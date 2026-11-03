/**
 * @module mail/message-grid/navigation/src/more-menu
 */

jn.define('mail/message-grid/navigation/src/more-menu', (require, exports, module) => {
	const { BaseListMoreMenu } = require('layout/ui/list/base-more-menu');
	const { Icon: AssetIcon } = require('assets/icons');
	const { Icon } = require('ui-system/blocks/icon');
	const { showErrorToast } = require('toast/error');
	const { Loc } = require('loc');
	const { PerfPoint } = require('debug/prism');
	const { requireLazy } = require('require-lazy');

	const { selectIsMultiSelectMode } = require('mail/statemanager/redux/slices/messages/selector');
	const { selectCurrentMailbox } = require('mail/statemanager/redux/slices/mailboxes/selector');
	const { setMultiSelectMode } = require('mail/statemanager/redux/slices/messages');
	const { AjaxMethod } = require('mail/const');
	const {
		applyGroupingSetting,
		CONVERSATION_ONBOARDING_TEST_ID,
		ConversationGroupingSetting,
		ConversationOnboarding,
		conversationOnboardingEligibilityCapture,
		conversationSettingsState,
		resolveGroupingMenuItemState,
		resolveGroupingMenuState,
	} = require('mail/message-grid/src/conversation-aha');
	const store = require('statemanager/redux/store');
	const { dispatch } = store;

	let MailboxSettingsDialog = null;
	let MailboxFoldersSettingsDialog = null;
	const SIGNATURES_MENU_BUTTON_ID = 'message-grid-more-menu-button';

	// The grid controller reports the first successful chain expansion here, which wakes the onboarding.
	const CONVERSATION_FIRST_EXPANDED_EVENT = 'mail.conversation:onFirstExpanded';
	// A saved grouping switch is reported back to the controller, which re-reads the list with the
	// conversation state cleared. See message-grid/src/controller.js.
	const CONVERSATION_GROUPING_CHANGED_EVENT = 'mail.conversation:onGroupingChanged';
	const CONVERSATION_GROUPING_MENU_ID = 'conversationGrouping';
	const ONBOARDING_PLATFORM = 'mobile';

	/**
	 * @class MessageGridMoreMenu
	 */
	class MessageGridMoreMenu extends BaseListMoreMenu
	{
		/**
		 * @param props
		 * @param {String} props.selectedSorting
		 * @param {Boolean} props.isASC
		 * @param {Object} props.callbacks
		 */
		constructor(props = {})
		{
			super([], null, props.selectedSorting, props.callbacks);
			this.signaturesAhaScheduled = false;
			this.signaturesOnboarding = null;
			this.signaturesIsNew = false;

			this.isDraftMode = props.isDraftMode ?? (() => false);
			this.onCheckDrafts = props.onCheckDrafts ?? (() => {});

			this.conversationOnboarding = null;
			this.handleFirstConversationExpanded = () => {
				// The onboarding runs once, so its trigger unsubscribes itself before it fires.
				BX.removeCustomEvent(CONVERSATION_FIRST_EXPANDED_EVENT, this.handleFirstConversationExpanded);
				this.showConversationOnboarding();
			};
			BX.addCustomEvent(CONVERSATION_FIRST_EXPANDED_EVENT, this.handleFirstConversationExpanded);
		}

		/**
		 * @public
		 */
		destroy()
		{
			// The event is broadcast, so without this the onboarding could still fire after the grid is
			// gone and anchor to a button that no longer exists.
			BX.removeCustomEvent(CONVERSATION_FIRST_EXPANDED_EVENT, this.handleFirstConversationExpanded);
		}

		/**
		 * @public
		 * @returns {{type: string, id: string, testId: string, callback: ((function(): void)|*)}}
		 */
		getMenuButton()
		{
			this.scheduleSignaturesAhaMoment();

			return {
				type: 'more',
				id: SIGNATURES_MENU_BUTTON_ID,
				testId: SIGNATURES_MENU_BUTTON_ID,
				callback: this.openMoreMenu,
			};
		}

		/**
		 * @private
		 * @returns {Boolean}
		 */
		isSignaturesAvailable()
		{
			return selectCurrentMailbox(store.getState())?.signaturesAvailable === true;
		}

		scheduleSignaturesAhaMoment()
		{
			// Not latched while unavailable: the mailbox slice may still be empty, and the getter
			// runs again on every header render. Showing the aha moment would burn its first-time
			// flag in Tourist for good, so a portal with the flag off must never reach it.
			if (this.signaturesAhaScheduled || !this.isSignaturesAvailable())
			{
				return;
			}

			this.signaturesAhaScheduled = true;
			requireLazy('mail:signatures/aha', false)
				.then((onboarding = {}) => {
					this.signaturesOnboarding = onboarding;
					this.signaturesIsNew = onboarding.isSignaturesOpenedFirstTime?.() ?? false;

					return onboarding.showSignaturesAhaMoment?.({
						targetRef: SIGNATURES_MENU_BUTTON_ID,
						onClick: this.openMoreMenu,
					});
				})
				.catch((error) => console.error('MessageGridMoreMenu.scheduleSignaturesAhaMoment:', error))
			;
		}

		/**
		 * @private
		 * @returns {Array}
		 */
		getMenuItems()
		{
			const menuItems = [
				this.createMenuItem({
					id: 'checkItems',
					title: Loc.getMessage('MAILMOBILE_MESSAGE_GRID_MORE_MENU_CHECK'),
					checked: false,
					icon: Icon.CIRCLE_CHECK,
					showCheckedIcon: false,
				}),
			];

			if (this.isDraftMode())
			{
				return menuItems;
			}

			const groupingState = resolveGroupingMenuState(conversationSettingsState.get());
			if (groupingState.visible)
			{
				const menuItemState = resolveGroupingMenuItemState(conversationSettingsState.get());
				menuItems.push(this.createMenuItem({
					id: CONVERSATION_GROUPING_MENU_ID,
					testId: 'message-grid-more-menu-conversation-grouping',
					title: Loc.getMessage('MAILMOBILE_MESSAGE_GRID_MORE_MENU_GROUP_CONVERSATIONS'),
					checked: menuItemState.checked,
					icon: Icon.CHATS,
					showCheckedIcon: menuItemState.showCheckedIcon,
				}));
			}

			const currentMailbox = selectCurrentMailbox(store.getState());

			if (currentMailbox?.canEditSettings)
			{
				menuItems.push(this.createMenuItem({
					id: 'mailboxSettings',
					title: Loc.getMessage('MAILMOBILE_MESSAGE_GRID_MORE_MENU_MAILBOX_SETTINGS'),
					checked: false,
					icon: Icon.SETTINGS,
					showCheckedIcon: false,
				}));

				menuItems.push(this.createMenuItem({
					id: 'mailboxFoldersSettings',
					title: Loc.getMessage('MAILMOBILE_MESSAGE_GRID_MORE_MENU_MAILBOX_FOLDERS_SETTINGS'),
					checked: false,
					icon: AssetIcon.FOLDER,
					showCheckedIcon: false,
				}));
			}

			if (!this.isSignaturesAvailable())
			{
				return menuItems;
			}

			const signaturesItem = this.createMenuItem({
				id: 'signatures',
				testId: 'message-grid-more-menu-signatures',
				title: Loc.getMessage('MAILMOBILE_MESSAGE_GRID_MORE_MENU_SIGNATURES'),
				checked: false,
				icon: AssetIcon.SIGN,
				showCheckedIcon: false,
			});
			if (this.signaturesIsNew)
			{
				signaturesItem.titleBadgeValue = Loc.getMessage('MAILMOBILE_MESSAGE_GRID_MORE_MENU_NEW_BADGE');
			}

			menuItems.push(signaturesItem);

			return menuItems;
		}

		/**
		 * @private
		 * @param event
		 * @param item
		 */
		onMenuItemSelected(event, item)
		{
			const realItemId = String(item.id).split('::')[0];

			if (realItemId === 'checkItems')
			{
				this.checkItems();
			}

			if (realItemId === CONVERSATION_GROUPING_MENU_ID)
			{
				this.toggleConversationGrouping();
			}

			if (realItemId === 'mailboxSettings')
			{
				this.openMailboxSettings();
			}

			if (realItemId === 'mailboxFoldersSettings')
			{
				this.openMailboxFoldersSettings();
			}

			if (realItemId === 'signatures')
			{
				this.openSignatures();
			}
		}

		checkItems()
		{
			if (this.isDraftMode())
			{
				this.onCheckDrafts();

				return;
			}

			const currentState = store.getState();
			const isMultiSelectMode = selectIsMultiSelectMode(currentState);

			dispatch(setMultiSelectMode({ isMultiSelectMode: !isMultiSelectMode }));
		}

		/**
		 * Saves the shared grouping setting over API-04 and, on success, asks the grid to re-read the
		 * list with the conversation state cleared. A failed save keeps the previous value and surfaces
		 * an error, so the switch shows the same state on the next open.
		 */
		toggleConversationGrouping()
		{
			const { enabled } = resolveGroupingMenuState(conversationSettingsState.get());

			const setting = new ConversationGroupingSetting({
				persist: (nextEnabled) => this.#persistConversationGrouping(nextEnabled),
				onCommitted: (enabled) => {
					conversationSettingsState.set(applyGroupingSetting(conversationSettingsState.get(), enabled));
					BX.postComponentEvent(CONVERSATION_GROUPING_CHANGED_EVENT, [{ enabled }]);
				},
				onReverted: () => showErrorToast({
					message: Loc.getMessage('MAILMOBILE_MESSAGE_GRID_CONVERSATION_SETTING_ERROR'),
				}),
			});

			void setting.toggle(enabled);
		}

		async #persistConversationGrouping(nextEnabled)
		{
			const label = nextEnabled ? 'enable' : 'disable';
			const perfPoint = new PerfPoint('Mail Conversation Grouping Setting', label).start();

			try
			{
				const response = await BX.ajax.runAction(
					AjaxMethod.setConversationSettings,
					{ data: { enabled: nextEnabled } },
				);
				const errors = response?.errors;

				return !(Array.isArray(errors) && errors.length > 0);
			}
			finally
			{
				perfPoint.end();
			}
		}

		showConversationOnboarding()
		{
			this.conversationOnboarding = new ConversationOnboarding({
				loadEligibility: () => this.#loadConversationOnboardingEligibility(),
				showBanner: ({ onAcknowledge }) => this.#showConversationOnboardingBanner(onAcknowledge),
				markSeen: () => this.#markConversationOnboardingSeen(),
			});

			void this.conversationOnboarding.notifyExpanded();
		}

		#loadConversationOnboardingEligibility()
		{
			return conversationOnboardingEligibilityCapture.loadConfirmed(
				() => BX.ajax
					.runAction(AjaxMethod.getConversationSettings, { data: { platform: ONBOARDING_PLATFORM } })
					.then((response) => response?.data ?? {}),
			);
		}

		#showConversationOnboardingBanner(onAcknowledge)
		{
			return requireLazy('ui-system/popups/aha-moment', false)
				.then(({ AhaMoment, ButtonType }) => AhaMoment.show({
					testId: CONVERSATION_ONBOARDING_TEST_ID,
					targetRef: SIGNATURES_MENU_BUTTON_ID,
					title: Loc.getMessage('MAILMOBILE_MESSAGE_GRID_CONVERSATION_ONBOARDING_TITLE'),
					description: Loc.getMessage('MAILMOBILE_MESSAGE_GRID_CONVERSATION_ONBOARDING_DESCRIPTION'),
					buttonText: Loc.getMessage('MAILMOBILE_MESSAGE_GRID_CONVERSATION_ONBOARDING_ACTION'),
					bottomButtonType: ButtonType.GO_TO_FEATURE,
					disableHideByOutsideClick: false,
					delay: 500,
					onClick: () => {
						onAcknowledge();
						this.openMoreMenu();
					},
					onClose: onAcknowledge,
				}))
			;
		}

		#markConversationOnboardingSeen()
		{
			void BX.ajax.runAction(
				AjaxMethod.markConversationOnboarding,
				{ data: { platform: ONBOARDING_PLATFORM } },
			);
		}

		openMailboxSettings()
		{
			if (!MailboxSettingsDialog)
			{
				({ MailboxSettingsDialog } = require('mail/mailbox/settings'));
			}

			const currentMailbox = selectCurrentMailbox(store.getState());
			if (!currentMailbox?.id || !currentMailbox.canEditSettings)
			{
				return;
			}

			MailboxSettingsDialog.open({
				mailboxId: currentMailbox.id,
				titleText: Loc.getMessage('MAILMOBILE_MESSAGE_GRID_MORE_MENU_MAILBOX_SETTINGS'),
			});
		}

		openMailboxFoldersSettings()
		{
			if (!MailboxFoldersSettingsDialog)
			{
				({ MailboxFoldersSettingsDialog } = require('mail/mailbox/folders-settings'));
			}

			const currentMailbox = selectCurrentMailbox(store.getState());
			if (!currentMailbox?.id || !currentMailbox.canEditSettings)
			{
				return;
			}

			MailboxFoldersSettingsDialog.open({
				mailboxId: currentMailbox.id,
				titleText: Loc.getMessage('MAILMOBILE_MESSAGE_GRID_MORE_MENU_MAILBOX_FOLDERS_SETTINGS'),
			});
		}

		async openSignatures()
		{
			if (!this.isSignaturesAvailable())
			{
				return;
			}

			const perfPoint = new PerfPoint('Mail Signatures Manage', 'openSignatures').start();
			perfPoint.startPoint('Load Signatures Extension');
			let signaturesExtension;
			try
			{
				signaturesExtension = await requireLazy('mail:signatures', false) ?? {};
			}
			catch
			{
				signaturesExtension = {};
			}
			finally
			{
				perfPoint.endPoint('Load Signatures Extension');
			}

			const { SignatureNavigator } = signaturesExtension;
			if (!SignatureNavigator)
			{
				perfPoint.end();

				return;
			}

			perfPoint.startPoint('Load Signature Context');
			try
			{
				SignatureNavigator.open({
					perfPoint,
					onOpened: () => this.signaturesOnboarding?.rememberSignaturesOpened?.(),
				});
			}
			catch (error)
			{
				perfPoint.endPoint('Load Signature Context');
				perfPoint.end();

				throw error;
			}
		}
	}

	module.exports = { MessageGridMoreMenu };
});
