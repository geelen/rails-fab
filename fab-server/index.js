import url from 'url'
import rewrites from './rewrites'
import { route } from './fab-server'

export async function render(request, settings) {
  return route(settings, url.parse(request.url).path, request, rewrites)
}
