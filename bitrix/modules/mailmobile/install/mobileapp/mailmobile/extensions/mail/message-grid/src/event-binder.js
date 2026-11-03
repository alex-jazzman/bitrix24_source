/**
 * @module mail/message-grid/src/event-binder
 */
jn.define('mail/message-grid/src/event-binder', (require, exports, module) => {
	const { observeMailboxesChange } = require('mail/statemanager/redux/slices/mailboxes/observers/stateful-list');
	const { observeFoldersChange } = require('mail/statemanager/redux/slices/folders/observers/stateful-list');
	const { observeListChange } = require('mail/statemanager/redux/slices/messages/observers/stateful-list');
	const { observeLabelsChange } = require('mail/statemanager/redux/slices/labels/observers/stateful-list');
	const store = require('statemanager/redux/store');

	class MessageGridEventBinder
	{
		constructor(props)
		{
			this.onMailboxStructureChanged = props.onMailboxStructureChanged;
			this.onVisibleMailboxesChange = props.onVisibleMailboxesChange;
			this.onVisibleFoldersChange = props.onVisibleFoldersChange;
			this.onLabelsChange = props.onLabelsChange;
			this.onVisibleMailsChange = props.onVisibleMailsChange;
			this.onOpenFolderMenu = props.onOpenFolderMenu;
			this.onTabsSelected = props.onTabsSelected;
			this.onPullCallback = props.onPullCallback;
			this.onLabelCountersUpdated = props.onLabelCountersUpdated;
			this.onBindingSent = props.onBindingSent;
			this.onFeedPostBound = props.onFeedPostBound;
			this.onViewHidden = props.onViewHidden;
			this.parentWidget = props.parentWidget;

			this.customEventSubscriptions = [];
			this.unsubscribeCallbacks = [];
			this.unsubscribeReduxCallbacks = [];
			this.unsubscribeMessageObserver = null;
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
			this.unsubscribeReduxCallbacks.forEach((unsubscribe) => unsubscribe?.());
			this.unsubscribeReduxCallbacks = [];
			this.unsubscribeMessageObserver?.();
			this.unsubscribeMessageObserver = null;

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
			this.#subscribeCustomEvent('Mail.Binding::feedPostBound', this.onFeedPostBound);
			this.#subscribeCustomEvent('onTabsSelected', this.onTabsSelected);
		}

		#bindObservers()
		{
			if (this.unsubscribeReduxCallbacks.length > 0)
			{
				return;
			}

			this.unsubscribeReduxCallbacks.push(
				observeMailboxesChange(store, this.onVisibleMailboxesChange),
				observeFoldersChange(store, this.onVisibleFoldersChange),
				// A switch between two labels keeps the virtual key as it is, so the folders observer
				// reports nothing and the list would stay on the previous label.
				observeLabelsChange(store, this.onLabelsChange),
			);
			this.setMessageObserverEnabled(true);
		}

		setReduxObserversEnabled(enabled)
		{
			if (enabled)
			{
				this.#bindObservers();

				return;
			}

			this.unsubscribeReduxCallbacks.forEach((unsubscribe) => unsubscribe?.());
			this.unsubscribeReduxCallbacks = [];
			this.setMessageObserverEnabled(false);
		}

		setMessageObserverEnabled(enabled)
		{
			if (enabled && !this.unsubscribeMessageObserver)
			{
				this.unsubscribeMessageObserver = observeListChange(store, this.onVisibleMailsChange);

				return;
			}

			if (!enabled && this.unsubscribeMessageObserver)
			{
				this.unsubscribeMessageObserver();
				this.unsubscribeMessageObserver = null;
			}
		}

		#bindPull()
		{
			this.unsubscribeCallbacks.push(BX.PULL.subscribe({
				callback: this.onPullCallback,
				command: 'task_add',
				moduleId: 'tasks',
			}));

			// The module mail recalculates the unread counters of labels on every read status change
			// and sends them here, as it does for the web menu of labels: a local delta covers only
			// what this client has just done itself.
			this.unsubscribeCallbacks.push(BX.PULL.subscribe({
				callback: this.onLabelCountersUpdated,
				command: 'labelCountersUpdated',
				moduleId: 'mail',
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
