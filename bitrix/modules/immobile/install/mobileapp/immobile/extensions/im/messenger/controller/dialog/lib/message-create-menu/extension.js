/**
 * @module im/messenger/controller/dialog/lib/message-create-menu
 */
jn.define('im/messenger/controller/dialog/lib/message-create-menu', (require, exports, module) => {
	const { Loc } = require('loc');
	const { isModuleInstalled } = require('module');

	const { ContextMenu } = require('layout/ui/context-menu');
	const { Icon } = require('assets/icons');
	const { Logger } = require('im/messenger/lib/logger');
	const { EntityManager } = require('im/messenger/controller/dialog/lib/entity-manager');
	const { AnalyticsService } = require('im/messenger/provider/services/analytics');

	/**
	 * @class MessageCreateMenu
	 */
	class MessageCreateMenu
	{
		/**
		 * @param {DialogId} dialogId
		 * @param {MessagesModelState} messageData
		 * @param {MessengerCoreStore} store
		 */
		constructor(dialogId, messageData, store)
		{
			this.dialogId = dialogId;
			this.actions = this.constructor.getActions();
			this.actionsData = [];
			this.messageData = messageData;
			this.store = store;
			this.entityManager = new EntityManager(dialogId, store);
		}

		/**
		 * @param {DialogId} dialogId
		 * @param {MessagesModelState} messageData
		 * @param {MessengerCoreStore} store
		 */
		static open(dialogId, messageData, store)
		{
			const instanceClass = new MessageCreateMenu(dialogId, messageData, store);
			instanceClass.show();
		}

		static hasActions()
		{
			return this.getActions().length > 0;
		}

		static getActions()
		{
			const actions = [];

			if (isModuleInstalled('tasks'))
			{
				actions.push({ name: 'task', icon: Icon.TASK });
			}

			if (isModuleInstalled('calendar'))
			{
				actions.push({ name: 'calendar', icon: Icon.CALENDAR_WITH_SLOTS });
			}

			return actions;
		}

		show()
		{
			this.setCloseMenuPromise();
			this.createMenu();
			this.menu.show().catch((err) => Logger.error('MessageCreateMenu.open.catch:', err));

			AnalyticsService.getInstance().sendOpenMessageCreateMenu(this.dialogId);
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
			this.actions.forEach(({ name, icon }) => {
				this.actionsData.push({
					id: name,
					title: Loc.getMessage(`IMMOBILE_DIALOG_MESSAGE_CREATE_MENU_${name.toUpperCase()}`),
					icon,
					onClickCallback: this.getCallbackByAction(name),
					testId: `IMMOBILE_DIALOG_MESSAGE_CREATE_MENU_${name.toUpperCase()}`,
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

		onClickActionCalendar()
		{
			Logger.log(`${this.constructor.name}.onClickActionCalendar`);

			this.closePromise.then(() => {
				void this.entityManager.createMeeting(this.messageData.id);
			})
				.catch((error) => Logger.log(`${this.constructor.name}.onClickActionCalendar.closePromise.catch:`, error));
		}

		onClickActionTask()
		{
			Logger.log(`${this.constructor.name}.onClickActionTask`);

			this.closePromise.then(() => {
				this.entityManager.createTaskFomMessage(this.messageData);
			})
				.catch((error) => Logger.log(`${this.constructor.name}.onClickActionTask.closePromise.catch:`, error));
		}
	}

	module.exports = {
		MessageCreateMenu,
	};
});
