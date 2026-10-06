/**
 * @module im/messenger/controller/chat-invite/controller
 */
jn.define('im/messenger/controller/chat-invite/controller', (require, exports, module) => {
	const { Loc } = require('loc');
	const { getLoggerWithContext } = require('im/messenger/lib/logger');
	const { EventType } = require('im/messenger/const');

	const { TabType } = require('im/messenger/controller/chat-invite/const');
	const { GuestsTabController } = require('im/messenger/controller/chat-invite/tabs/guests/controller');
	const { EmployeesTabController } = require('im/messenger/controller/chat-invite/tabs/employees/controller');

	/**
	 * @class ChatInviteController
	 */
	class ChatInviteController
	{
		/**
		 * @param {ChatInviteProps} props
		 */
		static open(props)
		{
			void new ChatInviteController(props).open();
		}

		/**
		 * @param {ChatInviteProps} props
		 */
		constructor(props)
		{
			this.props = props;
			this.tabsWidget = null;
			this.guestsTabController = null;
			this.employeesTabController = null;
			this.logger = getLoggerWithContext('chat-invite--controller', this);
		}

		/**
		 * @param {LayoutWidget} tabsWidget
		 */
		#tabsWidgetReady = (tabsWidget) => {
			this.tabsWidget = tabsWidget;

			this.tabsWidget.on(EventType.navigation.onTabSelected, this.#onTabSelected);
			this.tabsWidget.on(EventType.view.close, this.#onWidgetClose);

			const widgets = this.tabsWidget.nestedWidgets();
			this.#initEmployeesTab(widgets.employees);
		};

		/**
		 * @param {ChatInviteTab} tab
		 */
		#onTabSelected = (tab) => {
			const widgets = this.tabsWidget.nestedWidgets();

			if (tab?.id === TabType.EMPLOYEES)
			{
				// Native tabs widget tears down the nested selector on tab deactivation,
				// so its search input stops emitting events after switching away.
				// Re-open the selector on every activation to restore the bridge.
				this.#initEmployeesTab(widgets.employees);
			}
			else if (tab?.id === TabType.GUESTS)
			{
				// Lazy-mount the Guests tab on first selection — the common employee-only
				// flow never opens it. #initGuestsTab is idempotent (guarded).
				this.#initGuestsTab(widgets.guests);
			}
		};

		/**
		 * @param {LayoutWidget} layout
		 */
		#initGuestsTab(layout)
		{
			if (!layout || this.guestsTabController)
			{
				return;
			}

			const { dialogId, store } = this.props;

			this.guestsTabController = new GuestsTabController({
				parentLayout: this.props.parentLayout,
				layout,
				boxLayout: this.tabsWidget,
				dialogId,
				store,
			});

			layout.showComponent(this.guestsTabController.createView());
		}

		/**
		 * @param {LayoutWidget} layout
		 */
		#initEmployeesTab(layout)
		{
			if (!layout)
			{
				return;
			}

			if (!this.employeesTabController)
			{
				this.employeesTabController = new EmployeesTabController({
					dialogId: this.props.dialogId,
					store: this.props.store,
					onCloseWidget: this.#close,
				});
			}

			this.employeesTabController.init(layout);
		}

		/**
		 * @desc Closes the outer tabs widget and releases nested selectors.
		 */
		#close = () => {
			this.employeesTabController?.close?.();
			this.tabsWidget?.close?.();
		};

		/**
		 * @desc Drops widget listeners on close — both programmatic (#close → close()) and manual (swipe).
		 */
		#onWidgetClose = () => {
			this.tabsWidget?.off?.(EventType.navigation.onTabSelected, this.#onTabSelected);
			this.tabsWidget?.off?.(EventType.view.close, this.#onWidgetClose);
		};

		/**
		 * @return {ChatInviteTabsData}
		 */
		#getTabsData()
		{
			const employeesTab = {
				id: TabType.EMPLOYEES,
				title: Loc.getMessage('IMMOBILE_CHAT_INVITE_TAB_EMPLOYEES_TITLE'),
				active: true,
				widget: {
					name: 'selector',
					code: TabType.EMPLOYEES,
					settings: {
						objectName: 'selector',
						sendButtonName: Loc.getMessage('IMMOBILE_CHAT_INVITE_SELECTOR_SEND_BUTTON_TEXT'),
					},
				},
			};

			const guestsTab = {
				id: TabType.GUESTS,
				title: Loc.getMessage('IMMOBILE_CHAT_INVITE_TAB_GUESTS_TITLE'),
				active: false,
				widget: {
					name: 'layout',
					code: TabType.GUESTS,
				},
			};

			return {
				items: [employeesTab, guestsTab],
			};
		}

		/**
		 * @desc Opens the invite tabs widget.
		 */
		open()
		{
			const widgetParams = {
				titleParams: {
					text: Loc.getMessage('IMMOBILE_CHAT_INVITE_TITLE'),
					type: 'dialog',
				},
				grabTitle: false,
				grabButtons: false,
				grabSearch: false,
				backdrop: {
					swipeContentAllowed: false,
					horizontalSwipeAllowed: false,
					mediumPositionHeight: 620,
				},
				type: 'segments',
				tabs: this.#getTabsData(),
			};

			const parentLayout = this.props.parentLayout ?? PageManager;
			parentLayout.openWidget('tabs', widgetParams)
				.then(this.#tabsWidgetReady)
				.catch((error) => this.logger.error('openWidget error', error));
		}
	}

	module.exports = { ChatInviteController };
});
