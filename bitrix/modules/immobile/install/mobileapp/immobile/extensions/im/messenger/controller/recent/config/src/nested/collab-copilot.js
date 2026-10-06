/**
 * @module im/messenger/controller/recent/config/src/nested/collab-copilot
 */
jn.define('im/messenger/controller/recent/config/src/nested/collab-copilot', (require, exports, module) => {
	const { RecentTab, ChatSearchSelectorSection, DialogType, CopilotRoleType, OpenDialogContextType } = require('im/messenger/const');
	const { RecentServiceName } = require('im/messenger/controller/recent/const');
	const { serviceLocator } = require('im/messenger/lib/di/service-locator');
	const { Notification } = require('im/messenger/lib/ui/notification');
	const { ChatService } = require('im/messenger/provider/services/chat');
	const { MenuVisibility } = require('im/messenger/controller/dialog-creator/menu-visibility');

	const CollabCopilotConfig = {
		services: {
			[RecentServiceName.render]: {
				extension: 'im/messenger/controller/recent/service/render/common',
				props: {
					sections: ['pinned', 'general'],
					defaultSection: 'general',
					convertorExtension: 'im/messenger/controller/recent/service/render/lib/convertor/common',
				},
			},
			[RecentServiceName.databaseLoad]: {
				extension: 'im/messenger/controller/recent/service/database-load/common',
				props: {
					savePageAction: 'recentModel/setByRecentSection',
					filter: {
						limit: 50,
					},
				},
			},
			[RecentServiceName.serverLoad]: {
				extension: 'im/messenger/controller/recent/service/server-load/nested-list',
				props: {
					recentSection: RecentTab.copilot,
				},
			},
			[RecentServiceName.vuex]: {
				extension: 'im/messenger/controller/recent/service/vuex/nested-list',
				props: {},
			},
			[RecentServiceName.emptyState]: {
				extension: 'im/messenger/controller/recent/service/empty-state/common',
				props: {
					welcomeScreenExtension: 'im/messenger/controller/recent/service/empty-state/lib/welcome-screen/nested',
					welcomeScreenProps: {
						recentSection: RecentTab.copilot,
					},
				},
			},
			[RecentServiceName.floatingButton]: {
				extension: 'im/messenger/controller/recent/service/floating-button/nested',
				props: {
					checkShouldShowButton: () => MenuVisibility.canCreateCopilot(),
					onDirectCreate: (parentChatId) => {
						const chatService = new ChatService();
						return chatService.createCopilot({
							type: DialogType.copilot.toUpperCase(),
							copilotMainRole: CopilotRoleType.copilotUniversalRole,
							parentChatId,
						})
							.then(({ chatId }) => {
								return serviceLocator.get('dialog-manager').openDialog({
									dialogId: `chat${chatId}`,
									context: OpenDialogContextType.chatCreation,
								});
							})
							.catch(() => {
								Notification.showErrorToast();
							});
					},
				},
			},
			[RecentServiceName.select]: {
				extension: 'im/messenger/controller/recent/service/select/common',
				props: {},
			},
			[RecentServiceName.pagination]: {
				extension: 'im/messenger/controller/recent/service/pagination/common',
				props: {},
			},
			[RecentServiceName.filter]: {
				extension: 'im/messenger/controller/recent/service/filter/common',
				props: {},
			},
			[RecentServiceName.action]: {
				extension: 'im/messenger/controller/recent/service/action/common',
				props: {},
			},
			[RecentServiceName.search]: {
				extension: 'im/messenger/controller/recent/service/search/common',
				props: {
					recentTab: RecentTab.collabDefault,
					sections: [ChatSearchSelectorSection.recent, ChatSearchSelectorSection.common],
				},
			},
		},
	};

	module.exports = { CollabCopilotConfig };
});
