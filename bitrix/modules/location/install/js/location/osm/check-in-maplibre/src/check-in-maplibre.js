import './css/check-in-maplibre.css';
import { CheckInEngineRegistry } from 'location.osm';
import CheckInMapServiceMapLibre from './check-in-map-service-maplibre';

// Self-registration keeps location.osm free of a static dependency on the heavy
// MapLibre vendor bundle: this extension is loaded only when the engine is chosen.
CheckInEngineRegistry.register('maplibre', CheckInMapServiceMapLibre);

export {
	CheckInMapServiceMapLibre,
};
