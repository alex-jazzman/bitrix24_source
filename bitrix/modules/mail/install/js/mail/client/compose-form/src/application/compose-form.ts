import { Dom, Event, Runtime, Type } from 'main.core';
import { EventEmitter } from 'main.core.events';
import { Loader } from 'main.loader';
import { type MessageEvent, SidePanel, type Slider, type SliderEvent } from 'main.sidepanel';
import { BitrixVue } from 'ui.vue3';

import {
	type LargeAttachment,
	type LargeAttachmentFormAdapter,
	type LargeAttachmentParams,
} from 'mail.client.large-attachment';
import { getMigrationState } from 'mail.migration-state';

import { App } from './app';
import { ComposeFormEvent } from '../const/event';
import { AutoApplyTemplate } from '../feature/auto-apply-template/auto-apply-template';
import { closeComposeForm, closeComposeFormKey, releaseComposeForm } from '../feature/close-form/close-form';
import { DraftIntegration } from '../feature/draft-integration/draft-integration';
import { DraftBridgeEvent } from '../feature/draft-integration/draft-compose-adapter';
import { type ComposeEditorAdapter, type EditorUnsubscribe } from '../infrastructure/adapter/editor/types';
import {
	largeAttachmentGateKey,
	LargeAttachmentAdapter,
	type LargeAttachmentSendGate,
} from '../infrastructure/adapter/large-attachment/large-attachment';
import { loc } from '../lib/loc/loc';
import { composeStateKey, createComposeState, isLargeAttachmentEnabled } from '../model/compose/compose';
import { type ComposeInitialData, type ComposeState } from '../model/compose/types';

/** Options passed by the compose screen template: ids of the server-rendered markup and initial data. */
export type ComposeFormOptions = {
	containerId: string,
	formId: string,
	editorFormId: string,
	editorId: string,
	initialData: ComposeInitialData,
};

/**
 * Mount result of the root component. The editor adapter is created in its `setup()`, and code outside
 * the application reuses that instance instead of creating a second one.
 */
type ComposeRootInstance = {
	editor: ComposeEditorAdapter,
};

/**
 * The core of the large attachments comes with the compose template and only when the feature is on, so the
 * form does not depend on the extension and asks `main.core` for it at the moment it starts the scenario.
 */
type LargeAttachmentExtension = {
	LargeAttachment: {
		init(params: LargeAttachmentParams, formAdapter?: LargeAttachmentFormAdapter): LargeAttachment,
	},
};

type VueApplication = {
	config: {
		globalProperties: {
			loc?: (phraseCode: string, replacements?: Record<string, string>) => string,
		},
	},
	provide(key: symbol, value: unknown): void,
	mount(rootContainer: Element | string): ComposeRootInstance,
	unmount(): void,
};

/** Mark the wrapper nodes `compose-form.css` gives a height to, so the form fills the panel. */
const FrameClass = 'mail-compose-form-frame';
const ShellClass = 'mail-compose-form-shell';

const SliderMessageEvent = 'SidePanel.Slider:onMessage';

/** Cancelable request fired before a panel agrees to close. */
const SliderCanCloseEvent = 'SidePanel.Slider:onClose';

/**
 * Fired once the panel has agreed to close, whoever asked for it: its own close control, Escape, or the form
 * itself. The panel still stands in the stack at that moment, so its cache can still be turned off.
 */
const SliderCloseEvent = 'SidePanel.Slider:onCloseStart';

/**
 * Messages of the mailbox settings panel. It opens over the form, so its answer reaches the form and
 * nothing above it; the form re-posts them upwards.
 */
const RelayedSliderMessages = new Set(['mail-mailbox-config-success', 'mail-mailbox-config-delete']);

