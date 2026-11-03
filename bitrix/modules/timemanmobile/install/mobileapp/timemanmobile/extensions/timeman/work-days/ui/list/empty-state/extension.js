/**
 * @module timeman/work-days/ui/list/empty-state
 */
jn.define('timeman/work-days/ui/list/empty-state', (require, exports, module) => {
	const { Loc } = require('loc');
	const { Indent, Corner, Color } = require('tokens');
	const { StatusBlock } = require('ui-system/blocks/status-block');
	const { makeLibraryImagePath } = require('asset-manager');
	const { createTestIdGenerator } = require('utils/test');

	class WorkDaysEmptyState extends LayoutComponent
	{
		constructor(props)
		{
			super(props);

			this.getTestId = createTestIdGenerator({ prefix: 'work-days-empty', context: this });
		}

		render()
		{
			return View(
				{
					style: {
						flex: 1,
						marginTop: Indent.XL2.toNumber(),

						borderTopLeftRadius: Corner.XL.toNumber(),
						borderTopRightRadius: Corner.XL.toNumber(),
						backgroundColor: Color.bgContentPrimary.toHex(),
						justifyContent: 'center',
						alignItems: 'center',
					},
				},
				StatusBlock({
					testId: this.getTestId('state'),
					title: Loc.getMessage('M_TIMEMAN_WORK_DAYS_EMPTY_TITLE'),
					description: Loc.getMessage('M_TIMEMAN_WORK_DAYS_EMPTY_DESCRIPTION'),
					image: Image({
						resizeMode: 'contain',
						style: {
							width: 160,
							height: 136,
						},
						uri: makeLibraryImagePath('calendar-error.png', 'volumetric', 'mobile', true),
					}),
					preventRefresh: true,
				}),
			);
		}
	}

	module.exports = { WorkDaysEmptyState };
});
