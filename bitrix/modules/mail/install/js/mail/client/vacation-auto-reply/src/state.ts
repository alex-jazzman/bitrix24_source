import { Dom, Loc, Type } from 'main.core';
import { reactive } from 'ui.vue3';

import { type AjaxError, type GetSettingResponse, type MailboxOption, type VacationAutoReplySetting } from './types';

/**
 * What the screen shows as a whole. A mailbox without a stored setting is not a state of its own: it
 * comes back as a switched off auto-reply with empty fields, which is the ready screen already.
 */
export const ScreenStatus = Object.freeze({
	Loading: 'loading',
	Ready: 'ready',
	Failed: 'failed',
	Empty: 'empty',
});

export const FormField = Object.freeze({
	Mailbox: 'mailbox',
	Period: 'period',
	Body: 'body',
});

export type ScreenStatusValue = 'loading' | 'ready' | 'failed' | 'empty';
export type FormFieldName = 'mailbox' | 'period' | 'body';

export type FieldErrors = {
	mailbox: string,
	period: string,
	body: string,
};

/** A rejected save split into what belongs next to a field and what belongs to the screen. */
export type SaveFailure = {
	fields: FieldErrors,
	common: string,
};

/** A refused read: what it says, and whether asking again can bring a different answer. */
export type LoadFailure = {
	message: string,
	retryable: boolean,
};

/**
 * Where a message of a field is shown, which controls it is about, and what describes those controls
 * whatever the server said. The text of the auto-reply is typed into the frame of the editor below
 * the form, so the controls of a field do not always stand next to its message.
 */
export type FieldErrorTarget = {
	message: HTMLElement,
	controls: HTMLElement[],
	/** What the field is described by for good: the example of the format of a bound of the period. */
	hint?: HTMLElement,
	/** How the user is taken to the field, when focusing its first control would not do it. */
	focus?: () => boolean,
};

export type FieldErrorTargets = Record<FormFieldName, FieldErrorTarget>;

export type ScreenStateData = {
	status: ScreenStatusValue,
	mailboxId: number,
	setting: VacationAutoReplySetting | null,
	mailboxes: MailboxOption[],
	fieldErrors: FieldErrors,
	loadFailure: LoadFailure | null,
	generation: number,
	saving: boolean,
};

/**
 * Load error codes that describe the request itself rather than the way it travelled: no access to
 * the mailbox, no such mailbox, or the feature switched off. Asking again answers the same.
 */
const FINAL_LOAD_ERROR_CODES = new Set(['access_denied', 'feature_disabled', 'mailbox_not_found']);

/** Which field of the form each validation error is about. */
const FIELD_BY_ERROR_CODE: Record<string, FormFieldName> = {
	body_required: FormField.Body,
	body_too_long: FormField.Body,
	period_required: FormField.Period,
	period_order: FormField.Period,
	mailbox_unavailable: FormField.Mailbox,
	mailbox_not_found: FormField.Mailbox,
	access_denied: FormField.Mailbox,
};

export function createEmptyFieldErrors(): FieldErrors
{
	return { mailbox: '', period: '', body: '' };
}

export function createScreenStateData(): ScreenStateData
{
	return reactive<ScreenStateData>({
		status: ScreenStatus.Loading,
		mailboxId: 0,
		setting: null,
		mailboxes: [],
		fieldErrors: createEmptyFieldErrors(),
		loadFailure: null,
		generation: 0,
		saving: false,
	});
}

function normalizeMailboxes(mailboxes: MailboxOption[]): MailboxOption[]
{
	return mailboxes.filter((mailbox: MailboxOption): boolean => mailbox.id > 0);
}

function readErrors(reason: unknown): AjaxError[]
{
	const errors = (reason as { errors?: AjaxError[] })?.errors;

	return Type.isArray(errors) ? errors : [];
}

/**
 * Every validation code names the place on the screen where the user can do something about it. A
 * code the screen does not know about, and a failure that carries no codes at all, stay a message of
 * the whole screen rather than silence.
 */
export function parseSaveFailure(reason: unknown): SaveFailure
{
	const fields = createEmptyFieldErrors();
	let common = '';

	for (const error of readErrors(reason))
	{
		const [field, message] = describeError(error);

		if (field === null)
		{
			common = message;
		}
		else if (fields[field] === '')
		{
			// The first message of a field wins: the later ones describe the same field of the
			// same request.
			fields[field] = message;
		}
	}

	if (common === '' && !hasFieldError(fields))
	{
		common = fallbackMessage(reason);
	}

	return { fields, common };
}

