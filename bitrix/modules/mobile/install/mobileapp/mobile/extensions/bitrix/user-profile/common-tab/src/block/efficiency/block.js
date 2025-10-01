/**
 * @module user-profile/common-tab/src/block/efficiency/block
 */
jn.define('user-profile/common-tab/src/block/efficiency/block', (require, exports, module) => {
	const { BaseBlock } = require('user-profile/common-tab/src/block/base-block');
	const { Loc } = require('loc');
	const { ViewMode } = require('user-profile/common-tab/src/block/base-view');
	const { Efficiency } = require('user-profile/common-tab/src/block/efficiency/view');

	class EfficiencyBlock extends BaseBlock
	{
		isAvailable()
		{
			const { efficiency } = this.props;

			return Boolean(efficiency);
		}

		getSort()
		{
			return 400;
		}

		prepareProps(commonTabData)
		{
			const { efficiency, ownerId } = commonTabData ?? {};

			return {
				ownerId,
				efficiency,
				testId: 'efficiency-card',
				onClick: this.openEfficiency.bind(this),
				style: {
					minHeight: 96,
					minWidth: '40%',
				},
			};
		}

		getContentClass()
		{
			return Efficiency;
		}

		getViewMode()
		{
			return ViewMode.HALF_WIDTH;
		}

		getTitle()
		{
			return Loc.getMessage('M_PROFILE_EFFICIENCY_TITLE');
		}

		async openEfficiency()
		{
			const { ownerId } = this.props;
			const { Entry } = await requireLazy('tasks:entry').catch(console.error);

			void Entry.openEfficiency({ userId: ownerId });
		}
	}

	module.exports = {
		EfficiencyBlock,
	};
});
