/* eslint-disable */
this.BX = this.BX || {};
this.BX.Location = this.BX.Location || {};
(function (exports, location_source, location_core, ui_avatar) {
	'use strict';

	/**
	 * Marker types for checkin map
	 * @module location/checkin
	 */
	const MarkerType = Object.freeze({
		CHECK_IN: 'checkin',
		AUTO_CHECK_IN: 'autocheckin',
		FIRST_CHECK_IN: 'firstcheckin',
		FIRST_AUTO_CHECK_IN: 'firstautocheckin',
		LAST_CHECK_IN: 'lastcheckin',
		LAST_AUTO_CHECK_IN: 'lastautocheckin',
		TRANSIT_AUTO_CHECK_IN: 'transitautocheckin'
	});

	// Color palette and selection logic from layout/ui/user/empty-avatar
	const COLORS = ['#df532d', '#64a513', '#4ba984', '#4ba5c3', '#3e99ce', '#8474c8', '#1eb4aa', '#f76187', '#58cc47', '#ab7761', '#29619b', '#728f7a', '#ba9c7b', '#e8a441', '#556574', '#909090', '#5e5f5e'];
	const getColor = id => COLORS[id % COLORS.length];

	/**
	 * Returns the outerHTML of an AvatarRound component.
	 * Shows the avatar image when avatarUrl is provided; otherwise shows initials
	 * extracted from `name` on a background color derived from the numeric user `id`.
	 *
	 * @param {string|null} avatarUrl
	 * @param {string} name - used to extract initials (first letters of first two words)
	 * @param {number} id - numeric user id, determines the background color
	 * @param {number} size - desired pixel size of the avatar element
	 * @returns {string}
	 */
	function getAvatar(avatarUrl, name, id, size) {
		const avatar = new ui_avatar.AvatarRound({
			picPath: avatarUrl || '',
			title: name || '',
			size,
			baseColor: getColor(id)
		});
		return avatar.getContainer().outerHTML;
	}

	/**
	 * Factory for creating marker icons
	 * @module location/checkin
	 */
	class MarkerIconFactory {
		static createLastCheckInIconHtml(avatarUrl, name, id, time, checkInCount = null, isDayClosed = false) {
			const countBadge = checkInCount !== null && checkInCount !== undefined ? `<span class="employee-drop-badge">${checkInCount}</span>` : '';
			const dayClosedClass = isDayClosed ? ' day-closed' : '';
			return `
			<div class="marker-container last-check-in-marker-container${dayClosedClass}">
				<div class="employee-drop">
					<div class="employee-drop-content">
						${getAvatar(avatarUrl, name, id, 48)}
						${countBadge}
					</div>
				</div>
				<div class="marker-point-circle">
				</div>
				<div class="marker-drop-time">${time}</div>
			</div>
		`;
		}
		static createLastAutoCheckInIconHtml(avatarUrl, name, id, time, checkInCount = null, isDayClosed = false) {
			const countBadge = checkInCount !== null && checkInCount !== undefined ? `<span class="employee-drop-badge">${checkInCount}</span>` : '';
			const dayClosedClass = isDayClosed ? ' day-closed' : '';
			return `
			<div class="marker-container last-auto-check-in-marker-container${dayClosedClass}">
				<div class="employee-drop">
					<div class="employee-drop-content">
						${getAvatar(avatarUrl, name, id, 48)}
						${countBadge}
					</div>
				</div>
				<div class="marker-point-circle">
				</div>
				<div class="marker-drop-time">${time}</div>
			</div>
		`;
		}
		static createCheckInIconHtml(time) {
			return `
			<div class="marker-container check-in-marker-container">
				<div class="marker-point-circle"></div>
				<div class="marker-drop-time">${time}</div>
			</div>
		`;
		}
		static createFirstCheckInIconHtml(time) {
			return `
			<div class="marker-container first-check-in-marker-container">
				<div class="first-check-in-marker-icon">
					<svg class="first-check-in-marker-icon-svg" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
						<path d="M12.5777 6.85421C13.4377 7.3726 13.4377 8.61966 12.5777 9.13806L6.15773 13.0079C5.22469 13.57 4.03534 12.898 4.03534 11.8086L4.03534 4.18298C4.03551 3.09365 5.22472 2.42206 6.15773 2.98442L12.5777 6.85421Z" fill="currentColor"/>
					</svg>
				</div>
				<div class="marker-drop-time">${time}</div>
			</div>
		`;
		}
		static createFirstAutoCheckInIconHtml(time) {
			return `
			<div class="marker-container first-auto-check-in-marker-container">
				<div class="first-check-in-marker-icon">
					<svg class="first-check-in-marker-icon-svg" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
						<path d="M12.5777 6.85421C13.4377 7.3726 13.4377 8.61966 12.5777 9.13806L6.15773 13.0079C5.22469 13.57 4.03534 12.898 4.03534 11.8086L4.03534 4.18298C4.03551 3.09365 5.22472 2.42206 6.15773 2.98442L12.5777 6.85421Z" fill="currentColor"/>
					</svg>
				</div>
				<div class="marker-drop-time">${time}</div>
			</div>
		`;
		}
		static createAutoCheckInIconHtml(time) {
			return `
			<div class="marker-container auto-check-in-marker-container">
				<div class="marker-point-circle"></div>
				<div class="marker-drop-time">${time}</div>
			</div>
		`;
		}
		static createTransitAutoCheckInIconHtml() {
			return `
			<div class="marker-container transit-auto-check-in-marker-container">
				<div class="marker-point-circle"></div>
			</div>
		`;
		}
		static getCheckInIconConfig(time) {
			return {
				html: this.createCheckInIconHtml(time),
				className: 'check-in-marker',
				iconSize: [60, 46],
				iconAnchor: [30, 5]
			};
		}
		static getAutoCheckInIconConfig(time) {
			return {
				html: this.createAutoCheckInIconHtml(time),
				className: 'custom-auto-check-in-marker',
				iconSize: [60, 46],
				iconAnchor: [30, 5]
			};
		}
		static getTransitAutoCheckInIconConfig() {
			return {
				html: this.createTransitAutoCheckInIconHtml(),
				className: 'custom-transit-auto-check-in-marker',
				iconSize: [10, 10],
				iconAnchor: [5, 5]
			};
		}
		static getFirstCheckInIconConfig(time) {
			return {
				html: this.createFirstCheckInIconHtml(time),
				className: 'custom-first-check-in-marker',
				iconSize: [60, 70],
				iconAnchor: [30, 20]
			};
		}
		static getFirstAutoCheckInIconConfig(time) {
			return {
				html: this.createFirstAutoCheckInIconHtml(time),
				className: 'custom-first-auto-check-in-marker',
				iconSize: [60, 70],
				iconAnchor: [30, 20]
			};
		}
		static getLastCheckInIconConfig(avatarUrl, name, id, time, checkInCount = null, isDayClosed = false) {
			return {
				html: this.createLastCheckInIconHtml(avatarUrl, name, id, time, checkInCount, isDayClosed),
				className: 'custom-last-check-in-marker',
				iconSize: [60, 114],
				iconAnchor: [30, 73]
			};
		}
		static getLastAutoCheckInIconConfig(avatarUrl, name, id, time, checkInCount = null, isDayClosed = false) {
			return {
				html: this.createLastAutoCheckInIconHtml(avatarUrl, name, id, time, checkInCount, isDayClosed),
				className: 'custom-last-auto-check-in-marker',
				iconSize: [60, 114],
				iconAnchor: [30, 73]
			};
		}

		/**
		 * Wraps any icon config with a bullet loader placed above the marker.
		 * Adjusts iconSize and iconAnchor to account for the extra loader height.
		 * @param {Object} config
		 * @returns {Object}
		 */
		static wrapWithLoader(config) {
			const LOADER_HEIGHT = 20;
			const loaderHtml = `
			<div class="marker-bullet-loader">
				<div class="ui-loader__bullet">
					<div class="ui-loader__bullet_item"></div>
					<div class="ui-loader__bullet_item"></div>
					<div class="ui-loader__bullet_item"></div>
					<div class="ui-loader__bullet_item"></div>
					<div class="ui-loader__bullet_item"></div>
				</div>
			</div>
		`;
			return {
				...config,
				html: `${loaderHtml}${config.html}`,
				iconSize: [config.iconSize[0], config.iconSize[1] + LOADER_HEIGHT],
				iconAnchor: [config.iconAnchor[0], config.iconAnchor[1] + LOADER_HEIGHT]
			};
		}

		/**
		 * Create icon configuration based on marker type.
		 * Pass `data.loading = true` to overlay a bullet loader above the marker.
		 */
		static createIconByType(type, data) {
			let config;
			switch (type) {
				case MarkerType.CHECK_IN:
					config = this.getCheckInIconConfig(data.time);
					break;
				case MarkerType.AUTO_CHECK_IN:
					config = this.getAutoCheckInIconConfig(data.time);
					break;
				case MarkerType.TRANSIT_AUTO_CHECK_IN:
					config = this.getTransitAutoCheckInIconConfig();
					break;
				case MarkerType.FIRST_CHECK_IN:
					config = this.getFirstCheckInIconConfig(data.time);
					break;
				case MarkerType.FIRST_AUTO_CHECK_IN:
					config = this.getFirstAutoCheckInIconConfig(data.time);
					break;
				case MarkerType.LAST_CHECK_IN:
					config = this.getLastCheckInIconConfig(data.avatarUrl, data.name, data.id, data.time, data.checkInCount, data.isDayClosed);
					break;
				case MarkerType.LAST_AUTO_CHECK_IN:
					config = this.getLastAutoCheckInIconConfig(data.avatarUrl, data.name, data.id, data.time, data.checkInCount, data.isDayClosed);
					break;
				default:
					console.error('Unknown marker type:', type);
					return null;
			}
			return data.loading ? this.wrapWithLoader(config) : config;
		}
	}

	const AVATAR_LAYOUTS = [[],
	// 0
	[{
		left: 27,
		top: 27
	}],
	// 1 – centered
	[
	// 2 – SW→NE diagonal; top-right (NE) rendered last → on top
	{
		left: 15,
		top: 38
	}, {
		left: 39,
		top: 14
	}], [
	// 3 – equilateral triangle; top vertex first, bottom row last (higher z-index)
	{
		left: 27,
		top: 8
	}, {
		left: 10,
		top: 38
	}, {
		left: 44,
		top: 38
	}], [
	// 4 – diamond (r = 20); top, right, left, bottom rendered last → on top
	{
		left: 27,
		top: 7
	}, {
		left: 47,
		top: 27
	}, {
		left: 6,
		top: 27
	}, {
		left: 27,
		top: 47
	}], [
	// 5 – pentagon ring (r = 20); bottom vertex rendered last → on top
	{
		left: 38,
		top: 10
	}, {
		left: 15,
		top: 10
	}, {
		left: 46,
		top: 33
	}, {
		left: 7,
		top: 33
	}, {
		left: 27,
		top: 46
	}], [
	// 6 – hexagon ring (r = 24); sorted top→bottom, bottom rendered last → on top
	{
		left: 27,
		top: 3
	}, {
		left: 47,
		top: 15
	}, {
		left: 6,
		top: 15
	}, {
		left: 47,
		top: 39
	}, {
		left: 6,
		top: 39
	}, {
		left: 27,
		top: 51
	}], [
	// 7 – hexagon ring (r = 24) + center; ring sorted top→bottom, center rendered last → on top
	{
		left: 27,
		top: 3
	}, {
		left: 47,
		top: 15
	}, {
		left: 6,
		top: 15
	}, {
		left: 47,
		top: 39
	}, {
		left: 6,
		top: 39
	}, {
		left: 27,
		top: 51
	}, {
		left: 27,
		top: 27
	} // center – rendered last → on top
	], [
	// 8 – octagon ring (r = 25); sorted top→bottom, bottom rendered last → on top
	{
		left: 27,
		top: 2
	}, {
		left: 44,
		top: 9
	}, {
		left: 9,
		top: 9
	}, {
		left: 52,
		top: 27
	}, {
		left: 2,
		top: 27
	}, {
		left: 44,
		top: 44
	}, {
		left: 9,
		top: 44
	}, {
		left: 27,
		top: 52
	}]];

	// 9+ clusters: 7 avatars in a heptagon ring (r = 26, ~31% overlap) + overflow counter in the center.
	// Outer ring sorted top→bottom so the lowest avatars are rendered last → appear on top.
	const CLUSTER_OVERFLOW_LAYOUT = [{
		left: 27,
		top: 1
	}, {
		left: 47,
		top: 10
	}, {
		left: 6,
		top: 10
	}, {
		left: 52,
		top: 32
	}, {
		left: 1,
		top: 32
	}, {
		left: 38,
		top: 50
	}, {
		left: 15,
		top: 50
	}, {
		left: 27,
		top: 27
	} // center – rendered as overflow counter (always last)
	];

	// Base avatar size used for layout calculations
	const BASE_AVATAR_SIZE = 32;

	/**
	 * Returns avatar size in pixels based on cluster marker count.
	 * @param {number} count - Number of markers in the cluster
	 * @returns {number}
	 */
	function getAvatarSize(count) {
		if (count <= 2) {
			return 42;
		}
		if (count <= 4) {
			return 38;
		}
		if (count <= 5) {
			return 36;
		}
		return 32; // 6+ markers
	}
	class ClusterIconFactory {
		/**
		 * @param {Array<object|null>} markerConfigs - marker config objects passed from CheckInMapService
		 * @param {boolean} animated
		 * @returns {{ html: string, className: string, iconSize: number[], iconAnchor: number[] }}
		 */
		static createRouteIcon(markerConfigs, animated = true) {
			const count = markerConfigs.length;
			const label = count > 99 ? '99+' : String(count);
			const animateClass = animated ? ' map-route-cluster-animate' : '';
			return {
				html: `<div class="map-route-cluster-icon${animateClass}"><span class="map-route-cluster-count">${label}</span></div>`,
				className: 'map-route-cluster-marker',
				iconSize: [40, 40],
				iconAnchor: [20, 20]
			};
		}
		static createIcon(markerConfigs, animated = true) {
			const count = markerConfigs.length;
			const avatarUrls = markerConfigs.map(config => config?.avatarUrl ?? null);
			const names = markerConfigs.map(config => config?.name ?? '');
			const ids = markerConfigs.map(config => config?.id ?? 0);

			// Determine avatar size based on count
			const avatarSize = getAvatarSize(count);
			// Offset to center avatars of different sizes (layouts are calculated for 32px)
			const sizeOffset = (BASE_AVATAR_SIZE - avatarSize) / 2;
			let layout = null;
			let showCounter = false;
			let counterValue = 0;
			if (count <= 8) {
				layout = AVATAR_LAYOUTS[count] ?? AVATAR_LAYOUTS[6].slice(0, count);
			} else {
				// 9+ avatars: 7 visible in a ring, overflow counter in the center
				layout = CLUSTER_OVERFLOW_LAYOUT;
				showCounter = true;
				counterValue = count - 7;
			}
			const animateClass = animated ? ' map-cluster-animate' : '';
			let html = `<div class="map-cluster-icon${animateClass}">`;
			const avatarSlots = showCounter ? layout.length - 1 : layout.length;
			for (let i = 0; i < avatarSlots; i++) {
				const {
					left,
					top
				} = layout[i];
				const adjustedLeft = left + sizeOffset;
				const adjustedTop = top + sizeOffset;
				const inner = getAvatar(avatarUrls[i], names[i], ids[i], avatarSize);
				html += `<div class="map-cluster-avatar" style="left:${adjustedLeft}px;top:${adjustedTop}px;width:${avatarSize}px;height:${avatarSize}px;z-index:${i + 1};">${inner}</div>`;
			}
			if (showCounter) {
				const {
					left,
					top
				} = layout[layout.length - 1];
				const adjustedLeft = left + sizeOffset;
				const adjustedTop = top + sizeOffset;
				html += `<div class="map-cluster-avatar map-cluster-avatar--counter" style="left:${adjustedLeft}px;top:${adjustedTop}px;width:${avatarSize}px;height:${avatarSize}px;z-index:${avatarSlots + 1};"><span>+${counterValue}</span></div>`;
			}
			html += '</div>';
			return {
				html,
				className: 'map-cluster-marker',
				iconSize: [85, 85],
				iconAnchor: [42, 42]
			};
		}
	}

	class CheckInMap {
		constructor() {
			this.mapService = null;
			this.subscribeToEvents();
		}
		init(props) {
			const preparedProps = this.getPreparedProps(props);
			this.mapService = location_source.Factory.create(BX.message('LOCATION_MOBILE_SOURCE_CODE'), BX.message('LOCATION_MOBILE_LANGUAGE_ID'), BX.message('LOCATION_MOBILE_SOURCE_LANGUAGE_ID'), BX.message('LOCATION_MOBILE_SOURCE_PARAMS')).checkinMap;
			this.mapService.init(preparedProps);
		}
		getPreparedProps(props = {}) {
			const preparedProps = {
				...props,
				containerId: '#check-in-map'
			};
			if (Array.isArray(preparedProps.markers)) {
				preparedProps.markers = this.prepareMarkers(preparedProps.markers);
			}
			return preparedProps;
		}
		subscribeToEvents() {
			BXNativeBridge?.onReceiveEvent(this.onReceiveEvent);
		}
		onReceiveEvent = event => {
			const {
				eventType,
				data = {}
			} = event;
			if (!this.mapService && eventType !== location_core.CheckinMapCommandType.INIT_MAP) {
				console.error('Map service is not initialized. Call INIT_MAP first.');
				return;
			}
			switch (eventType) {
				case location_core.CheckinMapCommandType.INIT_MAP:
					this.init(data);
					break;
				case location_core.CheckinMapCommandType.ADD_MARKERS:
					{
						const preparedData = this.getPreparedProps({
							markers: data.markers
						});
						this.mapService.addMarkers(preparedData.markers);
						break;
					}
				case location_core.CheckinMapCommandType.REMOVE_MARKERS:
					this.mapService.removeMarkers(data.ids);
					break;
				case location_core.CheckinMapCommandType.CLEAR_MARKERS:
					this.mapService.clearMarkers();
					break;
				case location_core.CheckinMapCommandType.ADD_LAYERS:
					this.mapService.addLayers(data.layers);
					break;
				case location_core.CheckinMapCommandType.REMOVE_LAYERS:
					this.mapService.removeLayers(data.ids);
					break;
				case location_core.CheckinMapCommandType.CLEAR_LAYERS:
					this.mapService.clearLayers();
					break;
				case location_core.CheckinMapCommandType.FIT_BOUNDS:
					this.mapService.fitBounds(data.bounds, data.options);
					break;
				case location_core.CheckinMapCommandType.SET_ZOOM:
					this.mapService.setZoom(data.zoom);
					break;
				case location_core.CheckinMapCommandType.ZOOM_IN:
					this.mapService.zoomIn();
					break;
				case location_core.CheckinMapCommandType.ZOOM_OUT:
					this.mapService.zoomOut();
					break;
				case location_core.CheckinMapCommandType.FIT_TO_LAYERS:
					this.mapService.fitToLayers(data.maxZoom);
					break;
				case location_core.CheckinMapCommandType.ENABLE_CLUSTERING:
					{
						const isRouteMode = data.options?.mode === 'route';
						this.mapService.enableClustering({
							...data.options,
							clusterIconFactory: isRouteMode ? (markerConfigs, animated) => ClusterIconFactory.createRouteIcon(markerConfigs, animated) : (markerConfigs, animated) => ClusterIconFactory.createIcon(markerConfigs, animated)
						});
						break;
					}
				case location_core.CheckinMapCommandType.DISABLE_CLUSTERING:
					this.mapService.disableClustering();
					break;
				case location_core.CheckinMapCommandType.UPDATE_CLUSTER_ICON:
					{
						const markerConfigs = data.markerIds.map(id => this.mapService.getMarkerConfig(id));
						let iconConfig = ClusterIconFactory.createIcon(markerConfigs, false);
						if (data.loading) {
							iconConfig = MarkerIconFactory.wrapWithLoader(iconConfig);
						}
						this.mapService.setClusterIcon(data.markerIds, iconConfig);
						break;
					}
				case location_core.CheckinMapCommandType.UPDATE_SETTINGS:
					this.mapService.updateSettings(data);
					break;
				default:
					console.warn('Unknown command type:', eventType);
			}
		};

		/**
		 * Process marker config: convert type-based config to full icon config
		 */
		processMarkerConfig(config) {
			const markerIcon = this.prepareIconConfig(config?.markerIcon);
			const preparedConfig = {
				...config,
				markerIcon
			};
			if (!markerIcon) {
				return preparedConfig;
			}
			const {
				type,
				data
			} = markerIcon;
			if (type) {
				const iconConfig = MarkerIconFactory.createIconByType(type, data || {});
				if (iconConfig) {
					return {
						...preparedConfig,
						avatarUrl: preparedConfig.avatarUrl ?? data?.avatarUrl ?? null,
						name: preparedConfig.name ?? data?.name ?? null,
						id: preparedConfig.id ?? data?.id ?? null,
						markerIcon: iconConfig
					};
				}
				console.error('Failed to create icon config for type:', type);
			}
			return preparedConfig;
		}

		/**
		 * Process multiple markers
		 */
		processMarkers(markers) {
			if (!Array.isArray(markers)) {
				return markers;
			}
			return markers.map(marker => ({
				id: marker.id,
				config: this.processMarkerConfig(marker.config)
			}));
		}
		prepareMarkers(markers) {
			if (!Array.isArray(markers)) {
				return markers;
			}
			return markers.map(marker => ({
				...marker,
				config: this.processMarkerConfig(marker.config)
			}));
		}
		prepareIconConfig(markerIcon) {
			if (!markerIcon) {
				return markerIcon;
			}

			// If icon has a type, we'll generate html via MarkerIconFactory
			// So we should remove the html property to avoid confusion
			if (markerIcon.type) {
				const {
					html,
					...restIcon
				} = markerIcon;
				return restIcon;
			}

			// If no type specified, keep the icon as is (including html)
			return markerIcon;
		}
	}

	exports.CheckInMap = CheckInMap;
	exports.MarkerIconFactory = MarkerIconFactory;
	exports.MarkerType = MarkerType;

})(this.BX.Location.CheckIn = this.BX.Location.CheckIn || {}, BX.Location.Source, BX.Location.Core, BX.UI);
//# sourceMappingURL=check-in-map.bundle.js.map
