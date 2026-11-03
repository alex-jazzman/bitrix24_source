import { Dom, Loc, Text, Type } from 'main.core';
import { Loader } from 'main.loader';
import { BitrixVue, markRaw } from 'ui.vue3';

import { Api } from './api';
import { App, type VacationAutoReplyAppControl } from './application/app';
import { resolveTimezoneId } from './period';
import {
	createSaveFailureHandler,
	createScreenStateData,
	describeFailure,
	describeSaveBlock,
	type FieldErrorTargets,
	parseSaveFailure,
	parseLoadFailure,
	renderFieldErrors,
	ScreenState,
	type ScreenStateData,
	ScreenStatus,
	type ScreenStatusValue,
} from './state';
import { type SaveContext, VacationAutoReplyTransport } from './transport';
import {
	type GetSettingResponse,
	type SaveActiveFlag,
	type ScreenParams,
	type VacationAutoReplySetting,
} from './types';

import './style.css';

/** Role the component template marks the existing BXHtmlEditor container with. */
const EDITOR_ROLE = 'mail-vacation-auto-reply-editor';

/** The save button belongs to the slider panel and is named by its type. */
const SAVE_BUTTON_ID = 'ui-button-panel-save';
const SAVE_BUTTON_WAIT_CLASS = 'ui-btn-wait';

const TestId = Object.freeze({
	loader: 'mail-vacation-auto-reply-loader',
});

type VueApplication = {
	mount(rootContainer: Element | string): VacationAutoReplyAppControl,
	unmount(): void,
};

type PeriodRequest = {
	startsAt: string,
	endsAt: string,
};

function loc(phrase: string): string
{
	return Loc.getMessage(phrase) ?? '';
}

/**
 * The slider button outlives this screen, so the screen must return the attributes it added.
 */
function releaseSaveState(save: HTMLElement | null): void
{
	if (save === null)
	{
		return;
	}

	Dom.attr(save, 'aria-disabled', null);
	Dom.attr(save, 'aria-describedby', null);
}

/**
 * The screen of the vacation auto-reply: public facade, state owner and common lifecycle owner.
 */
export class Screen
{
	static #instance: Screen | null = null;

	#params: ScreenParams;
	#stateData: ScreenStateData = createScreenStateData();
	#state: ScreenState = new ScreenState(this.#stateData);
	#app: VueApplication | null = null;
	#root: VacationAutoReplyAppControl | null = null;
	#appContainer: HTMLElement;
	#loader: Loader | null = null;
	#saveRequest: number = 0;
	#preparedSaveRequest: SaveContext | null = null;
	#destroyed: boolean = false;

	static init(params: ScreenParams): void
	{
		const container = document.getElementById(String(params?.containerId ?? ''));
		if (container === null)
		{
			return;
		}

		Screen.#instance?.destroy();
		Screen.#instance = new Screen(params, container);
	}

	/** Entry point of the save button of the slider. */
	static save(): void
	{
		Screen.#instance?.save();
	}

	constructor(params: ScreenParams, container: HTMLElement)
	{
		this.#params = params;
		this.#appContainer = container;

		const handleSaveFailure = createSaveFailureHandler(
			this.#state,
			(): FieldErrorTargets => this.#errorTargets(),
			(): number => this.#saveRequest,
		);
		const transport = markRaw(new VacationAutoReplyTransport({
			readForm: (payload): SaveContext => this.#readForm(payload.signature),
			onStarted: (): void => this.#beginSave(),
			onSaved: (setting: VacationAutoReplySetting): void => this.#applySaved(setting),
			onFailure: (failure): void => {
				const wasSaving = this.#state.isSaving();
				try
				{
					handleSaveFailure(failure);
				}
				finally
				{
					this.#releaseCompletedSave(wasSaving);
				}
			},
		}));

		this.#root = this.#mountApplication(container, transport);

		const mailboxId = Text.toInteger(params.mailboxId);
		if (mailboxId > 0)
		{
			void this.#load(mailboxId);
		}
		else
		{
			this.#state.markEmpty();
			this.#showStatus();
		}
	}

