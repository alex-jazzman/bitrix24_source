/**
 * @module mail/message-grid/src/event-binder
 */
jn.define('mail/message-grid/src/event-binder', (require, exports, module) => {
	const { observeMailboxesChange } = require('mail/statemanager/redux/slices/mailboxes/observers/stateful-list');
	const { observeFoldersChange } = require('mail/statemanager/redux/slices/folders/observers/stateful-list');
	const { observeListChange } = require('mail/statemanager/redux/slices/messages/observers/stateful-list');
	const store = require('statemanager/redux/store');

	class MessageGridEventBinder
	{
		constructor(props)
		{
			this.onMailboxStructureChanged = props.onMailboxStructureChanged;
			this.onVisibleMailboxesChange = props.onVisibleMailboxesChange;
			this.onVisibleFoldersChange = props.onVisibleFoldersChange;
			this.onVisibleMailsChange = props.onVisibleMailsChange;
			this.onOpenFolderMenu = props.onOpenFolderMenu;
			this.onTabsSelected = props.onTabsSelected;
			this.onPullCallback = props.onPullCallback;
			this.onBindingSent = props.onBindingSent;
			this.onViewHidden = props.onViewHidden;
			this.parentWidget = props.parentWidget;

			this.customEventSubscriptions = [];
			this.unsubscribeCallbacks = [];
			this.widgetSubscriptions = [];
			this.isBound = false;
		}

		bind()
		{
			if (this.isBound)
			{
				return;
			}

			this.isBound = true;

			this.#bindWidgetEvents();
			this.#bindCustomEvents();
			this.#bindObservers();
			this.#bindPull();
		}

		unbind()
		{
			if (!this.isBound)
			{
				return;
			}

			this.customEventSubscriptions.forEach(({ eventName, handler }) => BX.removeCustomEvent(eventName, handler));
			this.customEventSubscriptions = [];

			this.widgetSubscriptions.forEach(({ eventName, handler }) => this.parentWidget.off(eventName, handler));
			this.widgetSubscriptions = [];

			this.unsubscribeCallbacks.forEach((unsubscribe) => unsubscribe?.());
			this.unsubscribeCallbacks = [];

			this.isBound = false;
		}

		#bindWidgetEvents()
		{
			this.#subscribeWidgetEvent('titleClick', this.onOpenFolderMenu);
			this.#subscribeWidgetEvent('removed', this.onViewHidden);
			this.#subscribeWidgetEvent('hidden', this.onViewHidden);
		}

		#bindCustomEvents()
		{
			this.#subscribeCustomEvent('Mail.Mailbox::significantChangesInStructure', this.onMailboxStructureChanged);
			this.#subscribeCustomEvent('Mail.Binding::bindingSent', this.onBindingSent);
			this.#subscribeCustomEvent('onTabsSelected', this.onTabsSelected);
		}

		#bindObservers()
		{
			this.unsubscribeCallbacks.push(
				observeMailboxesChange(store, this.onVisibleMailboxesChange),
				observeFoldersChange(store, this.onVisibleFoldersChange),
				observeListChange(store, this.onVisibleMailsChange),
			);
		}

		#bindPull()
		{
			this.unsubscribeCallbacks.push(BX.PULL.subscribe({
				callback: this.onPullCallback,
				command: 'task_add',
				moduleId: 'tasks',
			}));
		}

		#subscribeWidgetEvent(eventName, handler)
		{
			this.parentWidget.on(eventName, handler);
			this.widgetSubscriptions.push({ eventName, handler });
		}

		#subscribeCustomEvent(eventName, handler)
		{
			BX.addCustomEvent(eventName, handler);
			this.customEventSubscriptions.push({ eventName, handler });
		}
	}

	module.exports = { MessageGridEventBinder };
});
