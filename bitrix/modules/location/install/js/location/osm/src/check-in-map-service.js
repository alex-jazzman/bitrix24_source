import {
	CheckInMapServiceBase,
	CheckInMapEventType,
} from 'location.core';
import { Leaflet as L } from '../leaflet/src/leaflet';
import { ClusteringManager } from './clustering-manager';

// Smooth move of a placed marker (`animate: true`; `animateDuration` overrides). Deliberately shorter
// than the gap between position fixes: the marker walks and then waits rather than lagging behind reality.
// Hand-kept mirror of ANIMATION_CONFIG.easeTo in the MapLibre engine; engine-mirrored-constants.test.js guards it.
export const MARKER_MOVE_DURATION_MS = 600;
const MARKER_MOVE_EASING = (t) => t * (2 - t);

// Minimum gap (ms) between two redraws of a line following a walking marker (~30 fps cap). The RAF loop
// still ticks every frame, so only the line is throttled: it lags the marker by at most one frame, hidden
// under the icon. Mirror of GROW_SOURCE_UPDATE_INTERVAL_MS in the MapLibre engine, guarded by the same test.
export const FOLLOWER_UPDATE_INTERVAL_MS = 30;

// A redraw rewrites the line whole, so a frame costs what the line is long: 0.012 ms at 30 vertices
// against 0.18 ms at the ~1350 a tracked shift ends with. Past this many vertices the gap between
// redraws grows with the line, the tip then lagging the marker by under a pixel at the zoom a route is watched at.
const FOLLOWER_CHEAP_LINE_VERTICES = 300;
const FOLLOWER_MAX_UPDATE_INTERVAL_MS = 120;

/**
 * Minimum gap (ms) between two redraws of a followed line of this many vertices. Mirrored in the
 * MapLibre engine and held to it by the same test as the walk duration.
 *
 * @param {number} vertexCount
 * @returns {number}
 */
export const followerUpdateIntervalMs = (vertexCount) => Math.min(
	FOLLOWER_MAX_UPDATE_INTERVAL_MS,
	FOLLOWER_UPDATE_INTERVAL_MS * Math.max(1, Math.ceil(vertexCount / FOLLOWER_CHEAP_LINE_VERTICES)),
);

export default class CheckInMapService extends CheckInMapServiceBase
{
	constructor(props)
	{
		super(props);
		const {
			languageId,
			sourceLanguageId,
			serviceUrl,
			mapServiceUrl,
			tileLayerFactoryMethod,
		} = props;

		this.languageId = languageId;
		this.sourceLanguageId = sourceLanguageId;
		this.tileLayerFactoryMethod = tileLayerFactoryMethod;
		this.serviceUrl = serviceUrl;
		this.mapServiceUrl = mapServiceUrl;
		this.tileUrlTemplate = `${mapServiceUrl}/hot/en/{z}/{x}/{y}.png`;

		this.mapInstance = null;
		this.markers = new Map();
		this.layers = new Map();

		// Accessed by ClusteringManager (convention-private: not part of the public API)
		this.markerOriginalLatLngs = new Map();
		this.markerConfigs = new Map();

		this.clustering = new ClusteringManager(this);
	}

	processInitProps(props)
	{
		this.containerId = props?.containerId;
		this.mapCenter = props?.mapCenter;
		this.mapZoom = props?.mapZoom || 13;
		this.zoomControlPosition = props?.zoomControlPosition || 'topright';
		this.fitBoundsPadding = props?.fitBoundsPadding || [20, 20];
		this.fitBoundsMaxZoom = props?.fitBoundsMaxZoom || 18;
		this.colorScheme = (props?.colorScheme ?? '').includes('dark') ? 'dark' : 'light';

		if (props?.colors)
		{
			this.#applyThemeColors(props.colors);
		}
	}

	#applyThemeColors(colors)
	{
		const root = document.documentElement;
		const { primaryBg, accent, accentBg, base3, base7, success } = colors;

		if (primaryBg)
		{
			root.style.setProperty('--primary-bg-color', primaryBg);
		}

		if (accent)
		{
			root.style.setProperty('--accent-color', accent);
		}

		if (accentBg)
		{
			root.style.setProperty('--accent-bg-color', accentBg);
		}

		if (base3)
		{
			root.style.setProperty('--base3-color', base3);
		}

		if (base7)
		{
			root.style.setProperty('--base7-color', base7);
		}

		if (success)
		{
			root.style.setProperty('--success-color', success);
		}
	}

