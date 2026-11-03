/**
 * @module timeman/work-reports/review/list/src/user-item
 */
jn.define('timeman/work-reports/review/list/src/user-item', (require, exports, module) => {
	const { Color, Indent, Component } = require('tokens');
	const { Base } = require('layout/ui/simple-list/items/base');
	const { Text2 } = require('ui-system/typography/text');
	const { Avatar } = require('ui-system/blocks/avatar');
	const { createTestIdGenerator } = require('utils/test');

	const USER_ITEM_TYPE = 'WorkReportUser';

	class UserItem extends Base
	{
		/** @param {UserItemProps} props */
		constructor(props)
		{
			super(props);

			this.getTestId = createTestIdGenerator({
				prefix: `work-report-user-${props.item.userId}`,
				context: this,
			});
		}

		renderItemContent()
		{
			const { item } = this.props;
			const user = item.user ?? {};
			const userId = item.userId ?? user.id;

			return View(
				{
					testId: this.getTestId('header'),
					style: {
						flexDirection: 'row',
						alignItems: 'center',
						paddingHorizontal: Component.paddingLr.toNumber(),
						paddingTop: Indent.XL4.toNumber(),
						paddingBottom: Indent.XL2.toNumber(),
					},
				},
				Avatar({
					testId: this.getTestId('avatar'),
					id: userId,
					size: 24,
					name: user.name,
					uri: user.photo,
				}),
				Text2({
					testId: this.getTestId('name'),
					text: user.name ?? '',
					accent: true,
					color: Color.base1,
					numberOfLines: 1,
					ellipsize: 'end',
					style: {
						flex: 1,
						marginLeft: Indent.L.toNumber(),
					},
				}),
			);
		}
	}

	module.exports = {
		UserItem,
		USER_ITEM_TYPE,
	};
});
