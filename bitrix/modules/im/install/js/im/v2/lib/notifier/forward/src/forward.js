import 'ui.notification';
import { Dom, Event, Loc } from 'main.core';
import { LiveAnnouncer } from 'ui.a11y';

import './forward.css';

type Balloon = {
	getContainer: () => HTMLElement,
	deactivateAutoHide: () => void,
	activateAutoHide: () => void,
};

type ForwardRecipientResult = {
	dialogTitle: string,
	state: string,
	displayReason?: string,
};

type ForwardOperationResult = {
	totalRecipients: number,
	successfulRecipients: number,
	hasRetryableDeliveries: boolean,
	recipients: ForwardRecipientResult[],
};

type ShowResultParams = {
	operationId: string,
	result: ForwardOperationResult,
	retry?: () => Promise<ForwardOperationResult>,
};

const AUTO_HIDE_DELAY = 8000;
const attachedInteractionPause = new WeakSet();

const getReasonText = (reason: ?string): string => {
	const phraseByReason = {
		transientUnknown: 'IM_NOTIFIER_MESSAGE_FORWARD_REASON_TRANSIENT',
		storage: 'IM_NOTIFIER_MESSAGE_FORWARD_REASON_STORAGE',
		fileUnavailable: 'IM_NOTIFIER_MESSAGE_FORWARD_REASON_FILE_UNAVAILABLE',
		chatUnavailable: 'IM_NOTIFIER_MESSAGE_FORWARD_REASON_CHAT_UNAVAILABLE',
		notWritable: 'IM_NOTIFIER_MESSAGE_FORWARD_REASON_NOT_WRITABLE',
	};

	return Loc.getMessage(phraseByReason[reason] ?? phraseByReason.transientUnknown);
};

const createElement = (tagName: string, className?: string, text?: string): HTMLElement => {
	const element = document.createElement(tagName);
	if (className)
	{
		element.className = className;
	}

	if (text)
	{
		element.textContent = text;
	}

	return element;
};

const getSummary = (result: ForwardOperationResult): string => {
	const phrase = result.successfulRecipients === result.totalRecipients
		? 'IM_NOTIFIER_MESSAGE_FORWARD_RECIPIENTS_COMPLETE'
		: 'IM_NOTIFIER_MESSAGE_FORWARD_RECIPIENTS_PARTIAL';

	return Loc.getMessage(phrase, {
		'#SUCCESS_COUNT#': result.successfulRecipients,
		'#COUNT#': result.totalRecipients,
	});
};

const attachInteractionPause = (balloon: Balloon): void => {
	const container = balloon.getContainer();
	if (attachedInteractionPause.has(container))
	{
		return;
	}

	attachedInteractionPause.add(container);
	let isPointerInside = false;
	let isFocusInside = container.contains(document.activeElement);
	const updateAutoHide = () => {
		if (isPointerInside || isFocusInside)
		{
			balloon.deactivateAutoHide();

			return;
		}

		balloon.activateAutoHide();
	};

	Event.bind(container, 'mouseenter', () => {
		isPointerInside = true;
		updateAutoHide();
	});
	Event.bind(container, 'mouseleave', () => {
		isPointerInside = false;
		updateAutoHide();
	});
	Event.bind(container, 'focusin', () => {
		isFocusInside = true;
		updateAutoHide();
	});
	Event.bind(container, 'focusout', (event) => {
		isFocusInside = container.contains(event.relatedTarget);
		updateAutoHide();
	});
};

const showProgress = (content: HTMLElement): void => {
	content.setAttribute('data-testid', 'im-forward-result-progress');
	content.setAttribute('aria-busy', 'true');
	const summary = content.querySelector('.bx-im-notifier-forward-result__summary');
	if (summary)
	{
		summary.textContent = Loc.getMessage('IM_NOTIFIER_MESSAGE_FORWARD_RETRY_PROGRESS');
	}
	content.querySelectorAll('button').forEach((button) => {
		const actionButton = button;
		actionButton.disabled = true;
	});
};

