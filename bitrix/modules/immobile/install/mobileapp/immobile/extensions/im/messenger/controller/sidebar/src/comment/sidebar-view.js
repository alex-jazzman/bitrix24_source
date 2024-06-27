/**
 * @module im/messenger/controller/sidebar/comment/sidebar-view
 */
jn.define('im/messenger/controller/sidebar/comment/sidebar-view', (require, exports, module) => {
	const { ChannelSidebarView } = require('im/messenger/controller/sidebar/channel/sidebar-view');
	const { ChannelProfileBtn } = require('im/messenger/controller/sidebar/channel/profile-btn-view');
	const { CommentProfileInfo } = require('im/messenger/controller/sidebar/comment/profile-info');
	const { commentSidebarEmptyState } = require('im/messenger/assets/common');
	const { Theme } = require('im/lib/theme');
	const { Loc } = require('loc');

	/**
	 * @class CommentSidebarView
	 * @typedef {LayoutComponent<CommentSidebarViewProps, CommentSidebarViewState>} CommentSidebarView
	 */
	class CommentSidebarView extends ChannelSidebarView
	{
		renderInfoBlock()
		{
			return View(
				{
					style: {
						justifyContent: 'center',
						alignItems: 'center',
						flexDirection: 'column',
					},
				},
				new CommentProfileInfo(this.props),
			);
		}

		renderButtonsBlock()
		{
			return new ChannelProfileBtn({ buttonElements: this.props.buttonElements });
		}

		renderTabs()
		{
			return View(
				{
					style: {
						justifyContent: 'center',
						alignItems: 'center',
						marginTop: 44,
					},
				},
				View(
					{
						style: {
							justifyContent: 'center',
							alignItems: 'center',
							flexDirection: 'row',
						},
					},
					Image({
						style: {
							width: 96,
							height: 96,
						},
						svg: {
							content: commentSidebarEmptyState(),
						},
						onFailure: () => {
							this.setState({ showImageAvatar: false });
						},
					}),
				),
				Text(
					{
						style: {
							alignSelf: 'center',
							color: Theme.colors.base2,
							fontSize: 16,
							fontWeight: 500,
							marginTop: 16,
							marginBottom: 8,
						},
						text: Loc.getMessage('IMMOBILE_DIALOG_SIDEBAR_WIDGET_EMPTY_STATE_TITLE'),
					},
				),
				View(
					{
						style: {
							width: 300,
						},
					},
					Text(
						{
							style: {
								textAlign: 'center',
								color: Theme.colors.base4,
								fontSize: 14,
								fontWeight: 400,
								numberOfLines: 2,
							},
							text: Loc.getMessage('IMMOBILE_DIALOG_SIDEBAR_WIDGET_EMPTY_STATE_DESC'),
						},
					),
				),
			);
		}
	}

	module.exports = { CommentSidebarView };
});