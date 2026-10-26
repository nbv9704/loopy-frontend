import { describe, expect, it } from 'vitest'
import { confirmedImportResult, importSummary, previewImport } from './importPreview'

const body = {
  chapterId: '11111111-1111-4111-8111-111111111111',
  lessons: [
    {
      lessonId: 'intro',
      title: 'Intro',
      lessonType: 'concept',
      orderIndex: 0,
    },
  ],
}
const preview = (patch: object = {}) =>
  previewImport(JSON.stringify({ ...body, lessons: [{ ...body.lessons[0], ...patch }] }))

describe('import preview contract', () => {
  it('supports concept lessons without code and preserves omitted child collections', () => {
    const result = preview()
    expect(result.issues).toEqual([])
    expect(result.payload?.lessons[0]).toMatchObject({
      order_index: 0,
      lesson_type: 'concept',
      status: 'draft',
    })
    expect(result.payload?.lessons[0]).not.toHaveProperty('test_cases')
    expect(result.payload?.lessons[0]).not.toHaveProperty('steps')
  })
  it('normalizes camelCase test cases and false/zero/null answers without data loss', () => {
    const result = preview({
      testCases: [{ orderIndex: 0, description: 'Null', expectedOutput: null, isHidden: false }],
      lessonSteps: [
        {
          type: 'true_false',
          prompt: 'False?',
          correctAnswer: false,
          isRequired: false,
          orderIndex: 0,
        },
      ],
      isAhaLesson: false,
    })
    expect(result.payload?.lessons[0].test_cases?.[0]).toMatchObject({
      order_index: 0,
      expected_output: null,
      is_hidden: false,
    })
    expect(result.payload?.lessons[0].steps?.[0]).toMatchObject({
      correct_answer: false,
      order_index: 0,
    })
    expect(importSummary(result.payload!)).toMatchObject({
      lessons: 1,
      testCases: 1,
      steps: 1,
      replacedTests: 1,
      replacedSteps: 1,
    })
  })
  it('keeps [] as explicit replacement, distinct from an omitted field', () => {
    expect(preview({ test_cases: [], steps: [] }).payload?.lessons[0]).toMatchObject({
      test_cases: [],
      steps: [],
    })
  })
  it.each([
    { status: 'publshed' },
    { lessonType: 'unknown' },
    { validationType: 'unknown' },
    { lesson_id: 'conflict' },
    { testCases: null },
    { typo_field: 'never silently discard' },
    { testCases: [{ orderIndex: 0, description: 'Missing output' }] },
    { steps: [{ type: 'true_false', prompt: 'x', order_index: 0, correct_answer: { x: true } }] },
    { steps: [{ type: 'true_false', prompt: 'x', order_index: 0, correct_answer: [['x']] }] },
    { lessonType: 'code_fix', starterCode: ' ', solutionCode: 'x' },
  ])('blocks malformed or ambiguous fields %j', patch => {
    expect(preview(patch).payload).toBeNull()
    expect(preview(patch).issues.length).toBeGreaterThan(0)
  })
  it.each(['null', '[]', '{}', '{invalid', '{"lessons":[]}'])(
    'handles root %s without crashing',
    source => {
      expect(previewImport(source).payload).toBeNull()
      expect(previewImport(source).issues.length).toBeGreaterThan(0)
    }
  )
  it('rejects duplicate lesson identities and duplicate step order', () => {
    expect(
      previewImport(JSON.stringify({ ...body, lessons: [...body.lessons, ...body.lessons] }))
        .payload
    ).toBeNull()
    const step = { type: 'note', prompt: 'Read', orderIndex: 0 }
    expect(preview({ steps: [step, step] }).payload).toBeNull()
  })
  it.each([
    null,
    {},
    { lessonsCreated: 0 },
    {
      lessonsCreated: 1,
      testCasesCreated: 1,
      testCasesReplaced: 0,
      stepsCreated: 0,
      stepsReplaced: 0,
      errors: [],
    },
  ])('requires a complete matching transaction acknowledgement %j', value => {
    expect(() => confirmedImportResult(value, preview().payload!)).toThrow('Chưa xác nhận')
  })
})
