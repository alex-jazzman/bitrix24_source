/**
 * @module im/messenger/controller/dialog/lib/message-create-menu
 */
jn.define('im/messenger/controller/dialog/lib/message-create-menu', (require, exports, module) => {
	const { Loc } = require('loc');
	const { ContextMenu } = require('layout/ui/context-menu');
	const { menuIcons } = require('im/messenger/assets/common');
	const { openTaskCreateForm } = require('tasks/layout/task/create/opener');
	const { Logger } = require('im/messenger/lib/logger');
	const { RestMethod } = require('im/messenger/const/rest');

	/**
	 * @class MessageAvatarMenu
	 */
	class MessageCreateMenu
	{
		/**
		 * @param {MessagesModelState} messageData
		 * @param {DialogLocator} serviceLocator
		 */
		constructor(messageData, serviceLocator) {
			this.actionsName = ['task'];
			this.actionsData = [];
			this.messageData = messageData;
			this.serviceLocator = serviceLocator;
		}

		/**
		 * @param {MessagesModelState} messageData
		 * @param {DialogLocator} serviceLocator
		 */
		static open(messageData, serviceLocator)
		{
			const instanceClass = new MessageCreateMenu(messageData, serviceLocator);
			instanceClass.show();
		}

		show()
		{
			this.setCloseMenuPromise();
			this.createMenu();
			this.menu.show().catch((err) => Logger.error('MessageCreateMenu.open.catch:', err));
		}

		createMenu()
		{
			this.prepareActionsData();
			this.menu = new ContextMenu({
				actions: this.actionsData,
				params: {
					title: Loc.getMessage('IMMOBILE_DIALOG_MESSAGE_CREATE_MENU_TITLE'),
					showActionLoader: true,
				},
				onClose: () => this.resolveClosePromise(),
			});
		}

		prepareActionsData()
		{
			this.actionsName.forEach((actionName) => {
				this.actionsData.push({
					id: actionName,
					title: Loc.getMessage(`IMMOBILE_DIALOG_MESSAGE_CREATE_MENU_${actionName.toUpperCase()}`),
					data: {
						svgIcon: menuIcons[actionName](),
					},
					onClickCallback: this.getCallbackByAction(actionName),
					testId: `IMMOBILE_DIALOG_MESSAGE_CREATE_MENU_${actionName.toUpperCase()}`,
				});
			});
		}

		/**
		 * @param {string} actionName
		 * @return {Function}
		 */
		getCallbackByAction(actionName)
		{
			const method = Object.getOwnPropertyNames(Object.getPrototypeOf(this))
				.filter((prop) => prop.toLowerCase().includes(actionName));

			if (method.length === 0 || method.length > 2)
			{
				return () => Logger.error(`${this.constructor.name}.getCallbackByAction error find method`, method);
			}

			return this[method].bind(this);
		}

		setCloseMenuPromise()
		{
			this.closePromise = new Promise((resolve) => {
				this.resolveClosePromise = resolve;
			});
		}

		async onClickActionTask()
		{
			Logger.log(`${this.constructor.name}.onClickActionTask`);
			const taskData = await this.getPrepareDataFromRest();
			if (!taskData.params)
			{
				return;
			}

			const auditorsIds = taskData.params.AUDITORS.split(',');
			this.store = this.serviceLocator.get('store');
			const auditors = auditorsIds.map((id) => {
				const user = this.store.getters['usersModel/getById'](id);
				if (user && user.name)
				{
					return Object.create({ id, name: user.name });
				}

				return Object.create({ id, name: '' });
			});

			const filesIds = taskData.params.UF_TASK_WEBDAV_FILES;
			let files = [];
			if (filesIds)
			{
				files = filesIds.map((id) => Object.create({ id }));
			}

			this.closePromise.then(() => {
				openTaskCreateForm({
					initialTaskData: {
						title: this.messageData.text,
						description: taskData.params.DESCRIPTION,
						auditors,
						// files, TODO when will be ready API TASK
						IM_CHAT_ID: taskData.params.IM_CHAT_ID,
						IM_MESSAGE_ID: taskData.params.IM_MESSAGE_ID,
					},
					closeAfterSave: true,
				});
			})
				.catch((error) => Logger.log(`${this.constructor.name}.onClickActionTask.closePromise.catch:`, error));
		}

		/**
		 * @return {Promise}
		 */
		getPrepareDataFromRest()
		{
			return new Promise((resolve, reject) => {
				BX.rest.callMethod(RestMethod.imChatTaskPrepare, { MESSAGE_ID: this.messageData.id })
					.then((result) => {
						Logger.log(`${this.constructor.name}.getPrepareDataFromRest result`, result.data());
						resolve(result.data());
					})
					.catch((result) => {
						Logger.error(`${this.constructor.name}.getPrepareDataFromRest catch:`, result.error());
						reject(result.error());
					});
			});
		}
	}

	module.exports = {
		MessageCreateMenu,
	};
});
