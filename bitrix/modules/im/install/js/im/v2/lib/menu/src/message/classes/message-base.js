import { Loc, Type } from 'main.core';
import { type EventEmitter } from 'main.core.events';
import { Outline as OutlineIcons } from 'ui.icon-set.api.core';
import { MenuItemDesign, type MenuItemOptions, type MenuOptions, type MenuSectionOptions } from 'ui.system.menu';

import { Core } from 'im.v2.application.core';
import { EventType, PlacementType, ActionByRole, PromoId, MessageComponent, type ApplicationContext } from 'im.v2.const';
import { Analytics } from 'im.v2.lib.analytics';
import { ChannelManager } from 'im.v2.lib.channel';
import { ChatManager } from 'im.v2.lib.chat';
import { showDeleteChannelPostConfirm, showDownloadAllFilesConfirm } from 'im.v2.lib.confirm';
import { CopilotManager } from 'im.v2.lib.copilot';
import { EntityCreator } from 'im.v2.lib.entity-creator';
import { FeatureManager, Feature } from 'im.v2.lib.feature';
import { MarketManager } from 'im.v2.lib.market';
import { MessageManager } from 'im.v2.lib.message';
import { Notifier } from 'im.v2.lib.notifier';
import { Parser } from 'im.v2.lib.parser';
import { PermissionManager } from 'im.v2.lib.permission';
import { PromoManager } from 'im.v2.lib.promo';
import { Utils } from 'im.v2.lib.utils';
import { type ImModelMessage, type ImModelChat, type ImModelFile } from 'im.v2.model';
import { AiTaskService } from 'im.v2.provider.service.ai-task';
import { DiskService } from 'im.v2.provider.service.disk';
import { MessageService } from 'im.v2.provider.service.message';

import { BaseMenu } from '../../base/base';

export type MessageMenuContext = ImModelMessage & { dialogId: string };

export const MenuSectionCode = {
	first: 'first',
	second: 'second',
	third: 'third',
};

export const NestedMenuSectionCode = {
	first: 'first',
	second: 'second',
	third: 'third',
};

// Where the item is declared by the list that builds it. `nested` alone does not mean the item is
// rendered inside a submenu: a short nested list is flattened onto the top level.
export const MenuItemPlacement = {
	topLevel: 'top_level',
	nested: 'nested',
};

type BuilderBlock = { type: string, fileIds?: number[], fileId?: number };

const fileIdsFromList = (block: BuilderBlock): number[] => {
	return Type.isArrayFilled(block.fileIds) ? block.fileIds : [];
};

// Builder block files are not duplicated in `message.files`, so the menu joins both sources
// itself. One extractor per block type that carries files; other types contribute nothing.
const FileIdsByBlockType = {
	file: fileIdsFromList,
	gallery: fileIdsFromList,
	audio: (block: BuilderBlock): number[] => (Type.isNumber(block.fileId) ? [block.fileId] : []),
};

export class MessageMenu extends BaseMenu
{
	emitter: EventEmitter;
	context: MessageMenuContext;
	diskService: DiskService;

	maxPins: number = 20;

	#areNestedItemsInSubMenu: boolean = false;

	constructor(applicationContext: ApplicationContext)
	{
		super();

		this.id = 'bx-im-message-context-menu';
		this.diskService = new DiskService();
		this.marketManager = MarketManager.getInstance();

		const { emitter } = applicationContext;
		this.emitter = emitter;
	}

	getMenuOptions(): MenuOptions
	{
		return {
			...super.getMenuOptions(),
			className: this.getMenuClassName(),
			angle: true,
			offsetLeft: 11,
			minWidth: 238,
		};
	}

	getMenuItems(): (MenuItemOptions | null)[]
	{
		const firstGroupItems = [
			this.getReplyItem(),
			this.getCopyItem(),
			this.getEditItem(),
			this.getDownloadFileItem(),
			this.getForwardItem(),
			this.getAskCopilotItem(),
			this.getCreateAiTaskItem(),
			this.isAiTaskFromMessageAvailable() ? null : this.getCreateTaskItem(),
			...this.getAdditionalItems(),
		];

		const secondGroupItems = [
			this.getDeleteItem(),
			this.getSelectItem(),
		];

		return [
			...this.groupItems(firstGroupItems, MenuSectionCode.first),
			...this.groupItems(secondGroupItems, MenuSectionCode.second),
		];
	}

