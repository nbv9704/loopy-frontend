// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { I18nextProvider } from 'react-i18next'
import { createInstance } from 'i18next'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import InterfacePreparation from './InterfacePreparation'
import { useInterfacePreparation } from './context'
import { prepareInterface } from './prepare'
import { interfaceTranslations } from '../../i18n/resources'

vi.mock('./prepare', () => ({ prepareInterface: vi.fn() }))
const deferred = () => {
  let resolve!: () => void
  const promise = new Promise<void>(done => {
    resolve = done
  })
  return { promise, resolve }
}
beforeEach(() => vi.resetAllMocks())
afterEach(cleanup)

async function mount() {
  const i18n = createInstance()
  await i18n.init({
    lng: 'en',
    resources: {
      en: { translation: interfaceTranslations.en },
      vi: { translation: interfaceTranslations.vi },
    },
  })
  function Editor() {
    const { changeLanguage } = useInterfacePreparation()
    return (
      <>
        <input aria-label="draft" defaultValue="" />
        <button onClick={() => changeLanguage('vi')}>Vietnamese</button>
      </>
    )
  }
  const view = render(
    <I18nextProvider i18n={i18n}>
      <InterfacePreparation>
        <Editor />
      </InterfacePreparation>
    </I18nextProvider>
  )
  return { i18n, view }
}

it('does not reveal the interface until all startup work completes', async () => {
  const ready = deferred()
  vi.mocked(prepareInterface).mockReturnValue(ready.promise)
  await mount()
  expect(screen.getByRole('status').textContent).toContain('Preparing your interface')
  expect(screen.queryByLabelText('draft')).toBeNull()
  await act(async () => ready.resolve())
  expect(screen.getByLabelText('draft')).toBeTruthy()
  expect(screen.queryByRole('status')).toBeNull()
})

it('commits a locale only after preparation and preserves mounted drafts behind the overlay', async () => {
  const next = deferred()
  vi.mocked(prepareInterface).mockResolvedValueOnce().mockReturnValueOnce(next.promise)
  const { i18n } = await mount()
  const draft = await screen.findByLabelText('draft')
  fireEvent.change(draft, { target: { value: 'Keep my code' } })
  const switcher = screen.getByText('Vietnamese')
  switcher.focus()
  fireEvent.click(switcher)
  expect(i18n.language).toBe('en')
  expect(screen.getByRole('status').textContent).toContain('Đang chuẩn bị giao diện')
  expect((draft as HTMLInputElement).value).toBe('Keep my code')
  expect(draft.closest('[inert]')).not.toBeNull()
  await act(async () => next.resolve())
  expect(i18n.language).toBe('vi')
  expect(screen.getByLabelText('draft')).toBe(draft)
  expect((draft as HTMLInputElement).value).toBe('Keep my code')
  expect(document.activeElement).toBe(switcher)
})

it('shows a bounded failure with explicit retry instead of revealing a partly downloaded interface', async () => {
  vi.mocked(prepareInterface)
    .mockRejectedValueOnce(new Error('Chunk unavailable'))
    .mockResolvedValueOnce()
  await mount()
  await screen.findByRole('alert')
  expect(screen.queryByLabelText('draft')).toBeNull()
  fireEvent.click(screen.getByText('Try again'))
  await waitFor(() => expect(screen.getByLabelText('draft')).toBeTruthy())
})
