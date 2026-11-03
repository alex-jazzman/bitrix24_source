import './css/check-in-map.css';
import { Factory } from 'location.source';
import { CheckInMapEventType, CheckinMapCommandType } from 'location.core';
import { MarkerType } from './marker-type';
import { buildIconKey } from './icon-key';
import { MarkerIconFactory, OFFICE_PLATE_MAX_FACES } from './marker-icon-factory';
import { ClusterIconFactory } from './cluster-icon-factory';
import { CI_XN_ZOOM_THRESHOLD, PLATE_MIN_ZOOM } from './checkin-tokens';

const MAP_CONTAINER_SELECTOR = '#check-in-map';

// Hides everything the engine draws while the map stands on a stand-in centre (see init).
const STAND_IN_CENTER_CLASS = 'ci-stand-in-center';
// A tap is a choice of an object, not a move of the map, and a finger resting on the glass jitters by
// a pixel or two - so the touch has to travel before the gesture counts as one. This is the usual slop
// of a drag.
const MANUAL_MOVE_SLOP_PX = 10;

// A drag holds the finger down for seconds and raises touchmove at the frame rate. The host only needs
// to know that the user has taken the map over, so the frames of one gesture are coalesced into windows
// this long. The window belongs to the gesture alone: a press of a control is a single call, and a window
// over it would take the report away rather than thin it out (see reportManualMove).
const GESTURE_REPORT_WINDOW_MS = 300;

// The commands with a button of the map's own control column behind them. Those buttons are drawn by the
// native component on top of the webview, so the press itself never reaches this page - the command is
// the whole of what the page gets to read it by. Pressing one is the user taking the camera over just as
// a drag is. Everything else the host sends is the host drawing its own scene, the frames of the camera
// it follows the live marker with included, and must stay silent.
const USER_CAMERA_COMMANDS = new Set([
	CheckinMapCommandType.ZOOM_IN,
	CheckinMapCommandType.ZOOM_OUT,
	CheckinMapCommandType.FIT_TO_LAYERS,
]);

/**
 * Where the touches sit and how widely they are spread. A drag moves the centre; a pinch changes the
 * spread while the centre may not move at all. Together they cover every gesture that moves the camera,
 * and a single still finger answers neither. The count comes along because both readings are averages
 * over the touches that are down: comparing two of them taken over a different number of fingers
 * measures the change of the hand and not a move of the map.
 * @returns {?{x: Number, y: Number, spread: Number, count: Number}}
 */
const getTouchGeometry = (touches) => {
	const points = Array.from(touches ?? []);
	if (points.length === 0)
	{
		return null;
	}

	const x = points.reduce((sum, point) => sum + point.clientX, 0) / points.length;
	const y = points.reduce((sum, point) => sum + point.clientY, 0) / points.length;
	const spread = points.reduce(
		(sum, point) => sum + Math.hypot(point.clientX - x, point.clientY - y),
		0,
	) / points.length;

	return { x, y, spread, count: points.length };
};

class CheckInMap
{
	#touchAnchor = null;
	#lastGestureReportAt = 0;

	constructor()
	{
		this.mapService = null;
		this.standsOnStandInCenter = false;
		this.subscribeToEvents();
		this.#subscribeToManualMove();
	}

