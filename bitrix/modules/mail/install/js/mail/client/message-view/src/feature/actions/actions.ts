import {
	type MailAddressViewModel,
	type RecipientListViewModel,
} from '../../model/types';

export type ActionName =
	| 'reply'
	| 'replyAll'
	| 'forward'
	| 'more'
	| 'recipient'
	| 'citation'
	| 'assignLabels'
	| 'discussInChat'
	| 'unbind'
	| 'markSpam'
	| 'delete'
	| 'crm'
	| 'task'
	| 'chat'
	| 'calendar'
	| 'feed'
	| 'pull'
	| 'iCal'
;

export type RetryableActionName = 'markSpam' | 'delete';
export type ActionRequestStatus = 'idle' | 'pending' | 'succeeded' | 'error';
export type ActionMenuCloseReason = 'toggle' | 'escape' | 'outside' | 'action';

export type ActionBinding = {
	readonly id: string,
	readonly type: string,
	readonly title: string,
	readonly href: string | null,
};

export type CitationMetadata = {
	readonly formId: string,
	readonly quoteFieldName: string,
	readonly available: boolean,
};

export type ActionContext = {
	readonly messageId: number,
	readonly mailboxId: number,
	readonly recipients: RecipientListViewModel,
	readonly citation: CitationMetadata,
	readonly bindings: readonly ActionBinding[],
};

export type ActionInvokeIntent =
	| {
		type: 'invoke',
		action: Exclude<ActionName, 'more' | 'recipient' | 'citation'>,
		payload?: unknown,
	}
	| {
		type: 'invoke',
		action: 'recipient',
		recipient: MailAddressViewModel,
	}
	| {
		type: 'invoke',
		action: 'citation',
		citation: CitationMetadata,
	}
;

export type ActionMenuIntent =
	| { type: 'menu-open' }
	| { type: 'menu-toggle' }
	| {
		type: 'menu-close',
		reason: ActionMenuCloseReason,
		returnFocus: boolean,
	}
;

export type ActionRetryIntent = {
	type: 'retry',
	action: RetryableActionName,
};

export type ActionIntent = ActionInvokeIntent | ActionMenuIntent | ActionRetryIntent;

export type ActionVisibility = Readonly<Record<ActionName, boolean>>;

export type RetryableActionState = {
	status: ActionRequestStatus,
	error: string | null,
	canRetry: boolean,
};

export type ActionsState = {
	readonly visibility: ActionVisibility,
	readonly context: ActionContext,
	menu: {
		open: boolean,
		closeReason: ActionMenuCloseReason | null,
		focusReturnToken: number,
	},
	requests: Record<RetryableActionName, RetryableActionState>,
};

export type ActionDispatchResult =
	| { status: 'success' }
	| { status: 'busy' | 'unavailable' | 'ignored' }
	| { status: 'error', error: unknown }
;

export type ActionDelegate = (
	intent: ActionInvokeIntent,
	context: ActionContext,
) => void | Promise<void>;

export type ActionDelegates = Partial<Record<Exclude<ActionName, 'more'>, ActionDelegate>>;

export type ActionsOptions = {
	readonly messageId: number,
	readonly mailboxId: number,
	readonly recipients: RecipientListViewModel,
	readonly citation: CitationMetadata,
	readonly isCurrentMessage: boolean,
	readonly bindings?: readonly ActionBinding[],
	readonly visibility?: Partial<Record<ActionName, boolean>>,
	readonly delegates?: ActionDelegates,
	readonly onChange?: (state: Readonly<ActionsState>) => void,
	readonly getErrorMessage?: (error: unknown) => string | null,
};

