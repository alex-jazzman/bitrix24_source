import './vendor/maplibre-gl.css';
import * as MaplibreModule from './vendor/maplibre-gl.js';

// maplibre-gl dist is a UMD bundle: under webpack it lands in `module.exports`
// (the namespace's `default`), not on `window`. Re-export it as an ES module so
// consumers can `import { maplibregl } from 'location.osm.maplibre'` - mirroring
// how location.osm.leaflet re-exports its vendored Leaflet.
const maplibregl = MaplibreModule.default || MaplibreModule.maplibregl || MaplibreModule;

export { maplibregl };
