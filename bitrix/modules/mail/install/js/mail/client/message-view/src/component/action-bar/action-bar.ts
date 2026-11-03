import { Event, Type } from 'main.core';
import { type ComponentOptions, type PropType } from 'ui.vue3';

import {
	type ActionInvokeIntent,
	type ActionMenuCloseReason,
	type ActionMenuIntent,
	type ActionName,
	type ActionsState,
	type CitationMetadata,
	type RetryableActionName,
} from '../../feature/actions/actions';
import { type MailAddressViewModel } from '../../model/types';

type MenuActionName = Exclude<ActionName, 'more' | 'recipient' | 'citation'>;

export type ActionBarLabels = {
	readonly actions: Readonly<Record<ActionName, string>>,
	readonly pending: Readonly<Record<RetryableActionName, string>>,
	readonly retry: Readonly<Record<RetryableActionName, string>>,
	readonly error: Readonly<Record<RetryableActionName, string>>,
};

export type ActionBarLegacyAttributes = Readonly<Partial<Record<
	ActionName,
	Readonly<Record<string, string>>
>>>;

export type ActionBarActionIntent = ActionInvokeIntent | {
	readonly type: 'retry',
	readonly action: RetryableActionName,
};

export type ActionBarOutsideIntent = {
	readonly reason: 'outside',
	readonly returnFocus: boolean,
};

export type ActionBarEscapeIntent = {
	readonly reason: 'escape',
	readonly returnFocus: boolean,
};

export type ActionBarReturnFocusIntent = {
	readonly token: number,
	readonly target: 'more',
};

const PrimaryActionNames: readonly MenuActionName[] = [
	'reply',
	'replyAll',
	'forward',
];

const MoreActionNames: readonly MenuActionName[] = [
	'assignLabels',
	'discussInChat',
	'unbind',
	'markSpam',
	'delete',
	'crm',
	'task',
	'chat',
	'calendar',
	'feed',
	'pull',
	'iCal',
];

const RetryableActionNames = new Set<RetryableActionName>([
	'markSpam',
	'delete',
]);

const LegacyHostAttribute = 'data-mail-message-view-host';
const ActionTestIds: Partial<Record<ActionName, string>> = {
	reply: 'mail-message-view-reply',
	replyAll: 'mail-message-view-reply-all',
	forward: 'mail-message-view-forward',
	more: 'mail-message-view-more',
	assignLabels: 'mail-message-view-labels',
	discussInChat: 'mail-message-view-discuss',
	unbind: 'mail-message-view-unbind',
	markSpam: 'mail-message-view-spam',
	delete: 'mail-message-view-delete',
};
const LegacyPrimaryActionClasses: Readonly<Partial<Record<MenuActionName, string>>> = {
	reply: 'mail-msg-view-control-reply',
	replyAll: 'mail-msg-view-control-replyall',
	forward: 'mail-msg-view-control-forward',
};
const TestId = {
	root: 'mail-message-view-action-bar',
	menu: 'mail-message-view-action-menu',
};

export function removeActionTestIds(root: HTMLElement): void
{
	root.removeAttribute('data-testid');
	root.querySelectorAll('[data-testid]').forEach((element) => element.removeAttribute('data-testid'));
}

function isRetryableActionName(action: ActionName): action is RetryableActionName
{
	return RetryableActionNames.has(action as RetryableActionName);
}

function isActionBarActionIntent(payload?: ActionBarActionIntent): boolean
{
	if (!payload || payload.type !== 'invoke')
	{
		return Boolean(
			payload
			&& payload.type === 'retry'
			&& isRetryableActionName(payload.action),
		);
	}

	if (payload.action === 'recipient')
	{
		return Boolean(payload.recipient);
	}

	if (payload.action === 'citation')
	{
		return Boolean(payload.citation);
	}

	return true;
}

function isMenuCloseReason(reason?: ActionMenuCloseReason): boolean
{
	return reason === 'toggle' || reason === 'escape' || reason === 'outside' || reason === 'action';
}

function isActionMenuIntent(payload?: ActionMenuIntent): boolean
{
	if (!payload)
	{
		return false;
	}

	if (payload.type === 'menu-open' || payload.type === 'menu-toggle')
	{
		return true;
	}

	return payload.type === 'menu-close'
		&& isMenuCloseReason(payload.reason)
		&& Type.isBoolean(payload.returnFocus)
	;
}