	getMenuGroups(): MenuSectionOptions[]
	{
		return [
			{ code: MenuSectionCode.first },
			{ code: MenuSectionCode.second },
		];
	}

	getNestedMenuGroups(): MenuSectionOptions[]
	{
		return [
			{ code: NestedMenuSectionCode.first },
			{ code: NestedMenuSectionCode.second },
		];
	}

	getSelectItem(): ?MenuItemOptions
	{
		if (this.isDeletedMessage() || !this.isRealMessage())
		{
			return null;
		}

		return {
			title: Loc.getMessage('IM_DIALOG_CHAT_MENU_SELECT'),
			icon: OutlineIcons.CIRCLE_CHECK,
			onClick: () => {
				Analytics.getInstance().messageContextMenu.onSelect(this.context.dialogId);

				this.emitter.emit(EventType.dialog.openBulkActionsMode, {
					messageId: this.context.id,
					dialogId: this.context.dialogId,
				});
			},
		};
	}

	getReplyItem(): MenuItemOptions
	{
		return {
			title: Loc.getMessage('IM_DIALOG_CHAT_MENU_REPLY'),
			onClick: () => {
				Analytics.getInstance().messageContextMenu.onReply(this.context.dialogId);
				this.emitter.emit(EventType.textarea.replyMessage, {
					messageId: this.context.id,
					dialogId: this.context.dialogId,
				});
			},
			icon: OutlineIcons.QUOTE,
		};
	}

	getForwardItem(): ?MenuItemOptions
	{
		if (this.isDeletedMessage() || !this.isRealMessage())
		{
			return null;
		}

		return {
			title: Loc.getMessage('IM_DIALOG_CHAT_MENU_FORWARD'),
			icon: OutlineIcons.FORWARD,
			onClick: () => {
				Analytics.getInstance().messageContextMenu.onForward(this.context.dialogId);
				this.emitter.emit(EventType.dialog.showForwardPopup, {
					messagesIds: [this.context.id],
				});
			},
		};
	}

	getCopyItem(): ?MenuItemOptions
	{
		if (this.isDeletedMessage() || this.context.text.trim().length === 0)
		{
			return null;
		}

		return {
			title: Loc.getMessage('IM_DIALOG_CHAT_MENU_COPY'),
			onClick: async () => {
				Analytics.getInstance().messageContextMenu.onCopyText({
					dialogId: this.context.dialogId,
					messageId: this.context.id,
				});

				const textToCopy = Parser.prepareCopy(this.context);

				await Utils.text.copyToClipboard(textToCopy);
				Notifier.message.onCopyComplete();
			},
			icon: OutlineIcons.COPY,
		};
	}

	getCopyLinkItem(): MenuItemOptions
	{
		return {
			title: Loc.getMessage('IM_DIALOG_CHAT_MENU_COPY_LINK_MSGVER_1'),
			icon: OutlineIcons.LINK,
			onClick: () => {
				Analytics.getInstance().messageContextMenu.onCopyLink(this.context.dialogId);

				const textToCopy = ChatManager.buildMessageLink(this.context.dialogId, this.context.id);
				if (BX.clipboard?.copy(textToCopy))
				{
					Notifier.message.onCopyLinkComplete();
				}
			},
		};
	}

	getCopyFileItem(): ?MenuItemOptions
	{
		if (this.context.files.length !== 1)
		{
			return null;
		}

		return {
			title: Loc.getMessage('IM_DIALOG_CHAT_MENU_COPY_FILE'),
			icon: OutlineIcons.COPY,
			onClick: () => {
				const fileId = this.context.files[0];
				Analytics.getInstance().messageContextMenu.onCopyFile({
					dialogId: this.context.dialogId,
					fileId,
				});

				const textToCopy = Parser.prepareCopyFile(this.context);
				if (BX.clipboard?.copy(textToCopy))
				{
					Notifier.file.onCopyComplete();
				}
			},
		};
	}

