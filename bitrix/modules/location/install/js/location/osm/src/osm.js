import { Type } from 'main.core';
import { BaseSource, SourceCreationError } from 'location.core';
import AutocompleteService from './autocompleteservice';
import MapService from './mapservice';
import MapMobileService from './mapmobileservice';
import GeocodingService from './geocodingservice';
import CheckInMapService from './check-in-map-service';

export type OSMConstructorProps = {
	languageId: string,
	sourceLanguageId: string,
	mapService: MapService,
	mapMobileService: MapMobileService,
	checkInMapService: CheckInMapService,
	autocompleteService: AutocompleteService,
	geocodingService: GeocodingService
}

/**
 * Class for the using OpenStreetMap data as data source
 */
export default class OSM extends BaseSource
{
	static code = 'OSM';
	static #onPropsChangedEvent = 'onPropsChanged';

	#languageId = '';
	// todo: do we need this here?
	#sourceLanguageId = '';
	#mapService;
	#mapMobileService;
	#checkInMapService;
	#geocodingService;
	#autocompleteService;

	constructor(props: OSMConstructorProps)
	{
		super(props);

		if (!Type.isString(props.languageId) || props.languageId.trim() === '')
		{
			throw new SourceCreationError('props.languageId must be a string');
		}

		this.#languageId = props.languageId;

		if (!Type.isString(props.sourceLanguageId) || props.sourceLanguageId.trim() === '')
		{
			throw new SourceCreationError('props.sourceLanguageId must be a string');
		}

		this.#sourceLanguageId = props.sourceLanguageId;

		if (!(props.mapService instanceof MapService))
		{
			throw new SourceCreationError('props.mapService must be instanceof MapService');
		}
		this.#mapService = props.mapService;

		if (!(props.mapMobileService instanceof MapMobileService))
		{
			throw new SourceCreationError('props.mapMobileService must be instanceof MapMobileService');
		}
		this.#mapMobileService = props.mapMobileService;

		if (!(props.checkInMapService instanceof CheckInMapService))
		{
			throw new SourceCreationError('props.checkInMapService must be instanceof CheckInMapService');
		}
		this.#checkInMapService = props.checkInMapService;

		if (!(props.autocompleteService instanceof AutocompleteService))
		{
			throw new SourceCreationError('props.autocompleteService must be instanceof AutocompleteService');
		}

		this.#autocompleteService = props.autocompleteService;

		if (!(props.geocodingService instanceof GeocodingService))
		{
			throw new SourceCreationError('props.geocodingService must be instanceof GeocodingService');
		}

		this.#geocodingService = props.geocodingService;
	}

	get sourceCode(): string
	{
		return OSM.code;
	}

	get map()
	{
		return this.mapService;
	}

	get mapService()
	{
		return this.#mapService;
	}

	get mapMobile()
	{
		return this.#mapMobileService;
	}

	get checkinMap()
	{
		return this.#checkInMapService;
	}

	get autocompleteService()
	{
		return this.#autocompleteService;
	}

	get geocodingService()
	{
		return this.#geocodingService;
	}

	get languageId()
	{
		return this.#languageId;
	}
}
