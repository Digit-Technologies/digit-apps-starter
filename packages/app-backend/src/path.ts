/**
 * Normalize Worker request paths. Strips a leading `proxy/backend` prefix when
 * present so the same handler works at the Worker root or via the Digit proxy.
 */
export function pathSegments(pathname: string): string[] {
  const parts = pathname.split('/').filter(Boolean);
  while (parts.length && (parts[0] === 'proxy' || parts[0] === 'backend')) {
    parts.shift();
  }
  return parts;
}
