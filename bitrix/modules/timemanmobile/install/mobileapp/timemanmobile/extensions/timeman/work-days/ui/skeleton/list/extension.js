/**
 * @module timeman/work-days/ui/skeleton/list
 */
jn.define('timeman/work-days/ui/skeleton/list', (require, exports, module) => {
	const { Color, Indent, Corner } = require('tokens');
	const { Line, Circle } = require('utils/skeleton');

	const ITEM_COUNT = 10;

	const LINE_VARIANTS = [
		{ title: 100, subtitle: 40 },
		{ title: 120, subtitle: 20 },
		{ title: 60, subtitle: 80 },
	];

	const WorkDaysListSkeleton = () => View(
		{
			style: {
				flex: 1,
				marginTop: Indent.XL2.toNumber(),
				borderTopLeftRadius: Corner.XL.toNumber(),
				borderTopRightRadius: Corner.XL.toNumber(),
			},
		},
		View(
			{
				style: {
					paddingTop: Indent.S.toNumber(),
					backgroundColor: Color.bgContentPrimary.toHex(),
					borderRadius: Corner.XL.toNumber(),
				},
			},
			...Array.from({ length: ITEM_COUNT }, (item, index) => {
				const variant = LINE_VARIANTS[index % LINE_VARIANTS.length];

				return SkeletonItem(index !== ITEM_COUNT - 1, variant);
			}),
		),
	);

	const SkeletonItem = (showBorder, lines) => View(
		{
			style: {
				flexDirection: 'row',
				borderBottomWidth: 1,
				borderBottomColor: showBorder ? Color.bgSeparatorSecondary.toHex() : null,
				height: 42,
				alignItems: 'center',
				justifyContent: 'space-between',
				marginHorizontal: Indent.XL3.toNumber(),
			},
		},
		View(
			{
				style: {
					width: 160,
					alignItems: 'center',
					justifyContent: 'space-between',
					flexDirection: 'row',
				},
			},
			Circle(8),
			Line(lines.title, 11),
			Line(lines.subtitle, 5),
		),
		Line(70, 24),
	);

	module.exports = { WorkDaysListSkeleton };
});
