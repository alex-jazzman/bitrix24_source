/**
 * @module im/messenger/controller/sidebar/channel/tabs/tab-view
 */
jn.define('im/messenger/controller/sidebar/channel/tabs/tab-view', (require, exports, module) => {
	const { SidebarTabView } = require('im/messenger/controller/sidebar/chat/tabs/tab-view');
	const { ChannelParticipantsView } = require(
		'im/messenger/controller/sidebar/channel/tabs/participants/participants-view',
	);
	const { Loc } = require('loc');

	/**
	 * @class ChannelTabView
	 * @typedef {LayoutComponent<ChannelSidebarTabViewProps, ChannelSidebarTabViewState>} ChannelTabView
	 */
	class ChannelTabView extends SidebarTabView
	{
		/**
		 * @constructor
		 * @param {SidebarTabViewProps} props
		 */
		constructor(props)
		{
			super(props);
			this.state = {
				tabItems: this.buildTabsData(),
				selectedTab: { id: 0 },
			};
		}

		/**
		 * @desc Build tabs data by object
		 * @return {object[]}
		 */
		buildTabsData()
		{
			return [
				{
					title: Loc.getMessage('IMMOBILE_DIALOG_SIDEBAR_TAB_SUBSCRIBERS'),
					counter: 0,
					id: 'participants',
				},
			];
		}

		renderParticipantsList()
		{
			return new ChannelParticipantsView({
				dialogId: this.props.dialogId,
			});
		}
	}

	module.exports = { ChannelTabView };
});
