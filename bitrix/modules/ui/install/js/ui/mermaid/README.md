# ui.mermaid

Vendored [mermaid](https://mermaid.js.org/) diagram library, exposed under the
namespace `BX.UI.Mermaid` (mirrors `ui.pdfjs` / `BX.UI.Pdfjs`).

Consumers import the mermaid API and render diagrams to **static SVG** in the
parent frame:

```js
import { mermaid } from 'ui.mermaid';
```

## How to build a new version of mermaid?

chef emits an IIFE bundle, which cannot code-split mermaid's lazily-imported
diagram modules. So we first flatten the full `mermaid` package into a single
self-contained ESM file with esbuild, then let chef bundle that file:

```shell
cd ui/install/js/ui/mermaid
npm install                 # pulls mermaid + esbuild into node_modules
npm run vendor              # -> src/mermaid.bundle.mjs (no dynamic imports)
chef build ui.mermaid     # -> dist/mermaid.bundle.js
```

mermaid will be inside namespace: `BX.UI.Mermaid`.

## Third-party licenses

The bundle inlines mermaid **and all of its dependencies** (d3, dagre, cytoscape,
dompurify, katex, …), all under permissive licenses (MIT / ISC / BSD-3-Clause /
Apache-2.0 / MPL-2.0). These licenses require keeping the original copyright and
license texts in what we redistribute, so the `vendor` step uses
`--legal-comments=eof`: esbuild collects every bundled package's notice and
appends it to the end of the file (kept even when minified). chef carries it
through to `dist/`.

The bundled third-party software is also registered in the platform copyright
registry — `Copyright::getMainThirdParty()` in `main/lib/UI/Copyright.php` — so it
shows up on the admin "About / Licenses" page (`bitrix/admin/copyright.php`).
Update that list after any mermaid upgrade that adds or drops a dependency.
