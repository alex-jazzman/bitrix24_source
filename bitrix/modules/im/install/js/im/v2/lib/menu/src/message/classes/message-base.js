import { Loc, Type } from 'main.core';
import { EventEmitter } from 'main.core.events';

import { PromoManager } from 'im.v2.lib.promo';
import { Analytics } from 'im.v2.lib.analytics';
import { ChannelManager } from 'im.v2.lib.channel';
import { Core } from 'im.v2.application.core';
import { Parser } from 'im.v2.lib.parser';
import { EntityCreator } from 'im.v2.lib.entity-creator';
import { MessageService } from 'im.v2.provider.service.message';
import { DiskService } from 'im.v2.provider.service.disk';
import { EventType, PlacementType, ActionByRole, PromoId } from 'im.v2.const';
import { MarketManager } from 'im.v2.lib.market';
import { Utils } from 'im.v2.lib.utils';
import { PermissionManager } from 'im.v2.lib.permission';
import { showDeleteChannelPostConfirm, showDownloadAllFilesConfirm } from 'im.v2.lib.confirm';
import { Notifier } from 'im.v2.lib.notifier';

// noinspection ES6PreferShortImport
import { BaseMenu } from '../../base/base';

import '../css/message-menu.css';

import type { MenuItem } from 'im.v2.lib.menu';
import type { ImModelMessage, ImModelChat, ImModelFile } from 'im.v2.model';
import type { MenuOptions } from 'main.popup';
export type MessageMenuContext = ImModelMessage & { dialogId: string };

export class MessageMenu extends BaseMenu
{
	context: MessageMenuContext;
	diskService: DiskService;

	maxPins: number = 20;

	constructor()
	{
		super();

		this.id = 'bx-im-message-context-menu';
		this.diskService = new DiskService();
		this.marketManager = MarketManager.getInstance();
	}

	getMenuOptions(): MenuOptions
	{
		return {
			...super.getMenuOptions(),
			className: this.getMenuClassName(),
			angle: true,
			offsetLeft: 11,
			minWidth: 178,
		};
	}

	getMenuItems(): MenuItem[]
	{
		return [
			this.getReplyItem(),
			this.getCopyItem(),
			this.getEditItem(),
			this.getPinItem(),
			this.getForwardItem(),
			...this.getAdditionalItems(),
			this.getDeleteItem(),
			this.getDelimiter(),
			this.getSelectItem(),
		];
	}