	getPinItem(): ?MenuItemOptions
	{
		const canPin = PermissionManager.getInstance().canPerformActionByRole(
			ActionByRole.pinMessage,
			this.context.dialogId,
		);

		if (this.isDeletedMessage() || !canPin)
		{
			return null;
		}

		const isPinned = this.store.getters['messages/pin/isPinned']({
			chatId: this.context.chatId,
			messageId: this.context.id,
		});

		return {
			title: isPinned ? Loc.getMessage('IM_DIALOG_CHAT_MENU_UNPIN') : Loc.getMessage('IM_DIALOG_CHAT_MENU_PIN'),
			icon: OutlineIcons.PIN,
			onClick: () => {
				const messageService = new MessageService({ chatId: this.context.chatId });
				if (isPinned)
				{
					messageService.unpinMessage(this.context.chatId, this.context.id);
					Analytics.getInstance().messageContextMenu.onUnpin(this.context.dialogId);
				}
				else
				{
					if (this.#arePinsExceedLimit())
					{
						Notifier.chat.onMessagesPinLimitError(this.maxPins);
						Analytics.getInstance().messageContextMenu.onReachingPinsLimit(this.context.dialogId);

						return;
					}

					messageService.pinMessage(this.context.chatId, this.context.id);
					Analytics.getInstance().messageContextMenu.onPin(this.context.dialogId);
				}
			},
		};
	}

	getFavoriteItem(): MenuItemOptions
	{
		if (this.isDeletedMessage())
		{
			return null;
		}

		const isInFavorite = this.store.getters['sidebar/favorites/isFavoriteMessage'](this.context.chatId, this.context.id);

		const menuItemText = isInFavorite
			? Loc.getMessage('IM_DIALOG_CHAT_MENU_REMOVE_FROM_SAVED')
			: Loc.getMessage('IM_DIALOG_CHAT_MENU_SAVE')
		;

		return {
			title: menuItemText,
			icon: OutlineIcons.FAVORITE,
			onClick: () => {
				const messageService = new MessageService({ chatId: this.context.chatId });
				if (isInFavorite)
				{
					messageService.removeMessageFromFavorite(this.context.id);
				}
				else
				{
					Analytics.getInstance().messageContextMenu.onAddFavorite({
						dialogId: this.context.dialogId,
						messageId: this.context.id,
					});

					messageService.addMessageToFavorite(this.context.id);
				}
			},
		};
	}

	getMarkItem(): ?MenuItemOptions
	{
		const canUnread = this.context.viewed && !this.isOwnMessage();

		const dialog: ImModelChat = this.store.getters['chats/getByChatId'](this.context.chatId);
		const isMarked = this.context.id === dialog.markedId;
		if (!canUnread || isMarked)
		{
			return null;
		}

		return {
			title: Loc.getMessage('IM_DIALOG_CHAT_MENU_MARK'),
			icon: OutlineIcons.NEW_MESSAGE,
			onClick: () => {
				Analytics.getInstance().messageContextMenu.onMark(this.context.dialogId);

				const messageService = new MessageService({ chatId: this.context.chatId });
				messageService.markMessage(this.context.id);
			},
		};
	}

	getCreateTaskItem(placement: string = MenuItemPlacement.topLevel): ?MenuItemOptions
	{
		if (this.isDeletedMessage() || this.#isStickerMessage() || this.#isCurrentUserGuest())
		{
			return null;
		}

		return {
			title: Loc.getMessage('IM_DIALOG_CHAT_MENU_CREATE_TASK_MSGVER_1'),
			icon: OutlineIcons.TASK,
			onClick: () => {
				Analytics.getInstance().messageContextMenu.onCreateTask(this.context.dialogId, {
					isInNestedMenu: this.#isItemInNestedMenu(placement),
				});

				const entityCreator = new EntityCreator(this.context.chatId);
				void entityCreator.createTaskForMessage(this.context.id);
			},
		};
	}

	isAiTaskFromMessageAvailable(): boolean
	{
		return FeatureManager.isFeatureAvailable(Feature.isAiTaskFromMessageAvailable);
	}

	getCreateAiTaskItem(): ?MenuItemOptions
	{
		if (!this.isAiTaskFromMessageAvailable())
		{
			return null;
		}

		if (
			this.isDeletedMessage()
			|| this.#isStickerMessage()
			|| this.#isSystemMessage()
			|| this.#isCurrentUserGuest()
		)
		{
			return null;
		}

		const isBGPTv2 = FeatureManager.isFeatureAvailable(Feature.isBitrixGptV2Available);

		return {
			title: Loc.getMessage('IM_LIB_MENU_CREATE_AI_TASK'),
			icon: OutlineIcons.AI_STARS,
			design: isBGPTv2 ? MenuItemDesign.BitrixGPT : MenuItemDesign.Copilot,
			onClick: () => {
				Analytics.getInstance().messageContextMenu.onCreateAiTask(this.context.dialogId);

				const messageId = this.context.id;
				const chatId = this.context.chatId;
				void (new AiTaskService()).createForMessage(messageId, { chatId });
			},
		};
	}

	getCreateMeetingItem(): ?MenuItemOptions
	{
		if (this.isDeletedMessage() || this.#isStickerMessage() || this.#isCurrentUserGuest())
		{
			return null;
		}

		return {
			title: Loc.getMessage('IM_DIALOG_CHAT_MENU_CREATE_MEETING_MSGVER_1'),
			icon: OutlineIcons.CALENDAR_WITH_SLOTS,
			onClick: () => {
				Analytics.getInstance().messageContextMenu.onCreateEvent(this.context.dialogId);

				const entityCreator = new EntityCreator(this.context.chatId);
				void entityCreator.createMeetingForMessage(this.context.id);
			},
		};
	}

	getEditItem(): ?MenuItemOptions
	{
		if (!MessageManager.isEditable(this.context.id))
		{
			return null;
		}

		return {
			title: Loc.getMessage('IM_DIALOG_CHAT_MENU_EDIT'),
			icon: OutlineIcons.EDIT_L,
			onClick: () => {
				Analytics.getInstance().messageContextMenu.onEdit(this.context.dialogId);

				this.emitter.emit(EventType.textarea.editMessage, {
					messageId: this.context.id,
					dialogId: this.context.dialogId,
				});
			},
		};
	}

	getAskCopilotItem(): ?MenuItemOptions
	{
		if (!FeatureManager.isFeatureAvailable(Feature.isCopilotMentionAvailable))
		{
			return null;
		}

		if (!this.canSendMessage() || this.isDeletedMessage())
		{
			return null;
		}

		const isChannel = ChannelManager.isChannel(this.context.dialogId);
		if (isChannel)
		{
			return null;
		}

		const copilotBotDialogId = this.store.getters['users/bots/getCopilotBotDialogId'];
		const { name: mentionText } = this.store.getters['users/get'](copilotBotDialogId, true);
		const title = Loc.getMessage('IM_DIALOG_CHAT_MENU_ASK_COPILOT_MSGVER_1', {
			'#COPILOT_NAME#': (new CopilotManager()).getName(),
		});

		const isBGPTv2 = FeatureManager.isFeatureAvailable(Feature.isBitrixGptV2Available);
		const icon = isBGPTv2 ? OutlineIcons.BITRIX_GPT : OutlineIcons.COPILOT;
		const design = isBGPTv2 ? MenuItemDesign.BitrixGPT : MenuItemDesign.Copilot;

		return {
			title,
			icon,
			design,
			onClick: () => {
				Analytics.getInstance().messageContextMenu.onAskCopilot(this.context.dialogId);
				this.emitter.emit(EventType.textarea.insertMention, {
					mentionText,
					mentionReplacement: Utils.text.getMentionBbCode(copilotBotDialogId, mentionText),
					dialogId: this.context.dialogId,
				});

				this.emitter.emit(EventType.textarea.replyMessage, {
					messageId: this.context.id,
					dialogId: this.context.dialogId,
				});
			},
		};
	}

	getDeleteItem(): ?MenuItemOptions
	{
		if (this.isDeletedMessage())
		{
			return null;
		}

		const permissionManager = PermissionManager.getInstance();

		const canDeleteOwn = !this.isOwnMessage() || permissionManager.canPerformActionByRole(
			ActionByRole.deleteOwnMessage,
			this.context.dialogId,
		);
		const canDeleteOthers = this.isOwnMessage() || permissionManager.canPerformActionByRole(
			ActionByRole.deleteOthersMessage,
			this.context.dialogId,
		);

		if (!canDeleteOwn || !canDeleteOthers)
		{
			return null;
		}

		return {
			title: Loc.getMessage('IM_DIALOG_CHAT_MENU_DELETE'),
			design: MenuItemDesign.Alert,
			icon: OutlineIcons.TRASHCAN,
			onClick: this.#onDelete.bind(this),
		};
	}

	getMarketItems(): MenuItemOptions[]
	{
		const { dialogId, id } = this.context;
		const placements = this.marketManager.getAvailablePlacementsByType(PlacementType.contextMenu, dialogId);
		const marketMenuItem = [];

		const context = { messageId: id, dialogId };

		placements.forEach((placement) => {
			marketMenuItem.push({
				title: placement.title,
				icon: OutlineIcons.MARKET,
				onClick: () => {
					void MarketManager.openSlider(placement, context);
				},
			});
		});

		const MARKET_ITEMS_LIMIT = 10;

		return marketMenuItem.slice(0, MARKET_ITEMS_LIMIT);
	}

	getDownloadFileItem(): ?MenuItemOptions
	{
		const files = this.#getAvailableFiles();
		if (!Type.isArrayFilled(files))
		{
			return null;
		}

		if (files.length === 1)
		{
			return this.#getDownloadSingleFileItem(files[0]);
		}

		return this.#getDownloadSeveralFilesItem(files);
	}

	getSaveToDiskItem(): ?MenuItemOptions
	{
		const files = this.#getAvailableFiles();
		if (!Type.isArrayFilled(files))
		{
			return null;
		}

		const isSingleFile = files.length === 1;
		const menuItemText = isSingleFile
			? Loc.getMessage('IM_DIALOG_CHAT_MENU_SAVE_ON_DISK_MSGVER_1')
			: Loc.getMessage('IM_DIALOG_CHAT_MENU_SAVE_ALL_ON_DISK');

		return {
			title: menuItemText,
			icon: OutlineIcons.FOLDER_24,
			onClick: async function() {
				Analytics.getInstance().messageContextMenu.onSaveOnDisk({
					messageId: this.context.id,
					dialogId: this.context.dialogId,
				});

				try
				{
					await this.diskService.save(files.map((file) => file.id));
					Notifier.file.onDiskSaveComplete(isSingleFile);
				}
				catch
				{
					Notifier.onDefaultError();
				}
			}.bind(this),
		};
	}

	getAdditionalItems(): MenuItemOptions[]
	{
		const items = this.getNestedItems();
		this.#areNestedItemsInSubMenu = this.#needNestedMenu(items);

		if (this.#areNestedItemsInSubMenu)
		{
			return [{
				title: Loc.getMessage('IM_DIALOG_CHAT_MENU_MORE'),
				subMenu: {
					items,
					sections: this.getNestedMenuGroups(),
				},
			}];
		}

		return items;
	}

	getNestedItems(): MenuItemOptions[]
	{
		const firstGroupItems = [
			this.getPinItem(),
			this.getCopyLinkItem(),
			this.getCopyFileItem(),
			this.getMarkItem(),
			this.getFavoriteItem(),
			this.getSaveToDiskItem(),
			this.isAiTaskFromMessageAvailable() ? this.getCreateTaskItem(MenuItemPlacement.nested) : null,
			this.getCreateMeetingItem(),
		];

		return [
			...this.groupItems(firstGroupItems, NestedMenuSectionCode.first),
			...this.groupItems(this.getMarketItems(), NestedMenuSectionCode.second),
		];
	}

	isOwnMessage(): boolean
	{
		return this.context.authorId === Core.getUserId();
	}

	isDeletedMessage(): boolean
	{
		return this.context.isDeleted;
	}

	isRealMessage(): boolean
	{
		return this.store.getters['messages/isRealMessage'](this.context.id);
	}

	canSendMessage(): boolean
	{
		const dialog = Core.getStore().getters['chats/get'](this.context.dialogId, true);

		if (!dialog.isTextareaEnabled)
		{
			return false;
		}

		return PermissionManager.getInstance().canPerformActionByRole(ActionByRole.send, this.context.dialogId);
	}

	#isStickerMessage(): boolean
	{
		// A network sticker has no local pack, so it never gets a record in the sticker store.
		return this.store.getters['stickers/messages/isSticker'](this.context.id)
			|| this.context.componentId === MessageComponent.NetworkStickerMessage
		;
	}

	#isSystemMessage(): boolean
	{
		return this.context.authorId === 0;
	}

	#isItemInNestedMenu(placement: string): boolean
	{
		return placement === MenuItemPlacement.nested && this.#areNestedItemsInSubMenu;
	}

	#needNestedMenu(additionalItems: MenuItemOptions[]): boolean
	{
		const NESTED_MENU_MIN_ITEMS = 3;
		const menuItems = additionalItems.filter((item) => item !== null);

		return menuItems.length >= NESTED_MENU_MIN_ITEMS;
	}

	// Block files join the menu only under the option that renders the blocks themselves. With the
	// option off the menu stays what it was before the blocks feature: plain attachments only.
	#getBlockFileIds(): number[]
	{
		if (!FeatureManager.isFeatureAvailable(Feature.isMessageFileAudioBlockAvailable))
		{
			return [];
		}

		const blocks: BuilderBlock[] = this.store.getters['messages/builder/getBlocks'](this.context.id) ?? [];

		return blocks.flatMap((block) => FileIdsByBlockType[block.type]?.(block) ?? []);
	}

	// Every file of the message: plain attachments plus the files of its builder blocks.
	#allFileIds(): number[]
	{
		const messageFileIds = Type.isArray(this.context.files) ? this.context.files : [];

		return [...new Set([...messageFileIds, ...this.#getBlockFileIds()])];
	}

	// A block can point at a file the store has no model for (deleted, no access). Such a file is not
	// rendered in the message either, so the file items are built from the resolved models only.
	#getAvailableFiles(): ImModelFile[]
	{
		return this.#allFileIds()
			.map((fileId) => this.store.getters['files/get'](fileId))
			.filter((file) => file !== null);
	}

	async #onDelete()
	{
		const { id: messageId, dialogId, chatId } = this.context;
		Analytics.getInstance().messageContextMenu.onDelete({ messageId, dialogId });

		if (await this.#isDeletionCancelled())
		{
			return;
		}

		const messageService = new MessageService({ chatId });
		messageService.deleteMessages([messageId]);
	}

	async #isDeletionCancelled(): Promise<boolean>
	{
		const { id: messageId, dialogId } = this.context;
		if (!ChannelManager.isChannel(dialogId))
		{
			return false;
		}

		const confirmResult = await showDeleteChannelPostConfirm();
		if (!confirmResult)
		{
			Analytics.getInstance().messageContextMenu.onCancelDelete({ messageId, dialogId });

			return true;
		}

		return false;
	}

	#getDownloadSingleFileItem(file: ImModelFile): MenuItemOptions
	{
		return {
			title: Loc.getMessage('IM_DIALOG_CHAT_MENU_DOWNLOAD_FILE'),
			icon: OutlineIcons.DOWNLOAD,
			onClick: function() {
				Utils.file.downloadFiles([file]);

				Analytics.getInstance().messageContextMenu.onFileDownload({
					messageId: this.context.id,
					dialogId: this.context.dialogId,
				});
			}.bind(this),
		};
	}

	#getDownloadSeveralFilesItem(files: ImModelFile[]): MenuItemOptions
	{
		return {
			title: Loc.getMessage('IM_DIALOG_CHAT_MENU_DOWNLOAD_FILES'),
			icon: OutlineIcons.DOWNLOAD,
			onClick: async () => {
				Analytics.getInstance().messageContextMenu.onFileDownload({
					messageId: this.context.id,
					dialogId: this.context.dialogId,
				});
				Utils.file.downloadFiles(files);

				const needToShowPopup = PromoManager.getInstance().needToShow(PromoId.downloadSeveralFiles);
				if (needToShowPopup && Utils.browser.isChrome() && !Utils.platform.isBitrixDesktop())
				{
					await showDownloadAllFilesConfirm();
					void PromoManager.getInstance().markAsWatched(PromoId.downloadSeveralFiles);
				}
			},
		};
	}

	#arePinsExceedLimit(): string
	{
		const pins = this.store.getters['messages/pin/getPinned'](this.context.chatId);

		return pins.length >= this.maxPins;
	}

	#isCurrentUserGuest(): boolean
	{
		return this.store.getters['users/isGuest'](this.getCurrentUserId());
	}
}