	// Gestures that move the camera by hand are reported to the host, so it can drop a mode of its own
	// that keeps the camera elsewhere. The listeners capture: the engine handles these events on its
	// own canvas inside the container, and a bubbling listener would be at its mercy.
	#subscribeToManualMove()
	{
		const container = document.querySelector('#check-in-map');
		if (!container)
		{
			return;
		}

		const options = { capture: true, passive: true };
		container.addEventListener('touchstart', this.#onTouchStart, options);
		container.addEventListener('touchmove', this.#onTouchMove, options);
		container.addEventListener('wheel', this.#onWheel, options);
	}

	// Every gesture starts here, a second finger landing mid-drag included: the anchor is rebuilt from
	// the touches that are down now, so a pinch is measured from where it began rather than from where
	// the first finger landed.
	#onTouchStart = (event) => {
		this.#touchAnchor = getTouchGeometry(event.touches);
	};

	#onTouchMove = (event) => {
		const anchor = this.#touchAnchor;
		const current = getTouchGeometry(event.touches);
		if (!anchor || !current)
		{
			return;
		}

		// A finger lifted out of a pinch takes the centre halfway to the finger that stays and drops the
		// spread to zero - a jump well past the slop, with the map never touched. touchstart covers the
		// opposite direction; this covers the lift, and the gesture goes on being measured from where the
		// hand now is.
		if (current.count !== anchor.count)
		{
			this.#touchAnchor = current;

			return;
		}

		const hasMoved = Math.hypot(current.x - anchor.x, current.y - anchor.y) > MANUAL_MOVE_SLOP_PX
			|| Math.abs(current.spread - anchor.spread) > MANUAL_MOVE_SLOP_PX;

		if (hasMoved)
		{
			this.#reportGesture();
		}
	};

	#onWheel = () => {
		this.#reportGesture();
	};

