/**
 * @module timeman/work-reports/ui/form/src/heights
 */
jn.define('timeman/work-reports/ui/form/src/heights', (require, exports, module) => {
	// The blocks the form lays out itself, published the way the cards it puts inside publish theirs:
	// whoever stands in for the form - the count of its height, the shimmer drawn in its place - reads
	// these numbers instead of keeping a copy of them.
	const FORM_TITLE_HEIGHT = 44;
	const TEXT_AREA_HEIGHT = 182;

	module.exports = {
		FORM_TITLE_HEIGHT,
		TEXT_AREA_HEIGHT,
	};
});
