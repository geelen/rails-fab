const cheerio = require('cheerio')

const rewriteAssets = ($, ASSETS_HOST) => {
  $('script').each((i, elem) => {
    const src = $(elem).attr('src')
    if (src && src.startsWith(`${ASSETS_HOST}/premium/assets/React/app-`)) {
      $(elem).attr('src', `/React/app.js`)
    } else if (src && src.startsWith(`${ASSETS_HOST}/premium/assets/dynamic-`)) {
      $(elem).attr('src', `/React/app.css`)
    }
  })
  $('link').each((i, elem) => {
    const href = $(elem).attr('href')
    if (href && href.startsWith(`${ASSETS_HOST}/premium/assets/dynamic-`)) {
      $(elem).attr('href', `/React/app.css`)
    }
  })
}

module.exports = (html, ASSETS_HOST) => {
  const $ = cheerio.load(html)
  rewriteAssets($, ASSETS_HOST)
  return $.html()
}
