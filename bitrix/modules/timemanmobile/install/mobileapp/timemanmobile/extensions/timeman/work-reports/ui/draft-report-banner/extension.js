/**
 * @module timeman/work-reports/ui/draft-report-banner
 */
jn.define('timeman/work-reports/ui/draft-report-banner', (require, exports, module) => {
	const { Color, Indent, Component } = require('tokens');
	const { Card, CardDesign } = require('ui-system/layout/card');
	const { BadgeCounter, BadgeCounterDesign } = require('ui-system/blocks/badges/counter');
	const { Text4 } = require('ui-system/typography/text');
	const { makeLibraryImagePath } = require('asset-manager');
	const { createTestIdGenerator } = require('utils/test');
	const { Loc } = require('timeman/work-reports/loc');

	/**
	 * @param {DraftReportBannerProps} props
	 */
	function DraftReportBanner(props = {})
	{
		const { testId = 'draft-report-banner', count = 0, onClick } = props;
		const getTestId = createTestIdGenerator({ prefix: testId });

		return View(
			{
				testId: getTestId('wrapper'),
				style: {
					marginHorizontal: Component.paddingLr.toNumber(),
					paddingTop: Indent.S.toNumber(),
				},
			},
			Card(
				{
					testId: getTestId('card'),
					design: CardDesign.ACCENT,
					onClick,
					style: {
						flexDirection: 'row',
						alignItems: 'center',
					},
				},
				Image({
					testId: getTestId('icon'),
					resizeMode: 'contain',
					style: {
						width: 44,
						height: 41,
						marginRight: Indent.XL.toNumber(),
					},
					uri: makeLibraryImagePath('document-blue.png', 'graphic/common', 'mobile', false),
				}),
				Text4({
					testId: getTestId('text'),
					text: Loc.getMessage('M_TIMEMAN_WORK_REPORTS_DRAFT_BANNER_TEXT'),
					color: Color.base1,
					numberOfLines: 2,
					ellipsize: 'end',
					style: {
						flex: 1,
					},
				}),
			),
			count > 0 && View(
				{
					style: {
						position: 'absolute',
						top: 0,
						right: 0,
					},
				},
				BadgeCounter({
					testId: getTestId('badge'),
					value: count,
					design: BadgeCounterDesign.ALERT,
				}),
			),
		);
	}

	module.exports = { DraftReportBanner };
});
