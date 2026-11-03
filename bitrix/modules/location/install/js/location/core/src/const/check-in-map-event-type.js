const CheckInMapEventType = {
	MAP_LOADED: 'mapLoaded',
	PAGE_WITH_MAP_LOADED: 'pageWithMapLoaded',
	MARKER_CLICKED: 'markerClicked',
	CLUSTER_CLICKED: 'clusterClicked',
	LAYER_CLICKED: 'layerClicked',
	ZOOM_CHANGED: 'zoomChanged',
	// The user moved the camera by hand - dragged the map or pinched it. Programmatic camera moves
	// raise no pointer events and stay silent here, so a host that drives the camera itself can tell
	// its own move from the user taking the map over.
	MAP_MOVED_BY_USER: 'mapMovedByUser',
	// The requested map engine was not on the page and the built-in one took over. The host asked for
	// features the substitute may not have, so it is told instead of being left to guess.
	ENGINE_FALLBACK: 'engineFallback',
};

export default CheckInMapEventType;
