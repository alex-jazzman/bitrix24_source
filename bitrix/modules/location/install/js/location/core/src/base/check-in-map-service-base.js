/**
 * Base abstract class for map services.
 * All methods must be implemented in derived classes.
 */
export default class CheckInMapServiceBase
{
	/**
	 * Initialize the map with provided props.
	 * @param {Object} props - Initialization properties
	 * @param {String} [props.containerId] - Map container selector
	 * @param {Array} [props.mapCenter] - Initial map center coordinates [lat, lng]
	 * @param {Number} [props.mapZoom] - Initial zoom level
	 * @param {String} [props.zoomControlPosition] - Position of zoom control
	 * @param {Array} [props.fitBoundsPadding] - Default padding for fitBounds
	 * @param {Number} [props.fitBoundsMaxZoom] - Default max zoom for fitBounds
	 */
	init(props)
	{
		throw new Error('Must be implemented');
	}

	/**
	 * Destroy the map instance and clean up resources.
	 * Removes all markers, layers, and the map instance itself.
	 */
	destroy()
	{
		throw new Error('Must be implemented');
	}

	/**
	 * Add multiple markers to the map at once.
	 * @param {Array<Object>} markers - Array of marker objects
	 * @param {String|Number} markers[].id - Unique marker identifier
	 * @param {Object} markers[].config - Marker configuration
	 * @param {Array} markers[].config.coords - Marker coordinates [lat, lng]
	 * @param {Object} markers[].config.icon - Icon configuration
	 * @param {String} markers[].config.icon.html - HTML content for icon
	 * @param {String} markers[].config.icon.className - CSS class for icon
	 * @param {Array} markers[].config.icon.iconSize - Icon size [width, height]
	 * @param {Array} markers[].config.icon.iconAnchor - Icon anchor point [x, y]
	 */
	addMarkers(markers)
	{
		throw new Error('Must be implemented');
	}

	/**
	 * Remove markers from the map by their identifiers.
	 * @param {Array<String|Number>} ids - Array of marker identifiers to remove
	 */
	removeMarkers(ids)
	{
		throw new Error('Must be implemented');
	}

	/**
	 * Remove all markers from the map.
	 */
	clearMarkers()
	{
		throw new Error('Must be implemented');
	}

	/**
	 * Add multiple layers to the map at once.
	 * @param {Array<Object>} layers - Array of layer objects
	 * @param {String|Number} layers[].id - Unique layer identifier
	 * @param {Object} layers[].config - Layer configuration
	 * @param {String} layers[].config.type - Layer type: 'polyline', 'polygon', or 'circle'
	 * @param {Array<Array>} layers[].config.points - Array of coordinate points [[lat, lng], ...]
	 * @param {Object} layers[].config.options - Layer styling options
	 * @param {String} [layers[].config.options.color] - Line/fill color
	 * @param {Number} [layers[].config.options.weight] - Line weight
	 * @param {Number} [layers[].config.options.opacity] - Opacity (0-1)
	 * @param {String} [layers[].config.options.dashArray] - Dash pattern for lines
	 */
	addLayers(layers)
	{
		throw new Error('Must be implemented');
	}

	/**
	 * Remove layers from the map by their identifiers.
	 * @param {Array<String|Number>} ids - Array of layer identifiers to remove
	 */
	removeLayers(ids)
	{
		throw new Error('Must be implemented');
	}

	/**
	 * Remove all layers from the map.
	 */
	clearLayers()
	{
		throw new Error('Must be implemented');
	}

	/**
	 * Fit map view to contain all provided bounds.
	 * @param {Array<Array>} bounds - Array of coordinate points [[lat, lng], ...]
	 * @param {Object} [options={}] - Fit bounds options
	 * @param {Array} [options.padding] - Padding around bounds [top/bottom, left/right]
	 * @param {Number} [options.maxZoom] - Maximum zoom level to use
	 */
	fitBounds(bounds, options = {})
	{
		throw new Error('Must be implemented');
	}

	/**
	 * Set the map zoom level.
	 * @param {Number} zoom - Zoom level to set
	 */
	setZoom(zoom)
	{
		throw new Error('Must be implemented');
	}

	/**
	 * Increase map zoom by one level.
	 */
	zoomIn()
	{
		throw new Error('Must be implemented');
	}

	/**
	 * Decrease map zoom by one level.
	 */
	zoomOut()
	{
		throw new Error('Must be implemented');
	}

	/**
	 * Fit map view to contain all currently added layers.
	 * @param {Number|null} [maxZoom=null] - Maximum zoom level to use
	 */
	fitToLayers(maxZoom = null)
	{
		throw new Error('Must be implemented');
	}

	/**
	 * Enable automatic marker clustering based on zoom level and pixel distance.
	 * @param {Object} [options={}]
	 * @param {Number} [options.maxClusterRadius=80] - Pixel radius for grouping markers into a cluster
	 * @param {Function} [options.clusterIconFactory] - Custom factory: (count) => { html, className, iconSize, iconAnchor }
	 */
	enableClustering(options = {})
	{
		throw new Error('Must be implemented');
	}

	/**
	 * Disable marker clustering and restore individual markers.
	 */
	disableClustering()
	{
		throw new Error('Must be implemented');
	}

	/**
	 * Get the stored config for a marker by its ID.
	 * @param {String|Number} id - Marker identifier
	 * @returns {Object|null}
	 */
	getMarkerConfig(id)
	{
		throw new Error('Must be implemented');
	}

	/**
	 * Update the icon of a cluster identified by its member marker IDs.
	 * @param {Array<String|Number>} markerIds - IDs of the markers in the cluster
	 * @param {Object} iconConfig - Icon configuration { html, className, iconSize, iconAnchor }
	 */
	setClusterIcon(markerIds, iconConfig)
	{
		throw new Error('Must be implemented');
	}

	/**
	 * Update map settings after initialization.
	 * @param {Object} props
	 * @param {Array<Number>} [props.fitBoundsPadding] - [vertical, horizontal] or [top, right, bottom, left]
	 * @param {Number} [props.fitBoundsMaxZoom] - Range: 0..22
	 */
	updateSettings(props)
	{
		throw new Error('Must be implemented');
	}
}
