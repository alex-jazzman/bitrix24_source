/**
 * @module im/messenger/controller/selector/forward
 */
jn.define('im/messenger/controller/selector/forward', (require, exports, module) => {
	const { openDialogSelector } = require('im/messenger/controller/selector/dialog/opener');
	const { MessengerEmitter } = require('im/messenger/lib/emitter');
	const { EventType } = require('im/messenger/const');
	const { Loc } = require('im/messenger/loc');
	const { DialogHelper, UserHelper } = require('im/messenger/lib/helper');
	const { Feature } = require('im/messenger/lib/feature');
	const { serviceLocator } = require('im/messenger/lib/di/service-locator');
	const { Notification, ToastType } = require('im/messenger/lib/ui/notification');
	const { AnalyticsService } = require('im/messenger/provider/services/analytics');

	const REPLY_MANAGER_KEY = 'reply-manager';
	const MESSAGE_SENDER_KEY = 'message-sender';
	const MAX_RECIPIENTS = 20;
	const RESULT_FALLBACK_LIFETIME_SECONDS = 8;
	const ForwardSelectionMode = Object.freeze({
		legacyDisabled: 'legacyDisabled',
		multipleIdle: 'multipleIdle',
		legacySingle: 'legacySingle',
		backgroundMultiple: 'backgroundMultiple',
		limitReached: 'limitReached',
	});
	let forwardMessageManagerPromise = null;

	async function showForwardResult({ result, manager })
	{
		try
		{
			const forwardResultExtension = await requireLazy(
				'im:messenger/controller/forward-result',
				false,
			);
			if (!forwardResultExtension?.ForwardResult)
			{
				throw new Error('ForwardResult is unavailable');
			}

			const isAppActive = await manager.waitForAppActive();
			if (!isAppActive)
			{
				manager.release(result.operationId);

				return;
			}

			forwardResultExtension.ForwardResult.show({ result, manager });
		}
		catch
		{
			const isAppActive = await manager.waitForAppActive();
			if (!isAppActive)
			{
				manager.release(result.operationId);

				return;
			}

			let isHandled = false;
			let releaseTimer = null;
			const handleOnce = (handler) => {
				if (isHandled)
				{
					return;
				}

				isHandled = true;
				if (releaseTimer)
				{
					clearTimeout(releaseTimer);
				}
				handler();
			};
			releaseTimer = setTimeout(() => {
				handleOnce(() => manager.release(result.operationId));
			}, RESULT_FALLBACK_LIFETIME_SECONDS * 1000);

			Notification.showErrorToast({
				time: RESULT_FALLBACK_LIFETIME_SECONDS,
				buttonText: Loc.getMessage('IMMOBILE_MESSENGER_UI_NOTIFY_TOAST_BUTTON_GOTO'),
				shouldCloseOnTap: true,
				onButtonTap: () => {
					handleOnce(() => {
						void showForwardResult({ result, manager });
					});
				},
			});
		}
	}

	const getForwardMessageManager = async () => {
		const existingManager = serviceLocator.get('forward-message-manager');
		if (existingManager)
		{
			return existingManager;
		}

		if (!forwardMessageManagerPromise)
		{
			forwardMessageManagerPromise = (async () => {
				const { ForwardMessageManager } = await requireLazy(
					'im:messenger/application/lib/forward-message-manager',
					false,
				);
				const sendingService = serviceLocator.get('sending-service');
				const subscriptionManager = serviceLocator.get('subscription-manager');
				if (!ForwardMessageManager || !sendingService || !subscriptionManager)
				{
					throw new Error('ForwardMessageManager dependencies are unavailable');
				}

				let manager;
				manager = new ForwardMessageManager({
					sendingService,
					onOperationFinished: async (result, { attempt, fromDialogId }) => {
						AnalyticsService.getInstance().forwardAnalytics.sendOperationResult({
							fromDialogId,
							result,
							attempt,
						});

						await showForwardResult({ result, manager });
					},
				});
				serviceLocator.add('forward-message-manager', manager);
				subscriptionManager.register(manager);

				return manager;
			})();
		}

		try
		{
			return await forwardMessageManagerPromise;
		}
		finally
		{
			forwardMessageManagerPromise = null;
		}
	};

	const getForwardSelectionMode = ({ available, isGuest, count }) => {
		if (!available || isGuest)
		{
			return ForwardSelectionMode.legacyDisabled;
		}

		if (count === 0)
		{
			return ForwardSelectionMode.multipleIdle;
		}

		if (count === 1)
		{
			return ForwardSelectionMode.legacySingle;
		}

		return count <= MAX_RECIPIENTS
			? ForwardSelectionMode.backgroundMultiple
			: ForwardSelectionMode.limitReached
		;
	};

	class ForwardSelector
	{
		#selectedRecipientIds = new Set();

		/**
		 * @param {ForwardSelectorInitProps} props
		 */
		constructor(props)
		{
			this.props = props;
		}

		/**
		 * @param {Object} parentWidget
		 * @returns {Promise}
		 */
		async open({ parentWidget })
		{
			// Tabbed forward selector requires lazy-loading additional extensions (tasks,
			// channels, copilot list services) whose REST endpoints aren't whitelisted in
			// the guest scope (`MobileGuestApplication`). Fall back to the simple
			// openDialogSelector for guests — they only have access to one chat anyway.
			const canUseTabbed = !UserHelper.isCurrentUserGuest();
			const openSelector = canUseTabbed
				? await this.#getForwardDialogSelector()
				: openDialogSelector;
			const selectionMode = getForwardSelectionMode({
				available: Feature.isForwardMultipleRecipientsAvailable,
				isGuest: !canUseTabbed,
				count: 0,
			});
			const isMultipleMode = selectionMode !== ForwardSelectionMode.legacyDisabled;

			const providerOptions = {
				withFavorite: true,
				allowMultipleSelection: isMultipleMode,
			};
			// Tabbed provider hardcodes guest filtering internally, so we only need to pass
			// excludeGuests when falling back to the simple openDialogSelector.
			if (!canUseTabbed)
			{
				providerOptions.excludeGuests = true;
			}

			const selectorOptions = {
				title: Loc.getMessage('IMMOBILE_MESSENGER_FORWARD_SELECTOR_TITLE'),
				fromDialogId: this.props.fromDialogId,
				providerOptions,
			};

			if (isMultipleMode)
			{
				Object.assign(selectorOptions, {
					allowMultipleSelection: true,
					closeOnSelect: false,
					sendButtonName: Loc.getMessage('IMMOBILE_MESSENGER_FORWARD_SELECTOR_SEND_BUTTON'),
					onSelectedChanged: this.#onSelectedChanged,
					onClose: this.#onRecipientsSubmitted,
					onWidgetReady: (selector) => {
						this.multipleSelector = selector;
						this.#selectedRecipientIds.clear();
						this.#updateSendButton(0);
					},
				});
			}
			else
			{
				Object.assign(selectorOptions, {
					onItemSelected: this.#onDialogSelected,
					closeOnSelect: this.props.closeOnSelect ?? true,
				});
			}

			return openSelector(selectorOptions, parentWidget);
		}

		/**
		 * @return {Promise<Function>}
		 */
		async #getForwardDialogSelector()
		{
			const { openForwardDialogSelector } = await requireLazy('im:messenger/controller/selector/forward/tabbed', true);

			return openForwardDialogSelector;
		}

		/**
		 * @param {{
		 *     item: { id: string },
		 *     text: string,
		 *     scope: ?{ id: string },
		 *     widgetEntity: EntitySelectorWidget,
		 * }} params
		 */
		#onDialogSelected = async ({ item, text, scope, widgetEntity, trackAnalytics = true }) => {
			const {
				onDialogSelected,
				messageIds,
				fromDialogId,
				locator,
			} = this.props;

			const dialogId = item.id;
			const dialogHelper = DialogHelper.createByDialogId(dialogId);

			// The picker without tabs (old app builds, guests) has neither scopes nor
			// item positions, so the analytics service falls back to the legacy source.
			if (trackAnalytics)
			{
				this.#sendSelectRecipientAnalytics({ item, text, scope, widgetEntity });
			}

			if (onDialogSelected)
			{
				await onDialogSelected();
			}

			if (dialogHelper.isNotes && String(dialogId) !== String(fromDialogId))
			{
				const replyManager = locator.get(REPLY_MANAGER_KEY);

				replyManager.startForwardingMessages(messageIds, false);
				await locator.get(MESSAGE_SENDER_KEY).sendForwardMessageToNotes(dialogId);
				replyManager.finishForwardingMessage(false);

				const toastType = messageIds.length > 1 ? ToastType.forwardMessages : ToastType.forwardMessage;
				Notification.showToast(toastType, null, {
					onButtonTap() {
						MessengerEmitter.emit(EventType.messenger.openDialog, { dialogId });
					},
				});

				return;
			}

			if (String(dialogId) === String(fromDialogId) && locator)
			{
				locator.get(REPLY_MANAGER_KEY).startForwardingMessages(messageIds);

				return;
			}

			const openDialogParams = {
				dialogId,
				forwardMessageIds: messageIds,
			};

			MessengerEmitter.emit(EventType.messenger.openDialog, openDialogParams, 'im.messenger');
		};

		#onSelectedChanged = (selectedItems) => {
			const selected = selectedItems.slice(0, MAX_RECIPIENTS);
			if (selectedItems.length > MAX_RECIPIENTS)
			{
				const selectedRows = (this.multipleSelector?.getCurrentSelectedItems() ?? []).slice(0, MAX_RECIPIENTS);
				this.multipleSelector?.setSelected(selectedRows);
				this.multipleSelector?.getWidget()?.setSelected(selectedRows);
				Notification.showToastWithParams({
					message: Loc.getMessage('IMMOBILE_MESSENGER_FORWARD_SELECTOR_RECIPIENT_LIMIT'),
				});
			}

			const previousIds = this.#selectedRecipientIds;
			this.#selectedRecipientIds = new Set(selected.map(({ id }) => String(id)));
			selected.forEach((item) => {
				if (!previousIds.has(String(item.id)))
				{
					this.#sendSelectRecipientAnalytics({
						item,
						text: this.multipleSelector?.queryText,
						scope: { id: this.multipleSelector?.getProvider()?.getActiveTab?.() },
						widgetEntity: this.multipleSelector,
					});
				}
			});

			this.#updateSendButton(selected.length);
		};

		#onRecipientsSubmitted = async (selectedItems = []) => {
			if (selectedItems.length === 0)
			{
				return;
			}

			if (selectedItems.length === 1)
			{
				await this.#onDialogSelected({ item: selectedItems[0], trackAnalytics: false });

				return;
			}

			if (this.props.onDialogSelected)
			{
				await this.props.onDialogSelected();
			}

			const recipients = selectedItems.slice(0, MAX_RECIPIENTS).map((item) => Object.freeze({
				id: item.id,
				title: item.title,
				imageUrl: item.imageUrl,
			}));

			try
			{
				const forwardMessageManager = await getForwardMessageManager();
				forwardMessageManager.start({
					fromDialogId: this.props.fromDialogId,
					messageIds: Object.freeze([...this.props.messageIds]),
					recipients: Object.freeze(recipients),
				});
			}
			catch (error)
			{
				Notification.showErrorToast();
			}
		};

		#updateSendButton(selectedCount)
		{
			const widget = this.multipleSelector?.getWidget();
			widget?.setSendButtonVisible?.(true);
			widget?.setSendButtonCounter?.(selectedCount);
			widget?.setSendButtonEnabled?.(selectedCount > 0);
		}

		#sendSelectRecipientAnalytics({ item, text, scope, widgetEntity })
		{
			AnalyticsService.getInstance().forwardAnalytics.sendSelectRecipient({
				fromDialogId: this.props.fromDialogId,
				recipientDialogId: item.id,
				tab: scope?.id,
				isSearchResult: Boolean(text) && text.trim().length > 0,
				position: widgetEntity?.getProvider()?.getItemPosition?.(item.id) ?? 0,
			});
		}
	}

	module.exports = {
		ForwardSelector,
		ForwardSelectionMode,
		getForwardSelectionMode,
		getForwardMessageManager,
	};
});
