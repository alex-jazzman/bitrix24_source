/**
 * Marker types for checkin map
 * @module location/checkin
 */
export const MarkerType = Object.freeze({
	CHECK_IN: 'checkin',
	AUTO_CHECK_IN: 'autocheckin',
	FIRST_CHECK_IN: 'firstcheckin',
	FIRST_AUTO_CHECK_IN: 'firstautocheckin',
	LAST_CHECK_IN: 'lastcheckin',
	LAST_AUTO_CHECK_IN: 'lastautocheckin',
	TRANSIT_AUTO_CHECK_IN: 'transitautocheckin',
	CURRENT_LOCATION: 'currentlocation',
	// Significant events (new map prototype). Values match the orchestrator
	// (stafftrackmobile .../content/src/marker-type.js).
	NUM_PIN: 'numpin',
	AUTO_DOT: 'autodot',
	START_POINT: 'startpoint',
	FINISH_POINT: 'finishpoint',
	EMPLOYEE_AVATAR: 'employeeavatar',
	STACK: 'stack',
	FINISH_GROUP: 'finishgroup',
	OFFICE: 'office',
});
