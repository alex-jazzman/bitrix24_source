/**
 * @module im/messenger/controller/chat-composer/update/channel
 */
jn.define('im/messenger/controller/chat-composer/update/channel', (require, exports, module) => {
	const { Loc } = require('im/messenger/loc');
	const { Type } = require('type');
	const { DialogType, WidgetTitleParamsType } = require('im/messenger/const');
	const { LoggerManager } = require('im/messenger/lib/logger');
	const logger = LoggerManager.getInstance().getLogger('chat-composer--channel');

	const { UpdateGroupChat } = require('im/messenger/controller/chat-composer/update/group-chat');
	const { ChannelView } = require('im/messenger/controller/chat-composer/lib/view/channel');
	const { DialogTypeView } = require('im/messenger/controller/chat-composer/lib/view/dialog-type');

	/**
	 * @class UpdateChannel
	 */
	class UpdateChannel extends UpdateGroupChat
	{
		/**
		 * @param {{ dialogId: DialogId, parentWidget?: PageManager }} params
		 */
		constructor(params)
		{
			super(params);

			/** @type {DialogTypeView | null} */
			this.dialogTypeView = null;
		}

		/**
		 * @protected
		 * @return {GroupChatViewProps}
		 */
		getDialogInfoProps()
		{
			const props = super.getDialogInfoProps();
			props.callbacks.onClickDialogTypeAction = this.openDialogTypeView.bind(this);

			return props;
		}

		/**
		 * @param {{ titleType?: string }} [params]
		 */
		openChannelView({ titleType = WidgetTitleParamsType.entity } = {})
		{
			this.parentWidget.openWidget('layout', {
				titleParams: {
					text: Loc.getMessage('IMMOBILE_CHAT_COMPOSER_UPDATE_CHANNEL_TITLE'),
					type: titleType,
				},
				modal: true,
			})
				.then((widget) => {
					this.mainView = ChannelView.openToEdit(this.getDialogInfoProps());
					this.mainWidget = widget;
					this.mainWidget.showComponent(this.mainView);
					this.mainWidget.expandBottomSheet();
					this.mainWidget.setLeftButtons([]);
					this.mainWidget.setRightButtons([
						{
							id: 'cross',
							type: 'cross',
							callback: () => this.checkBeforeCloseWidget(),
						},
					]);
					this.mainWidget.setBackButtonHandler(() => {
						this.checkBeforeCloseWidget();

						return true;
					});
				})
				.catch((error) => {
					logger.error(`${this.constructor.name}.PageManager.openWidget.catch:`, error);
				});
		}

		/**
		 * @protected
		 * @param {boolean} isOpenEntityType
		 * @return {DialogType}
		 */
		getTypeByEntityType(isOpenEntityType)
		{
			return isOpenEntityType ? DialogType.openChannel : DialogType.channel;
		}

		/**
		 * @protected
		 * @return {string}
		 */
		getDialogTypeWidgetTitle()
		{
			return Loc.getMessage('IMMOBILE_CHAT_COMPOSER_DIALOG_TYPE_CHANNEL_TITLE');
		}

		/**
		 * @protected
		 * @return {string}
		 */
		getParticipantWidgetTitle()
		{
			return Loc.getMessage('IMMOBILE_CHAT_COMPOSER_SUBSCRIBERS_TITLE');
		}

		/**
		 * @protected
		 * @param {{ titleType?: string }} [params]
		 */
		openDialogTypeView({ titleType = WidgetTitleParamsType.entity } = {})
		{
			PageManager.openWidget(
				'layout',
				{
					titleParams: {
						text: this.getDialogTypeWidgetTitle(),
						type: titleType,
					},
				},
				this.mainWidget,
			)
				.then((widget) => {
					this.dialogTypeView = new DialogTypeView(
						{
							dialogType: this.dialogModel.type,
							callbacks: {
								onChangeDialogType: this.onChangeDialogType.bind(this),
								onDestroyView: () => {
									this.dialogTypeView = null;
								},
							},
						},
					);
					widget.showComponent(this.dialogTypeView);
				})
				.catch((error) => {
					logger.error(`${this.constructor.name}.PageManager.openWidget.catch:`, error);
				});
		}

		/**
		 * @protected
		 * @desc update dialog type
		 * @param {boolean} isSetOpenEntityType
		 * @void
		 */
		onChangeDialogType(isSetOpenEntityType)
		{
			const searchable = isSetOpenEntityType ? 'Y' : 'N';
			const { permissions } = this.dialogModel;
			this.restChatUpdate({
				searchable,
				manageUsersAdd: permissions.manageUsersAdd,
				manageUsersDelete: permissions.manageUsersDelete,
				manageMessages: permissions.manageMessages,
			})
				.then(async (result) => {
					if (result !== true)
					{
						return false;
					}
					const type = this.getTypeByEntityType(isSetOpenEntityType);
					this.showSuccessfullyToast();
					await this.updateDialogModel({ type });

					return true;
				})
				.catch((error) => logger.log(`${this.constructor.name}.onChangeDialogType.catch:`, error));
		}

		/**
		 * @protected
		 * @desc Handler dialog store update
		 * @param {MutationPayload<DialoguesUpdateData>} payload
		 * @void
		 */
		onUpdateDialogStore({ payload })
		{
			super.onUpdateDialogStore({ payload });

			if (
				this.isOwnDialogPayload(payload)
				&& (payload.actionName === 'updateType' || payload.actionName === 'update')
				&& payload.data?.fields?.type
			)
			{
				this.updateDialogTypeState(payload.data?.fields?.type);
			}
		}

		/**
		 * @protected
		 * @desc dialog type view - state update
		 * @param {DialogType} newType
		 * @void
		 */
		updateDialogTypeState(newType)
		{
			if (Type.isNil(this.dialogTypeView))
			{
				return;
			}

			this.dialogTypeView.setState({ dialogType: newType });
		}
	}

	module.exports = { UpdateChannel };
});
