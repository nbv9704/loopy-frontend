import { expect, type Page, type TestInfo } from '@playwright/test'

export async function checkAdminLayout(page: Page, info: TestInfo, path: string, heading: string) {
  await page.goto(path)
  await expect(page.getByRole('heading', { level: 1, name: heading, exact: true })).toBeVisible()
  await page.waitForLoadState('networkidle')
  let requests = 0
  const count = (request: { url(): string }) => {
    if (request.url().includes('/api/')) requests++
  }
  page.on('request', count)
  try {
    for (const width of [1440, 1024, 768, 390, 320]) {
      await page.setViewportSize({ width, height: 960 })
      const overflow = await page.evaluate(() => {
        const limit = document.documentElement.clientWidth
        return [...document.querySelectorAll('main *, form *')]
          .filter(element => {
            const bounds = element.getBoundingClientRect()
            return (
              bounds.width > 0 &&
              bounds.right > limit + 1 &&
              getComputedStyle(element).position !== 'fixed'
            )
          })
          .slice(0, 5)
          .map(element => ({
            tag: element.tagName,
            class: element.className,
            text: element.textContent?.slice(0, 60),
          }))
      })
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
        `${path} @${width}: ${JSON.stringify(overflow)}`
      ).toBe(true)
      await expect(
        page.getByRole('heading', { level: 1, name: heading, exact: true })
      ).toBeInViewport()
      if (width === 1440 || width === 390) {
        await page.screenshot({
          path: info.outputPath(`${path.replace(/\W+/g, '-')}-${width}.png`),
        })
        const row = page.getByRole('table').first().locator('tbody tr').first()
        if (await row.isVisible())
          await row.screenshot({
            path: info.outputPath(`${path.replace(/\W+/g, '-')}-row-${width}.png`),
          })
        await page.evaluate(() => window.scrollTo(0, 0))
      }
    }
    expect(requests, `${path}: resizing must not refetch`).toBe(0)
  } finally {
    page.off('request', count)
  }
}
