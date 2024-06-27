/**
 * @module im/messenger/controller/sidebar/chat/sidebar-view
 */
jn.define('im/messenger/controller/sidebar/chat/sidebar-view', (require, exports, module) => {
	const { SidebarFriendlyDate } = require('im/messenger/controller/sidebar/chat/friendly-date');
	const { SidebarProfileBtn } = require('im/messenger/controller/sidebar/chat/sidebar-profile-btn');
	const { SidebarTabView } = require('im/messenger/controller/sidebar/chat/tabs/tab-view');
	const { SidebarProfileUserCounter } = require('im/messenger/controller/sidebar/chat/sidebar-profile-user-counter');
	const { SidebarProfileInfo } = require('im/messenger/controller/sidebar/chat/sidebar-profile-info');
	const { Type } = require('type');
	const { Theme } = require('im/lib/theme');

	/**
	 * @class SidebarView
	 * @typedef {LayoutComponent<SidebarViewProps, SidebarViewState>} SidebarView
	 */
	class SidebarView extends LayoutComponent
	{
		/**
		 * @constructor
		 * @param {SidebarViewProps} props
		 */
		constructor(props)
		{
			super(props);
			this.state = {
				userData: props.userData,
			};
		}

		render()
		{
			return View(
				{
					style: {
						backgroundColor: Theme.colors.bgContentPrimary,
						justifyContent: 'flex-start',
						alignItems: 'center',
						flexDirection: 'column',
					},
				},
				this.renderProfile(),
				this.renderTabs(),
			);
		}

		renderProfile()
		{
			return View(
				{
					style: {
						alignItems: 'center',
						flexDirection: 'column',
						alignSelf: 'stretch',
					},
				},
				this.renderInfoBlock(),
				this.renderButtonsBlock(),
			);
		}

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
				new SidebarProfileInfo(this.props),
				this.props.isGroupDialog ? this.renderDialogUserCounter() : this.renderUserLastTime(),
			);
		}

		renderDialogUserCounter()
		{
			return new SidebarProfileUserCounter({ dialogId: this.props.dialogId, isCopilot: this.props.isCopilot });
		}

		renderUserLastTime()
		{
			const { userData } = this.state;

			const textStyle = {
				color: Theme.colors.base3,
				fontSize: 14,
				fontWeight: 400,
				textStyle: 'normal',
				textAlign: 'center',
			};

			if (Type.isUndefined(userData.lastActivityDate) || Type.isNull(userData.lastActivityDate))
			{
				return null;
			}

			return View(
				{
					style: {
						marginTop: 5,
						flexDirection: 'row',
					},
				},
				new SidebarFriendlyDate({
					moment: userData.lastActivityDate,
					style: textStyle,
					showTime: true,
					useTimeAgo: true,
					futureAllowed: true,
					userData: userData.userModelData,
				}),
			);
		}

		renderButtonsBlock()
		{
			return new SidebarProfileBtn({ buttonElements: this.props.buttonElements });
		}

		renderTabs()
		{
			return new SidebarTabView({
				dialogId: this.props.dialogId,
				isNotes: this.props.isNotes,
				isCopilot: this.props.isCopilot,
			});
		}

		/**
		 * @desc Method update state component
		 * @param {object} newState
		 * @void
		 */
		updateStateView(newState)
		{
			this.setState(newState);
		}
	}

	module.exports = { SidebarView };
});
