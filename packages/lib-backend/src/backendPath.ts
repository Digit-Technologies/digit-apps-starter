/**
 * Pathname for Digit app Worker handlers: strips the platform `/proxy/backend` prefix.
 *
 * @example
 * const path = backendPath(request); // '/notes/1' from '.../proxy/backend/notes/1'
 */
export function backendPath(request: Request): string {
  const url = new URL(request.url);
  let path = url.pathname.replace(/^\/proxy\/backend(?=\/|$)/, '') || '/';
  if (!path.startsWith('/')) path = `/${path}`;
  if (path.length > 1 && path.endsWith('/')) path = path.slice(0, -1);
  return path;
}
