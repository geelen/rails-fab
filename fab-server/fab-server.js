const url = require('url')

const rewriteHost = (from, to) => {
  const url_to = new URL(to)
  const url_from = new URL(from)
  url_from.protocol = url_to.protocol
  url_from.host = url_to.host
  url_from.port = url_to.port
  return url_from.href
}

function hostMatches(url_a, url_b) {
  return url.parse(url_a).host === url.parse(url_b).host
}

export async function route(settings, route, request, rewrite) {
  const { RAILS_SERVER } = settings
  const original_request_url = request.url

  let forwarded_url, init
  try {
    forwarded_url = rewriteHost(request.url, RAILS_SERVER)

    // Ensure host and origin headers are set appropriately
    const headers = new Headers(request.headers)
    headers.delete('host')

    const referer = headers.get('referer')
    if (referer && hostMatches(referer, original_request_url))
      headers.set('referer', rewriteHost(referer, RAILS_SERVER))

    const origin = headers.get('origin')
    if (origin && hostMatches(origin, original_request_url))
      headers.set('origin', rewriteHost(origin, RAILS_SERVER))

    init = {
      headers,
      method: request.method,
      ...(request.method === 'POST' ? { body: request.body && request.body.toString() } : {}),
      redirect: 'manual'
    }

  } catch (e) {
    console.log(`Caught exception creating request`)
    console.log(e)
    return route
  }

  const response = await fetch(forwarded_url, init)

  try {
    const location = response.headers.get('location')
    if (location) {
      // Replace hostname of redirect
      const rewritten_location = hostMatches(location, RAILS_SERVER)
        ? rewriteHost(location, original_request_url)
        : location

      // Replace redirect_uri of redirect if present
      const parsed_location = new URL(rewritten_location)
      const { searchParams } = parsed_location
      const redirect_uri = searchParams && searchParams.get('redirect_uri')
      if (redirect_uri) {
        let rewritten_redirect_uri = rewriteHost(redirect_uri, original_request_url)
        searchParams.set('redirect_uri', rewritten_redirect_uri)
      }

      response.headers.set('location', parsed_location.href)
    }
  } catch (e) {
    console.log(`Caught exception rewriting location`)
    console.log(e)
  }

  try {
    if (/text\/html/.exec(response.headers.get('content-type'))) {
      const html = await response.text()
      const rewritten = rewrite(html)

      return new Response(rewritten, {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers
      })
    }
  } catch (e) {
    console.log(`Caught exception rewriting response body`)
    console.log(e)
  }

  return response
}
