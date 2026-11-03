import { Dom, Event as MainEvent, Type } from 'main.core';
import { BitrixVue, defineComponent, nextTick, reactive, type PropType } from 'ui.vue3';

import { type MailtoIntent, MessageViewComponent } from '../component/message-view/message-view';
import {
	removeActionTestIds,
	type ActionBarActionIntent,
	type ActionBarLegacyAttributes,
	type ActionBarLabels,
} from '../component/action-bar/action-bar';
import {
	Attachments,
	createAttachmentsComponentLabels,
	type AttachmentsComponentLabels,
	type AttachmentsIntent,
	type AttachmentsRefreshIntent,
	type AttachmentsResponse,
	type AttachmentsState,
} from '../component/attachments/attachments';
import {
	type ThreadComponentLabels,
	type ThreadLoadSideIntent,
	type ThreadRetryItemIntent,
	type ThreadToggleItemIntent,
} from '../component/thread/thread';
import {
	Actions,
	type ActionDelegates,
	type ActionIntent,
	type ActionMenuIntent,
	type ActionName,
	type ActionsState,
} from '../feature/actions/actions';
import {
	Thread,
	type ThreadPair,
	type ThreadState,
} from '../feature/thread/thread';
import {
	LegacyIsland,
	type LegacyThreadPair,
} from '../infrastructure/adapter/legacy-island/legacy-island';
import { LegacyViewRegistry } from '../infrastructure/adapter/legacy-view-registry/legacy-view-registry';
import {
	PlatformIntegrationRegistry,
	type SliderEventEmitterIntegration,
} from '../infrastructure/adapter/platform-integrations/platform-integrations';
import {
	ComponentApi,
	type TrustedComponentContent,
} from '../infrastructure/service/component-api/component-api';
import { createMessageViewState } from '../model/state';
import { type BootstrapViewModel, type MessageViewState } from '../model/types';
import { Screen, type CleanupAction, type ScreenApplication } from './screen';
import '../style.css';

export type MessageViewOptions = {
	containerId: string,
	bootstrap: Readonly<BootstrapViewModel>,
	threadLabels?: ThreadComponentLabels,
	mailUfMessageToken?: string,
};

export type MessageViewStateLifecycle = {
	bind(state: MessageViewState): boolean,
	handleImageFailure(url: string): boolean,
	dispose(): void,
};

type VueApplication = {
	mount(rootContainer: Element | string): void,
	unmount(): void,
};

type ThreadView = {
	state: Readonly<ThreadState>,
};

type ActionsView = {
	state: Readonly<ActionsState>,
};

type AttachmentsView = {
	state: Readonly<AttachmentsState>,
};

type BodyLoadResponse = {
	readonly status: 'success',
} | {
	readonly status: 'network',
	readonly error?: unknown,
};

type LegacyIntegrationBridge = {
	onBodyLoading?(): void,
	onBodyResponse?(response: BodyLoadResponse): void,
	onCrmExcluded?(): void,
	onAttachmentsLoading(): void,
	onAttachmentsResponse(response: AttachmentsResponse): boolean,
};

type LegacyView = {
	id?: number | string,
	pageSwapper?: object | null,
	slider?: object | null,
	options?: {
		formId?: string,
		ajaxAttachmentElementId?: string,
	},
	setIntegrationBridge?(bridge: LegacyIntegrationBridge | null): void,
	loadAttachmentsForState?(): Promise<AttachmentsResponse>,
	finalizeAttachmentsIntegration?(): void,
	openMailComposer?(email: string): void,
	invokeActionForState?(selector: string): Promise<void>,
	destroy?(): void,
};

type LegacyWindow = Window & typeof globalThis & {
	BX?: {
		Event?: {
			EventEmitter?: SliderEventEmitterIntegration,
		},
	},
	BXMailView?: {
		getView?(messageId?: number | string): LegacyView | undefined,
		subscribeViewReady?(handler: (view: LegacyView) => void): () => void,
	},
	BXMainMailForm?: {
		getForm?(formId: string): { destroy?(): void } | null,
	},
};

type LegacySeeds = Map<string, HTMLElement[]>;

