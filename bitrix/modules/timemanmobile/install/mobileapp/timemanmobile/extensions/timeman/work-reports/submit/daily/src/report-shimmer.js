/**
 * @module timeman/work-reports/submit/daily/src/report-shimmer
 */
jn.define('timeman/work-reports/submit/daily/src/report-shimmer', (require, exports, module) => {
	const { Line } = require('utils/skeleton');
	const { Color, Component, Corner, Indent } = require('tokens');
	const { ShimmerView } = require('layout/polyfill');
	const { Area } = require('ui-system/layout/area');
	const { AreaList } = require('ui-system/layout/area-list');
	const { Box } = require('ui-system/layout/box');
	const { ChipButtonSize } = require('ui-system/blocks/chips/chip-button');
	const { FORM_TITLE_HEIGHT, TEXT_AREA_HEIGHT } = require('timeman/work-reports/ui/form');
	const { GPT_CARD_HEIGHT, ROBOT_CARD_HEIGHT } = require('timeman/work-reports/ui/gpt-report-card');
	const { MAP_HEIGHT } = require('timeman/work-reports/ui/map-card');

	const SPACING = Indent.XL3.toNumber();

	// The line the title is drawn as: the block it stands in is the height the form gives its title,
	// and only the line inside it belongs to the shimmer.
	const TITLE_LINE_WIDTH = 160;
	const TITLE_LINE_HEIGHT = 20;

	// The badges the map card puts on the map: the same chips, drawn as the empty pills of a skeleton.
	const PILL_HEIGHT = ChipButtonSize.M.getHeight();
	const TIME_PILL_WIDTH = 72;
	const CHECK_IN_PILL_WIDTH = 120;

	/**
	 * The report form as it looks before its data arrives: the title, the card of the auto report when
	 * one is expected, the card of the map with its two badges and the block of the report text.
	 *
	 * @extends {LayoutComponent<DailyReportShimmerProps>}
	 */
	class DailyReportShimmer extends LayoutComponent
	{
		render()
		{
			// The wrapping of the form, so that every block stands where its content will stand: the
			// paddings are the ones Box and Area give the form and are not repeated here by hand. The
			// form is opened read-only at this point, so it has no footer to stand in for either.
			return Box(
				{
					testId: 'day-summary-shimmer',
					withScroll: true,
					withPaddingHorizontal: true,
					safeArea: {
						bottom: false,
					},
				},
				AreaList(
					{
						withScroll: false,
						safeArea: {
							bottom: false,
						},
					},
					Area(
						{
							isFirst: true,
						},
						this.#renderTitle(),
						this.#renderReportCard(),
						this.#renderMapCard(),
						Line('100%', TEXT_AREA_HEIGHT, 0, 0, Corner.M.toNumber()),
					),
				),
			);
		}

		#renderTitle()
		{
			return View(
				{
					style: {
						height: FORM_TITLE_HEIGHT,
						alignItems: 'center',
						justifyContent: 'center',
						marginBottom: SPACING,
					},
				},
				Line(TITLE_LINE_WIDTH, TITLE_LINE_HEIGHT),
			);
		}

		/**
		 * The auto report has a card of its own only on a record that carries one, and the form leaves
		 * its place empty otherwise: the shimmer draws it under the same condition, so the sheet does
		 * not promise a card that will not come.
		 */
		#renderReportCard()
		{
			const { hasAutoReport, hasGpt } = this.props;

			if (!hasAutoReport && !hasGpt)
			{
				return null;
			}

			const height = hasGpt ? GPT_CARD_HEIGHT : ROBOT_CARD_HEIGHT;

			return Line('100%', height, 0, SPACING, Component.cardCornerXL.toNumber());
		}

		/**
		 * Both the card of the map and its badges shimmer, and they are told apart by their tones: the
		 * badges keep the tone of the skeleton the other blocks are drawn in, `base6`, and the card is
		 * given its neighbour `base7`. The pair holds in both themes, only the side changes: in the
		 * light one the badges are darker than the card (`#DFE0E3` on `#EDEEF0`), in the dark one
		 * lighter (`#54595F` on `#363C41`).
		 */
		#renderMapCard()
		{
			return View(
				{
					testId: 'day-summary-shimmer-map',
					style: {
						position: 'relative',
						height: MAP_HEIGHT,
						marginBottom: SPACING,
					},
				},
				this.#renderShimmeringBlock({
					width: '100%',
					height: MAP_HEIGHT,
					borderRadius: Component.cardCornerXL.toNumber(),
					backgroundColor: Color.base7.toHex(),
				}),
				this.#renderTimePill(),
				this.#renderCheckInPill(),
			);
		}

		#renderTimePill()
		{
			return View(
				{
					testId: 'day-summary-shimmer-map-time',
					style: {
						position: 'absolute',
						top: Indent.L.toNumber(),
						right: Indent.L.toNumber(),
					},
				},
				this.#renderPill(TIME_PILL_WIDTH),
			);
		}

		#renderCheckInPill()
		{
			return View(
				{
					testId: 'day-summary-shimmer-map-checkin-count',
					style: {
						position: 'absolute',
						top: 0,
						bottom: 0,
						left: 0,
						right: 0,
						justifyContent: 'center',
						alignItems: 'center',
					},
				},
				this.#renderPill(CHECK_IN_PILL_WIDTH),
			);
		}

		/**
		 * @param {number} width
		 * @returns {ShimmerView}
		 */
		#renderPill(width)
		{
			return this.#renderShimmeringBlock({
				width,
				height: PILL_HEIGHT,
				borderRadius: PILL_HEIGHT / 2,
				backgroundColor: Color.base6.toHex(),
			});
		}

		/**
		 * `Line` of `utils/skeleton` draws in the tone of the skeleton and takes no other, while the card
		 * of the map and its badges have to shimmer in two tones, one on top of the other. This is the
		 * same block `Line` is built from, with the tone left to the caller.
		 *
		 * @param {ElementStyle} style
		 * @returns {ShimmerView}
		 */
		#renderShimmeringBlock(style)
		{
			return ShimmerView(
				{ animating: true },
				View({ style }),
			);
		}
	}

	module.exports = { DailyReportShimmer };
});
