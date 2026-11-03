import { CheckInMapEventType, LocationRepository, SourceRepository } from 'location.core';
import { Leaflet } from '../leaflet/src/leaflet';
import OSM from './osm';
import AutocompleteService from './autocompleteservice';
import SearchRequester from './requesters/searchrequester';
import GeocodingService from './geocodingservice';
import ReverseRequester from './requesters/reverserequester';
import MapService from './mapservice';
import MapMobileService from './mapmobileservice';
import CheckInMapService from './check-in-map-service';
import CheckInEngineRegistry, { BUILT_IN_ENGINE_CODE } from './check-in-engine-registry';
import TileLayerAuth from '../leaflet/src/tilelayerauth';
import TokenContainer from './tokencontainer';
import NominatimResponseConverter from './responseconverters/nominatimresponseconverter';
import AutocompleteResponseConverter from './responseconverters/autocompleteresponseconverter';

export type OSMFactoryProps = {
	languageId: string,
	sourceLanguageId: string,
	token: string,
	serviceUrl: string,
	mapServiceUrl: string,
	hostName: string,
	autocompletePromptsCount: ?number,
	mapEngine: ?string
}

export default class OSMFactory
{
	static createOSMSource(params: OSMFactoryProps)
	{
		const tokenContainer = new TokenContainer({
			token: params.token,
			sourceRepository: new SourceRepository(),
		});

		const osmParams =	{
			languageId: params.languageId,
			sourceLanguageId: params.sourceLanguageId,
		};

		const responseConverter = new NominatimResponseConverter({ languageId: params.languageId });

		const searchRequester = new SearchRequester({
			languageId: params.languageId,
			sourceLanguageId: params.sourceLanguageId,
			tokenContainer,
			serviceUrl: params.serviceUrl,
			hostName: params.hostName,
			responseConverter,
		});

		const reverseRequester = new ReverseRequester({
			languageId: params.languageId,
			sourceLanguageId: params.sourceLanguageId,
			serviceUrl: params.serviceUrl,
			hostName: params.hostName,
			tokenContainer,
			responseConverter,
		});

		const autocompleteResponseConverter = new AutocompleteResponseConverter({ languageId: params.languageId });

		osmParams.autocompleteService = new AutocompleteService({
			languageId: params.languageId,
			autocompletePromptsCount: params.autocompletePromptsCount || 7,
			sourceLanguageId: params.sourceLanguageId,
			responseConverter: autocompleteResponseConverter,
			autocompleteReplacements: params.autocompleteReplacements,
		});

		const geocodingService = new GeocodingService({
			searchRequester,
			reverseRequester,
		});

		osmParams.geocodingService = geocodingService;

		osmParams.mapService = new MapService({
			languageId: params.languageId,
			geocodingService,
			mapFactoryMethod: Leaflet.map,
			markerFactoryMethod: Leaflet.marker,
			locationRepository: new LocationRepository(),
			sourceLanguageId: params.sourceLanguageId,
			tileLayerFactoryMethod: () => {
				const tileLayerAuth = new TileLayerAuth();
				tileLayerAuth.setTokenContainer(tokenContainer);
				tileLayerAuth.setHostName(params.hostName);

				return tileLayerAuth;
			},
			serviceUrl: params.serviceUrl,
			mapServiceUrl: params.mapServiceUrl,
		});

		osmParams.mapMobileService = new MapMobileService({
			languageId: params.languageId,
			geocodingService,
			mapFactoryMethod: Leaflet.map,
			markerFactoryMethod: Leaflet.marker,
			iconFactoryMethod: Leaflet.icon,
			locationRepository: new LocationRepository(),
			sourceLanguageId: params.sourceLanguageId,
			tileLayerFactoryMethod: () => {
				const tileLayerAuth = new TileLayerAuth();
				tileLayerAuth.setTokenContainer(tokenContainer);
				tileLayerAuth.setHostName(params.hostName);

				return tileLayerAuth;
			},
			serviceUrl: params.serviceUrl,
			mapServiceUrl: params.mapServiceUrl,
		});

		const checkInProps = {
			languageId: params.languageId,
			sourceLanguageId: params.sourceLanguageId,
			tileLayerFactoryMethod: () => {
				const tileLayerAuth = new TileLayerAuth();
				tileLayerAuth.setTokenContainer(tokenContainer);
				tileLayerAuth.setHostName(params.hostName);

				return tileLayerAuth;
			},
			// MapLibre engine handles tile auth via OsmAuthProtocol, so it needs
			// the token container and host name directly (Leaflet uses the factory).
			tokenContainer,
			hostName: params.hostName,
			serviceUrl: params.serviceUrl,
			mapServiceUrl: params.mapServiceUrl,
		};

		// Engines other than Leaflet live in their own extensions and register themselves
		// once loaded (location.osm.check-in-maplibre), so an engine that was not loaded
		// falls back to Leaflet instead of pulling its bundle into every location.osm page.
		const RequestedEngineClass = CheckInEngineRegistry.get(params.mapEngine);

		osmParams.checkInMapService = new (RequestedEngineClass || CheckInMapService)(checkInProps);

		if (!RequestedEngineClass && params.mapEngine && params.mapEngine !== BUILT_IN_ENGINE_CODE)
		{
			OSMFactory.reportCheckInEngineFallback(osmParams.checkInMapService, params.mapEngine);
		}

		return new OSM(osmParams);
	}

	/**
	 * The substitute engine keeps the map alive but not every feature the caller asked the requested
	 * one for (layer clicks, direction arrows, freshness fade), so the swap is said out loud on both
	 * channels instead of leaving the host with a half-working map it believes is whole.
	 */
	static reportCheckInEngineFallback(checkInMapService, requestedEngine: string)
	{
		console.error(
			`Check-in map engine "${requestedEngine}" is not loaded, falling back to "${BUILT_IN_ENGINE_CODE}"`,
		);

		if (typeof BXNativeBridge === 'undefined')
		{
			return;
		}

		checkInMapService.sendEvent(CheckInMapEventType.ENGINE_FALLBACK, {
			requestedEngine,
			actualEngine: BUILT_IN_ENGINE_CODE,
		});
	}
}
