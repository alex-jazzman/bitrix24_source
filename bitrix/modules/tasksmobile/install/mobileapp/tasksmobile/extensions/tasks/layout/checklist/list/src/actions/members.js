/**
 * @module tasks/layout/checklist/list/src/actions/members
 */
jn.define('tasks/layout/checklist/list/src/actions/members', (require, exports, module) => {
	const { Color, Indent } = require('tokens');
	const { AvatarStack } = require('ui-system/blocks/avatar-stack');
	const { IconView, Icon } = require('ui-system/blocks/icon');
	const { useCallback } = require('utils/function');
	const {
		MEMBER_TYPE_ICONS,
		MEMBER_TYPE_RESTRICTION_FEATURE_META,
	} = require('tasks/layout/checklist/list/src/constants');
	const { Text4 } = require('ui-system/typography/text');

	const IMAGE_SIZE = 22;

	/**
	 * @class ItemMembers
	 * @extends LayoutComponent
	 * @param {ItemMembersProps} props
	 */
	class ItemMembers extends LayoutComponent
	{
		/** @return {boolean} */
		isShow()
		{
			const { item } = this.props;

			return item.getMembersCount() > 0;
		}

		/** @return {Object | null} */
		render()
		{
			if (!this.isShow())
			{
				return null;
			}

			return View(
				{
					style: {
						flexDirection: 'row',
					},
				},
				...this.renderMemberTypes(),
			);
		}

		/**
		 * @private
		 * @return {Object[]}
		 */
		renderMemberTypes()
		{
			const { item, testId } = this.props;
			const memberSections = {};

			item.getPrepareMembers().forEach(({ type, id }) => {
				if (memberSections[type])
				{
					memberSections[type].push(id);
				}
				else
				{
					memberSections[type] = [id];
				}
			});

			const memberSectionsKeys = Object.entries(memberSections).sort();

			return memberSectionsKeys.map(([memberType, ids], i) => View(
				{
					testId: `${memberType}_user`,
					style: {
						flexDirection: 'row',
						alignItems: 'center',
						marginRight: memberSectionsKeys.length - 1 === i ? 0 : Indent.M.toNumber(),
					},
					onClick: this.handleOnClick(memberType),
				},
				IconView({
					icon: (
						MEMBER_TYPE_RESTRICTION_FEATURE_META[memberType].isRestricted()
							? Icon.LOCK
							: MEMBER_TYPE_ICONS[memberType]
					),
					size: IMAGE_SIZE,
					color: Color.base3,
				}),
				AvatarStack({
					testId,
					entities: ids,
					size: IMAGE_SIZE,
					withRedux: true,
					visibleEntityCount: 1,
					restView: this.renderRestView,
					onClick: useCallback(this.handleOnClick(memberType), [memberType]),
				}),
			));
		}

		/**
		 * @private
		 * @param {number} count
		 * @return {Object | null}
		 */
		renderRestView = (count) => {
			if (!count)
			{
				return null;
			}

			return Text4({
				text: `+${count}`,
				color: Color.base3,
				style: {
					marginLeft: Indent.S.toNumber(),
				},
			});
		};

		/**
		 * @private
		 * @param {string} memberType
		 * @return {() => void}
		 */
		handleOnClick = (memberType) => () => {
			const { onClick, item } = this.props;

			onClick(item.getId(), memberType);
		};
	}

	module.exports = { ItemMembers };
});
