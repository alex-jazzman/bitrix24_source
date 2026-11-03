/**
 * @module timeman/workday-pill/src/ui/pill-shimmer
 */
jn.define('timeman/workday-pill/src/ui/pill-shimmer', (require, exports, module) => {
	const { Line } = require('utils/skeleton');
	const { Component } = require('tokens');

	const SHIMMER_WIDTH = 100;
	const SHIMMER_HEIGHT = 38;

	const WorkDayPillShimmer = () => Line(
		SHIMMER_WIDTH,
		SHIMMER_HEIGHT,
		0,
		0,
		Component.elementAccentCorner.toNumber(),
	);

	module.exports = { WorkDayPillShimmer };
});
