/**
 * @module im/messenger/lib/element/dialog/message/element/actions/action-buttons
 */
jn.define('im/messenger/lib/element/dialog/message/element/actions/action-buttons', (require, exports, module) => {
	const { Feature } = require('im/messenger/lib/feature');
	const { Icon } = require('assets/icons');
	const { Color } = require('tokens');
	const { MessageActionType } = require('im/messenger/const');

	const ActionTint = Object.freeze({
		active: Color.accentMainPrimaryalt.toHex(),
		neutral: Color.chatOtherCopilot2.toHex(),
	});

	/**
	 * @class ActionButtons
	 */
	class ActionButtons
	{
		#isLiked;
		#isDisliked;

		/**
		 * @param {object} options
		 * @param {boolean} options.isLiked
		 * @param {boolean} options.isDisliked
		 */
		constructor({ isLiked, isDisliked })
		{
			this.#isLiked = isLiked;
			this.#isDisliked = isDisliked;
		}

		/**
		 * @param {object} options
		 * @param {boolean} options.isLiked
		 * @param {boolean} options.isDisliked
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
				iconName: Icon.COPY.getIconName(),
				tint: ActionTint.neutral,
			};
		}

		/**
		 * @return {MessageFooterActionButton}
		 */
		#getRegenerateButton()
		{
			return {
				id: MessageActionType.regenerate,
				iconName: Icon.REFRESH.getIconName(),
				tint: ActionTint.neutral,
			};
		}

		/**
		 * @return {MessageFooterActionButton}
		 */
		#getLikeButton()
		{
			const iconName = this.#isLiked ? Icon.SOLID_LIKE.getIconName() : Icon.LIKE.getIconName();
			const tint = this.#isLiked ? ActionTint.active : ActionTint.neutral;

			return {
				id: MessageActionType.like,
				iconName,
				tint,
			};
		}

		/**
		 * @return {MessageFooterActionButton}
		 */
		#getDislikeButton()
		{
			const iconName = this.#isDisliked ? Icon.SOLID_DISIKE.getIconName() : Icon.DISLIKE.getIconName();
			const tint = this.#isDisliked ? ActionTint.active : ActionTint.neutral;

			return {
				id: MessageActionType.dislike,
				iconName,
				tint,
			};
		}

		/**
		 * @return {MessageFooterActionButton}
		 */
		#getForwardButton()
		{
			return {
				id: MessageActionType.forward,
				iconName: Icon.FORWARD.getIconName(),
				tint: ActionTint.neutral,
			};
		}
	}

	module.exports = { ActionButtons };
});
