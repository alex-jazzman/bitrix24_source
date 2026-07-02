/* global BXMobileApp */
import {
	CheckInMapServiceBase,
	CheckInMapEventType,
} from 'location.core';
import { Leaflet as L } from '../leaflet/src/leaflet';
import { ClusteringManager } from './clustering-manager';

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
				marker.getElement()?.setAttribute('testId', id);
			});

			marker.on('click', () => {
				this.sendEvent(CheckInMapEventType.MARKER_CLICKED, {
					markerId: id,
					coords,
				});
			});

			leafletMarkers.push({ id, marker, config });
		});

		leafletMarkers.forEach(({ id, marker, config }) => {
			// Remove old marker if exists
			if (this.markers.has(id))
			{
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
			const { type, points, options } = config;
			let layer;

			switch (type)
			{
				case 'polyline':
					layer = L.polyline(points, options);
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

		const rawPadding = options.padding || this.fitBoundsPadding;
		const maxZoom = options.maxZoom === undefined ? this.fitBoundsMaxZoom : options.maxZoom;
		const { paddingTopLeft, paddingBottomRight } = this.normalizePadding(rawPadding);

		this.clustering.suppressNextAnimation();

		if (this.clustering.isEnabled)
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
			const center = this.mapInstance.unproject(projected.add(paddingOffset), finalZoom);
			this.mapInstance.setView(center, finalZoom);

			return;
		}

		const leafletBounds = L.latLngBounds(bounds);
		if (!leafletBounds.isValid())
		{
			this.clustering.cancelTransition();
			console.error('Invalid Leaflet bounds');

			return;
		}

		this.mapInstance.fitBounds(leafletBounds, {
			paddingTopLeft,
			paddingBottomRight,
			maxZoom,
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

	#fitToLayersInFlight = false;

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
