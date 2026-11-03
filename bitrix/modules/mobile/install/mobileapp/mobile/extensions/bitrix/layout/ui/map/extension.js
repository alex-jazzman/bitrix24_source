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
	const { getMapBackgroundColor } = require('layout/ui/map/background');
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
				{
					testId: this.getTestId(),
				},
				WebView({
					style: {
						height: '100%',
						backgroundColor: getMapBackgroundColor(),
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
				this.#renderBottomControls(),
			);
		}

		// Bottom-anchored control column: fit-to-layers keeps the bottom slot; when the consumer
		// opts into a fit-to-me button (via onFitToMeClick), it is stacked ABOVE fit-to-layers.
		#renderBottomControls()
		{
			return View(
				{
					style: {
						position: 'absolute',
						bottom: 100,
						alignItems: 'center',
					},
				},
				this.#hasFitToMeButton() && this.#renderFitToMeButton(),
				this.#shouldShowFitButton() && this.#renderFitButton(),
			);
		}

		#shouldShowFitButton()
		{
			// Opt-out via showFitToLayers: false; defaults to shown so existing consumers are unaffected.
			return this.props.showFitToLayers !== false;
		}

		#renderFitButton()
		{
			return ChipButton({
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
			});
		}

		#hasFitToMeButton()
		{
			return Type.isFunction(this.props.onFitToMeClick);
		}

		// ChipButton carries neither `selected` nor `toggle`, so the pressed state of an opt-in
		// fit-to-me button is worn by the icon colour. The pressed testId keeps the released one as
		// its prefix: consumers that never pass isFitToMeActive address the very locator they did.
		#renderFitToMeButton()
		{
			const isActive = this.props.isFitToMeActive === true;

			return ChipButton({
				testId: this.getTestId(isActive ? 'fit-to-me-button-active' : 'fit-to-me-button'),
				text: '',
				icon: Icon.LOCATION,
				rounded: false,
				size: ChipButtonSize.L,
				mode: ChipButtonMode.SOLID,
				design: ChipButtonDesign.PRIMARY,
				backgroundColor: Color.bgContentPrimary,
				iconColor: isActive ? Color.accentMainSuccess : Color.base1,
				ellipsize: Ellipsize.END,
				onClick: this.onFitToMeButtonClick,
				style: {
					marginBottom: Indent.M.toNumber(),
					borderWidth: 1,
					borderColor: Color.base7.toHex(),
					borderRadius: Component.chipsLCorner.toNumber(),
				},
			});
		}

		onFitToLayersButtonClick = () => {
			this.fitToLayers();
		};

		onFitToMeButtonClick = () => {
			this.props.onFitToMeClick?.();
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
		 * @param {Boolean} [props.grayscale]
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
					// Check-in marker palette. The page is a WebView and has no AppTheme of its own,
					// so the only way its markers can follow the theme is to be handed the resolved
					// tokens here. The literals in check-in-map.css stay as light-theme fallbacks.
					checkInBlue: Color.accentMainPrimary.toHex(),
					checkInGreen: Color.accentMainSuccess.toHex(),
					checkInGrey: Color.base3.toHex(),
					checkInAmber: Color.accentMainWarning.toHex(),
					checkInWhite: Color.baseWhiteFixed.toHex(),
					// The big heading arrow beside a route. base2 is the one grey that inverts the right way -
					// dark over a light map, light over a darkened one - so the arrow stays legible without
					// competing with the route's own blue.
					checkInHeading: Color.base2.toHex(),
					// The photo-less employee placeholder is the app's own asset (mobile
					// assets/empty-avatar/person.svg), and every colour in it turns out to be a token, in both
					// themes: the card is accentSoftBlue2, the figure accentSoftBlue1, its outline the accent blue
					// already sent above. So the map can redraw that asset rather than approximate it.
					checkInSoftBlue1: Color.accentSoftBlue1.toHex(),
					checkInSoftBlue2: Color.accentSoftBlue2.toHex(),
					// Kant around a marker: one themed token, white on a light map and near-black on a darkened
					// one. Design calls this out explicitly - an earlier guess that the ring had to stay fixed white
					// was wrong.
					checkInKant: Color.base8.toHex(),
					// The digits in a disc (dot cluster, avatar badge) and the endpoint glyphs. They used
					// to ride on the kant token; the design split them so that on the dark map the numbers
					// and the start/finish icons stay white for accent while the kant stays near-black.
					checkInGlyph: Color.baseWhiteFixed.toHex(),
					// Surface of an avatar pin and of a cluster disc. No single token spans both
					// themes here: the design pairs a white disc in light with the lens blue in dark,
					// so the pair is resolved by theme rather than by one token.
					checkInSurface: String(AppTheme.id).includes('dark')
						? Color.bgDarkLensGradient2.toHex()
						: Color.baseWhiteFixed.toHex(),
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
		 * The host's intro cover over the map has finished: tell the page to hand the day over
		 * (it holds its markers hidden while the intro runs and drops them into place on this).
		 */
		introReveal()
		{
			this.sendEvent(CommandType.INTRO_REVEAL);
		}

		/**
		 * Hold every marker added from now on out of sight; dropMarkers lets the whole set fall into
		 * place. The pair is what choreographs an appearing route: dots first, then the growing line.
		 */
		holdMarkers()
		{
			this.sendEvent(CommandType.MARKERS_HOLD);
		}

		dropMarkers()
		{
			this.sendEvent(CommandType.MARKERS_DROP);
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
		showFitToLayers: PropTypes.bool,
		onReceiveEvent: PropTypes.func,
		onFitToMeClick: PropTypes.func,
		isFitToMeActive: PropTypes.bool,
	};

	module.exports = {
		Map: (props) => new Map(props),
		EventType,
		CommandType,
		// Re-exported so that a caller holding the component has one place to ask for the colour it
		// stands on, instead of a second copy of it. A caller that needs nothing else of the map takes
		// it from layout/ui/map/background directly and does not load this component at all.
		getMapBackgroundColor,
	};
});
