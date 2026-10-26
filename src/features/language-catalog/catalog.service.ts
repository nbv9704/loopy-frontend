import { z } from 'zod'
import { api } from '../../lib/api'

const languageSchema = z.object({
  id: z.string().trim().min(1),
  name: z.string().trim().min(1),
  displayName: z.string().trim().nullish(),
  display_name: z.string().trim().nullish(),
})

export interface CatalogLanguage {
  id: string
  name: string
}

export function readCatalogLanguages(data: unknown): CatalogLanguage[] {
  const parsed = z
    .union([
      z.array(languageSchema),
      z.object({ languages: z.array(languageSchema) }).transform(value => value.languages),
    ])
    .safeParse(data)
  if (!parsed.success) throw new Error('Invalid language catalog response')
  const ids = parsed.data.map(language => language.id)
  if (new Set(ids).size !== ids.length) throw new Error('Duplicate language catalog entry')
  return parsed.data.map(language => ({
    id: language.id,
    name: language.displayName || language.display_name || language.name,
  }))
}

export async function loadCatalogLanguages(signal: AbortSignal): Promise<CatalogLanguage[]> {
  const response = await api.request<unknown>('/api/languages', {
    signal,
    suppressErrorToast: true,
  })
  if (!response.success) throw new Error('Language catalog unavailable')
  return readCatalogLanguages(response.data)
}