	// A gesture goes on raising events for as long as the hand is on the glass, and the host learns nothing
	// from the frames that follow the first one.
	#reportGesture()
	{
		const now = Date.now();
		if (now - this.#lastGestureReportAt < GESTURE_REPORT_WINDOW_MS)
		{
			return;
		}

		this.#lastGestureReportAt = now;
		this.#reportManualMove();
	}

	#reportManualMove()
	{
		// eslint-disable-next-line no-undef
		BXNativeBridge?.sendEvent(CheckInMapEventType.MAP_MOVED_BY_USER, {});
	}

	/**
	 * The section can be opened before the first GPS fix - geolocation switched on while it was already
	 * loading - and then the host command carries no centre. No engine builds a map without one, so the
	 * portal region point from the page bootstrap stands in. That point is a place the user has nothing
	 * to do with, so the map is held out of sight until a camera command lands it on real coordinates
	 * (see revealMap); until then the container shows its own background, the same colour the host
	 * paints behind the WebView.
	 */
	init(props)
	{
		const hasHostCenter = this.isValidCenter(props?.mapCenter);
		const mapCenter = hasHostCenter ? props.mapCenter : this.getDefaultMapCenter();
		if (!this.isValidCenter(mapCenter))
		{
			console.error('INIT_MAP carries no map center and the page has no default point');

			return;
		}

		const preparedProps = { ...this.getPreparedProps(props), mapCenter };

		// A previous map would otherwise stay alive in the same container, and the MapLibre engine keeps
		// its tile protocol in a global registry - it has to release it before the new map registers one.
		// The reference goes whatever the engine does on the way out, so a destroy that throws leaves the
		// next INIT_MAP a clean slate instead of a service half torn down.
		try
		{
			this.mapService?.destroy();
		}
		finally
		{
			this.mapService = null;
		}

		this.setStandInCenter(!hasHostCenter);

		const mapService = this.createMapService();
		// Kept before init() so that an initialisation that throws still releases its resources on the
		// next INIT_MAP.
		this.mapService = mapService;
		mapService.onZoomChanged = (zoom) => this.applyZoomState(zoom);
		mapService.init(preparedProps);
	}

	createMapService()
	{
		const sourceParams = BX.message('LOCATION_MOBILE_SOURCE_PARAMS') || {};

		return Factory.create(
			BX.message('LOCATION_MOBILE_SOURCE_CODE'),
			BX.message('LOCATION_MOBILE_LANGUAGE_ID'),
			BX.message('LOCATION_MOBILE_SOURCE_LANGUAGE_ID'),
			{
				...sourceParams,
				mapEngine: BX.message('LOCATION_MOBILE_MAP_ENGINE') || 'leaflet',
			},
		).checkinMap;
	}

	getDefaultMapCenter()
	{
		// The whole page bootstrap is read this way here (see createMapService): main.core is not in the
		// extension's rel, and pulling it in for one more message would change what the bundle carries.
		// eslint-disable-next-line @bitrix24/bitrix24-rules/no-bx, @bitrix24/bitrix24-rules/no-bx-message
		const defaultPoint = BX.message('LOCATION_MOBILE_DEFAULT_LOCATION_POINT');
		if (!defaultPoint)
		{
			return null;
		}

		try
		{
			const { latitude, longitude } = JSON.parse(defaultPoint);

			return [latitude, longitude];
		}
		catch (error)
		{
			// A point that cannot be read is no point at all: answered as a page that carries none, so a
			// broken bootstrap value is not thrown out of the command the way a missing center used to be.
			console.error('Failed to read the default location point:', error);

			return null;
		}
	}

	isValidCenter(center)
	{
		return Array.isArray(center)
			&& center.length === 2
			&& center.every((coordinate) => Number.isFinite(coordinate))
		;
	}

	/**
	 * The camera is being put on coordinates the host actually has, so whatever the map was built on is
	 * no longer what it shows. Only a framing that carries coordinates gets here: a zoom changes the
	 * scale and leaves the camera where it is, and FIT_TO_LAYERS frames what is already drawn - which
	 * every path puts on the map together with the framing that carries its coordinates. So a day with
	 * nothing on it keeps the map hidden instead of showing the region point it was built on.
	 */
	revealMap()
	{
		this.setStandInCenter(false);
	}

	setStandInCenter(isOn)
	{
		this.standsOnStandInCenter = isOn;
		this.toggleContainerClass(STAND_IN_CENTER_CLASS, isOn);
	}

	applyZoomState(zoom)
	{
		this.toggleContainerClass('ci-zoom-far', zoom < CI_XN_ZOOM_THRESHOLD);
	}

	toggleContainerClass(className, isOn)
	{
		const container = document.querySelector(MAP_CONTAINER_SELECTOR);
		if (!container)
		{
			return;
		}

		// eslint-disable-next-line @bitrix24/bitrix24-rules/no-classlist
		container.classList.toggle(className, isOn);
	}

	getPreparedProps(props = {})
	{
		const preparedProps = {
			...props,
			containerId: MAP_CONTAINER_SELECTOR,
		};

		if (Array.isArray(preparedProps.markers))
		{
			preparedProps.markers = this.prepareMarkers(preparedProps.markers);
		}

		return preparedProps;
	}

	subscribeToEvents()
	{
		BXNativeBridge?.onReceiveEvent(this.onReceiveEvent);
	}

	onReceiveEvent = (event) => {
		const { eventType, data = {} } = event;
		if (!this.mapService && eventType !== CheckinMapCommandType.INIT_MAP)
		{
			console.error('Map service is not initialized. Call INIT_MAP first.');

			return;
		}

		if (USER_CAMERA_COMMANDS.has(eventType))
		{
			this.#reportManualMove();
		}

		switch (eventType)
		{
			case CheckinMapCommandType.INIT_MAP:
				this.init(data);
				break;
			case CheckinMapCommandType.ADD_MARKERS:
			{
				const preparedData = this.getPreparedProps({ markers: data.markers });
				this.mapService.addMarkers(preparedData.markers);
				break;
			}
			case CheckinMapCommandType.REMOVE_MARKERS:
				this.mapService.removeMarkers(data.ids);
				break;
			case CheckinMapCommandType.CLEAR_MARKERS:
				this.mapService.clearMarkers();
				break;
			case CheckinMapCommandType.ADD_LAYERS:
				this.mapService.addLayers(data.layers);
				break;
			case CheckinMapCommandType.REMOVE_LAYERS:
				this.mapService.removeLayers(data.ids);
				break;
			case CheckinMapCommandType.CLEAR_LAYERS:
				this.mapService.clearLayers();
				break;
			case CheckinMapCommandType.FIT_BOUNDS:
			{
				// The map the user is about to see stands on the stand-in centre, so the framing that
				// brings it to the real coordinates would otherwise be flown as a trip from there.
				const options = this.standsOnStandInCenter ? { ...data.options, duration: 0 } : data.options;

				if (Array.isArray(data.bounds) && data.bounds.length > 0)
				{
					this.revealMap();
				}

				this.mapService.fitBounds(data.bounds, options);
				break;
			}
			case CheckinMapCommandType.SET_ZOOM:
				this.mapService.setZoom(data.zoom);
				break;
			case CheckinMapCommandType.ZOOM_IN:
				this.mapService.zoomIn();
				break;
			case CheckinMapCommandType.ZOOM_OUT:
				this.mapService.zoomOut();
				break;
			case CheckinMapCommandType.FIT_TO_LAYERS:
				this.mapService.fitToLayers(data.maxZoom);
				break;
			case CheckinMapCommandType.ENABLE_CLUSTERING:
			{
				const isRouteMode = data.options?.mode === 'route';
				this.mapService.enableClustering({
					...data.options,
					clusterIconFactory: isRouteMode
						? (markerConfigs, animated) => ClusterIconFactory.createRouteIcon(markerConfigs, animated)
						: (markerConfigs, animated) => ClusterIconFactory.createIcon(markerConfigs, animated),
				});
				break;
			}
			case CheckinMapCommandType.DISABLE_CLUSTERING:
				this.mapService.disableClustering();
				break;
			case CheckinMapCommandType.UPDATE_CLUSTER_ICON:
			{
				const markerConfigs = data.markerIds.map((id) => this.mapService.getMarkerConfig(id));
				let iconConfig = ClusterIconFactory.createIcon(markerConfigs, false);
				if (data.loading)
				{
					iconConfig = MarkerIconFactory.wrapWithLoader(iconConfig);
				}

				this.mapService.setClusterIcon(data.markerIds, iconConfig);
				break;
			}
			case CheckinMapCommandType.UPDATE_SETTINGS:
				this.mapService.updateSettings(data);
				break;
			case CheckinMapCommandType.SET_GRAYSCALE:
				this.mapService.setGrayscale(data.enabled);
				break;
			default:
				console.warn('Unknown command type:', eventType);
		}
	};

	/**
	 * Process marker config: convert type-based config to full icon config
	 */
	processMarkerConfig(config)
	{
		const markerIcon = this.prepareIconConfig(config?.markerIcon);
		const preparedConfig = {
			...config,
			markerIcon,
		};

		if (!markerIcon)
		{
			return preparedConfig;
		}

		const { type, data } = markerIcon;

		if (type)
		{
			const iconData = data || {};
			const iconConfig = MarkerIconFactory.createIconByType(type, iconData);
			if (iconConfig)
			{
				return {
					...preparedConfig,
					avatarUrl: preparedConfig.avatarUrl ?? data?.avatarUrl ?? null,
					name: preparedConfig.name ?? data?.name ?? null,
					id: preparedConfig.id ?? data?.id ?? null,
					// Key and icon come from the same data, so the two cannot drift apart.
					markerIcon: { ...iconConfig, iconKey: buildIconKey(type, iconData) },
				};
			}

			console.error('Failed to create icon config for type:', type);
		}

		return preparedConfig;
	}

	/**
	 * Process multiple markers
	 */
	processMarkers(markers)
	{
		if (!Array.isArray(markers))
		{
			return markers;
		}

		return markers.map((marker) => ({
			id: marker.id,
			config: this.processMarkerConfig(marker.config),
		}));
	}

	prepareMarkers(markers)
	{
		if (!Array.isArray(markers))
		{
			return markers;
		}

		return markers.map((marker) => ({
			...marker,
			config: this.processMarkerConfig(marker.config),
		}));
	}

	prepareIconConfig(markerIcon)
	{
		if (!markerIcon)
		{
			return markerIcon;
		}

		// iconKey is not part of the host contract: the engine reads it as "the same icon, leave the
		// node alone", and only this class knows what an icon was built from.
		const { iconKey, ...hostIcon } = markerIcon;

		// If icon has a type, we'll generate html via MarkerIconFactory
		// So we should remove the html property to avoid confusion
		if (hostIcon.type)
		{
			const { html, ...restIcon } = hostIcon;

			return restIcon;
		}

		// If no type specified, keep the icon as is (including html)
		return hostIcon;
	}
}

export {
	CheckInMap,
	MarkerType,
	MarkerIconFactory,
	OFFICE_PLATE_MAX_FACES,
	PLATE_MIN_ZOOM,
};
