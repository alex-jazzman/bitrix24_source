/**
 * @module layout/ui/map/src/const/command-type
 */
jn.define('layout/ui/map/src/const/command-type', (require, exports, module) => {
	const CommandType = {
		INIT_MAP: 'initMap',
		ADD_MARKERS: 'addMarkers',
		REMOVE_MARKERS: 'removeMarkers',
		CLEAR_MARKERS: 'clearMarkers',
		ADD_LAYERS: 'addLayers',
		REMOVE_LAYERS: 'removeLayers',
		CLEAR_LAYERS: 'clearLayers',
		FIT_BOUNDS: 'fitBounds',
		SET_ZOOM: 'setZoom',
		ZOOM_IN: 'zoomIn',
		ZOOM_OUT: 'zoomOut',
		FIT_TO_LAYERS: 'fitToLayers',
		CREATE_ICON: 'createIcon',
	};

	module.exports = {
		CommandType,
	};
});
