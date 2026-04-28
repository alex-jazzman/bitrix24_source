/**
 * @module layout/ui/map/src/const/event-type
 */
jn.define('layout/ui/map/src/const/event-type', (require, exports, module) => {
	const EventType = {
		PAGE_WITH_MAP_LOADED: 'pageWithMapLoaded',
		MAP_LOADED: 'mapLoaded',
		MARKER_CLICKED: 'markerClicked',
	};

	module.exports = {
		EventType,
	};
});