const LegacySeedAttribute = 'data-mail-message-view-seed';
const LegacyHostAttribute = 'data-mail-message-view-host';
const LegacyActionAttributeNames = [
	'data-role',
	'data-uid-key',
	'data-label-ids',
	'aria-haspopup',
	'aria-expanded',
] as const;
const ActionSelectors: Partial<Record<ActionName, string>> = {
	reply: '.js-msg-view-control-reply',
	replyAll: '.js-msg-view-control-replyall',
	forward: '.js-msg-view-control-forward',
	more: '.mail-msg-view-control-more',
	assignLabels: '[data-role="mail-label-assign"]',
	discussInChat: '.js-mail-discuss-in-chat',
	unbind: '.js-msg-view-control-skip',
	markSpam: '.js-msg-view-control-spam',
	delete: '.js-msg-view-control-delete',
};
const ActionNames: readonly ActionName[] = [
	'reply', 'replyAll', 'forward', 'more', 'recipient', 'citation', 'assignLabels',
	'discussInChat', 'unbind', 'markSpam', 'delete', 'crm', 'task', 'chat',
	'calendar', 'feed', 'pull', 'iCal',
];

function collectLegacySeeds(container: HTMLElement): LegacySeeds
{
	const seeds: LegacySeeds = new Map();
	container.querySelectorAll(`[${LegacySeedAttribute}]`).forEach((node) => {
		if (!Type.isElementNode(node))
		{
			return;
		}

		const seed = node as HTMLElement;
		const key = seed.getAttribute(LegacySeedAttribute);
		if (!Type.isStringFilled(key))
		{
			return;
		}

		if (!seeds.has(key))
		{
			seeds.set(key, []);
		}
		seeds.get(key)?.push(seed);
		Dom.remove(seed);
	});

	return seeds;
}

function mountLegacySeeds(container: HTMLElement, seeds: LegacySeeds): void
{
	seeds.forEach((items, key) => {
		const host = container.querySelector(`[${LegacyHostAttribute}="${key}"]`);
		if (!Type.isElementNode(host))
		{
			return;
		}

		items.forEach((seed) => {
			while (seed.firstChild)
			{
				Dom.append(seed.firstChild as HTMLElement, host);
			}
		});
	});
}

function findSeedElement(seeds: LegacySeeds, key: string, selector: string): HTMLElement | null
{
	for (const seed of seeds.get(key) ?? [])
	{
		const element = seed.matches(selector) ? seed : seed.querySelector(selector);
		if (Type.isElementNode(element))
		{
			return element as HTMLElement;
		}
	}

	return null;
}

function createActionBarLabels(
	seeds: LegacySeeds,
	bootstrap: Readonly<BootstrapViewModel>,
): ActionBarLabels | null
{
	const actions = Object.fromEntries(
		ActionNames.map((action) => [action, '']),
	) as Record<ActionName, string>;
	const visibleActions: Partial<Record<ActionName, boolean>> = {
		reply: bootstrap.capabilities.reply,
		replyAll: bootstrap.capabilities.replyAll,
		forward: bootstrap.capabilities.forward,
		more: bootstrap.capabilities.more,
		assignLabels: bootstrap.capabilities.assignLabels,
		discussInChat: bootstrap.capabilities.discussInChat,
		unbind: bootstrap.capabilities.unbind,
		markSpam: bootstrap.capabilities.markSpam,
		delete: bootstrap.capabilities.delete,
	};

	for (const [action, visible] of Object.entries(visibleActions) as [ActionName, boolean][])
	{
		if (!visible)
		{
			continue;
		}

		const selector = ActionSelectors[action];
		const label = selector
			? findSeedElement(seeds, bootstrap.hosts.actions.id, selector)?.textContent?.trim()
			: ''
		;
		if (!Type.isStringFilled(label))
		{
			return null;
		}

		actions[action] = label;
	}

	return {
		actions,
		pending: {
			markSpam: actions.markSpam,
			delete: actions.delete,
		},
		retry: {
			markSpam: actions.markSpam,
			delete: actions.delete,
		},
		error: {
			markSpam: actions.markSpam,
			delete: actions.delete,
		},
	};
}

function createActionBarLegacyAttributes(
	seeds: LegacySeeds,
	bootstrap: Readonly<BootstrapViewModel>,
): ActionBarLegacyAttributes
{
	const selector = ActionSelectors.assignLabels;
	const assignLabels = selector
		? findSeedElement(seeds, bootstrap.hosts.actions.id, selector)
		: null
	;
	if (!assignLabels)
	{
		return {};
	}

	const attributes: Record<string, string> = {};
	LegacyActionAttributeNames.forEach((name) => {
		const value = assignLabels.getAttribute(name);
		if (value !== null)
		{
			attributes[name] = value;
		}
	});

	return { assignLabels: attributes };
}

function getLegacyErrorMessage(error: unknown): string | null
{
	if (error instanceof Error)
	{
		return error.message;
	}

	if (Type.isStringFilled(error))
	{
		return error;
	}

	const errors = Type.isObject(error)
		? (error as { errors?: unknown }).errors
		: null
	;
	if (Type.isArray(errors))
	{
		for (const item of errors)
		{
			const message = Type.isObject(item) ? (item as { message?: unknown }).message : null;
			if (Type.isStringFilled(message))
			{
				return message;
			}
		}
	}

	return null;
}

