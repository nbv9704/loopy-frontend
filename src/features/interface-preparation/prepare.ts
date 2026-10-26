import { interfaceContentKeys } from '../../i18n/contentKeys'
import type { InterfaceLanguage } from '../../i18n/language'
import { getContentCacheRevision } from '../../lib/contentCache'
import { loadContentKeys, retainPreparedContent } from '../../lib/contentRequests'
import { prepareRoutes } from '../../routes/pages'
import { prepareAssets } from './assets'

const pending = new Map<string, Promise<void>>()

export function prepareInterface(language: InterfaceLanguage) {
  const revision = getContentCacheRevision()
  const key = JSON.stringify([language, revision])
  let work = pending.get(key)
  if (!work) {
    work = Promise.all([
      prepareRoutes(),
      prepareAssets(language),
      // Missing/outage text resolves to the complete bundled locale, without N single-key requests.
      loadContentKeys(interfaceContentKeys, language, revision).then(() => {
        retainPreparedContent(interfaceContentKeys, language, revision)
      }),
    ])
      .then(() => undefined)
      .finally(() => pending.delete(key))
    pending.set(key, work)
  }
  return work
}
