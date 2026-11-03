const engines = new Map();

// Ships inside location.osm itself, so it is never registered and never missing.
export const BUILT_IN_ENGINE_CODE = 'leaflet';

/**
 * Registry of optional check-in map engines. An engine bundle registers itself when
 * it is loaded, so location.osm never depends on an engine extension statically.
 */
export default class CheckInEngineRegistry
{
	static register(engineCode: string, engineClass: Function)
	{
		engines.set(engineCode, engineClass);
	}

	static get(engineCode: ?string): ?Function
	{
		return engines.get(engineCode) || null;
	}
}
