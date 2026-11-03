/**
 * @module im/messenger/controller/dialog/lib/draft-manager
 */
jn.define('im/messenger/controller/dialog/lib/draft-manager', (require, exports, module) => {
	const { throttle, debounce } = require('utils/function');
	const { DraftType } = require('im/messenger/const');
	const { ObjectUtils, AsyncQueue } = require('im/messenger/lib/utils');
	const { getLoggerWithContext } = require('im/messenger/lib/logger');

	class DraftManager
	{
		/**
		 * @param {MessengerStore} store
		 * @param {DialogView} view
		 * @param {ReplyManager} replyManager
		 * @param {string|number} dialogId
		 * @param {(text: string) => string} prepareDraftText
		 * @param {boolean} initWithExternalForward
		 */
		constructor({ store, view, replyManager, dialogId, prepareDraftText, initWithExternalForward })
		{
			this.logger = getLoggerWithContext('dialog--draft-manager', this);

			this.store = store;
			this.view = view;
			this.dialogId = dialogId;
			this.replyManager = replyManager;
			this.prepareDraftText = prepareDraftText;
			this.initWithExternalForward = initWithExternalForward;

			this.saveDraftThrottled = throttle(this.saveDraft, 3000, this);
			this.saveDraftDebounced = debounce(this.saveDraft, 1500, this);
			this.changeTextHandler = this.changeTextHandler.bind(this);

			this.queue = new AsyncQueue();
			this.isSaveDraftCanceled = false;

			if (initWithExternalForward)
			{
				void this.clearDraft();
			}
			this.start();
		}

		start()
		{
			const sourceDraft = this.store.getters['draftModel/getById'](this.dialogId);

			if (!sourceDraft)
			{
				return;
			}
			const draft = this.prepareDraft(sourceDraft);
			const isDraftRepaired = draft !== sourceDraft;

			const draftMessage = {
				id: draft.messageId,
				type: draft.messageType,
				username: draft.userName,
				message: draft.message,
				image: draft.image,
				video: draft.video,
			};

			if (!ObjectUtils.isStringFullSpace(draft.text))
			{
				this.view.setInput(draft.text);
			}

			if (isDraftRepaired && !this.initWithExternalForward)
			{
				void this.saveRepairedDraft(draft);
			}

			switch (draft.type)
			{
				case DraftType.edit:
				{
					this.replyManager.initializeEditingMessage(draftMessage, this.initWithExternalForward);

					break;
				}

				case DraftType.reply:
				{
					this.replyManager.initializeQuotingMessage(draftMessage, this.initWithExternalForward);

					break;
				}

				default:
				{
					break;
				}
			}
		}

		/**
		 * @param {DraftModelState} draft
		 * @returns {DraftModelState}
		 */
		prepareDraft(draft)
		{
			try
			{
				const text = this.prepareDraftText(draft.text);
				if (text !== draft.text)
				{
					return { ...draft, text };
				}
			}
			catch (error)
			{
				this.logger.error('start: draft repair failed');
			}

			return draft;
		}

		/**
		 * @param {DraftModelState} draft
		 * @returns {Promise<void>}
		 */
		saveRepairedDraft(draft)
		{
			return this.queue.enqueue(async () => {
				try
				{
					await this.setRepairedDraftInStore(draft);
				}
				catch (error)
				{
					this.logger.error('start: repaired draft save failed');
				}
			});
		}

		changeTextHandler(message)
		{
			this.isSaveDraftCanceled = false;
			this.saveDraftThrottled(message);
			this.saveDraftDebounced(message);
		}

		/**
		 * @param {string} message
		 */
		saveDraft(message)
		{
			if (this.isSaveDraftCanceled)
			{
				this.logger.log('saveDraft canceled', message);

				return Promise.resolve();
			}

			this.logger.log('saveDraft', message);

			/** @type DraftModelState */
			const draft = {
				dialogId: this.dialogId,
				type: DraftType.text,
				text: message,
			};

			if (this.replyManager.isQuoteInProcess)
			{
				draft.type = DraftType.reply;
				draft.messageId = this.replyManager.quoteMessage.id;
				draft.messageType = this.replyManager.quoteMessage.type;
				draft.message = this.replyManager.quoteMessage.message;
				draft.userName = this.replyManager.quoteMessage.username;
				draft.video = this.replyManager.quoteMessage.video ?? null;
				draft.image = this.replyManager.quoteMessage.image ?? null;
			}
			else if (this.replyManager.isEditInProcess)
			{
				draft.type = DraftType.edit;
				draft.messageId = this.replyManager.editMessage.id;
				draft.messageType = this.replyManager.editMessage.type;
				draft.message = this.replyManager.editMessage.message;
				draft.userName = this.replyManager.editMessage.username;
				draft.video = this.replyManager.editMessage.video ?? null;
				draft.image = this.replyManager.editMessage.image ?? null;
			}

			return this.queue.enqueue(() => this.setInStore(draft));
		}

		/**
		 * @param {string} text
		 *
		 * @returns {Promise}
		 */
		cancelReply(text)
		{
			if (!text.trim())
			{
				return this.clearDraft();
			}

			return this.queue.enqueue(() => this.setInStore({
				text,
				type: DraftType.text,
				dialogId: this.dialogId,
			}));
		}

		/**
		 * @returns {Promise}
		 */
		cancelEditingMessage()
		{
			return this.queue.enqueue(() => this.clearDraft());
		}

		/**
		 *
		 * @param {Message} message
		 * @param {typeof InputQuoteType} type
		 * @param {string} text
		 *
		 * @returns {Promise}
		 */
		setQuotMessageInStore(message, type, text)
		{
			/** @type {DraftModelState} */
			const draft = {
				dialogId: this.dialogId,
				text,
				messageType: message.type,
				messageId: message.id,
				message: message.message,
				userName: message.username,
				type,
			};

			return this.queue.enqueue(() => this.setInStore(draft));
		}

		/**
		 * @returns {Promise}
		 */
		async clearDraft()
		{
			this.logger.log('clearDraft');
			this.isSaveDraftCanceled = true;

			await this.deleteDraft();
			await this.updateRecent();
		}

		/**
		 * @returns {Promise}
		 */
		async setInStore(draft)
		{
			await this.store.dispatch('draftModel/set', draft);
			await this.updateRecent();
		}

		/**
		 * @returns {Promise}
		 */
		async setRepairedDraftInStore(draft)
		{
			await this.store.dispatch('draftModel/setPreservingLastActivityDate', draft);
			await this.updateRecent();
		}

		/**
		 * @returns {Promise<Boolean>}
		 */
		updateRecent()
		{
			return this.store.dispatch('recentModel/update', [{ id: this.dialogId }]);
		}

		/**
		 * @returns {DraftModelState}
		 */
		getDraft()
		{
			return this.store.getters['draftModel/getById'](this.dialogId);
		}

		/**
		 * @returns {Promise<Boolean>}
		 */
		deleteDraft()
		{
			return this.store.dispatch('draftModel/delete', { dialogId: this.dialogId });
		}

		/**
		 * @param {number} messageId
		 * @returns {Promise<Boolean>}
		 */
		removeDraftByMessageId(messageId)
		{
			const draftModel = this.getDraft();

			if (
				messageId
				&& draftModel?.messageId
				&& String(draftModel?.messageId) === String(messageId))
			{
				return this.deleteDraft();
			}

			return Promise.resolve(false);
		}
	}

	module.exports = { DraftManager };
});
