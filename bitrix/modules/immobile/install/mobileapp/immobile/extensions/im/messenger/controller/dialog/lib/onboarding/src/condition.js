/**
 * @module im/messenger/controller/dialog/lib/onboarding/src/condition
 */
jn.define('im/messenger/controller/dialog/lib/onboarding/src/condition', (require, exports, module) => {
	const { ConditionBase } = require('onboarding/condition');
	const { Type } = require('type');

	const { DialogHelper } = require('im/messenger/lib/helper');
	const { DialogType } = require('im/messenger/const');
	const { Feature, MobileFeature } = require('im/messenger/lib/feature');
	const { OnboardingRest } = require('im/messenger/provider/rest');
	const { UserRole } = require('im/messenger/const');

	class Condition extends ConditionBase
	{
		static isAttachmentButtonEnabled()
		{
			return (ctx) => {
				if (!ctx)
				{
					return false;
				}

				return ctx.canHaveAttachments === true;
			};
		}

		static isDirectChat()
		{
			return (ctx) => {
				const dialogHelper = Condition.#getDialogHelperFromContext(ctx);

				return dialogHelper?.isDirect === true;
			};
		}

		static isChatWithBot()
		{
			return (ctx) => {
				const dialogHelper = Condition.#getDialogHelperFromContext(ctx);

				return dialogHelper?.isBot === true;
			};
		}

		static isChannel()
		{
			return (ctx) => {
				const dialogHelper = Condition.#getDialogHelperFromContext(ctx);

				return dialogHelper?.isChannel === true;
			};
		}

		static isGroupChat()
		{
			return (ctx) => {
				const dialogHelper = Condition.#getDialogHelperFromContext(ctx);

				return dialogHelper?.dialogModel?.type === DialogType.chat;
			};
		}

		static isOnboardingInChatSupported()
		{
			return () => MobileFeature.canUseSpotlightIds();
		}

		static hasMessagesAtLeast(minQuantity)
		{
			return Condition.#createQuantityChecker(minQuantity, OnboardingRest.getMessagesAmountFromServer);
		}

		static hasFilesAtLeast(minQuantity)
		{
			return Condition.#createQuantityChecker(minQuantity, OnboardingRest.getFilesQuantityByChatId);
		}

		static canCreateVote()
		{
			return (context) => {
				return Feature.isVoteMessageAvailable && !DialogHelper.createByDialogId(context?.dialogId)?.isDirect;
			};
		}

		static hasParticipantsMoreThan(minQuantity)
		{
			return (context) => {
				const dialogHelper = DialogHelper.createByDialogId(context?.dialogId);

				if (!dialogHelper?.dialogModel)
				{
					return false;
				}

				return dialogHelper.dialogModel?.userCounter >= minQuantity;
			};
		}

		static #resolveChatId(chatId)
		{
			return Type.isNumber(chatId) ? chatId : null;
		}

		static #getDialogHelperFromContext(context)
		{
			const dialogHelper = DialogHelper.createByDialogId(context?.dialogId);

			if (!dialogHelper?.dialogModel || dialogHelper?.dialogModel?.role === UserRole.guest)
			{
				return null;
			}

			return dialogHelper;
		}

		static #createQuantityChecker(minQuantity, fetcher)
		{
			return async (context) => {
				if (!Condition.#resolveChatId(context?.chatId))
				{
					return false;
				}

				try
				{
					const quantity = await fetcher(context.chatId);

					if (!Type.isNumber(quantity))
					{
						return false;
					}

					return quantity >= minQuantity;
				}
				catch
				{
					return false;
				}
			};
		}
	}

	module.exports = {
		Condition,
	};
});