	getSelectItem(): ?MenuItem
	{
		if (this.#isDeletedMessage() || !this.#isRealMessage())
		{
			return null;
		}

		return {
			text: Loc.getMessage('IM_DIALOG_CHAT_MENU_SELECT'),
			onclick: () => {
				EventEmitter.emit(EventType.dialog.openBulkActionsMode, {
					messageId: this.context.id,
					dialogId: this.context.dialogId,
				});
				this.menuInstance.close();
			},
		};
	}

	getReplyItem(): MenuItem
	{
		return {
			text: Loc.getMessage('IM_DIALOG_CHAT_MENU_REPLY'),
			onclick: () => {
				EventEmitter.emit(EventType.textarea.replyMessage, {
					messageId: this.context.id,
					dialogId: this.context.dialogId,
				});
				this.menuInstance.close();
			},
		};
	}

	getForwardItem(): ?MenuItem
	{
		if (this.#isDeletedMessage() || !this.#isRealMessage())
		{
			return null;
		}

		return {
			text: Loc.getMessage('IM_DIALOG_CHAT_MENU_FORWARD'),
			onclick: () => {
				Analytics.getInstance().messageForward.onClickForward({ dialogId: this.context.dialogId });
				EventEmitter.emit(EventType.dialog.showForwardPopup, {
					messagesIds: [this.context.id],
				});
				this.menuInstance.close();
			},
		};
	}

	getCopyItem(): ?MenuItem
	{
		if (this.#isDeletedMessage() || this.context.text.trim().length === 0)
		{
			return null;
		}

		return {
			text: Loc.getMessage('IM_DIALOG_CHAT_MENU_COPY'),
			onclick: async () => {
				const textToCopy = Parser.prepareCopy(this.context);

				await Utils.text.copyToClipboard(textToCopy);
				Notifier.message.onCopyComplete();

				this.menuInstance.close();
			},
		};
	}

	getCopyLinkItem(): MenuItem
	{
		return {
			text: Loc.getMessage('IM_DIALOG_CHAT_MENU_COPY_LINK_MSGVER_1'),
			onclick: () => {
				const textToCopy = Utils.text.getMessageLink(this.context.dialogId, this.context.id);
				if (BX.clipboard?.copy(textToCopy))
				{
					Notifier.message.onCopyLinkComplete();
				}
				this.menuInstance.close();
			},
		};
	}

	getCopyFileItem(): ?MenuItem
	{
		if (this.context.files.length !== 1)
		{
			return null;
		}

		return {
			text: Loc.getMessage('IM_DIALOG_CHAT_MENU_COPY_FILE'),
			onclick: () => {
				const textToCopy = Parser.prepareCopyFile(this.context);
				if (BX.clipboard?.copy(textToCopy))
				{
					Notifier.file.onCopyComplete();
				}
				this.menuInstance.close();
			},
		};
	}

	getPinItem(): ?MenuItem
	{
		const canPin = PermissionManager.getInstance().canPerformActionByRole(
			ActionByRole.pinMessage,
			this.context.dialogId,
		);

		if (this.#isDeletedMessage() || !canPin)
		{
			return null;
		}

		const isPinned = this.store.getters['messages/pin/isPinned']({
			chatId: this.context.chatId,
			messageId: this.context.id,
		});

		return {
			text: isPinned ? Loc.getMessage('IM_DIALOG_CHAT_MENU_UNPIN') : Loc.getMessage('IM_DIALOG_CHAT_MENU_PIN'),
			onclick: () => {
				const messageService = new MessageService({ chatId: this.context.chatId });
				if (isPinned)
				{
					messageService.unpinMessage(this.context.chatId, this.context.id);
					Analytics.getInstance().messagePins.onUnpin(this.context.chatId);
				}
				else
				{
					if (this.#arePinsExceedLimit())
					{
						Notifier.chat.onMessagesPinLimitError(this.maxPins);
						Analytics.getInstance().messagePins.onReachingLimit(this.context.chatId);
						this.menuInstance.close();

						return;
					}

					messageService.pinMessage(this.context.chatId, this.context.id);
					Analytics.getInstance().messagePins.onPin(this.context.chatId);
				}
				this.menuInstance.close();
			},
		};
	}

	getFavoriteItem(): MenuItem
	{
		if (this.#isDeletedMessage())
		{
			return null;
		}

		const isInFavorite = this.store.getters['sidebar/favorites/isFavoriteMessage'](this.context.chatId, this.context.id);

		const menuItemText = isInFavorite
			? Loc.getMessage('IM_DIALOG_CHAT_MENU_REMOVE_FROM_SAVED')
			: Loc.getMessage('IM_DIALOG_CHAT_MENU_SAVE')
		;

		return {
			text: menuItemText,
			onclick: () => {
				const messageService = new MessageService({ chatId: this.context.chatId });
				if (isInFavorite)
				{
					messageService.removeMessageFromFavorite(this.context.id);
				}
				else
				{
					messageService.addMessageToFavorite(this.context.id);
				}

				this.menuInstance.close();
			},
		};
	}

	getMarkItem(): ?MenuItem
	{
		const canUnread = this.context.viewed && !this.#isOwnMessage();

		const dialog: ImModelChat = this.store.getters['chats/getByChatId'](this.context.chatId);
		const isMarked = this.context.id === dialog.markedId;
		if (!canUnread || isMarked)
		{
			return null;
		}

		return {
			text: Loc.getMessage('IM_DIALOG_CHAT_MENU_MARK'),
			onclick: () => {
				const messageService = new MessageService({ chatId: this.context.chatId });
				messageService.markMessage(this.context.id);
				this.menuInstance.close();
			},
		};
	}

	getCreateTaskItem(): ?MenuItem
	{
		if (this.#isDeletedMessage())
		{
			return null;
		}

		return {
			text: Loc.getMessage('IM_DIALOG_CHAT_MENU_CREATE_TASK_MSGVER_1'),
			onclick: () => {
				const entityCreator = new EntityCreator(this.context.chatId);
				void entityCreator.createTaskForMessage(this.context.id);
				this.menuInstance.close();
			},
		};
	}

	getCreateMeetingItem(): ?MenuItem
	{
		if (this.#isDeletedMessage())
		{
			return null;
		}

		return {
			text: Loc.getMessage('IM_DIALOG_CHAT_MENU_CREATE_MEETING_MSGVER_1'),
			onclick: () => {
				const entityCreator = new EntityCreator(this.context.chatId);
				void entityCreator.createMeetingForMessage(this.context.id);
				this.menuInstance.close();
			},
		};
	}

	getEditItem(): ?MenuItem
	{
		if (!this.#isOwnMessage() || this.#isDeletedMessage() || this.#isForwardedMessage())
		{
			return null;
		}

		return {
			text: Loc.getMessage('IM_DIALOG_CHAT_MENU_EDIT'),
			onclick: () => {
				EventEmitter.emit(EventType.textarea.editMessage, {
					messageId: this.context.id,
					dialogId: this.context.dialogId,
				});
				this.menuInstance.close();
			},
		};
	}

	getDeleteItem(): ?MenuItem
	{
		if (this.#isDeletedMessage())
		{
			return null;
		}

		const permissionManager = PermissionManager.getInstance();
		const canDeleteOthersMessage = permissionManager.canPerformActionByRole(
			ActionByRole.deleteOthersMessage,
			this.context.dialogId,
		);
		if (!this.#isOwnMessage() && !canDeleteOthersMessage)
		{
			return null;
		}

		return {
			text: Loc.getMessage('IM_DIALOG_CHAT_MENU_DELETE'),
			className: 'menu-popup-no-icon bx-im-dialog-chat__message-menu_delete',
			onclick: this.#onDelete.bind(this),
		};
	}

	getMarketItems(): MenuItem[]
	{
		const { dialogId, id } = this.context;
		const placements = this.marketManager.getAvailablePlacementsByType(PlacementType.contextMenu, dialogId);
		const marketMenuItem = [];
		if (placements.length > 0)
		{
			marketMenuItem.push(this.getDelimiter());
		}

		const context = { messageId: id, dialogId };

		placements.forEach((placement) => {
			marketMenuItem.push({
				text: placement.title,
				onclick: () => {
					MarketManager.openSlider(placement, context);
					this.menuInstance.close();
				},
			});
		});

		// (10 items + 1 delimiter), because we don't want to show long context menu.
		const itemLimit = 11;

		return marketMenuItem.slice(0, itemLimit);
	}

	getDownloadFileItem(): ?MenuItem
	{
		if (!Type.isArrayFilled(this.context.files))
		{
			return null;
		}

		if (this.#isSingleFile())
		{
			return this.#getDownloadSingleFileItem();
		}

		return this.#getDownloadSeveralFilesItem();
	}

	getSaveToDiskItem(): ?MenuItem
	{
		if (!Type.isArrayFilled(this.context.files))
		{
			return null;
		}

		const menuItemText = this.#isSingleFile()
			? Loc.getMessage('IM_DIALOG_CHAT_MENU_SAVE_ON_DISK_MSGVER_1')
			: Loc.getMessage('IM_DIALOG_CHAT_MENU_SAVE_ALL_ON_DISK');

		return {
			text: menuItemText,
			onclick: async function() {
				Analytics.getInstance().messageFiles.onClickSaveOnDisk({
					messageId: this.context.id,
					dialogId: this.context.dialogId,
				});

				this.menuInstance.close();
				await this.diskService.save(this.context.files);
				Notifier.file.onDiskSaveComplete(this.#isSingleFile());
			}.bind(this),
		};
	}

	getDelimiter(): MenuItem
	{
		return {
			delimiter: true,
		};
	}

	getAdditionalItems(): MenuItem[]
	{
		const additionalItems = this.getNestedItems();
		if (this.#needNestedMenu(additionalItems))
		{
			return [{
				text: Loc.getMessage('IM_DIALOG_CHAT_MENU_MORE'),
				items: additionalItems,
			}];
		}

		return additionalItems;
	}

	getNestedItems(): MenuItem[]
	{
		return [
			this.getCopyLinkItem(),
			this.getCopyFileItem(),
			this.getMarkItem(),
			this.getFavoriteItem(),
			this.getDownloadFileItem(),
			this.getSaveToDiskItem(),
			this.getDelimiter(),
			this.getCreateTaskItem(),
			this.getCreateMeetingItem(),
			...this.getMarketItems(),
		];
	}

	#needNestedMenu(additionalItems: MenuItem[]): boolean
	{
		const NESTED_MENU_MIN_ITEMS = 3;
		const onlyMenuItems = additionalItems.filter((item) => item && !this.isDelimiter(item));

		return onlyMenuItems.length >= NESTED_MENU_MIN_ITEMS;
	}

	#isOwnMessage(): boolean
	{
		return this.context.authorId === Core.getUserId();
	}

	#isDeletedMessage(): boolean
	{
		return this.context.isDeleted;
	}

	#getFirstFile(): ?ImModelFile
	{
		return this.store.getters['files/get'](this.context.files[0]);
	}

	#isSingleFile(): boolean
	{
		return this.context.files.length === 1;
	}

	#isForwardedMessage(): boolean
	{
		return Type.isStringFilled(this.context.forward.id);
	}

	#isRealMessage(): boolean
	{
		return this.store.getters['messages/isRealMessage'](this.context.id);
	}

	async #onDelete()
	{
		const { id: messageId, dialogId, chatId } = this.context;
		Analytics.getInstance().messageDelete.onClickDelete({ messageId, dialogId });
		this.menuInstance.close();

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
			Analytics.getInstance().messageDelete.onCancel({ messageId, dialogId });

			return true;
		}

		return false;
	}

	#getDownloadSingleFileItem(): MenuItem
	{
		const file = this.#getFirstFile();

		return {
			html: Utils.file.createDownloadLink(
				Loc.getMessage('IM_DIALOG_CHAT_MENU_DOWNLOAD_FILE'),
				file.urlDownload,
				file.name,
			),
			onclick: function() {
				Analytics.getInstance().messageFiles.onClickDownload({
					messageId: this.context.id,
					dialogId: this.context.dialogId,
				});
				this.menuInstance.close();
			}.bind(this),
		};
	}

	#getDownloadSeveralFilesItem(): MenuItem
	{
		const files: ImModelFile[] = this.context.files.map((fileId) => {
			return this.store.getters['files/get'](fileId);
		});

		return {
			text: Loc.getMessage('IM_DIALOG_CHAT_MENU_DOWNLOAD_FILES'),
			onclick: async () => {
				Analytics.getInstance().messageFiles.onClickDownload({
					messageId: this.context.id,
					dialogId: this.context.dialogId,
				});
				Utils.file.downloadFiles(files);

				const needToShowPopup = PromoManager.getInstance().needToShow(PromoId.downloadSeveralFiles);
				if (needToShowPopup && Utils.browser.isChrome() && !Utils.platform.isBitrixDesktop())
				{
					this.menuInstance?.close();
					await showDownloadAllFilesConfirm();
					void PromoManager.getInstance().markAsWatched(PromoId.downloadSeveralFiles);
				}
				this.menuInstance?.close();
			},
		};
	}

	#arePinsExceedLimit(): string
	{
		const pins = this.store.getters['messages/pin/getPinned'](this.context.chatId);

		return pins.length >= this.maxPins;
	}
}