	init(props = {})
	{
		this.processInitProps(props);
		const container = document.querySelector(this.containerId);

		if (!container)
		{
			console.error('Map container not found:', this.containerId);

			return;
		}

		if (this.colorScheme === 'dark')
		{
			container.classList.add('theme-dark');
		}

		this.mapInstance = L.map(container, {
			center: this.mapCenter,
			zoom: this.mapZoom,
			zoomControl: false,
			attributionControl: false,
		});

		L.control.attribution({ prefix: false }).addTo(this.mapInstance);

		if (this.zoomControlPosition !== 'none')
		{
			L.control.zoom({
				position: this.zoomControlPosition,
			}).addTo(this.mapInstance);
		}

		const tile = this.tileLayerFactoryMethod();

		tile.initialize(this.tileUrlTemplate, {
			/**
			 * In order to avoid blurry tiles on retina screens, we need to apply the below options:
			 * detectRetina: true,
			 * maxNativeZoom: 22,
			 * maxZoom: 18,
			 *
			 * but we can't do it right now because of the following bug in the leaflet library:
			 * https://github.com/Leaflet/Leaflet/issues/8850
			 * which causes fetching non-existent tiles (19, 20, etc. zoom levels)
			 */
			maxZoom: 18,
			attribution: 'Map data &copy; OpenStreetMap contributors',
		});

		tile.addTo(this.mapInstance);

		this.mapInstance.whenReady(() => {
			this.sendEvent(CheckInMapEventType.MAP_LOADED, {});
		});
	}

	destroy()
	{
		// Dispose removes event listeners and cancels timeouts without touching the map.
		// clearMarkers() then removes all markers (individual and cluster) from the map.
		this.clustering.dispose();
		this.#cancelAllMarkerAnimations();
		this.clearMarkers();
		this.clearLayers();

		if (this.mapInstance)
		{
			this.mapInstance.remove();
			this.mapInstance = null;
		}
	}

