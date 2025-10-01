/**
 * @module user-profile/common-tab/src/block/gratitude/block
 */
jn.define('user-profile/common-tab/src/block/gratitude/block', (require, exports, module) => {
	const { BaseBlock } = require('user-profile/common-tab/src/block/base-block');
	const { Gratitude } = require('user-profile/common-tab/src/block/gratitude/view');
	const { gratitudesUpserted } = require('statemanager/redux/slices/gratitude');
	const { dispatch } = require('statemanager/redux/store');
	const { Loc } = require('loc');
	const { ViewMode } = require('user-profile/common-tab/src/block/base-view');
	const { GratitudeListManager } = require('layout/ui/gratitude-list');
	const { Type } = require('type');

	class GratitudeBlock extends BaseBlock
	{
		getSort()
		{
			return 400;
		}

		prepareProps(commonTabData)
		{
			const { gratitude, ownerId, parentWidget, efficiency } = commonTabData ?? {};

			if (gratitude?.items?.length > 0)
			{
				dispatch(gratitudesUpserted(gratitude.items));
			}

			return {
				ownerId,
				efficiency,
				parentWidget,
				gratitudeTotalCount: gratitude?.totalCount,
				gratitudes: gratitude?.items,
				testId: 'gratitude-card',
				onClick: this.onClick.bind(this),
				style: {
					height: 96,
					minWidth: '44%',
				},
			};
		}

		getContentClass()
		{
			return Gratitude;
		}

		getViewMode()
		{
			const { efficiency } = this.props;
			if (efficiency)
			{
				return ViewMode.HALF_WIDTH;
			}

			return ViewMode.FULL_WIDTH;
		}

		onClick()
		{
			const { ownerId, parentWidget } = this.props;

			void GratitudeListManager.openInComponentWithRedux({
				ownerId,
				parentWidget,
			});
		}

		getTitle()
		{
			if (Type.isArrayFilled(this.props?.gratitudes))
			{
				return Loc.getMessage('M_PROFILE_GRATITUDE_TITLE');
			}

			return null;
		}
	}

	module.exports = {
		GratitudeBlock,
	};
});
