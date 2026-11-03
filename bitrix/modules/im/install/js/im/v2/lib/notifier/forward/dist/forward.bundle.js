/* eslint-disable */
this.BX = this.BX || {};
this.BX.Messenger = this.BX.Messenger || {};
this.BX.Messenger.v2 = this.BX.Messenger.v2 || {};
this.BX.Messenger.v2.Lib = this.BX.Messenger.v2.Lib || {};
(function (exports, ui_notification, main_core, ui_a11y) {
	'use strict';

	const AUTO_HIDE_DELAY = 8000;
	const attachedInteractionPause = new WeakSet();
	const getReasonText = reason => {
		const phraseByReason = {
			transientUnknown: 'IM_NOTIFIER_MESSAGE_FORWARD_REASON_TRANSIENT',
			storage: 'IM_NOTIFIER_MESSAGE_FORWARD_REASON_STORAGE',
			fileUnavailable: 'IM_NOTIFIER_MESSAGE_FORWARD_REASON_FILE_UNAVAILABLE',
			chatUnavailable: 'IM_NOTIFIER_MESSAGE_FORWARD_REASON_CHAT_UNAVAILABLE',
			notWritable: 'IM_NOTIFIER_MESSAGE_FORWARD_REASON_NOT_WRITABLE'
		};
		return main_core.Loc.getMessage(phraseByReason[reason] ?? phraseByReason.transientUnknown);
	};
	const createElement = (tagName, className, text) => {
		const element = document.createElement(tagName);
		if (className) {
			element.className = className;
		}
		if (text) {
			element.textContent = text;
		}
		return element;
	};
	const getSummary = result => {
		const phrase = result.successfulRecipients === result.totalRecipients ? 'IM_NOTIFIER_MESSAGE_FORWARD_RECIPIENTS_COMPLETE' : 'IM_NOTIFIER_MESSAGE_FORWARD_RECIPIENTS_PARTIAL';
		return main_core.Loc.getMessage(phrase, {
			'#SUCCESS_COUNT#': result.successfulRecipients,
			'#COUNT#': result.totalRecipients
		});
	};
	const attachInteractionPause = balloon => {
		const container = balloon.getContainer();
		if (attachedInteractionPause.has(container)) {
			return;
		}
		attachedInteractionPause.add(container);
		let isPointerInside = false;
		let isFocusInside = container.contains(document.activeElement);
		const updateAutoHide = () => {
			if (isPointerInside || isFocusInside) {
				balloon.deactivateAutoHide();
				return;
			}
			balloon.activateAutoHide();
		};
		main_core.Event.bind(container, 'mouseenter', () => {
			isPointerInside = true;
			updateAutoHide();
		});
		main_core.Event.bind(container, 'mouseleave', () => {
			isPointerInside = false;
			updateAutoHide();
		});
		main_core.Event.bind(container, 'focusin', () => {
			isFocusInside = true;
			updateAutoHide();
		});
		main_core.Event.bind(container, 'focusout', event => {
			isFocusInside = container.contains(event.relatedTarget);
			updateAutoHide();
		});
	};
	const showProgress = content => {
		content.setAttribute('data-testid', 'im-forward-result-progress');
		content.setAttribute('aria-busy', 'true');
		const summary = content.querySelector('.bx-im-notifier-forward-result__summary');
		if (summary) {
			summary.textContent = main_core.Loc.getMessage('IM_NOTIFIER_MESSAGE_FORWARD_RETRY_PROGRESS');
		}
		content.querySelectorAll('button').forEach(button => {
			const actionButton = button;
			actionButton.disabled = true;
		});
	};
	const renderFailureDetails = (content, operationId, result, failedRecipients) => {
		const reasons = new Set(failedRecipients.map(({
			displayReason
		}) => displayReason));
		const isCommonTotalFailure = result.successfulRecipients === 0 && reasons.size === 1;
		if (isCommonTotalFailure) {
			content.append(createElement('p', 'bx-im-notifier-forward-result__reason', getReasonText(failedRecipients[0].displayReason)));
		} else {
			const detailsId = `im-forward-operation-${operationId}-details`;
			const list = createElement('ul', 'bx-im-notifier-forward-result__list');
			list.id = detailsId;
			list.hidden = true;
			failedRecipients.forEach(recipient => {
				const item = createElement('li', 'bx-im-notifier-forward-result__item');
				const title = createElement('span', 'bx-im-notifier-forward-result__recipient', recipient.dialogTitle);
				const reason = createElement('span', 'bx-im-notifier-forward-result__recipient-reason');
				reason.textContent = ` - ${getReasonText(recipient.displayReason)}`;
				item.append(title, reason);
				list.append(item);
			});
			const detailsButton = createElement('button', 'bx-im-notifier-forward-result__button', main_core.Loc.getMessage('IM_NOTIFIER_MESSAGE_FORWARD_DETAILS'));
			detailsButton.setAttribute('type', 'button');
			detailsButton.setAttribute('data-testid', 'im-forward-result-details');
			detailsButton.setAttribute('aria-expanded', 'false');
			detailsButton.setAttribute('aria-controls', detailsId);
			main_core.Event.bind(detailsButton, 'click', () => {
				const expanded = detailsButton.getAttribute('aria-expanded') === 'true';
				detailsButton.setAttribute('aria-expanded', String(!expanded));
				list.hidden = expanded;
			});
			const actions = createElement('div', 'bx-im-notifier-forward-result__actions');
			actions.append(detailsButton);
			content.append(list, actions);
		}
	};
	const getActionsContainer = content => {
		const foundActions = content.querySelector('.bx-im-notifier-forward-result__actions');
		if (foundActions instanceof HTMLElement) {
			return foundActions;
		}
		const actions = createElement('div', 'bx-im-notifier-forward-result__actions');
		content.append(actions);
		return actions;
	};
	const retryDelivery = async (content, params) => {
		const {
			operationId,
			retry
		} = params;
		const shouldRestoreFocus = content.contains(document.activeElement);
		if (shouldRestoreFocus) {
			content.focus();
		}
		showProgress(content);
		ui_a11y.LiveAnnouncer.announce(main_core.Loc.getMessage('IM_NOTIFIER_MESSAGE_FORWARD_RETRY_PROGRESS'), 'polite');
		const nextResult = await retry();
		const nextParams = {
			operationId,
			result: nextResult,
			retry: nextResult.hasRetryableDeliveries ? retry : undefined
		};
		renderResultContent(content, nextParams);
		ui_a11y.LiveAnnouncer.announce(getSummary(nextResult), 'polite');
		if (shouldRestoreFocus) {
			const nextAction = content.querySelector('button:not(:disabled)');
			if (nextAction instanceof HTMLElement) {
				nextAction.focus();
			} else {
				content.focus();
			}
		}
	};
	const renderRetryAction = (content, params) => {
		const retryButton = createElement('button', 'bx-im-notifier-forward-result__button', main_core.Loc.getMessage('IM_NOTIFIER_MESSAGE_FORWARD_RETRY'));
		retryButton.setAttribute('type', 'button');
		retryButton.setAttribute('data-testid', 'im-forward-result-retry');
		main_core.Event.bind(retryButton, 'click', () => {
			void retryDelivery(content, params);
		});
		getActionsContainer(content).append(retryButton);
	};
	const renderResultContent = (content, params) => {
		main_core.Dom.clean(content);
		content.setAttribute('data-testid', 'im-forward-result');
		content.removeAttribute('aria-busy');
		const {
			operationId,
			result,
			retry
		} = params;
		content.append(createElement('p', 'bx-im-notifier-forward-result__summary', getSummary(result)));
		const failedRecipients = result.recipients.filter(({
			state
		}) => state !== 'success');
		if (failedRecipients.length === 0) {
			return;
		}
		renderFailureDetails(content, operationId, result, failedRecipients);
		if (retry) {
			renderRetryAction(content, params);
		}
	};
	const createResultContent = params => {
		const content = createElement('div', 'bx-im-notifier-forward-result');
		content.tabIndex = -1;
		renderResultContent(content, params);
		return content;
	};
	const ForwardNotifier = {
		showResult(params) {
			const content = createResultContent(params);
			const summary = getSummary(params.result);
			const notificationParams = {
				id: `im-forward-operation-${params.operationId}`,
				autoHideDelay: AUTO_HIDE_DELAY,
				blinkOnUpdate: false
			};
			const balloon = BX.UI.Notification.Center.notify({
				content,
				...notificationParams
			}) ?? BX.UI.Notification.Center.getBalloonById(notificationParams.id);
			attachInteractionPause(balloon);
			ui_a11y.LiveAnnouncer.announce(summary, 'polite');
			return balloon;
		},
		onComplete(operationId, recipientCount) {
			return this.showResult({
				operationId,
				result: {
					totalRecipients: recipientCount,
					successfulRecipients: recipientCount,
					hasRetryableDeliveries: false,
					recipients: []
				}
			});
		}
	};

	exports.ForwardNotifier = ForwardNotifier;

})(this.BX.Messenger.v2.Lib.NotifierForward = this.BX.Messenger.v2.Lib.NotifierForward || {}, BX.UI.Notification, BX, BX.UI.Accessibility);
//# sourceMappingURL=forward.bundle.js.map
