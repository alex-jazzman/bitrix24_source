/* eslint-disable */
this.BX = this.BX || {};
this.BX.Messenger = this.BX.Messenger || {};
this.BX.Messenger.v2 = this.BX.Messenger.v2 || {};
(function (exports, im_v2_lib_utils, im_v2_application_core, im_v2_const, im_v2_lib_smileManager, imopenlines_v2_lib_openlines) {
	'use strict';

	const serverComponentList = new Set([im_v2_const.MessageComponent.unsupported, im_v2_const.MessageComponent.error, im_v2_const.MessageComponent.chatCreation, im_v2_const.MessageComponent.ownChatCreation, im_v2_const.MessageComponent.conferenceCreation, im_v2_const.MessageComponent.callInvite, im_v2_const.MessageComponent.copilotCreation, im_v2_const.MessageComponent.copilotMessage, im_v2_const.MessageComponent.aiAssistantMessage, im_v2_const.MessageComponent.supportVote, im_v2_const.MessageComponent.supportSessionNumber, im_v2_const.MessageComponent.supportChatCreation, im_v2_const.MessageComponent.zoomInvite, im_v2_const.MessageComponent.copilotAddedUsers, im_v2_const.MessageComponent.supervisorUpdateFeature, im_v2_const.MessageComponent.supervisorEnableFeature, im_v2_const.MessageComponent.sign, im_v2_const.MessageComponent.admin, im_v2_const.MessageComponent.checkIn, im_v2_const.MessageComponent.generalChatCreationMessage, im_v2_const.MessageComponent.generalChannelCreationMessage, im_v2_const.MessageComponent.channelCreationMessage, im_v2_const.MessageComponent.callMessage, im_v2_const.MessageComponent.voteMessage, im_v2_const.MessageComponent.convertToCollabMessage, im_v2_const.MessageComponent.sticker, im_v2_const.MessageComponent.aiBizprocMessage]);
	const demoComponentList = new Set([im_v2_const.MessageComponent.taskChatCreationMessage]);
	class MessageComponentManager {
		#message;
		#store;
		constructor(message) {
			this.#message = message;
			this.#store = im_v2_application_core.Core.getStore();
		}
		getName() {
			const openLinesMessageName = imopenlines_v2_lib_openlines.OpenLinesManager?.getMessageName(this.#message);
			if (openLinesMessageName) {
				return openLinesMessageName;
			}
			if (this.#isDeletedMessage()) {
				return im_v2_const.MessageComponent.deleted;
			}
			if (this.#isServerComponent() || this.#isDemoComponent()) {
				return this.#message.componentId;
			}
			if (this.#hasFiles()) {
				return im_v2_const.MessageComponent.file;
			}
			if (this.#isEmojiOnly() || this.#hasSmilesOnly()) {
				return im_v2_const.MessageComponent.smile;
			}
			if (this.#hasSticker()) {
				return im_v2_const.MessageComponent.sticker;
			}
			if (this.#hasBuilderBlocks()) {
				return im_v2_const.MessageComponent.builderMessage;
			}
			return im_v2_const.MessageComponent.default;
		}
		#isServerComponent() {
			return serverComponentList.has(this.#message.componentId);
		}
		#isDemoComponent() {
			return demoComponentList.has(this.#message.componentId);
		}
		#hasFiles() {
			return this.#message.files.length > 0;
		}
		#hasText() {
			return this.#message.text.length > 0;
		}
		#hasAttach() {
			return this.#message.attach.length > 0;
		}
		#hasBuilderBlocks() {
			return this.#store.getters['messages/builder/hasBlocks'](this.#message.id);
		}
		#hasSticker() {
			return this.#store.getters['stickers/messages/isSticker'](this.#message.id);
		}
		#isEmptyMessage() {
			return !this.#hasText() && !this.#hasFiles() && !this.#hasAttach() && !this.#hasSticker() && !this.#hasBuilderBlocks();
		}
		#isDeletedMessage() {
			return this.#message.isDeleted || this.#isEmptyMessage();
		}
		#isEmojiOnly() {
			if (this.#message.replyId > 0) {
				return false;
			}
			if (this.#isForward()) {
				return false;
			}
			if (!this.#hasOnlyText()) {
				return false;
			}
			return im_v2_lib_utils.Utils.text.isEmojiOnly(this.#message.text);
		}
		#hasSmilesOnly() {
			if (this.#message.replyId > 0) {
				return false;
			}
			if (this.#isForward()) {
				return false;
			}
			if (!this.#hasOnlyText()) {
				return false;
			}

			// todo: need to sync with getSmileRatio in lib/parser/src/functions/smile.js
			const smileManager = im_v2_lib_smileManager.SmileManager.getInstance();
			const smiles = smileManager.smileList?.smiles ?? [];
			const sortedSmiles = [...smiles].sort((a, b) => {
				return b.typing.localeCompare(a.typing);
			});
			const pattern = sortedSmiles.map(smile => {
				return im_v2_lib_utils.Utils.text.escapeRegex(smile.typing);
			}).join('|');
			const replacedText = this.#message.text.replaceAll(new RegExp(pattern, 'g'), '');
			const hasOnlySmiles = replacedText.trim().length === 0;
			const matchOnlySmiles = new RegExp(`(?:(?:${pattern})\\s*){4,}`);
			return hasOnlySmiles && !matchOnlySmiles.test(this.#message.text);
		}
		#hasOnlyText() {
			if (!this.#hasText()) {
				return false;
			}
			return !this.#hasFiles() && !this.#hasAttach();
		}
		#isForward() {
			return this.#store.getters['messages/isForward'](this.#message.id);
		}
	}

	exports.MessageComponentManager = MessageComponentManager;

})(this.BX.Messenger.v2.Lib = this.BX.Messenger.v2.Lib || {}, BX?.Messenger?.v2?.Lib??{}, BX?.Messenger?.v2?.Application??{}, BX?.Messenger?.v2?.Const??{}, BX?.Messenger?.v2?.Lib??{}, BX?.OpenLines?.v2?.Lib??{});
//# sourceMappingURL=message-component.bundle.js.map
