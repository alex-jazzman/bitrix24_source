/**
 * @module timeman/work-days/ui/skeleton/legend
 */
jn.define('timeman/work-days/ui/skeleton/legend', (require, exports, module) => {
	const { Color, Indent } = require('tokens');
	const { Line } = require('utils/skeleton');

	const CHIP_WIDTH = 92;
	const CHIP_HEIGHT = 26;
	const CHIP_RADIUS = 13;

	const WorkDaysLegendSkeleton = () => View(
		{
			style: {
				flexDirection: 'row',
				alignItems: 'center',
				justifyContent: 'center',
				paddingVertical: Indent.M.toNumber(),
				borderTopWidth: 1,
				borderTopColor: Color.bgSeparatorSecondary.toHex(),
			},
		},
		View(
			{ style: { marginRight: Indent.M.toNumber() } },
			Line(CHIP_WIDTH, CHIP_HEIGHT, 0, 0, CHIP_RADIUS),
		),
		Line(CHIP_WIDTH, CHIP_HEIGHT, 0, 0, CHIP_RADIUS),
	);

	module.exports = { WorkDaysLegendSkeleton };
});