/** Where the message belongs on the screen and what it says; a code of no field belongs to the screen. */
function describeError(error: AjaxError): [FormFieldName | null, string]
{
	const message = String(error?.message ?? '');
	const field = FIELD_BY_ERROR_CODE[String(error?.code ?? '')] ?? null;

	return [field, message === '' ? defaultCommonMessage() : message];
}

function fallbackMessage(reason: unknown): string
{
	if (reason instanceof Error && reason.message !== '')
	{
		return reason.message;
	}

	return defaultCommonMessage();
}

export function hasFieldError(fields: FieldErrors): boolean
{
	return Object.values(fields).some((message: string): boolean => message !== '');
}

/** The text of the alert above the form: the failure of the screen, or a pointer to the marked fields. */
export function describeFailure(failure: SaveFailure): string
{
	if (failure.common !== '')
	{
		return failure.common;
	}

	return Loc.getMessage('MAIL_VACATION_AUTO_REPLY_SAVE_INVALID') ?? '';
}

function defaultCommonMessage(): string
{
	return Loc.getMessage('MAIL_VACATION_AUTO_REPLY_SAVE_FAILED') ?? '';
}

/**
 * The server tells a refusal of the read apart from a request that did not get through, and the two
 * lead the user to different places: a refusal is answered by what the server said and by no offer
 * to ask again, since the answer would not change; anything else keeps the offer.
 */
export function parseLoadFailure(reason: unknown): LoadFailure
{
	const errors = readErrors(reason);
	const refusal = errors.find(
		(error: AjaxError): boolean => FINAL_LOAD_ERROR_CODES.has(String(error?.code ?? '')),
	);

	if (refusal !== undefined)
	{
		return { message: loadErrorMessage(refusal), retryable: false };
	}

	const first = errors[0];

	return {
		message: first === undefined ? defaultLoadMessage() : loadErrorMessage(first),
		retryable: true,
	};
}

function loadErrorMessage(error: AjaxError): string
{
	const message = String(error?.message ?? '');

	return message === '' ? defaultLoadMessage() : message;
}

function defaultLoadMessage(): string
{
	return Loc.getMessage('MAIL_VACATION_AUTO_REPLY_LOAD_ERROR') ?? '';
}

/**
 * Puts a rejected save on the form: the message next to every field and the mark on the controls it
 * is about, so that the error is seen without reading and is announced with the control it belongs
 * to. A field the server said nothing about is cleared, not left with the marks of the previous save.
 */
export function renderFieldErrors(targets: FieldErrorTargets, errors: FieldErrors): void
{
	Object.values(FormField).forEach((field: FormFieldName): void => {
		const target = targets[field];
		const message = errors[field];
		const invalid = message !== '';

		Dom.adjust(target.message, { text: message });

		target.controls.forEach((control: HTMLElement): void => {
			if (invalid)
			{
				Dom.addClass(control, '--error');
			}
			else
			{
				Dom.removeClass(control, '--error');
			}

			Dom.attr(control, 'aria-invalid', invalid ? 'true' : 'false');
			Dom.attr(control, 'aria-describedby', describedBy(target, invalid));
		});
	});
}

/**
 * What the control is described by: the hint of the field always, and the message of the server
 * while it stands. A message that replaced the hint would take the format of the field away from the
 * user exactly when the format is what the save was rejected for.
 */
function describedBy(target: FieldErrorTarget, invalid: boolean): string | null
{
	const ids = [target.hint?.id ?? '', invalid ? target.message.id : ''].filter(
		(id: string): boolean => id !== '',
	);

	return ids.length === 0 ? null : ids.join(' ');
}

/**
 * Takes the user to the first field a rejected save was about. The message of a field is named by
 * `aria-describedby` of its control, so it is read where the user has to do something about it, and
 * one announcement takes the place of several talking over each other.
 *
 * @returns whether there was a field to go to.
 */
export function focusFirstInvalidField(targets: FieldErrorTargets, errors: FieldErrors): boolean
{
	let focused = false;

	Object.values(FormField).forEach((field: FormFieldName): void => {
		if (focused || errors[field] === '')
		{
			return;
		}

		focused = takeFocusTo(field, targets[field]);
	});

	return focused;
}

/**
 * Where the focus of a field goes. The control of the mailbox is the input of the switcher of the
 * design system, and the switcher opens its menu on focus: the menu is drawn over the form and hides
 * the very message the user was taken to read, so the message of the mailbox takes the focus itself.
 * A field reached in a way of its own says so, the rest are reached by their first control.
 *
 * @returns whether the field took the focus.
 */
