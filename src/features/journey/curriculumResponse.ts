import { z } from 'zod'
import type { Curriculum } from './curriculum.types'

const id = z.string().trim().min(1)
const order = z
  .number()
  .int()
  .finite()
  .nullish()
  .transform(value => value ?? 0)
const text = z
  .string()
  .nullish()
  .transform(value => value ?? '')
const step = z.object({
  id,
  lessonId: id.optional(),
  type: z.enum([
    'note',
    'multiple_choice',
    'true_false',
    'fill_blank',
    'short_answer',
    'code_prompt',
  ]),
  prompt: z.string(),
  title: text,
  hint: text,
  options: z
    .array(z.union([z.string(), z.number().finite(), z.boolean()]))
    .nullish()
    .transform(value => value ?? []),
  isRequired: z
    .boolean()
    .nullish()
    .transform(value => value ?? false),
  orderIndex: order,
})
const chapter = z.object({
  id,
  languageId: id.optional(),
  title: text,
  description: text,
  chapterNumber: order,
  orderIndex: order,
})
const lesson = z.object({
  id,
  chapterId: id,
  lessonId: id.optional(),
  title: text,
  description: text,
  code: text,
  insight: text,
  starterCode: text,
  taskDescription: text,
  hint: text,
  hintLevel1: text,
  hintLevel2: text,
  hintLevel3: text,
  commonMistakes: text,
  debugStarterCode: text,
  debugTaskDescription: text,
  debugHint: text,
  lessonType: z
    .enum([
      'concept',
      'true_false',
      'multiple_choice',
      'fill_blank',
      'short_answer',
      'code_fix',
      'code_output',
      'code_build',
    ])
    .nullish()
    .transform(value => value ?? undefined),
  orderIndex: order,
  estimatedTime: z
    .number()
    .finite()
    .nonnegative()
    .nullish()
    .transform(value => value ?? undefined),
  estimated_time: z
    .number()
    .finite()
    .nonnegative()
    .nullish()
    .transform(value => value ?? undefined),
  difficulty: text,
  isAhaLesson: z
    .boolean()
    .nullish()
    .transform(value => value ?? false),
  gradingMode: z
    .enum(['stdout', 'function'])
    .nullish()
    .transform(value => value ?? undefined),
  steps: z
    .array(step)
    .nullish()
    .transform(value => value ?? undefined),
  lessonSteps: z
    .array(step)
    .nullish()
    .transform(value => value ?? undefined),
})
const schema = z.object({ chapters: z.array(chapter), lessons: z.array(lesson) })

/** Reject partial/ambiguous identity rather than silently dropping lessons from the map. */
export function readCurriculum(value: unknown, language: string): Curriculum {
  const result = schema.safeParse(value)
  if (!result.success) throw new Error('Dữ liệu bài học chưa sẵn sàng. Vui lòng thử lại.')
  const fail = () => {
    throw new Error('Dữ liệu bài học không nhất quán. Vui lòng thử lại.')
  }
  const chapters = new Set<string>()
  for (const item of result.data.chapters) {
    if (chapters.has(item.id) || (item.languageId && item.languageId !== language)) fail()
    chapters.add(item.id)
  }
  const lessons = new Set<string>()
  const aliases = new Map<string, number>()
  for (const item of result.data.lessons) {
    const alias = item.lessonId || item.id
    aliases.set(alias, (aliases.get(alias) || 0) + 1)
  }
  const canonicalIds = new Set(result.data.lessons.map(item => item.id))
  for (const item of result.data.lessons) {
    if (!chapters.has(item.chapterId) || lessons.has(item.id)) fail()
    lessons.add(item.id)
    const route = item.lessonId || item.id
    // Slugs are unique within a chapter in the DB, while Learn URLs span a language.
    if ((aliases.get(route) || 0) > 1 || (canonicalIds.has(route) && route !== item.id))
      item.lessonId = item.id
    const steps = new Set<string>()
    for (const entry of item.steps || item.lessonSteps || []) {
      if (steps.has(entry.id) || (entry.lessonId && entry.lessonId !== item.id)) fail()
      steps.add(entry.id)
    }
  }
  // These guards validate the public fields consumed by both Journey and LessonViewer.
  return {
    chapters: result.data.chapters.map(item => ({
      ...item,
      languageId: item.languageId || language,
    })),
    lessons: result.data.lessons.map(item => ({ ...item, lessonId: item.lessonId || item.id })),
  }
}