// @vue/component
export const ActionBarComponent = {
	name: 'MailMessageViewActionBar',
	props: {
		state: {
			type: Object as PropType<ActionsState>,
			required: true,
		},
		labels: {
			type: Object as PropType<ActionBarLabels | null>,
			default: null,
		},
		legacyActionAttributes: {
			type: Object as PropType<ActionBarLegacyAttributes>,
			default: () => ({}),
		},
	},
	emits: {
		action: (payload?: ActionBarActionIntent): boolean => {
			return isActionBarActionIntent(payload);
		},
		menu: (payload?: ActionMenuIntent): boolean => {
			return isActionMenuIntent(payload);
		},
		outside: (payload?: ActionBarOutsideIntent): boolean => {
			return Boolean(payload && payload.reason === 'outside' && Type.isBoolean(payload.returnFocus));
		},
		escape: (payload?: ActionBarEscapeIntent): boolean => {
			return Boolean(payload && payload.reason === 'escape' && Type.isBoolean(payload.returnFocus));
		},
		'return-focus': (payload?: ActionBarReturnFocusIntent): boolean => {
			return Boolean(payload && Number.isInteger(payload.token) && payload.target === 'more');
		},
	},
	setup(): Object
	{
		return {
			TestId,
		};
	},
	data(): { outsideCloseRequested: boolean }
	{
		return {
			outsideCloseRequested: false,
		};
	},
	computed: {
		primaryActions(): MenuActionName[]
		{
			return PrimaryActionNames.filter((action) => this.state.visibility[action]);
		},
		moreActions(): MenuActionName[]
		{
			return MoreActionNames.filter((action) => this.state.visibility[action]);
		},
		recipients(): MailAddressViewModel[]
		{
			return [
				...this.state.context.recipients.to,
				...this.state.context.recipients.cc,
				...this.state.context.recipients.bcc,
				...this.state.context.recipients.replyTo,
			];
		},
		recipientActions(): MailAddressViewModel[]
		{
			return this.canShowRecipientActions ? this.recipients : [];
		},
		canShowRecipientActions(): boolean
		{
			return this.state.visibility.recipient && this.recipients.length > 0;
		},
		canShowCitationAction(): boolean
		{
			return this.state.visibility.citation && this.state.context.citation.available;
		},
		canShowMenu(): boolean
		{
			return this.labels !== null
				&& this.state.visibility.more
				&& (
					this.moreActions.length > 0
					|| this.canShowRecipientActions
					|| this.canShowCitationAction
				)
			;
		},
		menuId(): string
		{
			return `mail-message-view-action-menu-${this.state.context.messageId}`;
		},
	},
	watch: {
		'state.menu.focusReturnToken': function(token: number, previousToken: number): void {
			if (token === previousToken || token <= 0)
			{
				return;
			}

			this.handleReturnFocus(token);
		},
		'state.menu.open': function(open: boolean, wasOpen: boolean): void {
			if (open && !wasOpen)
			{
				this.outsideCloseRequested = false;
				void this.handleFocusFirstMenuItem();
			}
		},
	},
	mounted(): void
	{
		Event.bind(document, 'pointerdown', this.handleDocumentPointerDown);
	},
	beforeUnmount(): void
	{
		Event.unbind(document, 'pointerdown', this.handleDocumentPointerDown);
	},
	methods: {
		getHostAttribute(hostId: string): Record<string, string>
		{
			return {
				[LegacyHostAttribute]: hostId,
			};
		},
		getRecipientLabel(recipient: MailAddressViewModel): string
		{
			return recipient.name || recipient.email;
		},
		getRequestStatus(action: ActionName): string
		{
			return isRetryableActionName(action) ? this.state.requests[action].status : 'idle';
		},
		getActionLabel(action: ActionName): string
		{
			if (!this.labels)
			{
				return '';
			}

			if (!isRetryableActionName(action))
			{
				return this.labels.actions[action];
			}

			const request = this.state.requests[action];
			if (request.status === 'pending')
			{
				return this.labels.pending[action];
			}

			if (request.status === 'error' && request.canRetry)
			{
				return this.labels.retry[action];
			}

			if (request.status === 'error')
			{
				return this.labels.error[action];
			}

			return this.labels.actions[action];
		},
		getActionTestId(action: ActionName): string | null
		{
			return ActionTestIds[action] ?? null;
		},
		getLegacyPrimaryActionClass(action: MenuActionName): string
		{
			return LegacyPrimaryActionClasses[action] ?? '';
		},
		getLegacyActionAttributes(action: ActionName): Readonly<Record<string, string>>
		{
			return this.legacyActionAttributes[action] ?? {};
		},
		isActionDisabled(action: ActionName): boolean
		{
			return isRetryableActionName(action) && this.state.requests[action].status === 'pending';
		},
		handleAction(action: MenuActionName): void
		{
			if (isRetryableActionName(action) && this.state.requests[action].status === 'error')
			{
				this.$emit('action', {
					type: 'retry',
					action,
				});

				return;
			}

			this.$emit('action', {
				type: 'invoke',
				action,
			});
		},
		handleRecipient(recipient: MailAddressViewModel): void
		{
			this.$emit('action', {
				type: 'invoke',
				action: 'recipient',
				recipient,
			});
		},
		handleCitation(citation: CitationMetadata): void
		{
			this.$emit('action', {
				type: 'invoke',
				action: 'citation',
				citation,
			});
		},
		handleMenuToggle(): void
		{
			this.$emit('menu', { type: 'menu-toggle' });
		},
		handleOutside(event: FocusEvent): void
		{
			const root = this.$refs.root as HTMLElement | undefined;
			const nextTarget = event.relatedTarget;
			if (
				!this.state.menu.open
				|| (
					nextTarget instanceof Node
					&& root?.contains(nextTarget)
				)
			)
			{
				return;
			}

			this.requestOutsideClose();
		},
		handleDocumentPointerDown(event: PointerEvent): void
		{
			const root = this.$refs.root as HTMLElement | undefined;
			if (
				!this.state.menu.open
				|| !(event.target instanceof Node)
				|| root?.contains(event.target)
			)
			{
				return;
			}

			this.requestOutsideClose();
		},
		requestOutsideClose(): void
		{
			if (this.outsideCloseRequested)
			{
				return;
			}

			this.outsideCloseRequested = true;
			const intent = {
				reason: 'outside',
				returnFocus: false,
			} as const;
			this.$emit('outside', intent);
			this.$emit('menu', {
				type: 'menu-close',
				reason: intent.reason,
				returnFocus: intent.returnFocus,
			});
		},
		handleEscape(event: KeyboardEvent): void
		{
			if (!this.state.menu.open)
			{
				return;
			}

			event.preventDefault();
			event.stopPropagation();
			const intent = {
				reason: 'escape',
				returnFocus: true,
			} as const;
			this.$emit('escape', intent);
			this.$emit('menu', {
				type: 'menu-close',
				reason: intent.reason,
				returnFocus: intent.returnFocus,
			});
		},
		async handleFocusFirstMenuItem(): Promise<void>
		{
			await this.$nextTick();
			const menu = this.$refs.menu as HTMLElement | undefined;
			const firstItem = menu?.querySelector('.mail-message-view-action-bar-menu-item:not(:disabled)');
			if (firstItem instanceof HTMLElement)
			{
				firstItem.focus();
			}
		},
		handleReturnFocus(token: number): void
		{
			const moreButton = this.$refs.moreButton as HTMLElement | undefined;
			moreButton?.focus();
			this.$emit('return-focus', {
				token,
				target: 'more',
			});
		},
	},
	template: `
		<div class="mail-message-view-action-bar-wrapper mail-msg-view-control-wrapper">
			<nav
				v-if="labels"
				ref="root"
				class="mail-message-view-action-bar mail-msg-view-control-block"
				:data-testid="TestId.root"
				@keydown.esc="handleEscape"
				@focusout="handleOutside"
			>
				<button
					v-for="action in primaryActions"
					:key="action"
					type="button"
					:class="['mail-message-view-action-bar-button', 'mail-msg-view-control', getLegacyPrimaryActionClass(action)]"
					:data-action="action"
					:data-testid="getActionTestId(action)"
					:disabled="isActionDisabled(action)"
					:aria-busy="getRequestStatus(action) === 'pending' ? 'true' : 'false'"
					@click="handleAction(action)"
				>{{ getActionLabel(action) }}</button>
				<div
					v-if="canShowMenu"
					class="mail-msg-view-control-more-wrapper"
				>
					<button
						ref="moreButton"
						type="button"
						class="mail-message-view-action-bar-button mail-message-view-action-bar-more mail-msg-view-control mail-msg-view-control-more"
						:aria-label="getActionLabel('more')"
						:aria-expanded="state.menu.open ? 'true' : 'false'"
						:aria-controls="menuId"
						data-action="more"
						:data-testid="getActionTestId('more')"
						@click="handleMenuToggle"
					>{{ getActionLabel('more') }}</button>
					<div
						v-if="state.menu.open"
						ref="menu"
						:id="menuId"
						class="mail-message-view-action-bar-menu mail-msg-view-control-more-menu"
						:data-testid="TestId.menu"
					>
						<button
							v-for="action in moreActions"
							:key="action"
							type="button"
							class="mail-message-view-action-bar-menu-item mail-msg-view-control"
							:data-action="action"
							:data-testid="getActionTestId(action)"
							v-bind="getLegacyActionAttributes(action)"
							:disabled="isActionDisabled(action)"
							:aria-busy="getRequestStatus(action) === 'pending' ? 'true' : 'false'"
							@click="handleAction(action)"
						>{{ getActionLabel(action) }}</button>
						<button
							v-if="canShowCitationAction"
							type="button"
							class="mail-message-view-action-bar-menu-item mail-msg-view-control"
							data-action="citation"
							@click="handleCitation(state.context.citation)"
						>{{ getActionLabel('citation') }}</button>
						<button
							v-for="recipient in recipientActions"
							:key="recipient.email"
							type="button"
							class="mail-message-view-action-bar-menu-item mail-msg-view-control"
							data-action="recipient"
							@click="handleRecipient(recipient)"
						>{{ getRecipientLabel(recipient) }}</button>
						<div
							v-for="binding in state.context.bindings"
							:key="binding.id"
							class="mail-message-view-host mail-message-view-action-bar-binding-host"
							v-bind="getHostAttribute(binding.id)"
						></div>
					</div>
				</div>
			</nav>
		</div>
	`,
} satisfies ComponentOptions;
