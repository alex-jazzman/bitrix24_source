// Vendored UMD build of `@vibeoffice/helper` (zero runtime deps; provenance:
// vibeoffice-demo/src/web/vendor/helper.umd.cjs). We do NOT build/ship the helper from its
// source here — the published UMD artifact is the contract.
//
// The API is imported BY VALUE, not via a `window.*` global: under chef/rollup the
// commonjs plugin resolves the UMD through its CommonJS branch (`m(exports)`), so the API
// is attached to `exports`, never to `window.VibeOffice`. A side-effect import would
// therefore leave `window.VibeOffice` undefined in the built bundle. Importing the named
// export lets rollup-commonjs hand us the real `createEditor`.
import { createEditor } from '../vendor/helper.umd.cjs';

import { Vibeoffice } from './vibeoffice';

Vibeoffice.setHelper({ createEditor });

export { Vibeoffice };
