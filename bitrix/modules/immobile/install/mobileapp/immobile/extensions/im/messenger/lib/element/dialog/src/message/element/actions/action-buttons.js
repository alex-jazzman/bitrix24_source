/**
 * @module im/messenger/lib/element/dialog/message/element/actions/action-buttons
 */
jn.define('im/messenger/lib/element/dialog/message/element/actions/action-buttons', (require, exports, module) => {
	const { Feature } = require('im/messenger/lib/feature');
	const { MessageActionType } = require('im/messenger/const');

	const IconName = Object.freeze({
		copy: 'copy',
		refresh: 'refresh',
		like: 'like',
		dislike: 'dislike',
		forward: 'forward',
	});

	/**
	 * @class ActionButtons
	 */
	class ActionButtons
	{
		#tint;

		/**
		 * @param {object} options
		 * @param {string} options.tint
		 */
		constructor({ tint })
		{
			this.#tint = tint;
		}

		/**
		 * @param {object} options
		 * @param {string} options.tint
		 * @return {ActionButtons}
		 */
		static create(options)
		{
			return new ActionButtons(options);
		}

		/**
		 * @return {MessageFooterActionButton[]}
		 */
		toMessageFormat()
		{
			if (!Feature.isMessageActionsSupported || !Feature.isBitrixGptV2Available)
			{
				return [];
			}

			return [
				this.#getCopyButton(),
				...(Feature.isAiAssistantRegenerateAvailable ? [this.#getRegenerateButton()] : []),
				...(Feature.isAiAssistantFeedbackAvailable ? [this.#getLikeButton(), this.#getDislikeButton()] : []),
				this.#getForwardButton(),
			];
		}

		/**
		 * @return {MessageFooterActionButton}
		 */
		#getCopyButton()
		{
			return {
				id: MessageActionType.copy,
				iconName: IconName.copy,
				tint: this.#tint,
			};
		}

		/**
		 * @return {MessageFooterActionButton}
		 */
		#getRegenerateButton()
		{
			return {
				id: MessageActionType.regenerate,
				iconName: IconName.refresh,
				tint: this.#tint,
			};
		}

		/**
		 * @return {MessageFooterActionButton}
		 */
		#getLikeButton()
		{
			return {
				id: MessageActionType.like,
				iconName: IconName.like,
				tint: this.#tint,
			};
		}

		/**
		 * @return {MessageFooterActionButton}
		 */
		#getDislikeButton()
		{
			return {
				id: MessageActionType.dislike,
				iconName: IconName.dislike,
				tint: this.#tint,
			};
		}

		/**
		 * @return {MessageFooterActionButton}
		 */
		#getForwardButton()
		{
			return {
				id: MessageActionType.forward,
				iconName: IconName.forward,
				tint: this.#tint,
			};
		}
	}

	module.exports = { ActionButtons };
});