	addMarkers(markers)
	{
		if (!Array.isArray(markers))
		{
			console.error('addMarkers expects an array of marker objects');

			return;
		}

		if (markers.length === 0)
		{
			return;
		}

		const leafletMarkers = [];

		markers.forEach((markerData) => {
			if (!markerData.id || !markerData.config)
			{
				console.error('Each marker must have id and config properties', markerData);

				return;
			}

			const { id, config } = markerData;
			const { coords, markerIcon } = config;

			if (!markerIcon || !markerIcon.html)
			{
				console.error('Invalid icon config for marker:', id, 'Icon must have html property');

				return;
			}

			if (this.#moveMarkerSmoothly(id, config))
			{
				return;
			}

			const leafletIcon = this.createDivIcon(
				markerIcon.html,
				markerIcon.className,
				markerIcon.iconSize,
				markerIcon.iconAnchor,
			);

			const marker = L.marker(coords, {
				icon: leafletIcon,
				// Multiply by 10000 to dominate over Leaflet's latitude-based z-index offset
				// (Math.round(lat * -10000)), ensuring time order takes priority.
				zIndexOffset: config.zIndex == null ? 0 : config.zIndex * 10000,
			});

			marker.on('add', () => {
				const element = marker.getElement();
				// Same value under both names: `testId` is the historical map attribute,
				// `data-testid` is what Playwright's getByTestId() reads.
				element?.setAttribute('testId', id);
				element?.setAttribute('data-testid', id);
			});

			marker.on('click', () => {
				this.sendEvent(CheckInMapEventType.MARKER_CLICKED, {
					markerId: id,
					// Read through the registry rather than the captured value: a marker moved by
					// #moveMarkerSmoothly keeps its listener while its config is replaced.
					coords: this.markerConfigs.get(id)?.coords ?? coords,
				});
			});

			leafletMarkers.push({ id, marker, config });
		});

		leafletMarkers.forEach(({ id, marker, config }) => {
			// Remove old marker if exists
			if (this.markers.has(id))
			{
				this.cancelMarkerAnimation(id);

				const oldMarker = this.markers.get(id);
				if (oldMarker && this.mapInstance)
				{
					this.mapInstance.removeLayer(oldMarker);
				}
			}

			this.markers.set(id, marker);
			this.markerOriginalLatLngs.set(id, marker.getLatLng());
			this.markerConfigs.set(id, config);

			if (!this.clustering.isEnabled)
			{
				marker.addTo(this.mapInstance);
			}
		});

		if (this.clustering.isEnabled)
		{
			this.clustering.updateClusters();
		}
	}

	addLayers(layers)
	{
		if (!Array.isArray(layers))
		{
			console.error('addLayers expects an array of layer objects');

			return;
		}

		if (layers.length === 0)
		{
			return;
		}

		layers.forEach((layerData) => {
			if (!layerData.id || !layerData.config)
			{
				console.error('Each layer must have id and config properties', layerData);

				return;
			}

			const { id, config } = layerData;
			const { type, options } = config;
			let layer;

			// `appendPoints` carries the vertices a line has GROWN by instead of the whole line: a live
			// tail grows by one vertex per fix, while the line it grows onto is the whole day of a tracked
			// shift. A growth is never a layer of its own - what is not on the map has nothing to grow.
			const growth = type === 'polyline' && Array.isArray(config.appendPoints)
				? config.appendPoints
				: null;
			const grown = growth ? this.#layerGeometry(id) : null;
			if (growth && !grown)
			{
				console.error('appendPoints has no layer of that id to grow', id);

				return;
			}

			const points = growth ? [...grown, ...growth] : config.points;

			// `followMarker` binds the final vertex of the line to the live position of that marker, so a
			// tail can never be drawn ahead of the marker it belongs to. The points kept here stay the ones
			// the caller sent - the tip is substituted only while a walk is running.
			const followMarker = type === 'polyline' ? (config.followMarker ?? null) : null;
			if (followMarker)
			{
				this.#layerFollowers.set(id, { markerId: followMarker, points });
			}
			else
			{
				this.#layerFollowers.delete(id);
			}

			// A growth carries no paint, so the line it grows is written in place rather than built anew:
			// rebuilt from the vertices alone it would come back in the default stroke of the engine.
			if (growth)
			{
				this.layers.get(id).setLatLngs(
					followMarker ? this.#pathWithFollowedTip(points, this.#markerPosition(followMarker)) : points,
				);

				return;
			}

			switch (type)
			{
				case 'polyline':
					layer = L.polyline(
						followMarker ? this.#pathWithFollowedTip(points, this.#markerPosition(followMarker)) : points,
						options,
					);
					break;
				case 'polygon':
					layer = L.polygon(points, options);
					break;
				case 'circle':
					layer = L.circle(points, options);
					break;
				default:
					console.error('Unknown layer type:', type);

					return;
			}

			if (this.layers.has(id))
			{
				const oldLayer = this.layers.get(id);
				if (oldLayer && this.mapInstance)
				{
					this.mapInstance.removeLayer(oldLayer);
				}
			}

			layer.addTo(this.mapInstance);
			this.layers.set(id, layer);
		});
	}

	clearMarkers()
	{
		this.#cancelAllMarkerAnimations();
		this.clustering.cancelPendingAnimations();
		this.clustering.clearClusterMarkers();
		this.markers.forEach((marker) => {
			if (this.mapInstance)
			{
				this.mapInstance.removeLayer(marker);
			}
		});
		this.markers.clear();
		this.markerOriginalLatLngs.clear();
		this.markerConfigs.clear();
		this.clustering.clearPrevMarkerKeys();
		this.#fitToLayersInFlight = false;
	}

	removeMarkers(ids)
	{
		if (!Array.isArray(ids))
		{
			console.error('removeMarkers expects an array of marker identifiers');

			return;
		}

		ids.forEach((id) => {
			this.cancelMarkerAnimation(id);

			const marker = this.markers.get(id);
			if (marker && this.mapInstance)
			{
				this.mapInstance.removeLayer(marker);
			}
			this.markers.delete(id);
			this.markerOriginalLatLngs.delete(id);
			this.markerConfigs.delete(id);
			this.clustering.deletePrevMarkerKey(id);
		});
		this.#fitToLayersInFlight = false;

		if (this.clustering.isEnabled)
		{
			this.clustering.updateClusters();
		}
	}

	removeLayers(ids)
	{
		if (!Array.isArray(ids))
		{
			console.error('removeLayers expects an array of layer identifiers');

			return;
		}

		ids.forEach((id) => {
			const layer = this.layers.get(id);
			if (layer && this.mapInstance)
			{
				this.mapInstance.removeLayer(layer);
			}
			this.layers.delete(id);
			this.#layerFollowers.delete(id);
		});
	}

	clearLayers()
	{
		this.layers.forEach((layer) => {
			if (this.mapInstance)
			{
				this.mapInstance.removeLayer(layer);
			}
		});
		this.layers.clear();
		this.#layerFollowers.clear();
	}

	fitBounds(bounds, options = {})
	{
		if (!this.mapInstance)
		{
			console.error('Map instance is not initialized');

			return;
		}

		if (!Array.isArray(bounds) || bounds.length === 0)
		{
			console.error('Invalid bounds: empty or not an array');

			return;
		}

		this.#settleMarkerAnimations();

		const rawPadding = options.padding || this.fitBoundsPadding;
		const maxZoom = options.maxZoom === undefined ? this.fitBoundsMaxZoom : options.maxZoom;
		const { paddingTopLeft, paddingBottomRight } = this.normalizePadding(rawPadding);
		// One-off pixel shift of the framed points, mirroring MapLibre's `offset`: they end up at
		// (viewport center + offset), so the center moves the same way but reversed.
		const offset = Array.isArray(options.offset) ? L.point(options.offset) : L.point(0, 0);
		// Some fits (e.g. centering on a single point) should not run the cluster merge/split
		// transition, which hides markers for the duration of the flight and reads as a flicker.
		const skipClusterTransition = options.skipClusterTransition === true;

		this.clustering.suppressNextAnimation();

		if (this.clustering.isEnabled && !skipClusterTransition)
		{
			this.clustering.beginTransition();
		}

		if (bounds.length === 1)
		{
			const finalZoom = Math.min(maxZoom, this.mapInstance.getMaxZoom());

			// Shift the center so that the single point lands in the middle of the
			// padded viewport area rather than the middle of the full viewport.
			const paddingOffset = paddingBottomRight.subtract(paddingTopLeft).divideBy(2);
			const projected = this.mapInstance.project(L.latLng(bounds[0]), finalZoom);
			const center = this.mapInstance.unproject(projected.add(paddingOffset).subtract(offset), finalZoom);

			if (options.animate)
			{
				this.mapInstance.flyTo(center, finalZoom, {
					duration: options.duration ?? 0.5,
				});
			}
			else
			{
				this.mapInstance.setView(center, finalZoom);
			}

			return;
		}

		const leafletBounds = L.latLngBounds(bounds);
		if (!leafletBounds.isValid())
		{
			this.clustering.cancelTransition();
			console.error('Invalid Leaflet bounds');

			return;
		}

		// Leaflet frames bounds at (their center + (paddingBottomRight - paddingTopLeft) / 2), so the shift
		// is folded into the two paddings. Their sum is kept intact - that is what the fitted zoom is
		// computed from, and only the framing is meant to move.
		this.mapInstance.fitBounds(leafletBounds, {
			paddingTopLeft: paddingTopLeft.add(offset),
			paddingBottomRight: paddingBottomRight.subtract(offset),
			maxZoom,
			animate: options.animate === true,
			duration: options.duration,
		});
	}

	setZoom(zoom)
	{
		if (!this.mapInstance)
		{
			console.error('Map instance is not initialized');

			return;
		}

		this.mapInstance.setZoom(zoom);
	}

	zoomIn()
	{
		if (!this.mapInstance)
		{
			console.error('Map instance is not initialized');

			return;
		}

		this.mapInstance.zoomIn();
	}

	zoomOut()
	{
		if (!this.mapInstance)
		{
			console.error('Map instance is not initialized');

			return;
		}

		this.mapInstance.zoomOut();
	}

	fitToLayers(maxZoom = null)
	{
		if (!this.mapInstance)
		{
			console.error('Map instance is not initialized');

			return;
		}

		this.#settleMarkerAnimations();

		// Compute bounds from stable data sources — not from what is currently
		// rendered on the map, since clustering and animations alter that.
		const bounds = L.latLngBounds([]);
		let hasPoints = false;

		this.markerOriginalLatLngs.forEach((latLng) => {
			bounds.extend(latLng);
			hasPoints = true;
		});

		this.layers.forEach((layer) => {
			if (layer instanceof L.Marker
				|| layer instanceof L.Circle
				|| layer instanceof L.CircleMarker)
			{
				bounds.extend(layer.getLatLng());
				hasPoints = true;
			}
			else if (layer instanceof L.Polyline || layer instanceof L.Polygon)
			{
				bounds.extend(layer.getBounds());
				hasPoints = true;
			}
		});

		if (!hasPoints)
		{
			return;
		}

		// Skip if a fitToLayers-triggered animation is already in progress.
		// This prevents redundant calls (e.g. periodic polling) from restarting
		// the pan/zoom while it is still running.
		if (this.#fitToLayersInFlight)
		{
			return;
		}

		const targetMaxZoom = maxZoom === null ? this.fitBoundsMaxZoom : maxZoom;
		const { paddingTopLeft, paddingBottomRight } = this.normalizePadding(this.fitBoundsPadding);
		const totalPadding = paddingTopLeft.add(paddingBottomRight);

		// Pass 1 — compute the initial zoom from geographic coordinates alone.
		const initialZoom = Math.min(
			this.mapInstance.getBoundsZoom(bounds, false, totalPadding),
			targetMaxZoom,
		);

		// Extend bounds to include the full visual footprint of every marker icon.
		// Leaflet places the marker's coordinate at iconAnchor, so part of the icon
		// can extend beyond the coordinate (e.g. the time pill below LAST_CHECK_IN
		// extends 41 px south of its anchor). Without this step, those pixels fall
		// behind the UI buttons even though the coordinate is inside the padded area.
		this.#extendBoundsForIconOverhangs(bounds, initialZoom);

		// Pass 2 — recompute zoom now that the bounds include icon overhangs.
		const targetZoom = Math.min(
			this.mapInstance.getBoundsZoom(bounds, false, totalPadding),
			targetMaxZoom,
		);

		// Skip if the map is already showing all points at the correct zoom within the
		// padded viewport area. Using the raw getBounds() would include the padding zone
		// (where UI elements may overlay the map), so we compute the padded inner bounds
		// from container pixel coordinates instead.
		const mapSize = this.mapInstance.getSize();
		const paddedNW = this.mapInstance.containerPointToLatLng(paddingTopLeft);
		const paddedSE = this.mapInstance.containerPointToLatLng(
			L.point(mapSize.x - paddingBottomRight.x, mapSize.y - paddingBottomRight.y),
		);
		const paddedViewBounds = L.latLngBounds(paddedNW, paddedSE);

		if (Math.abs(this.mapInstance.getZoom() - targetZoom) < 0.5
			&& paddedViewBounds.contains(bounds))
		{
			return;
		}

		this.#fitToLayersInFlight = true;

		// Clear the flag once the animation completes so the next call
		// can perform a fresh check (e.g. after the user pans the map).
		this.mapInstance.once('moveend', () => {
			this.#fitToLayersInFlight = false;
		});

		this.mapInstance.fitBounds(bounds, {
			paddingTopLeft,
			paddingBottomRight,
			maxZoom: targetZoom,
		});
	}

	/**
	 * Enables marker clustering. Can be called repeatedly to update options while clustering is active.
	 *
	 * @param {object} [options]
	 * @param {boolean} [options.animated=true]
	 *   Whether to animate markers flying in/out when clusters form or dissolve.
	 *   Set to `false` to skip CSS transition animations (e.g. on the initial render).
	 * @param {number} [options.maxClusterRadius=80]
	 *   Maximum distance in pixels between two markers at the current zoom level
	 *   at which they are grouped into the same cluster.
	 * @param {function} options.clusterIconFactory
	 *   Factory function that produces the icon config for a cluster marker.
	 *   Called with `(markerConfigs: Array<object|null>, animated: boolean)`.
	 *   `markerConfigs` contains the config objects passed to {@link addMarkers} for each
	 *   member marker, in the same order as the cluster's member IDs (may be `null` if a
	 *   config was not stored for a given ID).
	 *   Must return `{ html: string, className: string, iconSize: number[], iconAnchor: number[] }`.
	 */
	enableClustering(options = {})
	{
		// From here on the clustering manager owns marker positions, and it cannot stop the walks itself:
		// enable() takes every marker off the map first. A marker folded into a cluster would otherwise
		// keep walking off-map, writing the lines bound to it.
		this.#cancelAllMarkerAnimations();
		this.clustering.enable(options);
	}

	disableClustering()
	{
		this.clustering.disable();
	}

	updateSettings(props = {})
	{
		if (props.fitBoundsPadding !== undefined)
		{
			this.fitBoundsPadding = props.fitBoundsPadding;
		}

		if (props.fitBoundsMaxZoom !== undefined)
		{
			this.fitBoundsMaxZoom = props.fitBoundsMaxZoom;
		}
	}

	getMarkerConfig(id)
	{
		return this.markerConfigs.get(id) ?? null;
	}

	setClusterIcon(markerIds, iconConfig)
	{
		this.clustering.setClusterIcon(markerIds, iconConfig);
	}

	setGrayscale(enabled)
	{
		if (!this.mapInstance)
		{
			return;
		}

		const tilePane = this.mapInstance.getPane('tilePane');
		if (tilePane)
		{
			tilePane.style.filter = enabled ? 'grayscale(1)' : '';
		}
	}

	#fitToLayersInFlight = false;

	// Running smooth marker moves, keyed by marker id. At most one per marker: a newer update for the
	// same id supersedes the unfinished move and starts from wherever the marker currently is, so a
	// fix arriving early never makes the marker jump. Each record: { rafId, position }.
	#markerAnimations = new Map();

	// Lines whose final vertex follows a marker (`followMarker` in the layer config), keyed by host
	// layer id: { markerId, points }. `points` is the geometry as sent - the tip is substituted only
	// while that marker is walking.
	#layerFollowers = new Map();

	/**
	 * Reports whether the marker is currently gliding towards a new position.
	 *
	 * @param {string} id
	 * @returns {boolean}
	 */
	isMarkerAnimating(id)
	{
		return this.#markerAnimations.has(id);
	}

	/**
	 * Moves a placed marker to new coordinates instead of replacing it by id (`animate: true`). The instance is
	 * reused, so an infinite CSS animation in the icon (the pulse of an active employee) keeps running. Only for
	 * a marker on the map on its own; in a cluster the caller falls back to replace-by-id.
	 *
	 * @returns {boolean} true when the update has been handled here.
	 */
	#moveMarkerSmoothly(id, config)
	{
		const marker = this.markers.get(id);

		if (config.animate !== true
			|| !marker
			|| !this.mapInstance
			|| !this.mapInstance.hasLayer(marker))
		{
			return false;
		}

		const from = marker.getLatLng();
		const to = L.latLng(config.coords);

		this.#refreshMarkerIcon(marker, id, config.markerIcon);
		marker.setZIndexOffset((config.zIndex ?? 0) * 10000);

		this.markerConfigs.set(id, config);
		this.markerOriginalLatLngs.set(id, to);

		this.#animateMarkerMove(id, marker, from, to, config.animateDuration ?? MARKER_MOVE_DURATION_MS);

		return true;
	}

	// Swaps the icon of a reused marker only when the new config actually draws something else -
	// setIcon rebuilds the element, which would restart any CSS animation the icon runs.
	#refreshMarkerIcon(marker, id, markerIcon)
	{
		const previous = this.markerConfigs.get(id)?.markerIcon;

		if (previous && this.#sameIconConfig(previous, markerIcon))
		{
			return;
		}

		marker.setIcon(this.createDivIcon(
			markerIcon.html,
			markerIcon.className,
			markerIcon.iconSize,
			markerIcon.iconAnchor,
		));

		// setIcon replaces the element, and the 'add' event that stamps these does not fire again.
		const element = marker.getElement();
		element?.setAttribute('testId', id);
		element?.setAttribute('data-testid', id);
	}

	/**
	 * Whether two icon configs would paint an element the same way.
	 *
	 * `iconKey` (location.check-in, icon-key.js) identifies the source an icon was built from and wins
	 * over the markup: generated html is not comparable. An avatar gets a fresh mask id on every build,
	 * so the html of the live employee marker is never equal twice - compared by markup alone it would
	 * be rebuilt on every fix, and the pulse it runs would restart with it. A key on one side only means
	 * the icon changed its nature; ready-made html carries no key and is its own identity.
	 */
	#sameIconConfig(a, b)
	{
		if (a.iconKey !== undefined || b.iconKey !== undefined)
		{
			return a.iconKey === b.iconKey;
		}

		return a.html === b.html
			&& (a.className ?? '') === (b.className ?? '')
			&& String(a.iconSize) === String(b.iconSize)
			&& String(a.iconAnchor) === String(b.iconAnchor);
	}

	// Glides the marker by interpolating its coordinate frame by frame, not by a CSS transform on the
	// element: the marker stays geographically correct on every frame, so a camera move running at the same
	// time (the map follows the live position) composes with it instead of dragging it behind.
	#animateMarkerMove(id, marker, from, to, duration)
	{
		this.cancelMarkerAnimation(id);

		const canAnimate = duration > 0
			// eslint-disable-next-line @bitrix24/bitrix24-rules/no-typeof
			&& typeof requestAnimationFrame === 'function'
			&& !from.equals(to);

		if (!canAnimate)
		{
			marker.setLatLng(to);
			this.#drawFollowerLayers(id, to);

			return;
		}

		const startedAt = this.#now();
		const record = { rafId: 0, position: from };
		this.#markerAnimations.set(id, record);

		const followerInterval = this.#followerUpdateInterval(id);
		let lastFollowerWriteAt = -Infinity;

		const step = () => {
			// Bail if the map is gone or a newer update for this marker superseded this move.
			if (!this.mapInstance || this.#markerAnimations.get(id) !== record)
			{
				return;
			}

			const now = this.#now();
			const progress = Math.min(1, (now - startedAt) / duration);

			if (progress >= 1)
			{
				this.#markerAnimations.delete(id);
				marker.setLatLng(to);
				// The last write is never skipped: the followed line has to end on the exact geometry
				// the caller sent, whatever the throttle did to the frames before it.
				this.#drawFollowerLayers(id, to);

				return;
			}

			const t = MARKER_MOVE_EASING(progress);
			const position = L.latLng(
				from.lat + (to.lat - from.lat) * t,
				from.lng + (to.lng - from.lng) * t,
			);
			record.position = position;
			marker.setLatLng(position);

			if (now - lastFollowerWriteAt >= followerInterval)
			{
				this.#drawFollowerLayers(id, position);
				lastFollowerWriteAt = now;
			}

			record.rafId = requestAnimationFrame(step);
		};

		record.rafId = requestAnimationFrame(step);
	}

	// How often the lines bound to this marker are redrawn while it walks. The longest one decides: they
	// are all written from the same frame, so the frame costs what the longest costs. Read once per walk -
	// the answer must not cost a pass over the layers on every frame.
	#followerUpdateInterval(markerId)
	{
		let longest = 0;

		this.#layerFollowers.forEach((follower) => {
			if (follower.markerId === markerId && Array.isArray(follower.points))
			{
				longest = Math.max(longest, follower.points.length);
			}
		});

		return followerUpdateIntervalMs(longest);
	}

	/**
	 * Where the marker is drawn right now: the frame of a running move, its settled coordinate
	 * otherwise. This is what a line bound with `followMarker` ends at.
	 *
	 * @param {string} markerId
	 * @returns {object|null} L.LatLng
	 */
	#markerPosition(markerId)
	{
		const running = this.#markerAnimations.get(markerId);
		if (running)
		{
			return running.position;
		}

		return this.markers.get(markerId)?.getLatLng() ?? null;
	}

	// The geometry a line holds, as the caller sent it, or null when there is no line of that id. A
	// followed one is read off the copy kept for it: the polyline itself carries the frame of a running
	// walk in place of its tip, and a growth laid onto that would nail the frame down as geometry.
	#layerGeometry(id)
	{
		const layer = this.layers.get(id);
		if (!(layer instanceof L.Polyline))
		{
			return null;
		}

		const followed = this.#layerFollowers.get(id);

		return Array.isArray(followed?.points)
			? followed.points
			: layer.getLatLngs().map(({ lat, lng }) => [lat, lng]);
	}

	// The path a followed line is drawn with: the geometry as sent, its final vertex moved onto the
	// marker. Never mutates the stored points - they stay the target the move ends on.
	#pathWithFollowedTip(points, position)
	{
		if (!Array.isArray(points) || points.length === 0 || !position)
		{
			return points;
		}

		const drawn = points.slice(0, -1);
		drawn.push(position);

		return drawn;
	}

	// Writes every line bound to this marker with its tip on the given position. Called from the
	// frames of the move itself, so the tip and the marker are one and the same coordinate of one
	// and the same frame - there is no clock to keep in step with another.
	#drawFollowerLayers(markerId, position)
	{
		this.#layerFollowers.forEach((follower, layerId) => {
			if (follower.markerId !== markerId)
			{
				return;
			}

			const layer = this.layers.get(layerId);
			if (layer instanceof L.Polyline)
			{
				layer.setLatLngs(this.#pathWithFollowedTip(follower.points, position));
			}
		});
	}

	cancelMarkerAnimation(id)
	{
		const record = this.#markerAnimations.get(id);
		if (!record)
		{
			return;
		}

		// eslint-disable-next-line @bitrix24/bitrix24-rules/no-typeof
		if (typeof cancelAnimationFrame === 'function')
		{
			cancelAnimationFrame(record.rafId);
		}
		this.#markerAnimations.delete(id);
	}

	/**
	 * Ends every running walk on its destination. A camera fit frames the scene by the coordinates the
	 * markers are walking TO (it is built from markerOriginalLatLngs), so a marker still on its way would
	 * stand off the frame built for it - at the closest zoom, near the screen edge instead of the centre.
	 */
	#settleMarkerAnimations()
	{
		[...this.#markerAnimations.keys()].forEach((id) => {
			this.cancelMarkerAnimation(id);

			const marker = this.markers.get(id);
			const target = this.markerOriginalLatLngs.get(id);
			if (marker && target)
			{
				marker.setLatLng(target);
				this.#drawFollowerLayers(id, target);
			}
		});
	}