const ActionNames: readonly ActionName[] = [
	'reply',
	'replyAll',
	'forward',
	'more',
	'recipient',
	'citation',
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

function createVisibility(visibility: ActionsOptions['visibility']): ActionVisibility
{
	return Object.fromEntries(
		ActionNames.map((action) => [action, visibility?.[action] === true]),
	) as Record<ActionName, boolean>;
}

function createRequestState(): RetryableActionState
{
	return {
		status: 'idle',
		error: null,
		canRetry: false,
	};
}

export class Actions
{
	#state: ActionsState;
	#delegates: ActionDelegates;
	#onChange?: ActionsOptions['onChange'];
	#getErrorMessage?: ActionsOptions['getErrorMessage'];
	#lastRetryableIntents = new Map<RetryableActionName, ActionInvokeIntent>();
	#destroyed = false;

	constructor(options: ActionsOptions)
	{
		this.#delegates = options.delegates ?? {};
		this.#onChange = options.onChange;
		this.#getErrorMessage = options.getErrorMessage;
		this.#state = {
			visibility: createVisibility(options.visibility),
			context: {
				messageId: options.messageId,
				mailboxId: options.mailboxId,
				recipients: options.recipients,
				citation: options.citation,
				bindings: options.isCurrentMessage ? [...(options.bindings ?? [])] : [],
			},
			menu: {
				open: false,
				closeReason: null,
				focusReturnToken: 0,
			},
			requests: {
				markSpam: createRequestState(),
				delete: createRequestState(),
			},
		};
	}

	getState(): Readonly<ActionsState>
	{
		return this.#state;
	}

	getSnapshot(): ActionsState
	{
		return {
			visibility: { ...this.#state.visibility },
			context: {
				...this.#state.context,
				recipients: this.#state.context.recipients,
				citation: { ...this.#state.context.citation },
				bindings: this.#state.context.bindings.map((binding) => ({ ...binding })),
			},
			menu: { ...this.#state.menu },
			requests: {
				markSpam: { ...this.#state.requests.markSpam },
				delete: { ...this.#state.requests.delete },
			},
		};
	}

	setVisibility(action: ActionName, visible: boolean): void
	{
		if (this.#destroyed || this.#state.visibility[action] === visible)
		{
			return;
		}

		this.#state = {
			...this.#state,
			visibility: {
				...this.#state.visibility,
				[action]: visible,
			},
		};
		this.#notify();
	}

	async dispatch(intent: ActionIntent): Promise<ActionDispatchResult>
	{
		if (this.#destroyed)
		{
			return { status: 'ignored' };
		}

		if (intent.type === 'menu-open')
		{
			this.#openMenu();

			return { status: 'success' };
		}

		if (intent.type === 'menu-toggle')
		{
			if (this.#state.menu.open)
			{
				this.#closeMenu('toggle', true);
			}
			else
			{
				this.#openMenu();
			}

			return { status: 'success' };
		}

		if (intent.type === 'menu-close')
		{
			this.#closeMenu(intent.reason, intent.returnFocus);

			return { status: 'success' };
		}

		if (intent.type === 'retry')
		{
			const retryIntent = this.#lastRetryableIntents.get(intent.action);
			if (!retryIntent || !this.#state.requests[intent.action].canRetry)
			{
				return { status: 'unavailable' };
			}

			return this.#invoke(retryIntent);
		}

		return this.#invoke(intent);
	}

	destroy(): void
	{
		this.#destroyed = true;
		this.#onChange = undefined;
		this.#lastRetryableIntents.clear();
	}

	async #invoke(intent: ActionInvokeIntent): Promise<ActionDispatchResult>
	{
		const delegate = this.#delegates[intent.action];
		if (!delegate)
		{
			return { status: 'unavailable' };
		}

		if (intent.action === 'markSpam' || intent.action === 'delete')
		{
			return this.#invokeRetryable(intent.action, intent, delegate);
		}

		try
		{
			await delegate(intent, this.#state.context);
			this.#closeMenu('action', true);

			return { status: 'success' };
		}
		catch (error)
		{
			return { status: 'error', error };
		}
	}

	async #invokeRetryable(
		action: RetryableActionName,
		intent: ActionInvokeIntent,
		delegate: ActionDelegate,
	): Promise<ActionDispatchResult>
	{
		const request = this.#state.requests[action];
		if (request.status === 'pending')
		{
			return { status: 'busy' };
		}

		this.#lastRetryableIntents.set(action, intent);
		request.status = 'pending';
		request.error = null;
		request.canRetry = false;
		this.#notify();

		try
		{
			await delegate(intent, this.#state.context);
			if (this.#destroyed)
			{
				return { status: 'ignored' };
			}

			request.status = 'succeeded';
			this.#closeMenu('action', true);
			this.#notify();

			return { status: 'success' };
		}
		catch (error)
		{
			if (this.#destroyed)
			{
				return { status: 'ignored' };
			}

			request.status = 'error';
			request.error = this.#getErrorMessage?.(error) ?? null;
			request.canRetry = true;
			this.#notify();

			return { status: 'error', error };
		}
	}

	#openMenu(): void
	{
		this.#state.menu.open = true;
		this.#state.menu.closeReason = null;
		this.#notify();
	}

	#closeMenu(reason: ActionMenuCloseReason, returnFocus: boolean): void
	{
		this.#state.menu.open = false;
		this.#state.menu.closeReason = reason;
		if (returnFocus)
		{
			this.#state.menu.focusReturnToken += 1;
		}
		this.#notify();
	}

	#notify(): void
	{
		this.#onChange?.(this.getSnapshot());
	}
}
