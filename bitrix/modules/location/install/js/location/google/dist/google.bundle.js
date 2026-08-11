/* eslint-disable */
this.BX = this.BX || {};
this.BX.Location = this.BX.Location || {};
(function (exports, main_core, location_core) {
	'use strict';

	/**
	 * Loads google source services
	 */
	class Loader {
		static #loadingPromise = null;
		static #createSrc(apiKey, languageId) {
			return 'https://maps.googleapis.com/maps/api/js' + `?key=${apiKey}` + '&libraries=places' + `&language=${languageId}` + `&region=${this.#getRegion(languageId)}`;
		}
		static #getRegion(languageId) {
			const map = {
				'en': 'US',
				'uk': 'UA',
				'zh': 'CN',
				'ja': 'JP',
				'vi': 'VN',
				'ms': 'MY',
				'hi': 'IN'
			};
			return typeof map[languageId] !== 'undefined' ? map[languageId] : languageId.toUpperCase();
		}

		/**
		 * Loads google services
		 * @param {string} apiKey
		 * @param {string} languageId
		 * @returns {Promise}
		 */
		static load(apiKey, languageId) {
			if (Loader.#loadingPromise === null) {
				Loader.#loadingPromise = new Promise(resolve => {
					BX.load([Loader.#createSrc(apiKey, languageId)], () => {
						resolve();
					});
				});
			}
			return Loader.#loadingPromise;
		}
	}

	/* global google */

	const STATUS_OK = 'OK';
	const STATUS_ZERO_RESULTS = 'ZERO_RESULTS';
	class AutocompleteService extends location_core.AutocompleteServiceBase {
		/** {string} */
		#languageId;
		/** {google.maps.places.AutocompleteService} */
		#googleAutocompleteService;
		/** {Promise} */
		#loaderPromise;
		/** {GoogleSource} */
		#googleSource;
		/** {number} */
		#biasBoundRadius = 50000;
		constructor(props) {
			super(props);
			this.#languageId = props.languageId;
			this.#googleSource = props.googleSource;
			// Because googleSource could still be in the process of loading
			this.#loaderPromise = props.googleSource.loaderPromise.then(() => {
				this.#initAutocompleteService();
			});
		}
		#getPredictionPromise(query, params) {
			const queryPredictionsParams = {
				input: query
			};
			if (params.biasPoint) {
				queryPredictionsParams.location = new google.maps.LatLng(params.biasPoint.latitude, params.biasPoint.longitude);
				queryPredictionsParams.radius = this.#biasBoundRadius;
			}
			let cachedResult = location_core.AutocompleteCache.get(Google.code, queryPredictionsParams);
			if (cachedResult !== null) {
				return Promise.resolve(this.#convertToLocationsList(cachedResult.data.result, cachedResult.data.status));
			}
			return new Promise(resolve => {
				this.#googleAutocompleteService.getQueryPredictions(queryPredictionsParams, (res, status) => {
					if (status === STATUS_OK || status === STATUS_ZERO_RESULTS) {
						location_core.AutocompleteCache.set(Google.code, queryPredictionsParams, {
							status: status,
							result: res
						});
					}
					resolve(this.#convertToLocationsList(res, status));
				});
			});
		}

		/**
		 * Returns Promise witch  will transfer locations list
		 * @param {string} query
		 * @param {AutocompleteServiceParams} params
		 * @returns {Promise}
		 */
		autocomplete(query, params) {
			if (query === '') {
				return new Promise(resolve => {
					resolve([]);
				});
			}

			// Because google.maps.places.AutocompleteService could be still in the process of loading
			return this.#loaderPromise.then(() => {
				return this.#getPredictionPromise(query, params);
			}, error => BX.debug(error));
		}
		#initAutocompleteService() {
			if (typeof google === 'undefined' || typeof google.maps.places.AutocompleteService === 'undefined') {
				throw new Error('google.maps.places.AutocompleteService must be defined');
			}
			this.#googleAutocompleteService = new google.maps.places.AutocompleteService();
		}
		#convertToLocationsList(data, status) {
			if (status === STATUS_ZERO_RESULTS) {
				return [];
			}
			if (!data || status !== STATUS_OK) {
				return false;
			}
			const result = [];
			for (const item of data) {
				if (item.place_id) {
					let name;
					if (item.structured_formatting && item.structured_formatting.main_text) {
						name = item.structured_formatting.main_text;
					} else {
						name = item.description;
					}
					const location = new location_core.Location({
						sourceCode: this.#googleSource.sourceCode,
						externalId: item.place_id,
						name: name,
						languageId: this.#languageId
					});
					if (item.structured_formatting && item.structured_formatting.secondary_text) {
						location.setFieldValue(location_core.LocationType.TMP_TYPE_CLARIFICATION, item.structured_formatting.secondary_text);
					}
					const typeHint = this.#getTypeHint(item.types);
					if (typeHint) {
						location.setFieldValue(location_core.LocationType.TMP_TYPE_HINT, this.#getTypeHint(item.types));
					}
					result.push(location);
				}
			}
			return result;
		}
		#getTypeHint(types) {
			let result = '';
			if (types.indexOf('locality') >= 0) {
				result = main_core.Loc.getMessage('LOCATION_GOO_AUTOCOMPLETE_TYPE_LOCALITY');
			} else if (types.indexOf('sublocality') >= 0) {
				result = main_core.Loc.getMessage('LOCATION_GOO_AUTOCOMPLETE_TYPE_SUBLOCAL');
			} else if (types.indexOf('store') >= 0) {
				result = main_core.Loc.getMessage('LOCATION_GOO_AUTOCOMPLETE_TYPE_STORE');
			} else if (types.indexOf('restaurant') >= 0) {
				result = main_core.Loc.getMessage('LOCATION_GOO_AUTOCOMPLETE_TYPE_RESTAURANT');
			} else if (types.indexOf('cafe') >= 0) {
				result = main_core.Loc.getMessage('LOCATION_GOO_AUTOCOMPLETE_TYPE_CAFE');
			}
			return result;
		}
	}

	/**
	 * Class for the autocomplete locations and addresses inputs
	 */
	let Map$1 = class Map extends location_core.MapBase {
		static #onChangedEvent = 'onChanged';
		static #onStartChanging = 'onStartChanging';
		static #onEndChanging = 'onEndChanging';
		static #onMapViewChanged = 'onMapViewChanged';

		/** {string} */
		#languageId;
		/** {google.maps.Map} */
		#googleMap;
		/** {GoogleSource} */
		#googleSource;
		/** {number} */
		#zoom;
		/** {google.maps.Marker} */
		#locationMarker;
		/** {ControlMode} */
		#mode;
		/** Location */
		#location;
		#geocoder;
		#locationRepository;
		#timerId = null;
		#isUpdating = false;
		#changeDelay;
		#loaderPromise = null;
		constructor(props) {
			super(props);
			this.#languageId = props.languageId;
			this.#googleSource = props.googleSource;
			this.#locationRepository = props.locationRepository || new location_core.LocationRepository();
			this.#changeDelay = props.changeDelay || 700;
		}
		render(props) {
			this.#loaderPromise = this.#googleSource.loaderPromise.then(() => {
				this.#initGoogleMap(props);
			});
			return this.#loaderPromise;
		}
		get loaderPromise() {
			return this.#loaderPromise;
		}
		set mode(mode) {
			this.#mode = mode;
			if (this.#locationMarker) {
				this.#locationMarker.setDraggable(mode === location_core.ControlMode.edit);
			}
		}
		#convertLocationToPosition(location) {
			if (!location) {
				return null;
			}
			if (typeof google === 'undefined' || typeof google.maps === 'undefined') {
				return null;
			}
			return new google.maps.LatLng(location.latitude, location.longitude);
		}
		#adjustZoom() {
			if (!this.#location) {
				return;
			}
			const zoom = Map.getZoomByLocation(this.#location);
			if (zoom !== null && zoom !== this.#zoom) {
				this.zoom = zoom;
			}
		}
		get zoom() {
			return this.#zoom;
		}
		set zoom(zoom) {
			this.#zoom = zoom;
			if (this.#googleMap) {
				this.#googleMap.setZoom(zoom);
			}
		}
		#getPositionToLocationPromise(position) {
			return new Promise(resolve => {
				this.#geocoder.geocode({
					'location': position
				}, (results, status) => {
					if (status === 'OK' && results[0]) {
						resolve(results[0].place_id);
					} else if (status === 'ZERO_RESULTS') {
						resolve('');
					} else {
						throw Error('Geocoder failed due to: ' + status);
					}
				});
			}).then(placeId => {
				let result;
				if (placeId) {
					result = this.#locationRepository.findByExternalId(placeId, this.#googleSource.sourceCode, this.#languageId);
				} else {
					result = new Promise(resolve => {
						resolve(null);
					});
				}
				return result;
			});
		}
		set location(location) {
			this.#location = location;
			const position = this.#convertLocationToPosition(location);
			if (position) {
				if (this.#locationMarker) {
					this.#isUpdating = true;
					this.#locationMarker.setPosition(position);
					this.#isUpdating = false;
				}
				if (this.#googleMap) {
					if (!this.#locationMarker.getMap()) {
						this.#locationMarker.setMap(this.#googleMap);
					}
					this.#googleMap.panTo(position);
				}
			} else {
				if (this.#locationMarker) {
					this.#locationMarker.setMap(null);
				}
			}
			this.#adjustZoom();
		}
		get location() {
			return this.#location;
		}
		onLocationChangedEventSubscribe(listener) {
			this.subscribe(Map.#onChangedEvent, listener);
		}
		onStartChangingSubscribe(listener) {
			this.subscribe(Map.#onStartChanging, listener);
		}
		onEndChangingSubscribe(listener) {
			this.subscribe(Map.#onEndChanging, listener);
		}
		onMapViewChangedSubscribe(listener) {
			this.subscribe(Map.#onMapViewChanged, listener);
		}
		#emitOnLocationChangedEvent(location) {
			if (this.#mode === location_core.ControlMode.edit) {
				this.emit(Map.#onChangedEvent, {
					location: location
				});
			}
		}
		#onMarkerUpdatePosition() {
			if (!this.#isUpdating && this.#mode === location_core.ControlMode.edit) {
				this.#createTimer(this.#locationMarker.getPosition());
			}
		}
		#createTimer(position) {
			if (this.#timerId !== null) {
				clearTimeout(this.#timerId);
			}
			this.#timerId = setTimeout(() => {
				const requestId = main_core.Text.getRandom();
				this.emit(Map.#onStartChanging, {
					requestId
				});
				this.#timerId = null;
				this.#googleMap.panTo(position);
				this.#fulfillOnChangedEvent(position, requestId);
			}, this.#changeDelay);
		}
		#fulfillOnChangedEvent(position, requestId) {
			this.#getPositionToLocationPromise(position).then(location => {
				this.emit(Map.#onEndChanging, {
					requestId
				});
				this.#emitOnLocationChangedEvent(location);
			}).catch(response => {
				this.emit(Map.#onEndChanging, {
					requestId
				});
				location_core.ErrorPublisher.getInstance().notify(response.errors);
			});
		}
		#onMapClick(position) {
			if (this.#mode === location_core.ControlMode.edit) {
				if (!this.#locationMarker.getMap) {
					this.#locationMarker.setMap(this.#googleMap);
				}
				this.#locationMarker.setPosition(position);
				this.#createTimer(position);
			}
		}
		#initGoogleMap(props) {
			this.#mode = props.mode;
			this.#location = props.location || null;
			if (typeof google === 'undefined' || typeof google.maps.Map === 'undefined') {
				throw new Error('google.maps.Map must be defined');
			}
			const position = this.#convertLocationToPosition(this.#location);
			const mapProps = {
				gestureHandling: 'greedy',
				disableDefaultUI: true,
				zoomControl: BX.prop.getBoolean(props, 'zoomControl', true),
				zoomControlOptions: {
					position: google.maps.ControlPosition.TOP_LEFT
				}
			};
			const zoom = Map.getZoomByLocation(this.#location);
			if (zoom) {
				mapProps.zoom = zoom;
			}
			if (position) {
				mapProps.center = position;
			}
			this.#googleMap = new google.maps.Map(props.mapContainer, mapProps);
			this.#googleMap.addListener('click', e => {
				this.#onMapClick(e.latLng);
			});
			if (typeof google.maps.Marker === 'undefined') {
				throw new Error('google.maps.Marker must be defined');
			}
			this.#locationMarker = new google.maps.Marker({
				position: position,
				map: this.#googleMap,
				draggable: this.#mode === location_core.ControlMode.edit
			});
			this.#locationMarker.addListener('position_changed', () => {
				this.#onMarkerUpdatePosition();
			});
			if (typeof google.maps.Geocoder === 'undefined') {
				throw new Error('google.maps.Geocoder must be defined');
			}
			this.#geocoder = new google.maps.Geocoder();
		}
		get googleMap() {
			return this.#googleMap;
		}
		destroy() {
			main_core.Event.unbindAll(this);
			this.#googleMap = null;
			this.#locationMarker = null;
			this.#geocoder = null;
			this.#timerId = null;
			this.#loaderPromise = null;
			super.destroy();
		}
	};

	/**
	 * Class for the autocomplete locations and addresses inputs
	 */
	class Map extends location_core.MapBase {
		static #onChangedEvent = 'onChanged';
		static #onStartChanging = 'onStartChanging';
		static #onEndChanging = 'onEndChanging';
		static #onMapViewChanged = 'onMapViewChanged';

		/** {string} */
		#languageId;
		/** {google.maps.Map} */
		#googleMap;
		/** {GoogleSource} */
		#googleSource;
		#markerNode;
		/** {google.maps.Marker} */
		#locationMarker;

		/** {number} */
		#zoom;
		/** {ControlMode} */
		#mode;
		/** Location */
		#location;
		#geocoder;
		#locationRepository;
		#timerId = null;
		#changeDelay;
		#loaderPromise = null;
		#isMapChanging = false;
		constructor(props) {
			super(props);
			this.#languageId = props.languageId;
			this.#googleSource = props.googleSource;
			this.#locationRepository = props.locationRepository || new location_core.LocationRepository();
			this.#changeDelay = props.changeDelay || 700;
		}
		render(props) {
			this.#loaderPromise = this.#googleSource.loaderPromise.then(() => {
				this.#initGoogleMap(props);
			});
			return this.#loaderPromise;
		}
		get loaderPromise() {
			return this.#loaderPromise;
		}
		set mode(mode) {
			this.#mode = mode;
		}
		#convertLocationToPosition(location) {
			if (!location) {
				return null;
			}
			if (typeof google === 'undefined' || typeof google.maps === 'undefined') {
				return null;
			}
			return new google.maps.LatLng(location.latitude, location.longitude);
		}
		#adjustZoom() {
			if (!this.#location) {
				return;
			}
			const zoom = Map.getZoomByLocation(this.#location);
			if (zoom !== null && zoom !== this.#zoom) {
				this.zoom = zoom;
			}
		}
		get zoom() {
			return this.#zoom;
		}
		set zoom(zoom) {
			this.#zoom = zoom;
			if (this.#googleMap) {
				this.#googleMap.setZoom(zoom);
			}
		}
		#getPositionToLocationPromise(position) {
			return new Promise(resolve => {
				this.#geocoder.geocode({
					'location': position
				}, (results, status) => {
					if (status === 'OK' && results[0]) {
						resolve(results[0].place_id);
					} else if (status === 'ZERO_RESULTS') {
						resolve('');
					} else {
						throw Error('Geocoder failed due to: ' + status);
					}
				});
			}).then(placeId => {
				let result;
				if (placeId) {
					result = this.#locationRepository.findByExternalId(placeId, this.#googleSource.sourceCode, this.#languageId);
				} else {
					result = new Promise(resolve => {
						resolve(null);
					});
				}
				return result;
			});
		}
		set location(location) {
			this.#location = location;
			const position = this.#convertLocationToPosition(location);
			if (position && this.#googleMap) {
				this.#googleMap.panTo(position);
			}
			this.#adjustZoom();
		}
		panTo(latitude, longitude) {
			if (typeof google !== 'undefined' && typeof google.maps !== 'undefined' && this.#googleMap) {
				this.#googleMap.panTo(new google.maps.LatLng(latitude, longitude));
				this.#adjustZoom();
			}
		}
		get location() {
			return this.#location;
		}
		onLocationChangedEventSubscribe(listener) {
			this.subscribe(Map.#onChangedEvent, listener);
		}
		onStartChangingSubscribe(listener) {
			this.subscribe(Map.#onStartChanging, listener);
		}
		onEndChangingSubscribe(listener) {
			this.subscribe(Map.#onEndChanging, listener);
		}
		onMapViewChangedSubscribe(listener) {
			this.subscribe(Map.#onMapViewChanged, listener);
		}
		#emitOnLocationChangedEvent(location) {
			if (this.#mode === location_core.ControlMode.edit) {
				this.emit(Map.#onChangedEvent, {
					location: location
				});
			}
		}
		#createTimer() {
			if (this.#timerId !== null) {
				clearTimeout(this.#timerId);
			}
			this.#timerId = setTimeout(() => {
				const requestId = main_core.Text.getRandom();
				this.emit(Map.#onStartChanging, {
					requestId
				});
				this.#timerId = null;
				const position = this.#googleMap.getCenter();
				this.#fulfillOnChangedEvent(position, requestId);
			}, this.#changeDelay);
		}
		#fulfillOnChangedEvent(position, requestId) {
			this.#getPositionToLocationPromise(position).then(location => {
				this.emit(Map.#onEndChanging, {
					requestId
				});
				this.#emitOnLocationChangedEvent(location);
			}).catch(response => {
				this.emit(Map.#onEndChanging, {
					requestId
				});
				location_core.ErrorPublisher.getInstance().notify(response.errors);
			});
		}
		#onDrag() {
			if (this.#timerId !== null) {
				clearTimeout(this.#timerId);
			}
		}
		#onDragStart() {
			this.#onMapChanging();
			this.emit(Map.#onMapViewChanged);
		}
		#onZoomChanged() {
			this.#onMapChanging();
			this.emit(Map.#onMapViewChanged);
		}
		#onMapChanging() {
			if (this.#mode === location_core.ControlMode.edit) {
				this.#isMapChanging = true;
				main_core.Dom.addClass(this.#markerNode, 'location-map-mobile-center-marker-up');
			}
		}
		#onIdle() {
			if (this.#mode === location_core.ControlMode.edit) {
				if (this.#isMapChanging === false) {
					return;
				}
				const upClass = 'location-map-mobile-center-marker-up';
				if (main_core.Dom.hasClass(this.#markerNode, upClass)) {
					main_core.Dom.removeClass(this.#markerNode, upClass);
				}
				this.#createTimer();
				this.#isMapChanging = false;
			}
		}
		#initGoogleMap(props) {
			this.#mode = props.mode;
			this.#location = props.location || null;
			if (typeof google === 'undefined' || typeof google.maps.Map === 'undefined') {
				throw new Error('google.maps.Map must be defined');
			}
			const position = this.#convertLocationToPosition(this.#location);
			const mapProps = {
				gestureHandling: 'greedy',
				disableDefaultUI: true,
				zoomControl: BX.prop.getBoolean(props, 'zoomControl', true),
				zoomControlOptions: {
					position: google.maps.ControlPosition.TOP_LEFT
				}
			};
			const zoom = Map.getZoomByLocation(this.#location);
			if (zoom) {
				mapProps.zoom = zoom;
			}
			if (position) {
				mapProps.center = position;
			}
			this.#googleMap = new google.maps.Map(props.mapContainer, mapProps);
			if (this.#mode === location_core.ControlMode.edit) {
				this.#markerNode = main_core.Tag.render`<div class="location-map-mobile-center-marker"></div>`;
				this.#googleMap.getDiv().appendChild(this.#markerNode);
			} else {
				this.#locationMarker = new google.maps.Marker({
					position: position,
					map: this.#googleMap,
					draggable: false,
					icon: '/bitrix/js/location/css/image/marker.png'
				});
			}
			this.#googleMap.addListener('dragstart', () => this.#onDragStart());
			this.#googleMap.addListener('idle', () => this.#onIdle());
			this.#googleMap.addListener('drag', () => this.#onDrag());
			this.#googleMap.addListener('zoom_changed', () => this.#onZoomChanged());
			if (typeof google.maps.Geocoder === 'undefined') {
				throw new Error('google.maps.Geocoder must be defined');
			}
			this.#geocoder = new google.maps.Geocoder();
			if (props.searchOnRender) {
				this.#createTimer();
			}
		}
		get googleMap() {
			return this.#googleMap;
		}
		destroy() {
			main_core.Event.unbindAll(this);
			this.#googleMap = null;
			this.#geocoder = null;
			this.#timerId = null;
			this.#loaderPromise = null;
			super.destroy();
		}
	}

	class PhotoService extends location_core.PhotoServiceBase {
		#map;
		#service;
		#googleSource;
		#loadingPromise;
		constructor(props) {
			super(props);
			this.#googleSource = props.googleSource;
			this.#map = props.map;
		}
		#getLoaderPromise() {
			if (!this.#loadingPromise) {
				//map haven't rendered yet	`
				if (this.#map.loaderPromise === null) {
					return;
				}
				this.#loadingPromise = this.#map.loaderPromise.then(() => {
					this.#service = new google.maps.places.PlacesService(this.#map.googleMap);
				});
			}
			return this.#loadingPromise;
		}
		requestPhotos(props) {
			return new Promise(resolve => {
				let promise = this.#getLoaderPromise();
				if (!promise) {
					resolve([]);
				}
				let loaderPromise = this.#getLoaderPromise();
				if (!loaderPromise) {
					resolve([]);
				}
				loaderPromise.then(() => {
					if (props.location.sourceCode !== this.#googleSource.sourceCode) {
						resolve([]);
						return;
					}
					if (props.location.externalId.length <= 0) {
						resolve([]);
						return;
					}
					this.#service.getDetails({
						placeId: props.location.externalId,
						fields: ['photos']
					}, function (place, status) {
						let resultPhotos = [];
						if (status === google.maps.places.PlacesServiceStatus.OK) {
							if (Array.isArray(place.photos)) {
								let count = 0;
								for (let gPhoto of place.photos) {
									resultPhotos.push({
										url: gPhoto.getUrl(),
										width: gPhoto.width,
										height: gPhoto.height,
										description: Array.isArray(gPhoto.html_attributions) ? gPhoto.html_attributions.join('<br>') : '',
										thumbnail: {
											url: gPhoto.getUrl({
												maxHeight: props.thumbnailHeight,
												maxWidth: props.thumbnailWidth
											}),
											width: props.thumbnailWidth,
											height: props.thumbnailHeight
										}
									});
									count++;
									if (props.maxPhotoCount && count >= props.maxPhotoCount) {
										break;
									}
								}
							}
						}
						resolve(resultPhotos);
					});
				});
			});
		}
	}

	class GeocodingService extends location_core.GeocodingServiceBase {
		#map;
		#geocoder;
		#loadingPromise;
		#googleSource;
		constructor(props) {
			super(props);
			this.#map = props.map;
			this.#googleSource = props.googleSource;
		}
		#getLoaderPromise() {
			if (!this.#loadingPromise) {
				//map haven't rendered yet	`
				if (this.#googleSource.loaderPromise === null) {
					return;
				}
				this.#loadingPromise = this.#googleSource.loaderPromise.then(() => {
					this.#geocoder = new google.maps.Geocoder();
				});
			}
			return this.#loadingPromise;
		}
		#convertLocationType(types) {
			let typeMap = {
				'country': location_core.LocationType.COUNTRY,
				'locality': location_core.LocationType.LOCALITY,
				'postal_town': location_core.LocationType.LOCALITY,
				'route': location_core.LocationType.STREET,
				'street_address': location_core.LocationType.ADDRESS_LINE_1,
				'administrative_area_level_4': location_core.LocationType.ADM_LEVEL_4,
				'administrative_area_level_3': location_core.LocationType.ADM_LEVEL_3,
				'administrative_area_level_2': location_core.LocationType.ADM_LEVEL_2,
				'administrative_area_level_1': location_core.LocationType.ADM_LEVEL_1,
				'floor': location_core.LocationType.FLOOR,
				'postal_code': location_core.AddressType.POSTAL_CODE,
				'room': location_core.LocationType.ROOM,
				'sublocality': location_core.LocationType.SUB_LOCALITY,
				'sublocality_level_1': location_core.LocationType.SUB_LOCALITY_LEVEL_1,
				'sublocality_level_2': location_core.LocationType.SUB_LOCALITY_LEVEL_2,
				'street_number': location_core.LocationType.BUILDING
			};
			let result = location_core.LocationType.UNKNOWN;
			for (let item of types) {
				if (typeof typeMap[item] !== 'undefined') {
					result = typeMap[item];
					break;
				}
			}
			return result;
		}
		#convertResultToLocations(data) {
			let result = [];
			for (let item of data) {
				let location = new location_core.Location();
				location.sourceCode = this.#googleSource.sourceCode;
				location.languageId = this.#googleSource.languageId;
				location.externalId = item.place_id;
				location.type = this.#convertLocationType(item.types);
				location.name = item.formatted_address;
				location.latitude = item.geometry.location.lat();
				location.longitude = item.geometry.location.lng();
				result.push(location);
			}
			return result;
		}
		geocodeConcrete(addressString) {
			return new Promise(resolve => {
				const loaderPromise = this.#getLoaderPromise();
				if (!loaderPromise) {
					resolve([]);
					return;
				}
				loaderPromise.then(() => {
					this.#geocoder.geocode({
						address: addressString
					}, (results, status) => {
						if (status === 'OK') {
							resolve(this.#convertResultToLocations(results));
						} else if (status === 'ZERO_RESULTS') {
							resolve([]);
						} else {
							BX.debug(`Geocode was not successful for the following reason: ${status}`);
						}
					});
				});
			});
		}
	}

	class Google extends location_core.BaseSource {
		static code = 'GOOGLE';
		#languageId = '';
		#sourceLanguageId = '';
		#loaderPromise = null;
		#map;
		#mapMobile;
		#photoService;
		#geocodingService;
		#autocompleteService;
		constructor(props) {
			super(props);
			if (!main_core.Type.isString(props.languageId) || props.languageId.trim() === '') {
				throw new location_core.SourceCreationError('props.languageId must be a string');
			}
			this.#languageId = props.languageId;
			if (!main_core.Type.isString(props.sourceLanguageId) || props.sourceLanguageId.trim() === '') {
				throw new location_core.SourceCreationError('props.sourceLanguageId must be a string');
			}
			this.#sourceLanguageId = props.sourceLanguageId;
			if (!main_core.Type.isString(props.apiKey) || props.apiKey.trim() === '') {
				throw new location_core.SourceCreationError('props.apiKey must be a string');
			}
			this.#loaderPromise = Loader.load(props.apiKey, props.sourceLanguageId);
			this.#map = new Map$1({
				googleSource: this,
				languageId: this.#languageId
			});
			this.#mapMobile = new Map({
				googleSource: this,
				languageId: this.#languageId
			});
			this.#autocompleteService = new AutocompleteService({
				googleSource: this,
				languageId: this.#languageId
			});
			this.#photoService = new PhotoService({
				googleSource: this,
				map: this.#map
			});
			this.#geocodingService = new GeocodingService({
				googleSource: this,
				map: this.#map
			});
		}
		get sourceCode() {
			return Google.code;
		}
		get loaderPromise() {
			return this.#loaderPromise;
		}
		get map() {
			return this.#map;
		}
		get mapMobile() {
			return this.#mapMobile;
		}
		get autocompleteService() {
			return this.#autocompleteService;
		}
		get photoService() {
			return this.#photoService;
		}
		get geocodingService() {
			return this.#geocodingService;
		}
		get languageId() {
			return this.#languageId;
		}
	}

	exports.Google = Google;

})(this.BX.Location.Google = this.BX.Location.Google || {}, BX, BX.Location.Core);
//# sourceMappingURL=google.bundle.js.map
