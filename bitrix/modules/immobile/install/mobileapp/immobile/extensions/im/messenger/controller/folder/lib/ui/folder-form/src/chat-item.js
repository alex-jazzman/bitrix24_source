/**
 * @module im/messenger/controller/folder/lib/ui/folder-form/chat-item
 */
jn.define('im/messenger/controller/folder/lib/ui/folder-form/chat-item', (require, exports, module) => {
	const { Color } = require('tokens');
	const { Theme } = require('im/lib/theme');
	const { IconView, Icon } = require('ui-system/blocks/icon');
	const { ChatTitle } = require('im/messenger/lib/element/chat-title');
	const { ChatAvatar } = require('im/messenger/lib/ui/avatar');
	const { UserHelper } = require('im/messenger/lib/helper');

	/**
	 * @class FolderChatItem
	 *
	 * @param {object} props
	 * @param {string} props.dialogId
	 * @param {boolean} [props.showRemove=false]
	 * @param {Function} [props.onRemove]
	 */
	class FolderChatItem extends LayoutComponent
	{
		render()
		{
			const { dialogId, showRemove, onRemove } = this.props;
			const isNotes = UserHelper.isCurrentUser(dialogId);
			const title = ChatTitle.createFromDialogId(dialogId).getTitle({ useNotes: isNotes }) || dialogId;

			return View(
				{},
				View(
					{
						style: {
							flexDirection: 'row',
							alignItems: 'center',
							paddingHorizontal: 18,
							paddingTop: 14,
							paddingBottom: 15,
						},
					},
					ChatAvatar({
						dialogId,
						size: 40,
						isNotes,
						testId: `folder-chat-item-avatar-${dialogId}`,
					}),
					View(
						{
							style: {
								flex: 1,
								marginLeft: 12,
							},
						},
						Text({
							style: {
								fontSize: 17,
								color: Theme.colors.base1,
							},
							text: title,
							numberOfLines: 1,
							ellipsize: 'end',
						}),
					),
					showRemove && View(
						{
							style: {
								width: 28,
								height: 28,
								alignItems: 'center',
								justifyContent: 'center',
							},
							onClick: () => onRemove?.(dialogId),
						},
						IconView({
							icon: Icon.CROSS,
							size: 24,
							color: Color.base4,
						}),
					),
				),
				View({
					style: {
						height: 1,
						backgroundColor: Theme.colors.bgSeparatorSecondary,
						marginLeft: 70,
					},
				}),
			);
		}
	}

	module.exports = { FolderChatItem };
});
