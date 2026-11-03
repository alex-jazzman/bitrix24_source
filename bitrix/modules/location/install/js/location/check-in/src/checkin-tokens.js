const OFFICE_DROP = Object.freeze({
	BUBBLE_SIZE: 40,
	TAIL_HEIGHT: 9,
	TAIL_OVERLAP: 1,
});

const OFFICE_DROP_HEIGHT = OFFICE_DROP.BUBBLE_SIZE + OFFICE_DROP.TAIL_HEIGHT - OFFICE_DROP.TAIL_OVERLAP;

export const CI_MARKER_SIZE = Object.freeze({
	NUM_PIN: { iconSize: [30, 54], iconAnchor: [15, 45] },
	AUTO_DOT: { iconSize: [18, 18], iconAnchor: [9, 9] },
	START_POINT: { iconSize: [18, 18], iconAnchor: [9, 9] },
	FINISH_POINT: { iconSize: [18, 18], iconAnchor: [9, 9] },
	EMPLOYEE_AVATAR: { iconSize: [64, 72], iconAnchor: [32, 63] },
	FINISH_GROUP: { iconSize: [85, 85], iconAnchor: [42.5, 42.5] },
	OFFICE: {
		iconSize: [OFFICE_DROP.BUBBLE_SIZE, OFFICE_DROP_HEIGHT],
		iconAnchor: [OFFICE_DROP.BUBBLE_SIZE / 2, OFFICE_DROP_HEIGHT],
	},
});

export const CI_STACK = Object.freeze({
	DISC: 18,
	CRESCENT_OFFSET: 6,
});

// xN stack counter appears from this zoom in; below it check-in-map.js hangs the `ci-zoom-far` class and the
// counter is hidden by CSS. Mirrored across the bundle boundary by osm check-in-map-service-maplibre
// (ARROW_MIN_ZOOM): the direction-arrow layer uses this value as its minzoom so arrows and the counter reveal
// together. osm cannot import this bundle, so keep the two copies in sync.
export const CI_XN_ZOOM_THRESHOLD = 15;

export const PLATE_MIN_ZOOM = 13;

export const CI_OFFICE_PLATE = Object.freeze({
	DROP_GAP: 6,
	TITLE_LINE_HEIGHT: 16,
	FACES_LINE_HEIGHT: 26,
});

export const CI_AVATAR_STACK = Object.freeze({
	FACE_SIZE: 22,
	OUTLINE: 2,
	OVERLAP: 9,
});

// Staleness grey for this bundle. Canonical JS home of the value; the live consumer is the CSS mirror
// `--ci-grey` in css/check-in-map.css (the line-dot/num/stack `--stale` marker rules) - a CSS variable and
// a JS const cannot share one literal, so the two are kept in sync by hand. The same grey is mirrored again,
// across the bundle boundary, by osm route-gradient.LINE_GRADIENT_START_COLOR (the non-fresh arrow colour).
// Team-view route lines are not grey: they fade via alpha (stafftrackmobile route-line-freshness).
export const CI_GREY = '#97a2b2';

// Background colours of empty avatars drawn on the map. Mirror of the app-wide palette
// (mobile layout/ui/user/empty-avatar COLORS): the same employee keeps one colour on the map and in
// every list of the app, so the copies must stay identical - guarded by the stafftrackmobile test
// employee-palette-sync.test.js. This is not the team route palette of check-in v3 (stafftrackmobile
// employee-palette.js): that one colours route lines and their discs, and its first slots differ on purpose.
export const EMPTY_AVATAR_PALETTE = Object.freeze([
	'#df532d',
	'#64a513',
	'#4ba984',
	'#4ba5c3',
	'#3e99ce',
	'#8474c8',
	'#1eb4aa',
	'#f76187',
	'#58cc47',
	'#ab7761',
	'#29619b',
	'#728f7a',
	'#ba9c7b',
	'#e8a441',
	'#556574',
	'#909090',
	'#5e5f5e',
]);
