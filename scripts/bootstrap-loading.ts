import { createElement, Fragment } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import type { Plugin } from 'vite'
import { LoadingScreenLayout } from '../src/components/LoadingScreenLayout'
import en from '../src/i18n/locales/en.json'
import vi from '../src/i18n/locales/vi.json'

/** Render the shared skeleton before browser modules execute, in dev and production. */
export function bootstrapLoading(): Plugin {
  return {
    name: 'loopy-bootstrap-loading',
    transformIndexHtml: {
      order: 'pre',
      handler(html) {
        const message = createElement(
          Fragment,
          null,
          ...(['en', 'vi'] as const).map(language =>
            createElement(
              'span',
              { key: language, lang: language, 'data-bootstrap-language': language },
              (language === 'vi' ? vi : en).interfacePreparation.title
            )
          )
        )
        const skeleton = renderToStaticMarkup(createElement(LoadingScreenLayout, { message }))
        return html.replace(
          '<!-- app-loading -->',
          `<div role="status" aria-live="polite" data-testid="bootstrap-loading">${skeleton}</div>`
        )
      },
    },
  }
}
