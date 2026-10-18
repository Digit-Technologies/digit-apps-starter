/**
 * digit-apps stores each file under frontend/ at /app/<path> (publish strips
 * the frontend/ prefix). CSS is injected into the harness document
 * /app/index.html, so Vite's default /assets/... URLs are not served.
 * Rewrite emitted asset URLs to /app/<file> so @font-face stays same-origin
 * (font-src 'self'). Do not point fonts at a CDN.
 */
export function rewritePublishedAssetUrls() {
  return {
    name: 'digit-published-asset-urls',
    apply: 'build',
    enforce: 'post',
    generateBundle(_options, bundle) {
      const assetNames = Object.values(bundle)
        .filter((item) => item.type === 'asset' && !item.fileName.endsWith('.css'))
        .map((item) => item.fileName);

      for (const item of Object.values(bundle)) {
        if (item.type !== 'chunk' || typeof item.code !== 'string') continue;
        let code = item.code;
        for (const fileName of assetNames) {
          const served = `/app/${fileName}`;
          code = code.replaceAll(`./${fileName}`, served);
          code = code.replaceAll(`/${fileName}`, served);
          code = code.replaceAll('/app/app/', '/app/');
        }
        if (code.includes('fonts.googleapis.com') || code.includes('fonts.gstatic.com')) {
          this.error('App bundle referenced a font CDN; self-host fonts instead.');
        }
        item.code = code;
      }
    },
  };
}
