import headerLogo from '../../assets/images/logos/header/logo-w256.png'
import adminLogo from '../../assets/images/logos/logo-256x256.png'
import { avatarPresets } from '../profile/profileAvatar'
import type { InterfaceLanguage } from '../../i18n/language'

function bounded(work: Promise<unknown>) {
  let timer: ReturnType<typeof setTimeout>
  const deadline = new Promise<void>(resolve => {
    timer = setTimeout(resolve, 2500)
  })
  return Promise.race([work.catch(() => undefined), deadline]).finally(() => clearTimeout(timer))
}

let images: Promise<unknown> | undefined
const fonts = new Map<InterfaceLanguage, Promise<unknown>>()

/** Optional assets have a bounded wait; installed fonts/alt text remain usable offline. */
export async function prepareAssets(language: InterfaceLanguage) {
  images ??= Promise.all(
    [...new Set([headerLogo, adminLogo, ...avatarPresets])].map(src => {
      const image = new Image()
      const loaded = new Promise<void>(resolve => {
        image.onload = () => resolve()
        image.onerror = () => resolve()
      })
      image.src = src
      return bounded(typeof image.decode === 'function' ? image.decode() : loaded)
    })
  )
  if (!fonts.has(language)) {
    const sample =
      language === 'vi' ? 'Tiếng Việt: học lập trình ă â đ ê ô ơ ư' : 'Loopy: learn programming'
    const work = document.fonts?.load
      ? Promise.all(
          ['Space Grotesk', 'Outfit', 'Inter', 'JetBrains Mono'].flatMap(family =>
            [400, 600].map(weight => document.fonts.load(`${weight} 16px "${family}"`, sample))
          )
        )
      : Promise.resolve()
    fonts.set(language, bounded(work))
  }
  await Promise.all([images, fonts.get(language)])
}