function takeFocusTo(field: FormFieldName, target: FieldErrorTarget): boolean
{
	if (field === FormField.Mailbox)
	{
		return focusMessage(target.message);
	}

	if (target.focus !== undefined)
	{
		return target.focus();
	}

	const control = target.controls[0];
	if (control === undefined)
	{
		return false;
	}

	control.focus();

	return true;
}

/**
 * Takes the user to the message instead of the control it describes. A message is not in the order
 * of the tabs and takes the focus only when it is asked to; what a screen reader then reads out is
 * the text of the message, the same text `aria-describedby` names on the control.
 *
 * @returns whether the message took the focus.
 */
function focusMessage(message: HTMLElement): boolean
{
	Dom.attr(message, 'tabindex', '-1');
	message.focus();

	return document.activeElement === message;
}

/** What the text of the auto-reply is typed into: the frame of the editor, and its view of the code. */
export function resolveEditorControls(editor: HTMLElement | null): HTMLElement[]
{
	if (editor === null)
	{
		return [];
	}

	return [...editor.querySelectorAll<HTMLElement>('iframe, textarea')];
}

/**
 * Names the field of the text for a screen reader. The editor raises its frame without a title, and
 * a frame with no title is a field with no name: the label above the editor belongs to nothing until
 * it is put on the frame itself.
 */
export function nameEditorField(editor: HTMLElement | null, name: string): void
{
	if (name === '')
	{
		return;
	}

	resolveEditorControls(editor).forEach((control: HTMLElement): void => {
		Dom.attr(control, 'title', name);
	});
}

/**
 * The single answer of the screen to a rejected save: the state remembers the messages of the
 * fields, the form shows them and takes the user to the first of them. The transport reports the
 * failure to this handler, and a handler that only redraws the form would wipe the messages instead
 * of showing them.
 */
export function createSaveFailureHandler(
	state: ScreenState,
	resolveTargets: () => FieldErrorTargets,
	resolveGeneration: () => number,
): (failure: SaveFailure) => void
{
	return (failure: SaveFailure): void => {
		// The form already describes another mailbox when the mailbox was switched while the answer
		// was on its way, and the messages of the one the screen has left belong to no field of it
		if (!state.applyFailure(resolveGeneration(), failure))
		{
			return;
		}

		const targets = resolveTargets();
		const errors = state.getFieldErrors();

		renderFieldErrors(targets, errors);
		focusFirstInvalidField(targets, errors);
	};
}

/**
 * Why pressing save changes nothing right now; an empty text means the form goes to the server as it
 * is. A button that answers with silence reads as broken, so every state that refuses a save names
 * what it is waiting for or what it has no right to do.
 */
export function describeSaveBlock(state: ScreenState): string
{
	const status = state.getStatus();

	// A save whose answer has not come and a setting still on its way are the same wait for the user
	if (state.isSaving() || status === ScreenStatus.Loading)
	{
		return Loc.getMessage('MAIL_VACATION_AUTO_REPLY_SAVE_WAIT') ?? '';
	}

	if (status === ScreenStatus.Failed)
	{
		return state.getLoadFailure()?.message ?? defaultLoadMessage();
	}

	if (status === ScreenStatus.Empty)
	{
		return Loc.getMessage('MAIL_VACATION_AUTO_REPLY_NO_MAILBOX') ?? '';
	}

	return state.canEdit() ? '' : (Loc.getMessage('MAIL_VACATION_AUTO_REPLY_READONLY') ?? '');
}

/**
 * The state of the screen between the answers of the server. It knows nothing about the DOM: the
 * screen reads it to render, the transport reads it to build the request.
 */
export class ScreenState
{
	#data: ScreenStateData;
	#mailboxesFixed: boolean = false;

	constructor(data: ScreenStateData = createScreenStateData())
	{
		this.#data = data;
		this.#mailboxesFixed = data.mailboxes.length > 0;
	}

	getData(): ScreenStateData
	{
		return this.#data;
	}

	getStatus(): ScreenStatusValue
	{
		return this.#data.status;
	}

	getSelectedMailboxId(): number
	{
		return this.#data.mailboxId;
	}

	getSetting(): VacationAutoReplySetting | null
	{
		return this.#data.setting;
	}

	getMailboxes(): MailboxOption[]
	{
		return this.#data.mailboxes;
	}

	getFieldError(field: FormFieldName): string
	{
		return this.#data.fieldErrors[field];
	}

