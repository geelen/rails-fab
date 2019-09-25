const cheerio = require('cheerio')
const manifest = require('./manifest.json')
const path = require('path')
console.log({manifest})
const client_js = path.basename(manifest['client.js'])

const rewriteAssets = ($, ASSETS_HOST) => {
  $('script').each((i, elem) => {
    const src = $(elem).attr('src')
    if (src && src.startsWith(`/packs/js/client`)) {
      $(elem).attr('src', `/_assets/${client_js}`)
    }
  })
}

module.exports = (html) => {
  const $ = cheerio.load(html)
  rewriteAssets($)
  return $.html()
}