	#cancelAllMarkerAnimations()
	{
		this.#markerAnimations.forEach((record) => {
			// eslint-disable-next-line @bitrix24/bitrix24-rules/no-typeof
			if (typeof cancelAnimationFrame === 'function')
			{
				cancelAnimationFrame(record.rafId);
			}
		});
		this.#markerAnimations.clear();
	}

	#now()
	{
		// eslint-disable-next-line @bitrix24/bitrix24-rules/no-typeof
		return (typeof performance !== 'undefined' && typeof performance.now === 'function')
			? performance.now()
			: Date.now();
	}

	/**
	 * Extends geographic bounds to cover the full visual footprint of every marker icon.
	 *
	 * Leaflet positions a marker so that its iconAnchor pixel coincides with the geographic
	 * coordinate. Parts of the icon that extend beyond the anchor (e.g. a time label below
	 * the anchor) are not included in the coordinate-based bounds. This method converts
	 * each icon's corner pixels to lat/lng at the given zoom and extends the bounds
	 * accordingly, so that fitBounds will keep every pixel of every icon within the
	 * padded viewport area.
	 *
	 * @param {L.LatLngBounds} bounds - mutated in-place
	 * @param {number} zoom
	 */
	#extendBoundsForIconOverhangs(bounds, zoom)
	{
		this.markerOriginalLatLngs.forEach((latLng, id) => {
			const markerIcon = this.markerConfigs.get(id)?.markerIcon;

			if (!markerIcon?.iconSize || !markerIcon?.iconAnchor)
			{
				return;
			}

			const [w, h] = markerIcon.iconSize;
			const [anchorX, anchorY] = markerIcon.iconAnchor;
			const anchor = this.mapInstance.project(latLng, zoom);

			// NW corner of icon (top-left relative to anchor)
			bounds.extend(this.mapInstance.unproject(
				anchor.subtract(L.point(anchorX, anchorY)),
				zoom,
			));

			// SE corner of icon (bottom-right relative to anchor)
			bounds.extend(this.mapInstance.unproject(
				anchor.add(L.point(w - anchorX, h - anchorY)),
				zoom,
			));
		});
	}

	/**
	 * Normalizes fitBoundsPadding into Leaflet paddingTopLeft / paddingBottomRight points.
	 *
	 * Supported input formats:
	 *   [vertical, horizontal]          — symmetric, same on all four sides
	 *   [top, right, bottom, left]      — CSS-like, each side explicit
	 *
	 * Leaflet Point convention: x = horizontal (left/right), y = vertical (top/bottom).
	 *
	 * @param {number[]} padding
	 * @returns {{ paddingTopLeft: L.Point, paddingBottomRight: L.Point }}
	 */
	normalizePadding(padding)
	{
		if (padding.length >= 4)
		{
			// [top, right, bottom, left]
			return {
				paddingTopLeft: L.point(padding[3], padding[0]), // {x: left, y: top}
				paddingBottomRight: L.point(padding[1], padding[2]), // {x: right, y: bottom}
			};
		}

		// [vertical, horizontal] — symmetric
		const [v, h = v] = padding;

		return {
			paddingTopLeft: L.point(h, v),
			paddingBottomRight: L.point(h, v),
		};
	}

	createDivIcon(html, className, iconSize, iconAnchor)
	{
		return L.divIcon({
			html,
			className,
			iconSize,
			iconAnchor,
		});
	}

	sendEvent(type, data = {})
	{
		// eslint-disable-next-line no-undef
		BXNativeBridge?.sendEvent(type, data);
	}
}
