/**
 * @module im/messenger/controller/recent/config/src/global/all
 */
jn.define('im/messenger/controller/recent/config/src/global/all', (require, exports, module) => {
	const {
		ActionByUserType,
		NavigationTabId,
	} = require('im/messenger/const');
	const { Feature } = require('im/messenger/lib/feature');
	const { UserPermission } = require('im/messenger/lib/permission-manager');
	const { openChatCreateByActiveRecentTab } = require('im/messenger/lib/open-chat-create');
	const { RecentServiceName } = require('im/messenger/controller/recent/const');
	const { FolderComposition } = require('im/messenger/controller/recent/service/lib/folder-composition');

	const WelcomeScreenExtension = Object.freeze({
		all: 'im/messenger/controller/recent/service/empty-state/lib/welcome-screen/all',
		folderUnsupported: 'im/messenger/controller/recent/service/empty-state/lib/welcome-screen/folder-unsupported',
	});

	/**
	 * Config of the "All" folder tab. The folder has no recent section of its own: its list is the
	 * union of the sections of its member folders, so the loaders and the list service are the
	 * section-aware ones. An active call is no part of that union: its row is owned by the external
	 * service and put back by the list service whenever the list is rebuilt as a whole.
	 */
	const AllConfig = {
		services: {
			[RecentServiceName.quickRecent]: {
				extension: 'im/messenger/controller/recent/service/quick-recent/common',
				props: {},
			},
			[RecentServiceName.databaseLoad]: {
				extension: 'im/messenger/controller/recent/service/database-load/all',
				props: {
					filter: {
						limit: 50,
					},
				},
			},
			[RecentServiceName.serverLoad]: {
				extension: 'im/messenger/controller/recent/service/server-load/all',
				props: {
					/**
					 * The tab is registered by its code, while the folder id comes with the folder
					 * list, so it is read from the store when the service is being initialized.
					 *
					 * @return {number|undefined}
					 */
					get folderId()
					{
						return FolderComposition.getFolderByTabId(NavigationTabId.all)?.id;
					},
				},
			},
			[RecentServiceName.floatingButton]: {
				extension: 'im/messenger/controller/recent/service/floating-button/common',
				props: {
					checkShouldShowButton: () => {
						return (
							UserPermission.canPerformActionByUserType(ActionByUserType.createChat)
							|| UserPermission.canPerformActionByUserType(ActionByUserType.createChannel)
							|| UserPermission.canPerformActionByUserType(ActionByUserType.createCollab)
						);
					},
					onTap: async () => {
						void openChatCreateByActiveRecentTab();
					},
				},
			},
			[RecentServiceName.emptyState]: {
				extension: 'im/messenger/controller/recent/service/empty-state/common',
				props: {
					/**
					 * The tab is laid over the folders, so on a build that cannot do them it stays
					 * empty whatever the user has: that user is offered the update instead of the
					 * ordinary greeting. A guest keeps the ordinary one - the application of a guest
					 * is fine, folders are closed to a guest by the portal. Read once, when the
					 * service is being initialized: within a session the answer does not change.
					 *
					 * @return {string}
					 */
					get welcomeScreenExtension()
					{
						const {
							outdatedApplication,
							unsupportedTabsWidget,
						} = Feature.ChatFoldersUnavailabilityReason;
						const reason = Feature.getChatFoldersUnavailabilityReason();

						return reason === outdatedApplication || reason === unsupportedTabsWidget
							? WelcomeScreenExtension.folderUnsupported
							: WelcomeScreenExtension.all
						;
					},
				},
			},
			[RecentServiceName.pagination]: {
				extension: 'im/messenger/controller/recent/service/pagination/common',
				props: {},
			},
			[RecentServiceName.search]: {
				extension: 'im/messenger/controller/recent/service/search/common',
				props: {
					/**
					 * The scope is declared by the tab and not deduced from the folder id below: the id
					 * is data, and a tab passing it for any other reason must not change the scope of
					 * its search by that alone. No recent section goes with it - the folder describes
					 * the result set on its own.
					 */
					folderCompositionOnly: true,
					/**
					 * Read on every search for the same reason as in the list service above.
					 *
					 * @return {number|undefined}
					 */
					get folderId()
					{
						return FolderComposition.getFolderByTabId(NavigationTabId.all)?.id;
					},
					searchUsers: true,
				},
			},
			[RecentServiceName.filter]: {
				extension: 'im/messenger/controller/recent/service/filter/common',
				props: {},
			},
			[RecentServiceName.render]: {
				extension: 'im/messenger/controller/recent/service/render/common',
				props: {
					sections: ['call', 'pinned', 'general'],
					defaultSection: 'general',
					convertorExtension: 'im/messenger/controller/recent/service/render/lib/convertor/chats',
				},
			},
			[RecentServiceName.vuex]: {
				extension: 'im/messenger/controller/recent/service/vuex/all',
				props: {},
			},
			[RecentServiceName.action]: {
				extension: 'im/messenger/controller/recent/service/action/common',
				props: {},
			},
			[RecentServiceName.select]: {
				extension: 'im/messenger/controller/recent/service/select/common',
				props: {},
			},
			[RecentServiceName.external]: {
				extension: 'im/messenger/controller/recent/service/external/chat',
				props: {},
			},
			[RecentServiceName.inviteBanner]: {
				extension: 'im/messenger/controller/recent/service/invite-banner/common',
				props: {},
			},
		},
	};

	module.exports = { AllConfig };
});