function getSeedLabel(seeds: LegacySeeds, key: string, selector: string): string | null
{
	const label = findSeedElement(seeds, key, selector)?.textContent?.trim().replace(/:\s*$/, '');

	return Type.isStringFilled(label) ? label : null;
}

function createAttachmentLabels(
	seeds: LegacySeeds,
	bootstrap: Readonly<BootstrapViewModel>,
	threadLabels?: ThreadComponentLabels,
): AttachmentsComponentLabels | null
{
	const seedKey = bootstrap.hosts.attachments.id;

	return createAttachmentsComponentLabels({
		files: getSeedLabel(seeds, seedKey, '.mail-msg-view-file-text')
			?? threadLabels?.loadBefore,
		loading: threadLabels?.loadingBefore,
		error: threadLabels?.errorBefore,
		refresh: getSeedLabel(
			seeds,
			seedKey,
			'[data-testid="mail-message-view-refresh-attachments"]',
		),
		retry: threadLabels?.retryBefore,
		archive: getSeedLabel(seeds, seedKey, '[data-testid="mail-message-view-download-archive"]'),
	});
}

function toThreadPair(pair: LegacyThreadPair): ThreadPair
{
	return {
		id: pair.id,
		rowKey: pair.rowKey,
		detailsKey: pair.detailsKey,
	};
}

function partitionInsertedPairs(
	pairs: readonly LegacyThreadPair[],
	insertedIds: readonly number[],
): { inserted: LegacyThreadPair[], discarded: LegacyThreadPair[] }
{
	const remainingIds = [...insertedIds];
	const inserted: LegacyThreadPair[] = [];
	const discarded: LegacyThreadPair[] = [];
	pairs.forEach((pair) => {
		const index = remainingIds.indexOf(pair.id);
		if (index === -1)
		{
			discarded.push(pair);

			return;
		}

		remainingIds.splice(index, 1);
		inserted.push(pair);
	});

	return { inserted, discarded };
}

// @vue/component
export const App = defineComponent({
	name: 'MailMessageViewApp',
	components: {
		MessageViewComponent,
	},
	props: {
		state: {
			type: Object as PropType<MessageViewState>,
			required: true,
		},
		threadView: {
			type: Object as PropType<ThreadView>,
			required: true,
		},
		threadLabels: {
			type: Object as PropType<ThreadComponentLabels | null>,
			default: null,
		},
		actionsView: {
			type: Object as PropType<ActionsView>,
			required: true,
		},
		actionLabels: {
			type: Object as PropType<ActionBarLabels | null>,
			default: null,
		},
		actionLegacyAttributes: {
			type: Object as PropType<ActionBarLegacyAttributes>,
			default: () => ({}),
		},
		attachmentsView: {
			type: Object as PropType<AttachmentsView>,
			required: true,
		},
		attachmentLabels: {
			type: Object as PropType<AttachmentsComponentLabels | null>,
			default: null,
		},
		onAction: {
			type: Function as PropType<(intent: ActionBarActionIntent) => void>,
			required: true,
		},
		onActionMenu: {
			type: Function as PropType<(intent: ActionMenuIntent) => void>,
			required: true,
		},
		onMailto: {
			type: Function as PropType<(intent: MailtoIntent) => void>,
			required: true,
		},
		onAttachmentsRefresh: {
			type: Function as PropType<(intent: AttachmentsRefreshIntent) => void>,
			required: true,
		},
		onAttachmentsIntent: {
			type: Function as PropType<(intent: AttachmentsIntent) => void>,
			required: true,
		},
		onLoadSide: {
			type: Function as PropType<(intent: ThreadLoadSideIntent) => void>,
			required: true,
		},
		onToggleItem: {
			type: Function as PropType<(intent: ThreadToggleItemIntent) => void>,
			required: true,
		},
		onRetryItem: {
			type: Function as PropType<(intent: ThreadRetryItemIntent) => void>,
			required: true,
		},
	},
	template: `
		<MessageViewComponent
			:state="state"
			:thread-state="threadView.state"
			:thread-labels="threadLabels"
			:actions-state="actionsView.state"
			:action-labels="actionLabels"
			:action-legacy-attributes="actionLegacyAttributes"
			:attachments-state="attachmentsView.state"
			:attachment-labels="attachmentLabels"
			@action="onAction"
			@action-menu="onActionMenu"
			@mailto="onMailto"
			@attachments-refresh="onAttachmentsRefresh"
			@attachments-intent="onAttachmentsIntent"
			@load-side="onLoadSide"
			@toggle-item="onToggleItem"
			@retry-item="onRetryItem"
		/>
	`,
});