const renderFailureDetails = (
	content: HTMLElement,
	operationId: string,
	result: ForwardOperationResult,
	failedRecipients: ForwardRecipientResult[],
): void => {
	const reasons = new Set(failedRecipients.map(({ displayReason }) => displayReason));
	const isCommonTotalFailure = result.successfulRecipients === 0 && reasons.size === 1;
	if (isCommonTotalFailure)
	{
		content.append(createElement(
			'p',
			'bx-im-notifier-forward-result__reason',
			getReasonText(failedRecipients[0].displayReason),
		));
	}
	else
	{
		const detailsId = `im-forward-operation-${operationId}-details`;
		const list = createElement('ul', 'bx-im-notifier-forward-result__list');
		list.id = detailsId;
		list.hidden = true;
		failedRecipients.forEach((recipient) => {
			const item = createElement('li', 'bx-im-notifier-forward-result__item');
			const title = createElement('span', 'bx-im-notifier-forward-result__recipient', recipient.dialogTitle);
			const reason = createElement('span', 'bx-im-notifier-forward-result__recipient-reason');
			reason.textContent = ` - ${getReasonText(recipient.displayReason)}`;
			item.append(title, reason);
			list.append(item);
		});

		const detailsButton = createElement(
			'button',
			'bx-im-notifier-forward-result__button',
			Loc.getMessage('IM_NOTIFIER_MESSAGE_FORWARD_DETAILS'),
		);
		detailsButton.setAttribute('type', 'button');
		detailsButton.setAttribute('data-testid', 'im-forward-result-details');
		detailsButton.setAttribute('aria-expanded', 'false');
		detailsButton.setAttribute('aria-controls', detailsId);
		Event.bind(detailsButton, 'click', () => {
			const expanded = detailsButton.getAttribute('aria-expanded') === 'true';
			detailsButton.setAttribute('aria-expanded', String(!expanded));
			list.hidden = expanded;
		});
		const actions = createElement('div', 'bx-im-notifier-forward-result__actions');
		actions.append(detailsButton);
		content.append(list, actions);
	}
};

const getActionsContainer = (content: HTMLElement): HTMLElement => {
	const foundActions = content.querySelector('.bx-im-notifier-forward-result__actions');
	if (foundActions instanceof HTMLElement)
	{
		return foundActions;
	}

	const actions = createElement('div', 'bx-im-notifier-forward-result__actions');
	content.append(actions);

	return actions;
};

const retryDelivery = async (content: HTMLElement, params: ShowResultParams): Promise<void> => {
	const { operationId, retry } = params;
	const shouldRestoreFocus = content.contains(document.activeElement);
	if (shouldRestoreFocus)
	{
		content.focus();
	}
	showProgress(content);
	LiveAnnouncer.announce(Loc.getMessage('IM_NOTIFIER_MESSAGE_FORWARD_RETRY_PROGRESS'), 'polite');

	const nextResult = await retry();
	const nextParams = {
		operationId,
		result: nextResult,
		retry: nextResult.hasRetryableDeliveries ? retry : undefined,
	};
	renderResultContent(content, nextParams);
	LiveAnnouncer.announce(getSummary(nextResult), 'polite');
	if (shouldRestoreFocus)
	{
		const nextAction = content.querySelector('button:not(:disabled)');
		if (nextAction instanceof HTMLElement)
		{
			nextAction.focus();
		}
		else
		{
			content.focus();
		}
	}
};

const renderRetryAction = (content: HTMLElement, params: ShowResultParams): void => {
	const retryButton = createElement(
		'button',
		'bx-im-notifier-forward-result__button',
		Loc.getMessage('IM_NOTIFIER_MESSAGE_FORWARD_RETRY'),
	);
	retryButton.setAttribute('type', 'button');
	retryButton.setAttribute('data-testid', 'im-forward-result-retry');
	Event.bind(retryButton, 'click', () => {
		void retryDelivery(content, params);
	});
	getActionsContainer(content).append(retryButton);
};

const renderResultContent = (content: HTMLElement, params: ShowResultParams): void => {
	Dom.clean(content);
	content.setAttribute('data-testid', 'im-forward-result');
	content.removeAttribute('aria-busy');
	const { operationId, result, retry } = params;
	content.append(createElement('p', 'bx-im-notifier-forward-result__summary', getSummary(result)));

	const failedRecipients = result.recipients.filter(({ state }) => state !== 'success');
	if (failedRecipients.length === 0)
	{
		return;
	}

	renderFailureDetails(content, operationId, result, failedRecipients);
	if (retry)
	{
		renderRetryAction(content, params);
	}
};

const createResultContent = (params: ShowResultParams): HTMLElement => {
	const content = createElement('div', 'bx-im-notifier-forward-result');
	content.tabIndex = -1;
	renderResultContent(content, params);

	return content;
};

export const ForwardNotifier = {
	showResult(params: ShowResultParams): Balloon
	{
		const content = createResultContent(params);
		const summary = getSummary(params.result);
		const notificationParams = {
			id: `im-forward-operation-${params.operationId}`,
			autoHideDelay: AUTO_HIDE_DELAY,
			blinkOnUpdate: false,
		};
		const balloon = BX.UI.Notification.Center.notify({ content, ...notificationParams })
			?? BX.UI.Notification.Center.getBalloonById(notificationParams.id)
		;
		attachInteractionPause(balloon);
		LiveAnnouncer.announce(summary, 'polite');

		return balloon;
	},

	onComplete(operationId: string, recipientCount: number): Balloon
	{
		return this.showResult({
			operationId,
			result: {
				totalRecipients: recipientCount,
				successfulRecipients: recipientCount,
				hasRetryableDeliveries: false,
				recipients: [],
			},
		});
	},
};
