/**
 * @module layout/ui/map
 */
jn.define('layout/ui/map', (require, exports, module) => {
	const { EventType } = require('layout/ui/map/src/const/event-type');
	const { CommandType } = require('layout/ui/map/src/const/command-type');
	const { Type } = require('type');
	const { createTestIdGenerator } = require('utils/test');
	const { Indent, Color, Component } = require('tokens');
	const AppTheme = require('apptheme');
	const { Icon } = require('assets/icons');
	const { PropTypes } = require('utils/validation');
	const {
		ChipButtonSize,
		ChipButtonMode,
		ChipButtonDesign,
		Ellipsize,
		ChipButton,
	} = require('ui-system/blocks/chips/chip-button');

	/**
	 * @typedef {Object} MapMarkerIconConfig
	 * @property {String} [type]
	 * @property {Object} [data]
	 * @property {String} [html]
	 * @property {String} [className]
	 * @property {Array<Number>} [iconSize]
	 * @property {Array<Number>} [iconAnchor]
	 */

	/**
	 * @typedef {Object} MapMarkerConfig
	 * @property {Array<Number>} coords - [lat, lng], where lat is -90..90 and lng is -180..180
	 * @property {MapMarkerIconConfig} icon
	 */

	/**
	 * @typedef {Object} MapMarkerPayload
	 * @property {String|Number} id
	 * @property {MapMarkerConfig} config
	 */

	/**
	 * @typedef {Object} MapLayerConfig
	 * @property {String} type - One of: 'polyline', 'polygon', 'circle'
	 * @property {Array<Array<Number>>} points - Array of [lat, lng] pairs
	 * @property {Object} [options]
	 */

	/**
	 * @typedef {Object} MapLayerPayload
	 * @property {String|Number} id
	 * @property {MapLayerConfig} config
	 */

	/**
	 * @typedef {Object} FitBoundsOptions
	 * @property {Array<Number>} [padding] - [vertical, horizontal] or [top, right, bottom, left]
	 * @property {Number} [maxZoom] - Range: 0..22 (clamped by map max zoom)
	 * @property {Boolean} [animate] - Enable smooth pan/zoom animation
	 * @property {Number} [duration] - Animation duration in seconds (used when animate=true)
	 */

	/**
	 * @class Map
	 * @property {?Object} webViewRef
	 */
	class Map extends LayoutComponent
	{
		constructor(props)
		{
			super(props);
			this.webViewRef = null;

			this.getTestId = createTestIdGenerator({
				prefix: 'map',
				context: this,
			});
		}

		render()
		{
			const { mapUrl, isLoading, loadingOverlayImageUri } = this.props;

			return View(
				{},
				WebView({
					style: {
						height: '100%',
						backgroundColor: '#DDDDDD',
					},
					data: {
						url: mapUrl,
					},
					ref: (ref) => {
						this.webViewRef = ref;
					},
					onReceiveEvent: (event) => {
						const { onReceiveEvent } = this.props;
						onReceiveEvent?.(event);
					},
				}),
				isLoading && loadingOverlayImageUri && Image({
					style: {
						position: 'absolute',
						top: 0,
						left: 0,
						right: 0,
						bottom: 0,
					},
					uri: loadingOverlayImageUri,
					resizeMode: 'cover',
					autoPlayAnimation: true,
				}),
				this.#renderControlButtons(),
			);
		}

		#renderControlButtons()
		{
			return View(
				{
					style: {
						position: 'absolute',
						top: 0,
						bottom: 0,
						right: Indent.XL3.toNumber(),
					},
				},
				View(
					{
						style: {
							flex: 1,
							justifyContent: 'center',
							paddingBottom: Indent.M.toNumber(),
						},
					},
					this.#renderZoomButtons(),
				),
				this.#renderFitButton(),
			);
		}

		#renderFitButton()
		{
			return View(
				{
					style: {
						position: 'absolute',
						bottom: 100,
					},
				},
				ChipButton({
					testId: this.getTestId('fit-to-layers-button'),
					text: '',
					icon: Icon.MOBILE_FILL,
					rounded: false,
					size: ChipButtonSize.L,
					mode: ChipButtonMode.SOLID,
					design: ChipButtonDesign.PRIMARY,
					backgroundColor: Color.bgContentPrimary,
					iconColor: Color.base1,
					ellipsize: Ellipsize.END,
					onClick: this.onFitToLayersButtonClick,
					style: {
						borderWidth: 1,
						borderColor: Color.base7.toHex(),
						borderRadius: Component.chipsLCorner.toNumber(),
					},
				}),
			);
		}

		onFitToLayersButtonClick = () => {
			this.fitToLayers();
		};

		#renderZoomButtons()
		{
			return View(
				{},
				ChipButton({
					testId: this.getTestId('zoom-in-button'),
					text: '',
					icon: Icon.PLUS,
					rounded: false,
					size: ChipButtonSize.L,
					mode: ChipButtonMode.SOLID,
					design: ChipButtonDesign.PRIMARY,
					backgroundColor: Color.bgContentPrimary,
					iconColor: Color.base1,
					ellipsize: Ellipsize.END,
					onClick: this.onZoomInButtonClick,
					style: {
						borderWidth: 1,
						borderColor: Color.base7.toHex(),
						borderRadius: Component.chipsLCorner.toNumber(),
					},
				}),
				ChipButton({
					testId: this.getTestId('zoom-out-button'),
					text: '',
					icon: Icon.MINUS,
					rounded: false,
					size: ChipButtonSize.L,
					mode: ChipButtonMode.SOLID,
					design: ChipButtonDesign.PRIMARY,
					backgroundColor: Color.bgContentPrimary,
					iconColor: Color.base1,
					ellipsize: Ellipsize.END,
					style: {
						marginTop: Indent.M.toNumber(),
						borderWidth: 1,
						borderColor: Color.base7.toHex(),
						borderRadius: Component.chipsLCorner.toNumber(),
					},
					onClick: this.onZoomOutButtonClick,
				}),
			);
		}

		onZoomInButtonClick = () => {
			this.zoomIn();
		};

		onZoomOutButtonClick = () => {
			this.zoomOut();
		};

		/**
		 * Send arbitrary command to the map iframe.
		 * @param {String} type
		 * @param {Object} data
		 */
		sendEvent(type, data = {})
		{
			if (!this.webViewRef)
			{
				console.error('Map WebView reference is not initialized');

				return;
			}

			this.webViewRef.sendEvent(type, data);
		}

		/**
		 * Initialize the map with base props.
		 * @param {Object} [props]
		 * @param {Array<Number>} [props.mapCenter] - [lat, lng]
		 * @param {Number} [props.mapZoom] - Range: 0..22
		 * @param {Array<Number>} [props.fitBoundsPadding] - [vertical, horizontal] or [top, right, bottom, left]
		 * @param {Number} [props.fitBoundsMaxZoom] - Range: 0..22
		 */
		initMap(props = {})
		{
			const preparedProps = {
				...props,
				zoomControlPosition: 'none',
				colorScheme: AppTheme.id,
				colors: {
					primaryBg: Color.bgContentPrimary.toHex(),
					accent: Color.bgDarkLensGradient2.toHex(),
					accentBg: Color.accentMainPrimary.toHex(),
					base3: Color.base3.toHex(),
					base7: Color.base7.toHex(),
					success: Color.accentMainSuccess.toHex(),
				},
			};
			this.sendEvent(CommandType.INIT_MAP, preparedProps);
		}

		/**
		 * Remove all markers from the map.
		 */
		clearMarkers()
		{
			this.sendEvent(CommandType.CLEAR_MARKERS);
		}

		/**
		 * Add multiple markers at once.
		 * @param {Array<MapMarkerPayload>} markers
		 */
		addMarkers(markers)
		{
			if (!Type.isArrayFilled(markers))
			{
				console.error('addMarkers expects an array of marker objects');
			}

			this.sendEvent(CommandType.ADD_MARKERS, { markers });
		}

		/**
		 * Remove markers by array of identifiers.
		 * @param {Array<String|Number>} ids
		 */
		removeMarkers(ids)
		{
			if (!Type.isArrayFilled(ids))
			{
				console.error('removeMarkers expects an array of marker identifiers');
			}

			this.sendEvent(CommandType.REMOVE_MARKERS, { ids });
		}

		/**
		 * Add multiple layers at once.
		 * @param {Array<MapLayerPayload>} layers
		 */
		addLayers(layers)
		{
			if (!Type.isArrayFilled(layers))
			{
				console.error('addLayers expects an array of layer objects');
			}

			this.sendEvent(CommandType.ADD_LAYERS, { layers });
		}

		/**
		 * Remove layers by array of identifiers.
		 * @param {Array<String|Number>} ids
		 */
		removeLayers(ids)
		{
			if (!Type.isArrayFilled(ids))
			{
				console.error('removeLayers expects an array of layer identifiers');
			}

			this.sendEvent(CommandType.REMOVE_LAYERS, { ids });
		}

		/**
		 * Remove all layers from the map.
		 */
		clearLayers()
		{
			this.sendEvent(CommandType.CLEAR_LAYERS);
		}

		/**
		 * Fit map view to provided bounds.
		 * @param {Array<Array<Number>>} bounds - Array of [lat, lng] pairs
		 * @param {FitBoundsOptions} [options]
		 */
		fitBounds(bounds, options = {})
		{
			this.sendEvent(CommandType.FIT_BOUNDS, { bounds, options });
		}

		/**
		 * Set zoom level for the map.
		 * @param {Number} zoom
		 */
		setZoom(zoom)
		{
			this.sendEvent(CommandType.SET_ZOOM, { zoom });
		}

		/**
		 * Increase map zoom by one level.
		 */
		zoomIn()
		{
			this.sendEvent(CommandType.ZOOM_IN);
		}

		/**
		 * Decrease map zoom by one level.
		 */
		zoomOut()
		{
			this.sendEvent(CommandType.ZOOM_OUT);
		}

		/**
		 * Fit map to currently added layers.
		 * @param {?Number} maxZoom
		 */
		fitToLayers(maxZoom = null)
		{
			this.sendEvent(CommandType.FIT_TO_LAYERS, { maxZoom });
		}

		/**
		 * Enable automatic marker clustering based on zoom level and pixel distance.
		 * @param {Object} [options]
		 * @param {Number} [options.maxClusterRadius=80] - Pixel radius for grouping markers into a cluster
		 * @param {Function} [options.clusterIconFactory]
		 * - Custom factory: (count) => { html, className, iconSize, iconAnchor }
		 */
		enableClustering(options = {})
		{
			this.sendEvent(CommandType.ENABLE_CLUSTERING, { options });
		}

		/**
		 * Disable marker clustering and restore individual markers.
		 */
		disableClustering()
		{
			this.sendEvent(CommandType.DISABLE_CLUSTERING);
		}

		/**
		 * Update icon of a cluster identified by its member marker IDs.
		 * @param {string[]} markerIds
		 * @param {boolean} loading
		 */
		updateClusterIcon(markerIds, loading)
		{
			this.sendEvent(CommandType.UPDATE_CLUSTER_ICON, { markerIds, loading });
		}

		/**
		 * Update map settings after initialization.
		 * @param {Object} props
		 * @param {Array<Number>} [props.fitBoundsPadding] - [vertical, horizontal] or [top, right, bottom, left]
		 * @param {Number} [props.fitBoundsMaxZoom] - Range: 0..22
		 */
		updateSettings(props = {})
		{
			this.sendEvent(CommandType.UPDATE_SETTINGS, props);
		}

		/**
		 * Enable or disable grayscale filter on the map.
		 * @param {boolean} enabled
		 */
		setGrayscale(enabled)
		{
			this.sendEvent(CommandType.SET_GRAYSCALE, { enabled });
		}
	}

	Map.propTypes = {
		mapUrl: PropTypes.string.isRequired,
		isLoading: PropTypes.bool,
		loadingOverlayImageUri: PropTypes.string,
		onReceiveEvent: PropTypes.func,
	};

	module.exports = {
		Map: (props) => new Map(props),
		EventType,
		CommandType,
	};
});