	getFieldErrors(): FieldErrors
	{
		return { ...this.#data.fieldErrors };
	}

	getLoadFailure(): LoadFailure | null
	{
		return this.#data.loadFailure;
	}

	/**
	 * Whether the answer of a save is still on its way. The editor sends no second request while it
	 * is, so a save pressed meanwhile is answered with the reason instead of going nowhere in silence.
	 */
	isSaving(): boolean
	{
		return this.#data.saving;
	}

	/** Shared access to somebody else's mailbox shows the setting but does not change it. */
	canEdit(): boolean
	{
		return this.#data.status === ScreenStatus.Ready && this.#data.setting?.canEdit === true;
	}

	/**
	 * Starts a read and names it. Mailboxes are switched faster than the server answers, and the
	 * answer of a mailbox the screen has already left describes a setting nobody is looking at:
	 * every read carries the number it was started under and is applied only while it is the last.
	 *
	 * @returns the number of the read the answer has to be brought back with.
	 */
	beginLoading(mailboxId: number): number
	{
		this.#data.generation += 1;
		this.#data.status = ScreenStatus.Loading;
		this.#data.mailboxId = mailboxId;
		this.#data.setting = null;
		this.#data.fieldErrors = createEmptyFieldErrors();
		this.#data.loadFailure = null;
		this.#data.saving = false;

		return this.#data.generation;
	}

	/** @returns whether the answer was of the read the screen is still waiting for. */
	applyLoaded(generation: number, response: GetSettingResponse): boolean
	{
		if (generation !== this.#data.generation)
		{
			return false;
		}

		this.#data.status = ScreenStatus.Ready;
		this.#data.setting = response.setting;
		if (!this.#mailboxesFixed)
		{
			this.#data.mailboxes = normalizeMailboxes(response.mailboxes);
			this.#mailboxesFixed = true;
		}
		this.#data.mailboxId = response.setting.mailboxId;
		this.#data.loadFailure = null;

		return true;
	}

	/** @returns whether the failure was of the read the screen is still waiting for. */
	failLoading(generation: number, failure: LoadFailure): boolean
	{
		if (generation !== this.#data.generation)
		{
			return false;
		}

		this.#data.status = ScreenStatus.Failed;
		this.#data.setting = null;
		this.#data.loadFailure = failure;

		return true;
	}

	/** The user has no mailbox to set an auto-reply of: there is nothing to ask the server about. */
	markEmpty(): void
	{
		this.#data.status = ScreenStatus.Empty;
		this.#data.setting = null;
		this.#data.mailboxId = 0;
	}

	/**
	 * Names the save the screen is waiting for the answer of. A save is answered under the number of
	 * the read it was started on: a mailbox switched in the meantime begins a read of its own and
	 * moves the number on, so the answer of a save the screen has left is told apart the same way.
	 *
	 * The number is taken once per save, and until the answer comes no save is started: a save named
	 * again would carry the number of the read of another mailbox and let the answer of this one
	 * through onto the form of that other mailbox.
	 *
	 * @returns the number the answer of the save has to be brought back with.
	 */
	beginSaving(): number
	{
		this.#data.saving = true;

		return this.#data.generation;
	}

	/**
	 * A saved setting replaces the loaded one: the server owns the bounds it stored.
	 *
	 * @returns whether the save was of the setting the screen is still showing.
	 */
	applySaved(generation: number, setting: VacationAutoReplySetting): boolean
	{
		if (generation !== this.#data.generation)
		{
			return false;
		}

		this.#data.saving = false;
		this.#data.setting = setting;
		this.#data.mailboxId = setting.mailboxId;
		this.#data.fieldErrors = createEmptyFieldErrors();

		return true;
	}

	/** @returns whether the rejected save was of the form the screen is still showing. */
	applyFailure(generation: number, failure: SaveFailure): boolean
	{
		if (generation !== this.#data.generation)
		{
			return false;
		}

		this.#data.saving = false;
		this.#data.fieldErrors = failure.fields;

		return true;
	}

	/**
	 * The screen is closed, and the requests it leaves behind are requests nobody waits for any more:
	 * the number is moved past every one of them at once. Each answer is then told apart by the check
	 * it already goes through - the one that tells apart the answer of a mailbox the screen has left -
	 * so nothing of a screen that is gone is put on the screen raised in its place.
	 */
	stopWaiting(): void
	{
		this.#data.generation += 1;
		this.#data.saving = false;
	}

	clearFieldErrors(): void
	{
		this.#data.fieldErrors = createEmptyFieldErrors();
	}

	refreshMailboxSelection(): void
	{
		this.#data.mailboxes = [...this.#data.mailboxes];
	}
}