export class ComposeForm
{
	#options: ComposeFormOptions;
	#app: VueApplication | null = null;
	#state: ComposeState | null = null;
	#shellNodes: HTMLElement[] = [];
	#largeAttachment: LargeAttachmentAdapter | null = null;
	#slider: Slider | null = null;
	#draft: DraftIntegration | null = null;
	#autoApply: AutoApplyTemplate | null = null;
	#formNode: HTMLElement | null = null;
	#editorSubscriptions: EditorUnsubscribe[] = [];
	#draftLoader: Loader | null = null;
	#draftLoaderTarget: HTMLElement | null = null;
	#panelClosePending: boolean = false;
	#panelCloseApproved: boolean = false;
	#migrationStateUnsubscribes: Array<() => void> = [];

	constructor(options: ComposeFormOptions)
	{
		this.#options = options;
	}

	start(): void
	{
		// A second start would mount a second application over the first one and subscribe to the panel
		// messages twice.
		if (this.#app)
		{
			return;
		}

		const container = document.getElementById(this.#options.containerId);
		if (!container)
		{
			return;
		}

		this.#markLayout(container);
		this.#formNode = document.getElementById(this.#options.formId);
		if (this.#formNode)
		{
			Event.bind(this.#formNode, 'input', this.#handleUserInput);
		}

		this.#state = createComposeState(this.#options.initialData);
		this.#subscribeToMigrationState(this.#state);
		this.#state.draft.isLoading = Type.isStringFilled(this.#state.draft.clientId) && this.#state.draft.id > 0;
		this.#draftLoaderTarget = this.#formNode ?? container.parentElement ?? container;
		if (this.#state.draft.isLoading)
		{
			this.#showDraftLoader();
		}
		this.#app = BitrixVue.createApp(App, {
			editorId: this.#options.editorId,
			formId: this.#options.formId,
			// `main.post.form` names the Disk uploader control after the editor form, not after the form id.
			uploaderControlId: this.#options.editorFormId,
		}) as unknown as VueApplication;
		this.#app.config.globalProperties.loc = loc;
		this.#app.provide(composeStateKey, this.#state);
		this.#app.provide(largeAttachmentGateKey, this.#resolveLargeAttachmentGate);
		this.#app.provide(closeComposeFormKey, this.#closeForm);
		const root = this.#app.mount(container);
		this.#editorSubscriptions = [
			root.editor.subscribeContentChange(this.#handleUserInput),
			root.editor.subscribeFileAdd(this.#handleUserInput),
			root.editor.subscribeFileRemove(this.#handleUserInput),
		];

		EventEmitter.subscribe(SliderMessageEvent, this.#relaySliderMessage, { compatMode: true });
		this.#watchPanelClose();

		this.#startDraftAndAutoApply(root, this.#state);
	}

	destroy(): void
	{
		this.#autoApply?.destroy();
		this.#autoApply = null;
		if (this.#formNode)
		{
			Event.unbind(this.#formNode, 'input', this.#handleUserInput);
		}
		this.#formNode = null;
		this.#editorSubscriptions.forEach((unsubscribe): void => unsubscribe());
		this.#editorSubscriptions = [];
		EventEmitter.unsubscribe(SliderMessageEvent, this.#relaySliderMessage);
		this.#unwatchPanelClose();

		// The large attachment core tears itself down on this event: it owns the sets uploaded to Disk, and a
		// conversion finishing after the form is gone still has to be cleaned up.
		EventEmitter.emit(ComposeFormEvent.Destroy, { formId: this.#options.formId });
		this.#draft?.destroy();
		this.#draft = null;
		this.#hideDraftLoader();
		this.#draftLoaderTarget = null;
		this.#largeAttachment = null;

		this.#app?.unmount();
		this.#app = null;
		this.#migrationStateUnsubscribes.forEach((unsubscribe): void => unsubscribe());
		this.#migrationStateUnsubscribes = [];
		this.#state = null;
		this.#unmarkLayout();
	}

	#subscribeToMigrationState(state: ComposeState): void
	{
		const migrationActiveByMailboxId = state.migrationActiveByMailboxId;
		const mailboxIds = new Set<number>([
			Number(state.mailbox.id ?? 0),
			Number(state.send.mailboxId ?? 0),
			...state.senders.map((sender): number => Number(sender.mailboxId ?? 0)),
		].filter((mailboxId): boolean => Number.isInteger(mailboxId) && mailboxId > 0));

		mailboxIds.forEach((mailboxId): void => {
			const migrationState = getMigrationState(mailboxId);
			migrationActiveByMailboxId[mailboxId] = migrationState.isActive();
			this.#migrationStateUnsubscribes.push(migrationState.subscribe((change): void => {
				migrationActiveByMailboxId[mailboxId] = change.active;
			}));
			void migrationState.initialize();
		});
	}

	#startDraftAndAutoApply(root: ComposeRootInstance, state: ComposeState): void
	{
		const draft = new DraftIntegration({
			formId: this.#options.formId,
			state,
			editor: root.editor,
			getLargeAttachments: () => this.#largeAttachment?.getDraftState() ?? null,
			onLoadingChange: this.#handleDraftLoadingChange,
			completeRestore: async (result): Promise<void> => {
				await this.#startLargeAttachments(root, state, result.largeAttachments ?? []);
			},
		});
		this.#draft = draft;

		// A restored draft owns the letter, so the last template is applied only to a compose that stayed
		// empty: the gate waits for the restore to report itself either way.
		const autoApply = new AutoApplyTemplate({
			editor: root.editor,
			state,
			formId: this.#options.formId,
			draftRestore: draft.restore,
		});
		this.#autoApply = autoApply;

		void draft.start();
		void autoApply.start();
	}

	#handleDraftLoadingChange = (loading: boolean): void => {
		if (loading)
		{
			this.#showDraftLoader();

			return;
		}

		this.#hideDraftLoader();
	};

	#showDraftLoader(): void
	{
		if (!this.#draftLoaderTarget || this.#draftLoader)
		{
			return;
		}

		this.#draftLoader = new Loader({ target: this.#draftLoaderTarget });
		Dom.attr(this.#draftLoader.layout, 'aria-hidden', 'true');
		void this.#draftLoader.show();
	}

	#hideDraftLoader(): void
	{
		this.#draftLoader?.destroy();
		this.#draftLoader = null;
	}

	#handleUserInput = (): void => {
		this.#autoApply?.markUserInput();
		if (!this.#state?.draft.isLoading)
		{
			EventEmitter.emit(ComposeFormEvent.Changed, {
				formId: this.#options.formId,
				reason: 'user',
			});
		}
	};

	/**
	 * Called after the application is mounted: the adapter reads the file set and the message body through
	 * the editor adapter, which belongs to the application.
	 */
	async #startLargeAttachments(
		root: ComposeRootInstance,
		state: ComposeState,
		draftLargeAttachments: LargeAttachmentParams['draftLargeAttachments'] = [],
	): Promise<void>
	{
		if (!isLargeAttachmentEnabled(state))
		{
			return;
		}

		const { largeAttachment, limits, mailbox, messageId } = state;
		const adapter = new LargeAttachmentAdapter({
			formId: this.#options.formId,
			containerId: this.#options.containerId,
			editor: root.editor,
			showAha: largeAttachment.showAha,
			ahaOptionName: largeAttachment.ahaOptionName,
		});

		this.#largeAttachment = adapter;

		try
		{
			const extension = await (
				Runtime.loadExtension('mail.client.large-attachment') as unknown as Promise<LargeAttachmentExtension>
			);
			// The screen may have been taken down while the core was on its way.
			if (this.#largeAttachment !== adapter)
			{
				return;
			}

			// The core keys its instances by form id and destroys the previous one for the same id.
			adapter.setCore(extension.LargeAttachment.init({
				formId: this.#options.formId,
				// Same id as the Disk uploader control gets in `main.post.form`.
				uploaderControlId: this.#options.editorFormId,
				messageId,
				featureAvailable: largeAttachment.featureAvailable,
				folderName: largeAttachment.folderName,
				// The core's "large" threshold mirrors the server check, so the limit is passed through
				// unchanged.
				maxSize: limits.maxAttachmentsSize,
				mailboxId: mailbox.id,
				postSendPromptSuppressed: largeAttachment.postSendPromptSuppressed,
				postSendPromptOptionName: largeAttachment.postSendPromptOptionName,
				draftLargeAttachments,
			}, adapter));
		}
		catch
		{
			// The optional large-attachment extension must not leave the compose form locked.
		}
	}

	/**
	 * Only this class can take the form down, so closing is provided to the application from here. The exit
	 * paths are read before `destroy()`, which drops the state.
	 */
	#closeForm = async (): Promise<void> => {
		const state = this.#state;
		if (!state)
		{
			return;
		}

		if (!(await this.#flushBeforeClose()))
		{
			return;
		}

		closeComposeForm({
			destroyForm: (): void => {
				this.destroy();
			},
			paths: state.paths,
		});
	};

	async #flushBeforeClose(): Promise<boolean>
	{
		const pending: Promise<void>[] = [];
		let prevented = false;
		EventEmitter.emit(DraftBridgeEvent.BeforeClose, {
			formId: this.#options.formId,
			data: {
				waitUntil: (promise: Promise<void>): void => {
					pending.push(promise);
				},
				preventDefault: (): void => {
					prevented = true;
				},
			},
		});
		await Promise.all(pending);

		return !prevented;
	}

	/**
	 * The panel has ways out of its own — its close control and Escape — and neither asks the form first.
	 * The form is taken down on them all the same, so a panel opened at this address again starts empty.
	 */
	#watchPanelClose(): void
	{
		this.#slider = SidePanel.Instance.getSliderByWindow(window);
		if (this.#slider)
		{
			EventEmitter.subscribe(this.#slider, SliderCanCloseEvent, this.#handlePanelCanClose, { compatMode: true });
			EventEmitter.subscribe(this.#slider, SliderCloseEvent, this.#handlePanelClose);
		}
	}

	#unwatchPanelClose(): void
	{
		if (this.#slider)
		{
			EventEmitter.unsubscribe(this.#slider, SliderCanCloseEvent, this.#handlePanelCanClose);
			EventEmitter.unsubscribe(this.#slider, SliderCloseEvent, this.#handlePanelClose);
			this.#slider = null;
		}
		this.#panelClosePending = false;
		this.#panelCloseApproved = false;
	}

	#handlePanelCanClose = (sliderEvent: SliderEvent): void => {
		if (!sliderEvent || this.#panelCloseApproved || !this.#state)
		{
			this.#panelCloseApproved = false;

			return;
		}

		sliderEvent.denyAction();
		if (this.#panelClosePending)
		{
			return;
		}

		this.#panelClosePending = true;
		const slider = this.#slider;
		void this.#flushBeforeClose().then((allowed: boolean): void => {
			this.#panelClosePending = false;
			if (allowed && slider && slider === this.#slider && this.#state)
			{
				this.#panelCloseApproved = true;
				slider.close();
			}
		}).catch((): void => {
			this.#panelClosePending = false;
		});
	};

	/** The panel is closing already, so the form only takes itself down and leaves the closing alone. */
	#handlePanelClose = (): void => {
		if (!this.#state)
		{
			return;
		}

		releaseComposeForm((): void => {
			this.destroy();
		});
	};

	/**
	 * Provided as a resolver rather than the instance: the adapter appears only after the application is
	 * mounted, and never at all when the feature is off.
	 */
	#resolveLargeAttachmentGate = (): LargeAttachmentSendGate | null => this.#largeAttachment;

	#relaySliderMessage = (event: MessageEvent): void => {
		const eventId = event.getEventId();
		if (eventId !== null && RelayedSliderMessages.has(eventId))
		{
			SidePanel.Instance.postMessage(window, eventId, event.getData() ?? {});
		}
	};

	#markLayout(container: HTMLElement): void
	{
		const form = document.getElementById(this.#options.formId);
		this.#shellNodes = form ? [form, container] : [container];

		Dom.addClass(document.body, FrameClass);
		this.#shellNodes.forEach((node) => {
			Dom.addClass(node, ShellClass);
		});
	}

	#unmarkLayout(): void
	{
		Dom.removeClass(document.body, FrameClass);
		this.#shellNodes.forEach((node) => {
			Dom.removeClass(node, ShellClass);
		});
		this.#shellNodes = [];
	}
}
