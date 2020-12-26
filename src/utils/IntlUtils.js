import intl from 'react-intl-universal'
import locales from './locales'

export function initIntl(lang) {
  intl.init({
    currentLocale: lang,
    locales,
    // eslint-disable-next-line no-unused-vars
    warningHandler: message => {}
  })
}

export function getIntlContent(key, defaultValue) {
  return intl.get(key).defaultMessage(defaultValue);
}

export function getCurrentLocale(locale) {
  if (locale === 'en-US') {
    return "English";
  } else {
    return "中文";
  }
}
