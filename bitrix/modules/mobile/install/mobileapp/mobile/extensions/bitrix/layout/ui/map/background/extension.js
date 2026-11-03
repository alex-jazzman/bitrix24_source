/**
 * @module layout/ui/map/background
 */
jn.define('layout/ui/map/background', (require, exports, module) => {
	const AppTheme = require('apptheme');

	// The colour the map stands on before the page inside its WebView has painted. It mirrors the page
	// background of the map itself (location, check-in-map.css), so the seam between the wrapper and the
	// page it loads is invisible in either theme; the two copies are held together by
	// checkin-token-mirrors.test.js of stafftrackmobile, the css being a stylesheet and unable to import.
	//
	// This lives in an extension of its own, apart from the map component, because a caller can need the
	// colour without needing the map. The check-in section covers its opening with an intro clip that
	// dissolves into this very colour and hands the screen over on it, and the cover is carried by the
	// tab's stub - which sits in the EAGER bundle of the section, the one whose size delays the first
	// frame the user sees. Requiring the map component there would pull its chips, its icons and its
	// prop validation into that bundle to read two hex values. The component takes the colour from here
	// too, so there is still one place that answers, and it is re-exported by layout/ui/map for callers
	// that hold the component anyway.
	//
	// The table stays private and the answer is a function on purpose: it is the INDEXING - by the theme,
	// with a fallback for a theme nobody listed - that goes stale when it is copied about, not the hex
	// values. So a caller gets the colour, never the table. The miss is decided on the table's own keys,
	// because a theme named after something every object answers to (`constructor`, `toString`) would come
	// back as that inherited answer, and an answer that is not nullish walks straight past the fallback.
	const BACKGROUND_COLOR_BY_THEME = {
		light: '#DDDDDD',
		dark: '#1C1C1E',
	};

	/**
	 * @returns {String}
	 */
	function getMapBackgroundColor()
	{
		return Object.hasOwn(BACKGROUND_COLOR_BY_THEME, AppTheme.id)
			? BACKGROUND_COLOR_BY_THEME[AppTheme.id]
			: BACKGROUND_COLOR_BY_THEME.light;
	}

	module.exports = { getMapBackgroundColor };
});
