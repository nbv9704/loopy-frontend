import { z } from 'zod'
import type { LearningPath, OnboardingLanguage, PathChapter } from './onboarding.types'

const id = z.string().trim().min(1)
const text = z
  .string()
  .nullish()
  .transform(value => value ?? undefined)
const languageSchema = z.object({
  id,
  name: z.string().min(1),
  displayName: text,
  display_name: text,
  canRunInBrowser: z.boolean().optional(),
  can_run_in_browser: z.boolean().optional(),
})
const pathSchema = z.object({
  id,
  languageId: id.optional(),
  language_id: id.optional(),
  goalId: id.optional(),
  goal_id: id.optional(),
  title: z.string().min(1),
  description: text,
})
const chapterSchema = z.object({
  id,
  title: z.string().min(1),
  description: text,
  lessonCount: z.number().int().nonnegative().safe().optional(),
  lesson_count: z.number().int().nonnegative().safe().optional(),
})
const uniqueIds = (rows: { id: string }[]) => new Set(rows.map(row => row.id)).size === rows.length

export function readOnboardingCatalog(
  languages: unknown,
  paths: unknown
): { languages: OnboardingLanguage[]; paths: LearningPath[] } {
  const languageResult = z.array(languageSchema).safeParse(languages)
  const pathResult = z.array(pathSchema).safeParse(paths)
  if (
    !languageResult.success ||
    !pathResult.success ||
    !uniqueIds(languageResult.data) ||
    !uniqueIds(pathResult.data)
  )
    throw new Error('Không đọc được dữ liệu lộ trình. Vui lòng thử lại.')
  if (!languageResult.data.length)
    throw new Error('Hiện chưa có ngôn ngữ học sẵn sàng. Vui lòng thử lại sau.')
  const languageIds = new Set(languageResult.data.map(row => row.id))
  const pairs = new Set<string>()
  for (const path of pathResult.data) {
    const language = path.languageId ?? path.language_id
    const goal = path.goalId ?? path.goal_id
    const pair = JSON.stringify([language, goal])
    if (
      !language ||
      !goal ||
      !languageIds.has(language) ||
      pairs.has(pair) ||
      (path.languageId && path.language_id && path.languageId !== path.language_id) ||
      (path.goalId && path.goal_id && path.goalId !== path.goal_id)
    )
      throw new Error('Dữ liệu ngôn ngữ và lộ trình không nhất quán. Vui lòng thử lại.')
    pairs.add(pair)
  }
  return { languages: languageResult.data, paths: pathResult.data }
}

export function readPathPreview(value: unknown, pathId: string): PathChapter[] {
  const result = z
    .object({ path: z.object({ id }).optional(), chapters: z.array(chapterSchema) })
    .safeParse(value)
  if (
    !result.success ||
    !uniqueIds(result.data.chapters) ||
    (result.data.path && result.data.path.id !== pathId) ||
    (result.success &&
      result.data.chapters.some(
        row =>
          row.lessonCount !== undefined &&
          row.lesson_count !== undefined &&
          row.lessonCount !== row.lesson_count
      ))
  )
    throw new Error('Không đọc được bài học trong lộ trình. Vui lòng thử lại.')
  return result.data.chapters
}