	#mountApplication(
		container: HTMLElement,
		transport: VacationAutoReplyTransport,
	): VacationAutoReplyAppControl
	{
		const editorNode = this.#findEditorNode();
		this.#app = BitrixVue.createApp(App, {
			state: this.#stateData,
			mailboxListPath: String(this.#params.mailboxListPath ?? ''),
			timezoneId: String(this.#params.timezoneId ?? ''),
			editorId: String(this.#params.editorId ?? ''),
			editorNode: editorNode === null ? null : markRaw(editorNode),
			transport,
			retryHandler: (): void => this.#handleRetry(),
			selectMailboxHandler: (mailboxId: number): void => this.#handleMailboxChange(mailboxId),
			activeChangeHandler: (active: boolean): void => this.#handleActiveChange(active),
		}) as unknown as VueApplication;

		return this.#app.mount(container);
	}

	#findEditorNode(): HTMLElement | null
	{
		const node = document.querySelector(`[data-role="${EDITOR_ROLE}"]`);

		return Type.isElementNode(node) ? node as HTMLElement : null;
	}

	save(): void
	{
		const blocked = this.#describeSaveBlock();
		if (blocked !== '')
		{
			this.#root?.showEditorError(blocked);
			this.#releaseSaveButtonWaitIfIdle();

			return;
		}

		try
		{
			this.#preparedSaveRequest = this.#createSaveRequest();
		}
		catch (reason)
		{
			this.#preparedSaveRequest = null;
			this.#showGeneralSaveError(reason);
			this.#releaseSaveButtonWaitIfIdle();

			return;
		}

		try
		{
			if (this.#root?.saveEditor() !== true)
			{
				this.#preparedSaveRequest = null;
			}
		}
		catch (reason)
		{
			this.#preparedSaveRequest = null;
			this.#showGeneralSaveError(reason);
		}
		this.#releaseSaveButtonWaitIfIdle();
	}

	#describeSaveBlock(): string
	{
		if (this.#destroyed || this.#root === null)
		{
			return loc('MAIL_VACATION_AUTO_REPLY_SAVE_WAIT');
		}

		return describeSaveBlock(this.#state);
	}

	/**
	 * Names the save the screen waits for. The transport calls this only after the editor has read the
	 * body, so failed editor reads do not leave the screen waiting for a request that never left.
	 */
	#beginSave(): void
	{
		this.#saveRequest = this.#state.beginSaving();
		this.#syncEditableState();
	}

	destroy(): void
	{
		if (this.#destroyed)
		{
			return;
		}

		this.#destroyed = true;
		if (Screen.#instance === this)
		{
			Screen.#instance = null;
		}

		this.#state.stopWaiting();
		this.#preparedSaveRequest = null;
		releaseSaveState(this.#saveButton());
		this.#releaseSaveButtonWait();
		this.#loader?.destroy();
		this.#loader = null;
		this.#app?.unmount();
		this.#app = null;
		this.#root = null;
	}

	async #load(mailboxId: number): Promise<void>
	{
		const request = this.#state.beginLoading(mailboxId);
		this.#root?.clearEditorError();
		this.#showStatus();

		const loaded = await this.#read(request, mailboxId);
		if (!loaded)
		{
			return;
		}

		this.#applySetting();
		this.#showStatus();
	}

	/**
	 * Puts the setting of the mailbox into the state. Rendering errors after the read are not read
	 * errors and must not be shown as transport failures.
	 *
	 * @returns whether the answer is the one the screen is still waiting for.
	 */
	async #read(request: number, mailboxId: number): Promise<boolean>
	{
		try
		{
			const response: GetSettingResponse = await Api.get(mailboxId);

			return this.#state.applyLoaded(request, response);
		}
		catch (reason)
		{
			if (this.#state.failLoading(request, parseLoadFailure(reason)))
			{
				this.#showStatus();
			}

			return false;
		}
	}

	/** The values of the form accepted by the save action. */
	#createSaveRequest(body: string | null = null): SaveContext
	{
		if (this.#root === null)
		{
			throw new Error('Vacation auto-reply application is not mounted.');
		}

		const setting = this.#state.getSetting();
		const period = this.#readPeriod(setting);
		const editorBody = body ?? this.#root.getEditorBody();

		return {
			mailboxId: this.#state.getSelectedMailboxId(),
			active: this.#activeFlag(this.#root.getActive()),
			startsAt: period.startsAt,
			endsAt: period.endsAt,
			timezoneId: this.#timezoneId(),
			body: editorBody,
		};
	}

	#readForm(body: string): SaveContext
	{
		const request = this.#preparedSaveRequest;
		this.#preparedSaveRequest = null;

		return request ?? this.#createSaveRequest(body);
	}

	#activeFlag(active: boolean): SaveActiveFlag
	{
		return active ? 1 : 0;
	}

	#readPeriod(setting: VacationAutoReplySetting | null): PeriodRequest
	{
		return this.#root?.getPeriodRequest(setting) ?? {
			startsAt: '',
			endsAt: '',
		};
	}

	#applySaved(setting: VacationAutoReplySetting): void
	{
		const wasSaving = this.#state.isSaving();
		const applied = this.#state.applySaved(this.#saveRequest, setting);
		this.#releaseCompletedSave(wasSaving);
		if (!applied)
		{
			return;
		}

		this.#root?.clearEditorError();
		this.#applySetting();
	}

	/** Timezone the period is shown and sent in; screen parameters provide it until the first response. */
	#timezoneId(): string
	{
		return resolveTimezoneId(this.#state.getSetting()?.timezoneId, this.#params.timezoneId);
	}

	/** Puts the loaded setting on the screen: active flag, period, body and editable state. */
	#applySetting(): void
	{
		const setting = this.#state.getSetting();
		if (setting === null)
		{
			return;
		}

		if (this.#root?.applySetting(setting) === false)
		{
			this.#root?.showEditorError(loc('MAIL_VACATION_AUTO_REPLY_LOAD_ERROR'));
		}

		this.#renderFieldErrors();
		this.#syncEditableState();
	}

	#handleActiveChange(active: boolean): void
	{
		const setting = this.#state.getSetting();
		if (setting?.canEdit === true)
		{
			setting.active = active;
		}

		this.#root?.clearEditorError();
		this.#state.clearFieldErrors();
		this.#renderFieldErrors();
	}

	/**
	 * The mailbox waits for the answer of a save the same way a second save does. The setting belongs
	 * to the mailbox, so typed values of one mailbox are not carried over to another.
	 */
	#handleMailboxChange(mailboxId: number): void
	{
		if (mailboxId <= 0 || mailboxId === this.#state.getSelectedMailboxId())
		{
			queueMicrotask((): void => {
				this.#state.refreshMailboxSelection();
			});

			return;
		}

		if (this.#state.isSaving())
		{
			queueMicrotask((): void => {
				this.#state.refreshMailboxSelection();
			});

			return;
		}

		void this.#load(mailboxId);
	}

	#handleRetry(): void
	{
		const failure = this.#state.getLoadFailure();
		if (failure?.retryable !== true)
		{
			return;
		}

		const mailboxId = this.#state.getSelectedMailboxId();
		if (mailboxId <= 0)
		{
			return;
		}

		void this.#load(mailboxId);
	}

	#showStatus(): void
	{
		this.#syncLoader(this.#state.getStatus());
	}

	#syncLoader(status: ScreenStatusValue): void
	{
		if (status !== ScreenStatus.Loading)
		{
			void this.#loader?.hide();

			return;
		}

		const target = this.#loaderTarget();
		if (target === null)
		{
			return;
		}

		this.#loader ??= new Loader({ target, size: 60 });
		void this.#loader.show();
	}

	#loaderTarget(): HTMLElement | null
	{
		const target = this.#appContainer.querySelector(`[data-testid="${TestId.loader}"]`);

		return Type.isElementNode(target) ? target as HTMLElement : null;
	}

	#syncEditableState(): void
	{
		// Only the save button is described here: it belongs to the panel of the slider and stands outside
		// the application. Everything inside the form - the note of the rights and the fields, frozen while
		// the answer of a save is on its way - is described by the form itself
		const editable = this.#state.canEdit();

		const save = this.#saveButton();
		if (editable)
		{
			releaseSaveState(save);

			return;
		}

		if (save === null)
		{
			return;
		}

		Dom.attr(save, 'aria-disabled', 'true');
		Dom.attr(save, 'aria-describedby', this.#root?.getReadonlyNoteId() ?? null);
	}

	/**
	 * The panel of the slider is raised next to the screen and outlives it, so its button is looked up
	 * by name every time instead of being held on to.
	 */
	#saveButton(): HTMLElement | null
	{
		return document.getElementById(SAVE_BUTTON_ID);
	}

	/** The answer of this screen releases the wait class added by the button panel on click. */
	#releaseCompletedSave(wasSaving: boolean): void
	{
		if (wasSaving && !this.#destroyed)
		{
			this.#releaseSaveButtonWait();
			// The answer has come and the fields are given back, whatever the answer said: a refused
			// save leaves the form as the user typed it and lets the typing go on
			this.#syncEditableState();
		}
	}

	/**
	 * The button panel handles the click after the inline screen handler and adds its wait class then,
	 * so an attempt that never reached the transport releases it in the next task.
	 */
	#releaseSaveButtonWaitIfIdle(): void
	{
		setTimeout((): void => {
			if (!this.#destroyed && !this.#state.isSaving())
			{
				this.#preparedSaveRequest = null;
				this.#releaseSaveButtonWait();
			}
		}, 0);
	}

	#releaseSaveButtonWait(): void
	{
		const saveButton = this.#saveButton();
		if (saveButton !== null)
		{
			Dom.removeClass(saveButton, SAVE_BUTTON_WAIT_CLASS);
		}
	}

	#renderFieldErrors(): void
	{
		renderFieldErrors(this.#errorTargets(), this.#state.getFieldErrors());
	}

	#errorTargets(): FieldErrorTargets
	{
		if (this.#root === null)
		{
			throw new Error('Vacation auto-reply application is not mounted.');
		}

		return this.#root.getFieldErrorTargets();
	}

	#showGeneralSaveError(reason: unknown): void
	{
		if (this.#destroyed || this.#state.getStatus() !== ScreenStatus.Ready)
		{
			return;
		}

		this.#root?.showEditorError(describeFailure(parseSaveFailure(reason)));
	}
}
