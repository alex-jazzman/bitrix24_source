/**
 * @module im/messenger/controller/dialog/lib/copilot-reasoning-manager
 */
jn.define('im/messenger/controller/dialog/lib/copilot-reasoning-manager', (require, exports, module) => {
	const { Type } = require('type');

	const { EventType } = require('im/messenger/const');
	const { serviceLocator } = require('im/messenger/lib/di/service-locator');
	const { DialogHelper } = require('im/messenger/lib/helper');
	const { getLogger } = require('im/messenger/lib/logger');
	const {
		CopilotSimpleStatus,
		COPILOT_SIMPLE_REASONING_PLAN_PARAM,
	} = require('im/messenger/lib/copilot-simple-status');

	const logger = getLogger('dialog--copilot-reasoning-manager');

	/**
	 * @desc The plan on a message is the only sign of a BitrixGPT placeholder in simple mode. A soft
	 *       delete keeps the plan in the params, so the deletion flag has to be answered here too.
	 * @param {?MessagesModelState} message
	 * @return {?CopilotSimpleReasoningPlan}
	 */
	function getReasoningPlan(message)
	{
		if (message?.params?.IS_DELETED === 'Y')
		{
			return null;
		}

		const plan = message?.params?.[COPILOT_SIMPLE_REASONING_PLAN_PARAM];

		return Type.isPlainObject(plan) && Type.isArrayFilled(plan.steps) ? plan : null;
	}

	/**
	 * @desc Which of the loaded messages carry a plan, keyed the way the shows are tracked.
	 * @param {Array<MessagesModelState>} messages
	 * @return {Map<string, CopilotSimpleReasoningPlan>}
	 */
	function selectReasoningPlans(messages)
	{
		const plans = new Map();
		if (!Type.isArrayFilled(messages))
		{
			return plans;
		}

		messages.forEach((message) => {
			const plan = getReasoningPlan(message);
			if (plan)
			{
				plans.set(String(message.id), plan);
			}
		});

		return plans;
	}

	/**
	 * @class CopilotReasoningManager
	 *
	 * Owns the reasoning show of one open chat: which of its messages carry a plan and which shows the
	 * player has been handed. The show follows the data, so a turn survives leaving the chat and
	 * coming back from background.
	 */
	class CopilotReasoningManager
	{
		/** @type {Set<string>} messages handed to the player, keyed as the player keys them */
		#started = new Set();

		/** @type {boolean} whether the loaded collection of this chat has ever been read */
		#collectionRead = false;

		/**
		 * @param {{ dialogLocator: DialogLocator }} params
		 */
		constructor({ dialogLocator })
		{
			this.dialogId = dialogLocator.get('dialogId');
			this.player = new CopilotSimpleStatus();
		}

		subscribeStoreEvents()
		{
			this.#getStoreManager().on('messagesModel/setChatCollection', this.#onChatCollectionChanged);

			// Messages of the chat may already sit in the model from a previous open, and such a reopen
			// publishes no load mutation of its own.
			this.restoreLoadedMessages();
		}

		unsubscribeStoreEvents()
		{
			this.#getStoreManager().off('messagesModel/setChatCollection', this.#onChatCollectionChanged);
		}

		subscribeExternalEvents()
		{
			BX.addCustomEvent(EventType.app.active, this.#onAppActive);
		}

		unsubscribeExternalEvents()
		{
			BX.removeCustomEvent(EventType.app.active, this.#onAppActive);
		}

		/**
		 * @desc Leaves no timer of this chat behind: the shows belong to the dialog that started them.
		 */
		destructor()
		{
			[...this.#started].forEach((messageId) => this.#stop(messageId));
		}

		/**
		 * @desc Restores the shows of the chat from the data of its loaded messages. The server publishes
		 *       no "keep showing" event, so this is the only way back into a turn already running: a
		 *       return to the chat, a return from background, and a sync that brought the answer instead
		 *       of a pull event all come through here.
		 */
		restoreLoadedMessages()
		{
			const chatId = this.#getChatId();
			if (chatId === 0)
			{
				// No data rather than no plans: an unresolved chat says nothing about its messages, and
				// stopping the shows here would end a turn the chat is still running.
				return;
			}

			const plans = selectReasoningPlans(this.#getLoadedMessages(chatId));

			[...this.#started]
				.filter((messageId) => !plans.has(messageId))
				.forEach((messageId) => this.#stop(messageId))
			;

			plans.forEach((plan, messageId) => this.#start(messageId, plan));
		}

		/**
		 * @desc Applies to the show what the message now says. The plan comes back empty only when the
		 *       route turns agent.
		 * @param {number|string} messageId
		 */
		syncMessage(messageId)
		{
			const message = this.#getMessage(messageId);
			if (Number(message?.chatId) !== this.#getChatId())
			{
				return;
			}

			const plan = getReasoningPlan(message);
			if (plan)
			{
				this.#start(messageId, plan);

				return;
			}

			this.#stop(messageId);
		}

		/**
		 * @desc The main terminal signal: the successful path deletes the placeholder and publishes the
		 *       answer as a new message, so the plan never comes back empty there. Called where the
		 *       deletion is seen: going by the model alone would restart the show on a deleted bubble.
		 * @param {number|string} messageId
		 */
		stopMessage(messageId)
		{
			this.#stop(messageId);
		}

		/**
		 * @desc Only a show the player actually created counts as started: a plan it refuses to play
		 *       leaves nothing to stop and must not keep the chat reading its collection on every mutation.
		 * @param {number|string} messageId
		 * @param {CopilotSimpleReasoningPlan} plan
		 */
		#start(messageId, plan)
		{
			logger.log(`${this.constructor.name}.start`, messageId);

			if (this.player.start(messageId, plan))
			{
				this.#started.add(String(messageId));

				return;
			}

			this.#started.delete(String(messageId));
		}

		/**
		 * @param {number|string} messageId
		 */
		#stop(messageId)
		{
			if (!this.#started.has(String(messageId)))
			{
				return;
			}

			logger.log(`${this.constructor.name}.stop`, messageId);

			this.player.stop(messageId);
			this.#started.delete(String(messageId));
		}

		/**
		 * @desc Forgets the shows the player has ended on its own. It publishes no event for that, and a
		 *       list that never empties would send every load of the chat into the full pass again.
		 */
		#dropEndedShows()
		{
			[...this.#started]
				.filter((messageId) => !this.player.isPlaying(messageId))
				.forEach((messageId) => this.#started.delete(messageId))
			;
		}

		/**
		 * @desc A restore reads the whole loaded collection, and an open chat is loaded into often, so a
		 *       mutation that can change no show is skipped.
		 * @param {Array<MessagesModelState>} chatMessages
		 * @return {boolean}
		 */
		#needsRestore(chatMessages)
		{
			// A running show: only a full pass sees that its placeholder has left the model.
			// Before the first pass: mutations skipped while the chat was unresolved get no second one.
			if (this.#started.size > 0 || !this.#collectionRead)
			{
				return true;
			}

			return chatMessages.some((message) => getReasoningPlan(message) !== null);
		}

		/**
		 * @param {number} chatId
		 * @return {Array<MessagesModelState>}
		 */
		#getLoadedMessages(chatId)
		{
			this.#collectionRead = true;

			return this.#getStore().getters['messagesModel/getByChatId'](chatId);
		}

		/**
		 * @param {number|string} messageId
		 * @return {?MessagesModelState}
		 */
		#getMessage(messageId)
		{
			return this.#getStore().getters['messagesModel/getById'](messageId);
		}

		/**
		 * @desc The chat is resolved on every call, not remembered: a cold open creates the managers
		 *       before the chat itself reaches the model.
		 * @return {number}
		 */
		#getChatId()
		{
			return DialogHelper.createByDialogId(this.dialogId)?.chatId ?? 0;
		}

		#getStore()
		{
			return serviceLocator.get('core').getStore();
		}

		/**
		 * @return {MessengerCoreStoreManager}
		 */
		#getStoreManager()
		{
			return serviceLocator.get('core').getStoreManager();
		}

		/**
		 * @param {MutationPayload<MessagesSetChatCollectionData, MessagesSetChatCollectionActions>} payload
		 */
		#onChatCollectionChanged = ({ payload }) => {
			const chatId = this.#getChatId();
			const chatMessages = (payload?.data?.messageList ?? [])
				.filter((message) => Number(message.chatId) === chatId)
			;
			if (chatMessages.length === 0)
			{
				return;
			}

			this.#dropEndedShows();

			if (!this.#needsRestore(chatMessages))
			{
				return;
			}

			this.restoreLoadedMessages();
		};

		#onAppActive = () => {
			this.restoreLoadedMessages();
		};
	}

	module.exports = {
		CopilotReasoningManager,
		getReasoningPlan,
		selectReasoningPlans,
	};
});
