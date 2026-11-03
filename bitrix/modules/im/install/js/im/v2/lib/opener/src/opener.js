import { Runtime, Type, type JsonObject } from 'main.core';
import { EventEmitter } from 'main.core.events';

import { EventType, GetParameter, Layout, NavigationMenuItem, type OpenCollabOptions } from 'im.v2.const';
import { CallManager } from 'im.v2.lib.call';
import { CreateChatManager, type OpenChatCreationParams, type CreatableChatTypeItem } from 'im.v2.lib.create-chat';
import { DesktopApi, DesktopFeature } from 'im.v2.lib.desktop-api';
import { Feature, FeatureManager, TariffManager } from 'im.v2.lib.feature';
import { FolderManager } from 'im.v2.lib.folder';
import { LayoutManager } from 'im.v2.lib.layout';
import { Logger } from 'im.v2.lib.logger';
import { type NavigationMenuItemParams, NavigationManager } from 'im.v2.lib.navigation';
import { PhoneManager } from 'im.v2.lib.phone';
import { MessengerSlider } from 'im.v2.lib.slider';
import { Utils } from 'im.v2.lib.utils';
import { BotContextService } from 'im.v2.provider.service.bot';
import { ChatService } from 'im.v2.provider.service.chat';

import { LinesService } from './classes/lines-service';
import {
	checkHistoryDialogId,
	openHistoryInSidePanel,
	normalizeEntityId,
	handleOpenTarget,
	isChatNestedInCollab,
	openChatInNewTab,
	shouldOpenNewTab,
} from './functions/helpers';