export class MessageViewScreenApplication implements ScreenApplication
{
	#options: MessageViewOptions;
	#screen: Screen | null = null;
	#container: HTMLElement | null = null;
	#app: VueApplication | null = null;
	#thread: Thread | null = null;
	#threadView: ThreadView | null = null;
	#island: LegacyIsland | null = null;
	#attachmentsIsland: LegacyIsland | null = null;
	#actions: Actions | null = null;
	#actionsView: ActionsView | null = null;
	#attachments: Attachments | null = null;
	#attachmentsView: AttachmentsView | null = null;
	#integrations: PlatformIntegrationRegistry | null = null;
	#nestedLegacyViews: LegacyViewRegistry | null = null;
	#state: MessageViewState | null = null;
	#stateLifecycle: MessageViewStateLifecycle | null;
	#connectedLegacyViews = new WeakSet<LegacyView>();

	constructor(options: MessageViewOptions, stateLifecycle: MessageViewStateLifecycle | null = null)
	{
		this.#options = options;
		this.#stateLifecycle = stateLifecycle;
	}

	bindScreen(screen: Screen): void
	{
		this.#screen = screen;
	}

	start(): void
	{
		const screen = this.#screen;
		if (this.#app || !screen)
		{
			return;
		}

		const container = document.getElementById(this.#options.containerId);
		if (!container)
		{
			return;
		}

		this.#container = container;
		const state = createMessageViewState(this.#options.bootstrap);
		this.#state = state;
		if (this.#stateLifecycle && !this.#stateLifecycle.bind(state))
		{
			throw new TypeError('Message view lifecycle rejected an unrelated state');
		}
		this.#registerSenderAvatarImageFailure(screen, container);
		const legacySeeds = collectLegacySeeds(container);
		const actionLabels = createActionBarLabels(legacySeeds, this.#options.bootstrap);
		const actionLegacyAttributes = createActionBarLegacyAttributes(
			legacySeeds,
			this.#options.bootstrap,
		);
		const attachmentLabels = createAttachmentLabels(
			legacySeeds,
			this.#options.bootstrap,
			this.#options.threadLabels,
		);
		if (actionLabels)
		{
			const legacyControls = findSeedElement(
				legacySeeds,
				this.#options.bootstrap.hosts.actions.id,
				`#${this.#options.bootstrap.domContracts.ids.actions}`,
			);
			if (legacyControls)
			{
				legacyControls.hidden = true;
				removeActionTestIds(legacyControls);
			}
		}

		const topWindow = (window.top ?? window) as LegacyWindow;
		const integrations = new PlatformIntegrationRegistry(
			screen,
			topWindow.BX?.Event?.EventEmitter,
		);
		this.#integrations = integrations;
		this.#nestedLegacyViews = new LegacyViewRegistry(screen);
		const island = new LegacyIsland({ screen, host: container });
		this.#island = island;
		const initialBefore = island.takeTrustedThreadSource(container, 'before');
		const initialAfter = island.takeTrustedThreadSource(container, 'after');
		const thread = this.#createThread(screen);
		this.#createActions(screen);
		this.#createAttachments(screen);
		const beforeCommit = thread.seed('before', initialBefore.map((pair) => toThreadPair(pair)));
		const afterCommit = thread.seed('after', initialAfter.map((pair) => toThreadPair(pair)));
		const beforePairs = partitionInsertedPairs(initialBefore, beforeCommit.insertedIds);
		const afterPairs = partitionInsertedPairs(initialAfter, afterCommit.insertedIds);
		island.discardThreadPairs([...beforePairs.discarded, ...afterPairs.discarded]);
		this.#threadView = reactive({ state: thread.getSnapshot() }) as ThreadView;
		this.#app = this.#createVueApplication(
			state,
			actionLabels,
			actionLegacyAttributes,
			attachmentLabels,
		);
		this.#app.mount(container);
		mountLegacySeeds(container, legacySeeds);
		const legacyControls = document.getElementById(this.#options.bootstrap.domContracts.ids.actions);
		const currentDetails = document.getElementById(
			this.#options.bootstrap.domContracts.ids.currentDetails,
		);
		if (legacyControls && currentDetails)
		{
			Dom.append(legacyControls, currentDetails);
		}
		island.mountThreadPairs(
			[...beforePairs.inserted, ...afterPairs.inserted],
			container,
			screen.captureGeneration(),
		);
		this.#registerMenuListeners(integrations);
		this.#subscribeLegacyViews();
	}

	#createThread(screen: Screen): Thread
	{
		const api = new ComponentApi({ screen });
		const thread = new Thread({
			currentId: this.#options.bootstrap.thread.currentMessageId,
			pageSize: this.#options.bootstrap.thread.pageSize,
			before: this.#options.bootstrap.thread.before,
			after: this.#options.bootstrap.thread.after,
			api,
			mailUfMessageToken: this.#options.mailUfMessageToken,
			lifecycle: screen,
			onChange: (snapshot) => {
				if (this.#threadView)
				{
					this.#threadView.state = snapshot;
				}
			},
		});
		this.#thread = thread;

		return thread;
	}

	#createActions(screen: Screen): void
	{
		const actions = new Actions({
			messageId: this.#options.bootstrap.currentMessage.id,
			mailboxId: this.#options.bootstrap.currentMessage.mailboxId,
			recipients: this.#options.bootstrap.currentMessage.recipients,
			citation: {
				formId: this.#options.bootstrap.hosts.compose.formId,
				quoteFieldName: this.#options.bootstrap.hosts.compose.quoteFieldName,
				available: false,
			},
			isCurrentMessage: true,
			visibility: {
				reply: this.#options.bootstrap.capabilities.reply,
				replyAll: this.#options.bootstrap.capabilities.replyAll,
				forward: this.#options.bootstrap.capabilities.forward,
				more: this.#options.bootstrap.capabilities.more,
				assignLabels: this.#options.bootstrap.capabilities.assignLabels,
				discussInChat: this.#options.bootstrap.capabilities.discussInChat,
				unbind: this.#options.bootstrap.capabilities.unbind,
				markSpam: this.#options.bootstrap.capabilities.markSpam,
				delete: this.#options.bootstrap.capabilities.delete,
			},
			delegates: this.#createActionDelegates(),
			getErrorMessage: getLegacyErrorMessage,
			onChange: (snapshot) => {
				if (this.#actionsView)
				{
					this.#actionsView.state = snapshot;
				}
			},
		});
		this.#actions = actions;
		screen.registerCleanup(() => actions.destroy());
		this.#actionsView = reactive({ state: actions.getSnapshot() }) as ActionsView;
	}

	#createAttachments(screen: Screen): void
	{
		const attachments = new Attachments({
			messageId: this.#options.bootstrap.currentMessage.id,
			host: this.#options.bootstrap.hosts.attachments,
			loader: () => this.#loadAttachmentsWithLegacy(),
			hasInitialContent: (
				this.#options.bootstrap.hosts.attachments.enabled
				&& !this.#options.bootstrap.hosts.attachments.hasDeferredContent
			),
			onTrustedContent: (content) => {
				this.#mountAttachments(content);
			},
			onChange: (snapshot) => {
				if (this.#attachmentsView)
				{
					this.#attachmentsView.state = snapshot;
				}
			},
		});
		this.#attachments = attachments;
		screen.registerCleanup(() => attachments.destroy());
		this.#attachmentsView = reactive({ state: attachments.getSnapshot() }) as AttachmentsView;
	}

	#createVueApplication(
		state: MessageViewState,
		actionLabels: ActionBarLabels | null,
		actionLegacyAttributes: ActionBarLegacyAttributes,
		attachmentLabels: AttachmentsComponentLabels | null,
	): VueApplication
	{
		return BitrixVue.createApp(App, {
			state,
			threadView: this.#threadView,
			threadLabels: this.#options.threadLabels,
			actionsView: this.#actionsView,
			actionLabels,
			actionLegacyAttributes,
			attachmentsView: this.#attachmentsView,
			attachmentLabels,
			onAction: (intent: ActionBarActionIntent) => {
				void this.#handleAction(intent);
			},
			onActionMenu: (intent: ActionMenuIntent) => {
				void this.#actions?.dispatch(intent);
			},
			onMailto: (intent: MailtoIntent) => {
				this.#handleMailto(intent);
			},
			onAttachmentsRefresh: (intent: AttachmentsRefreshIntent) => {
				void this.#handleAttachmentsRefresh(intent);
			},
			onAttachmentsIntent: (intent: AttachmentsIntent) => {
				this.#handleAttachmentsIntent(intent);
			},
			onLoadSide: (intent: ThreadLoadSideIntent) => {
				void this.#loadSide(intent);
			},
			onToggleItem: (intent: ThreadToggleItemIntent) => {
				void this.#toggleItem(intent);
			},
			onRetryItem: (intent: ThreadRetryItemIntent) => {
				void this.#retryItem(intent);
			},
		}) as unknown as VueApplication;
	}

	destroy(): void
	{
		this.#nestedLegacyViews?.destroy();
		this.#app?.unmount();
		this.#stateLifecycle?.dispose();
		this.#app = null;
		this.#thread = null;
		this.#threadView = null;
		this.#island = null;
		this.#attachmentsIsland = null;
		this.#actions = null;
		this.#actionsView = null;
		this.#attachments = null;
		this.#attachmentsView = null;
		this.#integrations = null;
		this.#nestedLegacyViews = null;
		this.#state = null;
		this.#container = null;
	}

	#registerSenderAvatarImageFailure(screen: Screen, container: HTMLElement): void
	{
		const lifecycle = this.#stateLifecycle;
		if (!lifecycle)
		{
			return;
		}

		const handleImageFailure = (event: Event): void => {
			const image = event.target;
			if (!(image instanceof HTMLImageElement))
			{
				return;
			}

			const isSenderImage = Dom.hasClass(image, 'mail-sender-avatar-editor__confirmed-image')
				|| Boolean(image.closest('.mail-msg-view-header-userpic'))
			;
			const url = image.getAttribute('src') ?? '';
			if (isSenderImage && url)
			{
				lifecycle.handleImageFailure(url);
			}
		};

		MainEvent.bind(container, 'error', handleImageFailure, true);
		screen.registerCleanup(() => MainEvent.unbind(container, 'error', handleImageFailure, true));
	}

	#createActionDelegates(): ActionDelegates
	{
		return {
			reply: () => this.#invokeLegacyControl('.js-msg-view-control-reply'),
			replyAll: () => this.#invokeLegacyControl('.js-msg-view-control-replyall'),
			forward: () => this.#invokeLegacyControl('.js-msg-view-control-forward'),
			assignLabels: () => Promise.resolve(),
			discussInChat: () => this.#invokeLegacyControl('.js-mail-discuss-in-chat'),
			unbind: () => this.#invokeLegacyControl('.js-msg-view-control-skip'),
			markSpam: () => this.#invokeLegacyAction('.js-msg-view-control-spam'),
			delete: () => this.#invokeLegacyAction('.js-msg-view-control-delete'),
		};
	}

	#invokeLegacyControl(selector: string): void
	{
		const controlBlock = document.getElementById(this.#options.bootstrap.domContracts.ids.actions);
		const control = controlBlock?.querySelector(selector);
		if (!(control instanceof HTMLElement))
		{
			throw new TypeError(`Legacy message action is unavailable: ${selector}`);
		}

		control.click();
	}

	#invokeLegacyAction(selector: string): Promise<void>
	{
		const view = this.#getCurrentLegacyView();
		if (!view?.invokeActionForState)
		{
			throw new TypeError(`Legacy message action bridge is unavailable: ${selector}`);
		}

		return view.invokeActionForState(selector);
	}

	#handleMailto(intent: MailtoIntent): void
	{
		this.#getCurrentLegacyView()?.openMailComposer?.(intent.email);
	}

	#getCurrentLegacyView(): LegacyView | undefined
	{
		return (window as LegacyWindow).BXMailView?.getView?.(
			this.#options.bootstrap.currentMessage.id,
		);
	}

	async #handleAction(intent: ActionBarActionIntent): Promise<void>
	{
		if (intent.type === 'retry')
		{
			await this.#actions?.dispatch(intent);

			return;
		}

		await this.#actions?.dispatch(intent as ActionIntent);
	}

	async #handleAttachmentsRefresh(intent: AttachmentsRefreshIntent): Promise<void>
	{
		const attachments = this.#attachments;
		if (
			!attachments
			|| intent.messageId !== this.#options.bootstrap.currentMessage.id
			|| intent.generation !== attachments.getState().generation
		)
		{
			return;
		}

		if (intent.type === 'retry')
		{
			await attachments.retry();

			return;
		}

		await attachments.refresh();
	}

	#handleAttachmentsIntent(intent: AttachmentsIntent): void
	{
		if (intent.messageId !== this.#options.bootstrap.currentMessage.id)
		{
			return;
		}

		const selector = intent.type === 'archive'
			? '[data-testid="mail-message-view-download-archive"]'
			: null
		;
		if (selector)
		{
			const control = this.#container?.querySelector(selector);
			if (control instanceof HTMLElement)
			{
				control.click();
			}
		}
	}

	#registerMenuListeners(integrations: PlatformIntegrationRegistry): void
	{
		const handleOutsideClick = (event: Event): void => {
			if (!this.#actions?.getState().menu.open)
			{
				return;
			}

			const root = this.#container?.querySelector('[data-testid="mail-message-view-action-bar"]');
			if (event.target instanceof Node && root?.contains(event.target))
			{
				return;
			}

			void this.#actions.dispatch({
				type: 'menu-close',
				reason: 'outside',
				returnFocus: false,
			});
		};

		const handleEscape = (event: Event): void => {
			if (
				!(event instanceof KeyboardEvent)
				|| event.key !== 'Escape'
				|| !this.#actions?.getState().menu.open
			)
			{
				return;
			}

			event.preventDefault();
			void this.#actions.dispatch({
				type: 'menu-close',
				reason: 'escape',
				returnFocus: true,
			});
		};

		integrations.registerNativeEvent(document, 'click', handleOutsideClick);
		integrations.registerNativeEvent(document, 'keydown', handleEscape);
	}

	#subscribeLegacyViews(): void
	{
		const screen = this.#screen;
		const facade = (window as LegacyWindow).BXMailView;
		if (!screen || !facade)
		{
			return;
		}

		if (facade.subscribeViewReady)
		{
			const unsubscribe = facade.subscribeViewReady((view) => this.#connectLegacyView(view));
			screen.registerCleanup(unsubscribe);

			return;
		}

		const currentView = facade.getView?.(this.#options.bootstrap.currentMessage.id);
		if (currentView)
		{
			this.#connectLegacyView(currentView);
		}
	}

	#connectLegacyView(view: LegacyView): void
	{
		const screen = this.#screen;
		const integrations = this.#integrations;
		if (!screen || !integrations || this.#connectedLegacyViews.has(view))
		{
			return;
		}

		this.#connectedLegacyViews.add(view);
		const generation = screen.captureGeneration();
		const isCurrent = String(view.id) === String(this.#options.bootstrap.currentMessage.id);
		const nestedViewId = !isCurrent && (Type.isString(view.id) || Type.isNumber(view.id))
			? view.id
			: null
		;
		const bridge = isCurrent ? this.#createCurrentLegacyBridge(generation) : {
			onAttachmentsLoading: () => {},
			onAttachmentsResponse: (response: AttachmentsResponse) => {
				return this.#acceptNestedAttachments(view, response, generation);
			},
		};
		view.setIntegrationBridge?.(bridge);
		const nestedCleanupActions: CleanupAction[] = [];
		const clearBridge = (): void => view.setIntegrationBridge?.(null);
		if (nestedViewId === null)
		{
			screen.registerCleanup(clearBridge);
		}
		else
		{
			nestedCleanupActions.push(clearBridge);
		}

		if (isCurrent && view.slider)
		{
			integrations.registerSlider(view.slider);
		}

		const formId = view.options?.formId;
		const legacyWindow = window as LegacyWindow;
		const form = Type.isStringFilled(formId) ? legacyWindow.BXMainMailForm?.getForm?.(formId) : null;
		if (form)
		{
			const releaseForm = integrations.registerForm(form);
			if (nestedViewId !== null)
			{
				nestedCleanupActions.push(releaseForm);
			}
		}

		if (nestedViewId !== null)
		{
			nestedCleanupActions.push(() => view.destroy?.());
			this.#nestedLegacyViews?.register(nestedViewId, nestedCleanupActions);
		}
	}

	#createCurrentLegacyBridge(generation: number): LegacyIntegrationBridge
	{
		const screen = this.#screen;

		return {
			onCrmExcluded: () => {
				screen?.guardCompletion(generation, () => {
					this.#actions?.setVisibility('unbind', false);
				});
			},
			onBodyLoading: () => {
				screen?.guardCompletion(generation, () => {
					if (this.#state)
					{
						this.#state.body.status = 'loading';
						this.#state.body.error = null;
					}
				});
			},
			onBodyResponse: (response) => {
				screen?.guardCompletion(generation, () => {
					if (this.#state)
					{
						this.#state.body.status = response.status === 'success' ? 'ready' : 'failed';
						this.#state.body.error = response.status === 'network'
							? getLegacyErrorMessage(response.error)
							: null
						;
					}
				});
			},
			onAttachmentsLoading: () => {
				screen?.guardCompletion(generation, () => this.#attachments?.beginExternalLoad());
			},
			onAttachmentsResponse: (response) => {
				let handled = false;
				screen?.guardCompletion(generation, () => {
					this.#attachments?.acceptExternal(response);
					handled = true;
				});

				return handled;
			},
		};
	}

	#acceptNestedAttachments(
		view: LegacyView,
		response: AttachmentsResponse,
		generation: number,
	): boolean
	{
		const screen = this.#screen;
		let handled = false;
		screen?.guardCompletion(generation, () => {
			handled = true;
			const hostId = view.options?.ajaxAttachmentElementId;
			const host = Type.isStringFilled(hostId) ? document.getElementById(hostId) : null;
			if (!host)
			{
				return;
			}

			if (response.status === 'network')
			{
				const messageId = Number(view.id);
				if (Number.isInteger(messageId))
				{
					this.#thread?.markItemLoadFailed(messageId, {
						status: 'error',
						kind: 'network',
						errors: [],
						cause: response.error,
						generation,
					});
				}

				return;
			}

			if (!Type.isString(response.attachmentsHtml) || response.attachmentsHtml === '')
			{
				return;
			}

			const island = new LegacyIsland({ screen, host });
			island.mountTrustedComponentResponse({
				html: response.attachmentsHtml,
				source: 'componentAction',
			}, generation);
		});

		return handled;
	}

	async #loadAttachmentsWithLegacy(): Promise<AttachmentsResponse>
	{
		const view = (window as LegacyWindow).BXMailView?.getView?.(
			this.#options.bootstrap.currentMessage.id,
		);
		if (view?.loadAttachmentsForState)
		{
			return view.loadAttachmentsForState();
		}

		return {
			status: 'network',
			error: new Error('Legacy attachments loader is unavailable'),
		};
	}

	#mountAttachments(content: TrustedComponentContent): void
	{
		const screen = this.#screen;
		const hostId = this.#options.bootstrap.hosts.attachments.ajaxContainerId;
		const host = hostId ? document.getElementById(hostId) : null;
		if (!screen || !host)
		{
			return;
		}

		this.#attachmentsIsland ??= new LegacyIsland({ screen, host });
		const mounted = this.#attachmentsIsland.mountTrustedComponentResponse(
			content,
			screen.captureGeneration(),
		);
		if (mounted)
		{
			this.#getCurrentLegacyView()?.finalizeAttachmentsIntegration?.();
		}
	}

	async #loadSide(intent: ThreadLoadSideIntent): Promise<void>
	{
		const thread = this.#thread;
		const island = this.#island;
		const container = this.#container;
		const screen = this.#screen;
		if (!thread || !island || !container || !screen)
		{
			return;
		}

		const generation = screen.captureGeneration();
		const result = await thread.loadSide(intent.side);
		if (result.status !== 'success')
		{
			return;
		}

		const pairs = island.createThreadPairsFromTrustedComponentResponse(result.content, intent.side);
		const anchor = container.querySelector(`#${this.#options.bootstrap.domContracts.ids.currentDetails}`);
		const scrollable = container.querySelector('.mail-msg-view-scroll-area');
		const anchorBefore = Type.isElementNode(anchor) ? anchor.getBoundingClientRect().top : 0;
		const commit = thread.commitServerPage(
			intent.side,
			pairs.map((pair) => toThreadPair(pair)),
			anchorBefore,
			anchorBefore,
		);
		const partitioned = partitionInsertedPairs(pairs, commit.insertedIds);
		island.discardThreadPairs(partitioned.discarded);
		await nextTick();
		island.mountThreadPairs(partitioned.inserted, container, generation);
		await nextTick();

		if (Type.isElementNode(anchor) && Type.isElementNode(scrollable))
		{
			const anchorAfter = anchor.getBoundingClientRect().top;
			scrollable.scrollTop += anchorAfter - anchorBefore;
		}
	}

	async #toggleItem(intent: ThreadToggleItemIntent): Promise<void>
	{
		const action = this.#thread?.toggleItem(intent.id);
		if (!action || action === 'missing')
		{
			return;
		}

		const expanded = action !== 'collapsed';
		this.#island?.setThreadPairExpanded(intent.side, intent.id, expanded);
		if (action === 'load')
		{
			await this.#loadItem(intent.id, intent.side, false);
		}
	}

	async #retryItem(intent: ThreadRetryItemIntent): Promise<void>
	{
		this.#island?.setThreadPairExpanded(intent.side, intent.id, true);
		await this.#loadItem(intent.id, intent.side, true);
	}

	async #loadItem(id: number, side: ThreadToggleItemIntent['side'], retry: boolean): Promise<void>
	{
		const thread = this.#thread;
		const island = this.#island;
		const screen = this.#screen;
		if (!thread || !island || !screen)
		{
			return;
		}

		const generation = screen.captureGeneration();
		const result = retry ? await thread.retryItem(id) : await thread.loadItem(id);
		if (result.status !== 'success')
		{
			return;
		}

		await nextTick();
		this.#nestedLegacyViews?.release(id);
		island.mountThreadDetails(result.content, side, id, generation);
	}
}
