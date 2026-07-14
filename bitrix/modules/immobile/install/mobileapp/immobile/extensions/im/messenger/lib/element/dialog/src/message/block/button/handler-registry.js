/**
 * @module im/messenger/lib/element/dialog/message/block/button/handler-registry
 */
jn.define('im/messenger/lib/element/dialog/message/block/button/handler-registry', (require, exports, module) => {
	const { AnalyticsEvent } = require('analytics');

	const { Loc } = require('im/messenger/loc');
	const { Analytics } = require('im/messenger/const');
	const { openPlanLimitsWidget } = require('im/messenger/lib/plan-limit');
	const { DialogTextHelper } = require('im/messenger/controller/dialog/lib/helper/text');

	/**
	 * Registry of eventButton handlers for block message elements.
	 *
	 * This is a thin entry point — handlers MUST only delegate to the target module.
	 * Do NOT place business logic, UI rendering, or complex flows here.
	 * Each handler should be a short bridge: resolve the target module and call it.
	 *
	 * Only messenger-scoped handlers belong here. External modules (tasks, crm, etc.)
	 * should receive events via their own entry points using requireLazy.
	 *
	 * Key — actionId (prefix with module name, e.g. 'tasks:openTask').
	 * Value — handler(params) called on button tap.
	 *
	 * @typedef {Object} HandlerParams
	 * @property {string} actionId
	 * @property {Object} actionParams - arbitrary params from eventButton.actionParams
	 * @property {string} messageId
	 * @property {ServiceLocator} dialogLocator - access to store, view, dialogId
	 *
	 * Handler can be sync or async. Errors are caught by the caller.
	 * Use requireLazy for cross-module deps to keep the dialog bundle lightweight:
	 * - requireLazy(ext, false) — target screen has its own loading state
	 * - requireLazy(ext, true) — show global loader
	 *
	 * @example
	 * // handler
	 * 'tasks:openTask': async ({ actionParams }) => {
	 *     const { Entry } = await requireLazy('tasks:entry', false);
	 *     Entry.openTask({ taskId: actionParams.taskId });
	 * },
	 *
	 * // REST API
	 * buttons: [[{
	 *     type: 'eventButton',
	 *     title: 'Open task',
	 *     actionId: 'tasks:openTask',
	 *     actionParams: { taskId: 456 },
	 * }]]
	 *
	 * @type {Object<string, function(HandlerParams): void|Promise<void>>}
	 */
	const handlerRegistry = {
		inviteToChat: ({ dialogLocator }) => {
			const { SidebarManager } = require('im/messenger/controller/dialog/lib/sidebar');

			SidebarManager.getInstance(dialogLocator, null).open();
		},
		copyLink: ({ dialogLocator }) => {
			const dialogId = dialogLocator.get('dialogId');
			const dialog = dialogLocator.get('store').getters['dialoguesModel/getById'](dialogId);
			const link = dialog.public.link;

			DialogTextHelper.copyToClipboard(
				link,
				{
					notificationText: Loc.getMessage('IMMOBILE_MESSENGER_DIALOG_COPY_LINK_TEXT'),
					parentWidget: dialogLocator.get('view')?.ui,
				},
			);
		},
		planLimitsUnlock: () => {
			const analytics = new AnalyticsEvent()
				.setSection(Analytics.Section.chatWindow);

			void openPlanLimitsWidget(analytics);
		},
	};

	module.exports = {
		handlerRegistry,
	};
});