export const Opener = {
	async openChat(dialogId: string | number = '', messageId: number = 0): Promise
	{
		const preparedDialogId = dialogId.toString();
		if (Utils.dialog.isLinesExternalId(preparedDialogId))
		{
			return this.openLines(preparedDialogId);
		}

		const config = {
			navigationItem: FolderManager.getRegularChatsLayout().name,
			dialogId: preparedDialogId,
			messageId,
		};

		await handleOpenTarget(config);

		return Promise.resolve();
	},

	async openChatWithBotContext(dialogId: string | number, context: JsonObject): Promise
	{
		const preparedDialogId = dialogId.toString();

		const botContextService = new BotContextService();
		botContextService.scheduleContextRequest(preparedDialogId, context);

		return this.openChat(preparedDialogId);
	},

	async openLines(dialogId: string = ''): Promise
	{
		let preparedDialogId = dialogId.toString();
		if (Utils.dialog.isLinesExternalId(preparedDialogId))
		{
			const linesService = new LinesService();
			preparedDialogId = await linesService.getDialogIdByUserCode(preparedDialogId);
		}

		const optionOpenLinesV2Activated = FeatureManager.isFeatureAvailable(Feature.openLinesV2);
		const navigationItem = optionOpenLinesV2Activated ? NavigationMenuItem.openlinesV2 : NavigationMenuItem.openlines;

		const config = {
			navigationItem,
			dialogId: preparedDialogId,
		};

		await handleOpenTarget(config);

		return Promise.resolve();
	},

	async openCopilot(dialogId: string = '', contextId = 0): Promise
	{
		const config = {
			navigationItem: NavigationMenuItem.copilot,
			dialogId: dialogId.toString(),
			messageId: contextId,
		};

		await handleOpenTarget(config);

		return Promise.resolve();
	},

	async openCollab(dialogId: string = '', options: OpenCollabOptions = {}): Promise
	{
		const preparedDialogId = dialogId.toString();

		if (!TariffManager.collab.isAvailable())
		{
			TariffManager.collab.openFeatureSlider();

			return null;
		}

		if (shouldOpenNewTab())
		{
			openChatInNewTab({ navigationItem: NavigationMenuItem.collab, dialogId: preparedDialogId });

			return Promise.resolve();
		}

		await MessengerSlider.getInstance().openSlider();

		if (await isChatNestedInCollab(preparedDialogId))
		{
			return LayoutManager.getInstance().setLayout({
				name: Layout.collab,
				entityId: preparedDialogId,
			});
		}

		const withCollabId = Type.isStringFilled(preparedDialogId);
		const isCollabV2Available = FeatureManager.isFeatureAvailable(Feature.isCollabV2Available);
		if (!withCollabId || !isCollabV2Available)
		{
			return LayoutManager.getInstance().setLayout({
				name: Layout.collab,
				entityId: preparedDialogId,
			});
		}

		if (!Utils.dialog.isChatDialogId(dialogId) && !Utils.dialog.isGroupExternalId(dialogId))
		{
			return Promise.resolve();
		}

		await this.openCollab();
		EventEmitter.emit(EventType.recent.openNestedList, { parentDialogId: dialogId, options });

		return Promise.resolve();
	},

	async openChannel(dialogId: string = ''): Promise
	{
		const config = {
			navigationItem: NavigationMenuItem.channel,
			dialogId: dialogId.toString(),
		};

		await handleOpenTarget(config);

		return Promise.resolve();
	},

	async openTaskComments(dialogId: string = '', messageId: number = 0): Promise
	{
		const config = {
			navigationItem: NavigationMenuItem.tasksTask,
			dialogId: dialogId.toString(),
			messageId,
		};

		await handleOpenTarget(config);

		return Promise.resolve();
	},

	openHistory(dialogId: string | number = ''): Promise
	{
		if (Utils.dialog.isDialogId(dialogId))
		{
			return this.openChat(dialogId);
		}

		if (!checkHistoryDialogId(dialogId))
		{
			return Promise.reject();
		}

		if (FeatureManager.isFeatureAvailable(Feature.openLinesV2) && Utils.dialog.isLinesHistoryId(dialogId))
		{
			// history app ships with imopenlines, fall back to the legacy slider while that module lags behind
			void Runtime.loadExtension('imopenlines.v2.application.history')
				.then(({ LinesHistoryApplication }) => {
					if (!LinesHistoryApplication)
					{
						openHistoryInSidePanel(dialogId);

						return;
					}

					LinesHistoryApplication.openInSlider(dialogId);
				})
				.catch((error) => {
					Logger.error('Opener: openHistory V2 delegation failed', error);
					openHistoryInSidePanel(dialogId);
				});

			return Promise.resolve();
		}

		openHistoryInSidePanel(dialogId);

		return Promise.resolve();
	},

	async openNotifications(): Promise
	{
		await MessengerSlider.getInstance().openSlider();
		await LayoutManager.getInstance().setLayout({
			name: Layout.notification,
		});

		EventEmitter.emit(EventType.layout.onOpenNotifications);

		return Promise.resolve();
	},

	async openRecentSearch(): Promise
	{
		await MessengerSlider.getInstance().openSlider();
		// Search goes where plain chats live and not where the user is sent back: the default folder is
		// whichever one the user put first, and the search event is heard by the chat lists alone.
		await LayoutManager.getInstance().setLayout(FolderManager.getRegularChatsLayout());

		EventEmitter.emit(EventType.recent.openSearch);

		return Promise.resolve();
	},

	async openSettings(sectionName: string): Promise
	{
		Logger.warn('Slider: openSettings', sectionName);
		await MessengerSlider.getInstance().openSlider();

		await LayoutManager.getInstance().setLayout({
			name: Layout.settings,
			entityId: sectionName,
		});

		return Promise.resolve();
	},

	openConference(code: string = ''): Promise
	{
		Logger.warn('Slider: openConference', code);

		if (!Utils.conference.isValidCode(code))
		{
			return Promise.reject();
		}

		const url = Utils.conference.getUrlByCode(code);
		Utils.browser.openLink(url, Utils.conference.getWindowNameByCode(code));

		return Promise.resolve();
	},

	async openChatCreation(chatType: CreatableChatTypeItem, params: OpenChatCreationParams): Promise
	{
		Logger.warn('Slider: openChatCreation', chatType);

		await MessengerSlider.getInstance().openSlider();

		return CreateChatManager.getInstance().startChatCreation(chatType, params);
	},

	async openChatUpdate(dialogId: string): Promise
	{
		Logger.warn('Slider: openChatUpdate', dialogId);

		await MessengerSlider.getInstance().openSlider();

		await (new ChatService()).loadChat(dialogId);

		return LayoutManager.getInstance().setLayout({
			name: Layout.updateChat,
			entityId: dialogId,
		});
	},

	startVideoCall(dialogId: string = '', withVideo: boolean = true, callOptions: ?Object = null): Promise
	{
		Logger.warn('Slider: onStartVideoCall', dialogId, withVideo);
		if (!Utils.dialog.isDialogId(dialogId))
		{
			Logger.error('Slider: onStartVideoCall - dialogId is not correct', dialogId);

			return false;
		}

		CallManager.getInstance().startCall(dialogId, withVideo, callOptions);

		return Promise.resolve();
	},

	startPhoneCall(number: string, params: Object<any, string>): Promise
	{
		Logger.warn('Slider: startPhoneCall', number, params);
		void PhoneManager.getInstance().startCall(number, params);

		return Promise.resolve();
	},

	startCallList(callListId: number, params: Object<string, any>): Promise
	{
		Logger.warn('Slider: startCallList', callListId, params);
		PhoneManager.getInstance().startCallList(callListId, params);

		return Promise.resolve();
	},

	openNewTab(path)
	{
		if (DesktopApi.isChatTab() && DesktopApi.isFeatureSupported(DesktopFeature.openNewTab.id))
		{
			DesktopApi.createImTab(`${path}&${GetParameter.desktopChatTabMode}=Y`);
		}
		else
		{
			Utils.browser.openLink(path);
		}
	},

	async openNavigationItem(payload: NavigationMenuItemParams): void
	{
		const { id, entityId, target, asLink } = payload;
		const isMarketApp = NavigationManager.isMarketApp(payload);
		if (!asLink || isMarketApp)
		{
			await MessengerSlider.getInstance().openSlider();
		}

		NavigationManager.open({
			id: id.toString(),
			entityId: normalizeEntityId(entityId),
			target,
			asLink,
		});
	},

	isChatOpened(dialogId: string): boolean
	{
		const currentLayout = LayoutManager.getInstance().getLayout();
		if (!LayoutManager.getInstance().isChatLayout(currentLayout.name))
		{
			return false;
		}

		return currentLayout.entityId === dialogId;
	},
};
