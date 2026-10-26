import { z } from 'zod'
// Request contract mirrors the API boundary in the independently deployed backend.
const lessonTypeSchema = z.enum([
  'concept',
  'true_false',
  'multiple_choice',
  'fill_blank',
  'short_answer',
  'code_fix',
  'code_output',
  'code_build',
])
const validationTypeSchema = z.enum(['rule', 'exact', 'regex', 'stdout', 'function'])
const lessonStepTypeSchema = z.enum([
  'note',
  'multiple_choice',
  'true_false',
  'fill_blank',
  'short_answer',
  'code_prompt',
])
const scalar = z.union([z.string(), z.number().finite(), z.boolean()])
const answerKeySchema = z.union([scalar, z.array(scalar), z.null()]).optional()

/** Normalize once at the boundary; never silently choose between two aliases. */
function aliases<T extends z.ZodTypeAny>(schema: T, names: Record<string, string>) {
  return z
    .unknown()
    .transform((value, ctx) => {
      if (!value || typeof value !== 'object' || Array.isArray(value)) return value
      const result = { ...value } as Record<string, unknown>
      for (const [alias, canonical] of Object.entries(names)) {
        if (Object.prototype.hasOwnProperty.call(result, alias)) {
          if (Object.prototype.hasOwnProperty.call(result, canonical)) {
            ctx.addIssue({
              code: 'custom',
              path: [alias],
              message: `Chỉ dùng một trong ${canonical} hoặc ${alias}.`,
            })
          } else result[canonical] = result[alias]
          delete result[alias]
        }
      }
      return result
    })
    .pipe(schema)
}

const order = z.number().int().nonnegative()
const text = (max: number) => z.string().max(max).default('')
function uniqueOrders(items: Array<{ order_index: number }>, ctx: z.RefinementCtx) {
  const seen = new Set<number>()
  items.forEach((item, index) => {
    if (seen.has(item.order_index))
      ctx.addIssue({
        code: 'custom',
        path: [index, 'order_index'],
        message: 'order_index bị trùng trong cùng lesson.',
      })
    seen.add(item.order_index)
  })
}

const testCase = aliases(
  z
    .object({
      order_index: order,
      description: z.string().trim().min(1).max(500),
      input: z.unknown().optional(),
      expected_output: z
        .unknown()
        .refine(value => value !== undefined, 'expected_output là bắt buộc; có thể dùng null.'),
      weight: z.number().int().min(1).max(100).default(10),
      timeout: z.number().int().min(1).max(60000).default(1000),
      is_hidden: z.boolean().default(false),
    })
    .strict(),
  { orderIndex: 'order_index', expectedOutput: 'expected_output', isHidden: 'is_hidden' }
)

const step = aliases(
  z
    .object({
      id: z.guid().optional(),
      type: lessonStepTypeSchema,
      title: text(200),
      prompt: z.string().trim().min(1).max(5000),
      options: z.array(z.unknown()).max(20).default([]),
      correct_answer: answerKeySchema.default(null),
      explanation: text(5000),
      hint: text(2000),
      is_required: z.boolean().default(false),
      order_index: order,
    })
    .strict(),
  { correctAnswer: 'correct_answer', isRequired: 'is_required', orderIndex: 'order_index' }
)

const difficulties = {
  beginner: 'beginner',
  easy: 'beginner',
  intermediate: 'intermediate',
  medium: 'intermediate',
  advanced: 'advanced',
  hard: 'advanced',
} as const
const lesson = aliases(
  z
    .object({
      lesson_id: z.string().trim().min(1).max(120),
      title: z.string().trim().min(1).max(200),
      lesson_type: lessonTypeSchema.default('code_fix'),
      description: text(10000),
      starter_code: text(50000),
      task_description: text(10000),
      hint: text(5000),
      hint_level_1: text(5000),
      hint_level_2: text(5000),
      hint_level_3: text(5000),
      common_mistakes: text(10000),
      solution_code: text(50000),
      is_aha_lesson: z.boolean().default(false),
      difficulty: z
        .enum(['beginner', 'intermediate', 'advanced', 'easy', 'medium', 'hard'])
        .default('beginner')
        .transform(value => difficulties[value]),
      grading_mode: z.enum(['stdout', 'function']).default('stdout'),
      validation_type: validationTypeSchema.default('rule'),
      validation_rules: z.record(z.string(), z.unknown()).default({}),
      success_output: text(10000),
      failure_hint: text(5000),
      status: z.enum(['draft', 'published', 'archived']).default('draft'),
      order_index: order,
      test_cases: z.array(testCase).max(100).superRefine(uniqueOrders).optional(),
      steps: z.array(step).max(100).superRefine(uniqueOrders).optional(),
    })
    .strict()
    .superRefine((value, ctx) => {
      if (value.lesson_type === 'code_fix' || value.lesson_type === 'code_build') {
        for (const field of ['starter_code', 'solution_code'] as const) {
          if (!value[field].trim())
            ctx.addIssue({
              code: 'custom',
              path: [field],
              message: `${field} là bắt buộc cho ${value.lesson_type}.`,
            })
        }
      }
    }),
  {
    lessonId: 'lesson_id',
    lessonType: 'lesson_type',
    starterCode: 'starter_code',
    taskDescription: 'task_description',
    hintLevel1: 'hint_level_1',
    hintLevel2: 'hint_level_2',
    hintLevel3: 'hint_level_3',
    commonMistakes: 'common_mistakes',
    solutionCode: 'solution_code',
    isAhaLesson: 'is_aha_lesson',
    gradingMode: 'grading_mode',
    validationType: 'validation_type',
    validationRules: 'validation_rules',
    successOutput: 'success_output',
    failureHint: 'failure_hint',
    orderIndex: 'order_index',
    testCases: 'test_cases',
    lessonSteps: 'steps',
  }
)

export const bulkImportPayloadSchema = aliases(
  z
    .object({
      chapter_id: z.guid('Chapter ID phải là UUID hợp lệ.'),
      lessons: z
        .array(lesson)
        .min(1)
        .max(200)
        .superRefine((items, ctx) => {
          const seen = new Set<string>()
          items.forEach((item, index) => {
            if (seen.has(item.lesson_id))
              ctx.addIssue({
                code: 'custom',
                path: [index, 'lesson_id'],
                message: 'lesson_id bị trùng trong payload.',
              })
            seen.add(item.lesson_id)
          })
        }),
    })
    .strict(),
  { chapterId: 'chapter_id' }
)
