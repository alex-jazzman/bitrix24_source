# ui.floating-ui

Vendored [@floating-ui/dom](https://floating-ui.com/) positioning library, exposed
under the namespace `BX.UI.FloatingUi`. Built the same way as `ui.lexical`: chef
bundles the package straight from `node_modules`, and the official upstream type
declarations are copied into the sources.

**Status: internal vendored library.** Its only consumer is `ui.system.popover`;
it is not used directly in product code. The extension re-exports the
`@floating-ui/dom` positioning API under `BX.UI.FloatingUi` so that
`ui.system.popover` can build its positioning on top of it. The interactive demo
page (see below) is kept for exercising every positioning case live.

Consumers import the public API as named exports and get the native upstream types:

```js
import { computePosition, autoUpdate, offset, flip, shift, arrow } from 'ui.floating-ui';
```

## How it works

- `src/floating-ui.js` — runtime entry: named re-exports of the `@floating-ui/dom`
  public API.
- `bundle.config.js` — `resolveNodeModules: true` + `standalone: true`: chef bundles
  the package straight from `node_modules`, inlining `@floating-ui/dom` and its
  dependencies (`@floating-ui/core`, `@floating-ui/utils`) into one self-contained
  IIFE (`dist/floating-ui.bundle.js`, global `BX.UI.FloatingUi`).
- `rollup-plugin-import-dts.js` — custom rollup plugin (modeled on `ui.lexical`):
  on `buildStart` it copies the official `.d.ts` files from `node_modules` into
  `src/vendor-types/` (`@floating-ui/dom` → `dom.d.ts`, `core` → `core.d.ts`,
  `utils` → `utils.d.ts`, `utils/dom` → `utils-dom.d.ts`), remapping npm-name
  imports to relative paths.
- `src/floating-ui.d.ts` — type aggregate named after the runtime entry
  (`export * from './vendor-types/dom'`). The TS resolver picks it up next to
  `src/floating-ui.js` via `aliases`, so consumers see the native
  `@floating-ui/dom` types without a hand-written contract.

`src/vendor-types/` and the built `dist/` are committed; `node_modules` and
`package-lock.json` are git-ignored.

## How to re-vendor a new version

The scheme requires `node_modules` to be installed at build time (same as
`ui.lexical`): chef resolves the package from `node_modules`, and the plugin
copies the `.d.ts` files from there as well.

```shell
cd ui/install/js/ui/floating-ui
npm install                 # only on a fresh checkout or when bumping the version
chef build ui.floating-ui   # builds dist/ and refreshes src/vendor-types/
```

Versions are pinned **exactly** (no `^`/`~` ranges) in `package.json`:
`@floating-ui/dom` in `dependencies`, and its transitive `@floating-ui/core` /
`@floating-ui/utils` via `overrides` (needed because `package-lock.json` is
git-ignored — without the overrides a fresh checkout could silently resolve
newer transitive versions). Upgrades are manual only: bump all three versions
in `package.json`, run `npm install`, then `chef build ui.floating-ui` — the
`import-dts` plugin rewrites `src/vendor-types/` for the new types. There is
no separate flattening step anymore.

## Licenses

`@floating-ui/dom`, `@floating-ui/core` and `@floating-ui/utils` are distributed
under the **MIT** license. `src/vendor-types/` contains the verbatim official
upstream `.d.ts` files (only import paths are changed — npm names to relative
paths).

Caveat: the `@floating-ui/*` packages do **not** embed copyright banners in their
`.d.ts` files or JS builds (unlike e.g. `ui.lexical`, where Meta puts a
`Copyright` header into every file). So neither `src/vendor-types/*` nor
`dist/floating-ui.bundle.js` carries banners — the license texts live in the
`LICENSE` files inside the packages (`node_modules/@floating-ui/*/LICENSE`).

The package is registered in the platform copyright registry —
`Copyright::getMainThirdParty()` in `main/lib/UI/Copyright.php` ("Floating UI",
MIT) — so it shows up on the admin "About / Licenses" page.

## Demo page (interactive case check)

The demo page with every positioning case is a portal dev page:
`ui/dev/public/floating-ui/index.php` (a regular Bitrix page with
`header.php`/`footer.php`; loads the extension via
`Extension::load('ui.floating-ui')`). Open it in the browser on a local portal
at the same address as the other `ui/dev/*` pages.

A built bundle is required first: `chef build ui.floating-ui` — the page takes
the API from the global `BX.UI.FloatingUi` set up by `Extension::load`. Cases are
listed on the left, the scene is on the right; each case has a short description
of what to do and what should happen. Switching cases tears down the previous
case's `autoUpdate` (cleanup).
