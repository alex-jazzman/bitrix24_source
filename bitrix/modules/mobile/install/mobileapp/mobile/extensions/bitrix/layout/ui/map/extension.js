/**
 * @module layout/ui/map
 */
jn.define('layout/ui/map', (require, exports, module) => {
	const { EventType } = require('layout/ui/map/src/const/event-type');
	const { CommandType } = require('layout/ui/map/src/const/command-type');
	const { Type } = require('type');
	const { createTestIdGenerator } = require('utils/test');
	const { Indent, Color } = require('tokens');

	const { Icon } = require('assets/icons');
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
			const { mapUrl } = this.props;

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
						console.warn('onReceiveEvent', event);
						const { onReceiveEvent } = this.props;
						onReceiveEvent?.(event);
					},
				}),
				this.#renderZoomButtons(),
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
						right: Indent.XL3.toNumber(),
					},
				},
				ChipButton({
					testId: this.getTestId('fit-to-layers-button'),
					text: '',
					icon: Icon.MOBILE_FILL,
					avatar: false,
					rounded: false,
					size: ChipButtonSize.L,
					mode: ChipButtonMode.SOLID,
					design: ChipButtonDesign.PRIMARY,
					badge: false,
					backgroundColor: Color.bgContentPrimary,
					iconColor: Color.base1,
					ellipsize: Ellipsize.END,
					onClick: () => {
						this.fitToLayers();
					},
				}),
			);
		}

		#renderZoomButtons()
		{
			return View(
				{
					style: {
						position: 'absolute',
						top: '45%',
						right: Indent.XL3.toNumber(),
						justifyContent: 'center',
					},
				},
				ChipButton({
					testId: this.getTestId('zoom-in-button'),
					text: '',
					icon: Icon.PLUS,
					avatar: false,
					rounded: false,
					size: ChipButtonSize.L,
					mode: ChipButtonMode.SOLID,
					design: ChipButtonDesign.PRIMARY,
					badge: false,
					backgroundColor: Color.bgContentPrimary,
					iconColor: Color.base1,
					ellipsize: Ellipsize.END,
					onClick: () => {
						this.zoomIn();
					},
				}),
				ChipButton({
					testId: this.getTestId('zoom-out-button'),
					text: '',
					icon: Icon.MINUS,
					avatar: false,
					rounded: false,
					size: ChipButtonSize.L,
					mode: ChipButtonMode.SOLID,
					design: ChipButtonDesign.PRIMARY,
					badge: false,
					backgroundColor: Color.bgContentPrimary,
					iconColor: Color.base1,
					ellipsize: Ellipsize.END,
					style: {
						marginTop: Indent.M.toNumber(),
					},
					onClick: () => {
						this.zoomOut();
					},
				}),
			);
		}

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
	}

	module.exports = {
		Map: (props) => new Map(props),
		EventType,
		CommandType,
	};
});
