import { createInstance } from 'i18next'
import { expect, it } from 'vitest'
import vi from './locales/vi.json'
import en from './locales/en.json'
import { isUntranslatedContent } from './contentText'

it('does not override authored CMS copy based on its words', () => {
  for (const [key, value] of [
    ['profile.goals.newbie_path_title', 'Newbie-first path'],
    ['profile.goals.view_all_paths', 'View all paths'],
  ]) {
    expect(isUntranslatedContent(key, value)).toBe(false)
    expect(isUntranslatedContent(key, 'Nội dung do quản trị viên chỉnh sửa')).toBe(false)
  }
})

function entries(value: object, prefix = ''): Array<[string, string]> {
  return Object.entries(value).flatMap(([name, item]) => {
    const key = prefix ? `${prefix}.${name}` : name
    return typeof item === 'string' ? [[key, item]] : entries(item, key)
  })
}

for (const [language, locale] of Object.entries({ vi, en })) {
  it(`${language} has no untranslated seed marker in bundled text`, () => {
    expect(entries(locale).filter(([key, value]) => isUntranslatedContent(key, value))).toEqual([])
  })

  it(`${language} resolves all visible shell labels without another language or CMS`, async () => {
    const i18n = createInstance()
    await i18n.init({
      lng: language,
      fallbackLng: false,
      resources: { [language]: { translation: locale } },
    })
    for (const key of [
      'nav.home',
      'nav.learn',
      'nav.playground',
      'nav.practice',
      'nav.docs',
      'nav.settings',
      'nav.logout',
      'auth.login',
      'footer.learning',
      'footer.languages',
      'footer.paths',
      'footer.practice',
      'footer.resources',
      'footer.docs',
      'footer.playground',
      'footer.description',
      'footer.allRightsReserved',
      'profile.goals.newbie_path_title',
      'profile.goals.newbie_path_desc',
      'profile.goals.update_btn',
      'profile.goals.view_all_paths',
      'profile.badge',
      'profile.loading',
      'profile.sidebar.role',
      'profile.metric.note.complete_lesson',
      'profile.metric.note.daily_habit',
      'profile.metric.note.saved_lessons',
      'profile.saved_lessons.singular',
      'profile.saved_lessons.plural',
    ]) {
      expect(i18n.exists(key), key).toBe(true)
      expect(typeof i18n.t(key), key).toBe('string')
      expect(isUntranslatedContent(key, i18n.t(key)), key).toBe(false)
    }
    expect(i18n.t('nav.logout')).toBe(language === 'vi' ? 'Đăng xuất' : 'Logout')
  })
}
