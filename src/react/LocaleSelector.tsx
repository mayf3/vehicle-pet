/**
 * LocaleSelector: switches between the two supported locales (zh-CN default).
 */

import type { Locale } from '../engine'
import { usePetEngine } from './PetEngineProvider'

export function LocaleSelector() {
  const { snapshot, copy, setLocale } = usePetEngine()
  const locales: Locale[] = ['zh-CN', 'en']

  return (
    <section className="vp-panel" aria-label={copy.language}>
      <h3>{copy.language}</h3>
      <div className="vp-selector" role="group" data-pet-locale-selector="true">
        {locales.map((locale) => (
          <button
            key={locale}
            type="button"
            aria-pressed={snapshot.locale === locale ? 'true' : 'false'}
            data-pet-locale-option={locale}
            onClick={() => setLocale(locale)}
          >
            {locale}
          </button>
        ))}
      </div>
    </section>
  )
}
