/**
 * @module im/messenger/controller/sidebar-v2/tabs/participants/src/items/copilot
 */
jn.define('im/messenger/controller/sidebar-v2/tabs/participants/src/items/copilot', (require, exports, module) => {
	const { Type } = require('type');
	const { ParticipantUserItem } = require('im/messenger/controller/sidebar-v2/tabs/participants/src/items/user');
	const { Color: MessengerColor, CopilotRoleType } = require('im/messenger/const');
	const { Feature } = require('im/messenger/lib/feature');
	const { Loc } = require('im/messenger/loc');

	/**
	 * @class ParticipantCopilotItem
	 */
	class ParticipantCopilotItem extends ParticipantUserItem
	{
		constructor(props)
		{
			super(props);

			this.dialogChatTitle = this.createChatTitle(this.getDialogId());
		}

		createAvatar()
		{
			const dialogModel = this.store.getters['dialoguesModel/getById'](this.getDialogId());

			return {
				testId: 'copilot-item',
				dialogId: this.getUserId(),
				options: { chatId: dialogModel?.chatId },
			};
		}

		createSubtitle()
		{
			if (Feature.isBitrixGptV2Available)
			{
				return { text: this.#getCopilotSubtitleText() };
			}

			const copilotRole = this.#getCopilotRole();
			const dialogModelState = this.#getCopilotDialogModelStateById(this.getDialogId());

			const text = (copilotRole?.default
				? this.chatTitle.getDescription()
				: this.dialogChatTitle.getDescription()) || dialogModelState?.aiProvider;

			return { text };
		}

		createTitle()
		{
			if (Feature.isBitrixGptV2Available)
			{
				return {
					text: this.#getCopilotTitleText(),
					color: null,
					colorGradient: MessengerColor.copilotGradient,
				};
			}

			return {
				text: this.#getCopilotTitleText(),
				style: {
					color: this.chatTitle.getTitleColor(),
				},
			};
		}

		getTestId()
		{
			return 'sidebar-tab-copilot-item';
		}

		handleOnClick()
		{
			return null;
		}

		getUserId()
		{
			const { userId } = this.props;

			return userId;
		}

		/**
		 * @returns {?CopilotModelState}
		 */
		#getCopilotDialogModelStateById(id)
		{
			return this.store.getters['dialoguesModel/copilotModel/getByDialogId'](id);
		}

		#getCopilotRole()
		{
			const { copilotRole } = this.props;

			return copilotRole;
		}

		/**
		 * @desc CoPilot participant title — always agentName (under BitrixGPT V2).
		 * @return {?string}
		 */
		#getCopilotTitleText()
		{
			if (Feature.isBitrixGptV2Available)
			{
				const agentName = Loc.getCopilotAgentName();
				if (Type.isStringFilled(agentName))
				{
					return agentName;
				}
			}

			return this.chatTitle.getTitle();
		}

		/**
		 * @desc CoPilot participant subtitle: profile role name or "personal assistant" phrase.
		 * @return {?string}
		 */
		#getCopilotSubtitleText()
		{
			const copilotData = this.store.getters['dialoguesModel/copilotModel/getByDialogId'](this.getDialogId());
			const mainRole = copilotData?.roles?.[copilotData?.chats?.[0]?.role];

			const isCopilotUniversalRole = !mainRole || mainRole?.code === CopilotRoleType.copilotUniversalRole;
			if (!isCopilotUniversalRole)
			{
				return this.dialogChatTitle.getCopilotRoleName();
			}

			return Loc.getMessage('IMMOBILE_MESSENGER_COPILOT_PERSONAL_ASSISTANT');
		}
	}

	module.exports = {
		ParticipantCopilotItem,
	};
});
