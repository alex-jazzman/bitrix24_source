import { Tag, Event, Dom, Type, Text } from 'main.core';
import type { BaseEvent } from 'main.core.events';

import './style.css';

const REACTION_MODE_FIELD_NAME = 'ReactionMode';
const FIELDS_FIELD_NAME = 'Fields';
const FIELDS_ROW_ID = `row_${FIELDS_FIELD_NAME}`;
const MODE_FIELDS = 'fields';
const MODE_ANY = 'any';

// The switcher is built from the declared modes only, so an empty option never becomes a button.
const REACTION_MODES = [MODE_FIELDS, MODE_ANY];

const NODE_SETTINGS_SAVING_EVENT = 'Bizproc.NodeSettings:nodeSettingsSaving';

const SETTINGS_BOX_SELECTOR = '.node-settings-edit-box';
const SETTINGS_CAPTION_SELECTOR = '.node-settings-edit-caption';

// No form carries this id, and an unmatched form attribute leaves the element without a form owner.
const DETACHED_FORM_ID = 'crm-trigger-reaction-mode-detached';

const SWITCHER_TEST_ID = 'crm-reaction-mode-switcher';
const OPTION_TEST_ID_PREFIX = 'crm-reaction-mode-option-';
const SELECT_TEST_ID = 'crm-reaction-mode-select';
const FIELDS_ROW_TEST_ID = 'crm-reaction-mode-fields-row';
const FIELDS_CONTROL_TEST_ID = 'crm-reaction-mode-fields-control';
const FIELDS_ERROR_TEST_ID = 'crm-reaction-mode-fields-error';

export type ActivityField = {
	property: {
		Settings?: { requiredErrorMessage?: string },
	},
};

// The part of the ui.system.radiobutton contract the switcher relies on. The extension is loaded at
// runtime, so a static type import would suggest a build-time dependency the renderer must not have.
type RadioButtonView = {
	render: () => HTMLElement,
	setChecked: (checked: boolean) => mixed,
	destroy: () => void,
};

export type RadioButtonExports = { RadioButton?: Function };

type ReactionModeOption = {
	mode: string,
	node: HTMLElement,
	button: RadioButtonView,
};

/**
 * Radio view over the standard `ReactionMode` select plus the behaviour that depends on the mode:
 * visibility of the tracked fields block and the client-side check for an empty selection.
 *
 * The select stays the value holder and is only hidden once the radio is rendered: a failed switcher
 * leaves the user with a working control and does not lose the mode on save.
 */
export class ReactionModeControl
{
	#select: HTMLSelectElement = null;
	#fieldsRow: ?HTMLElement = null;
	#fieldsControl: ?HTMLElement = null;
	#requiredErrorMessage: string = '';
	#radioButtonExtension: ?Promise<RadioButtonExports> = null;
	#switcher: ?HTMLElement = null;
	#fieldsError: ?HTMLElement = null;
	#options: ReactionModeOption[] = [];
	#isDestroyed: boolean = false;
	#onModeChangeHandler: Function = null;
	#onFieldsChangeHandler: Function = null;
	#onSettingsSavingHandler: Function = null;

	static find(
		form: HTMLFormElement,
		activityFields: { [key: string]: ActivityField },
		radioButtonExtension: Promise<RadioButtonExports>,
	): ?ReactionModeControl
	{
		const select = form?.querySelector(`[name="${REACTION_MODE_FIELD_NAME}"]`) ?? null;

		return select
			? new ReactionModeControl(form, select, activityFields?.[FIELDS_FIELD_NAME], radioButtonExtension)
			: null;
	}

	constructor(
		form: HTMLFormElement,
		select: HTMLSelectElement,
		fieldsField: ?ActivityField,
		radioButtonExtension: Promise<RadioButtonExports>,
	)
	{
		this.#select = select;
		// Rows are addressed inside the own form only: several settings panels may share row ids.
		this.#fieldsRow = form.querySelector(`[id="${FIELDS_ROW_ID}"]`);
		this.#fieldsControl = this.#fieldsRow?.querySelector('select, input, textarea') ?? null;
		this.#requiredErrorMessage = fieldsField?.property?.Settings?.requiredErrorMessage ?? '';
		this.#radioButtonExtension = radioButtonExtension;
		this.#onModeChangeHandler = this.#onModeChange.bind(this);
		this.#onFieldsChangeHandler = this.#clearFieldsError.bind(this);
		this.#onSettingsSavingHandler = this.#onSettingsSaving.bind(this);
	}

	/**
	 * Everything a ready form is expected to have is applied before the call returns; only the radio
	 * view waits for the design system primitive. The returned promise never rejects, so a caller that
	 * does not await it gets no unhandled rejection.
	 */
	apply(): Promise<void>
	{
		this.#markTestNodes();
		this.#applyFieldsVisibility();
		this.#bindEvents();

		return this.#renderSwitcher().catch((error) => {
			// Safe degradation: the standard select keeps the mode selectable and saveable.
			console.error(error);
		});
	}

	destroy(): void
	{
		this.#isDestroyed = true;
		this.#unbindEvents();
		this.#options.forEach(({ node, button }) => {
			Event.unbindAll(node);
			button.destroy();
		});
		this.#options = [];

		if (this.#switcher)
		{
			Dom.remove(this.#switcher);
			this.#switcher = null;
		}

		this.#fieldsError = null;
		this.#select = null;
		this.#fieldsRow = null;
		this.#fieldsControl = null;
	}

	/**
	 * Test anchors for the nodes the form owns. The row ids of the settings form are shared between
	 * panels, so this control is the only place that knows which row belongs to this activity.
	 */
	#markTestNodes(): void
	{
		Dom.attr(this.#select, 'data-testid', SELECT_TEST_ID);
		Dom.attr(this.#fieldsRow, 'data-testid', FIELDS_ROW_TEST_ID);
		Dom.attr(this.#fieldsControl, 'data-testid', FIELDS_CONTROL_TEST_ID);
	}

	#bindEvents(): void
	{
		Event.bind(this.#select, 'change', this.#onModeChangeHandler);
		Event.bind(this.#fieldsControl, 'change', this.#onFieldsChangeHandler);
		Event.EventEmitter.subscribe(NODE_SETTINGS_SAVING_EVENT, this.#onSettingsSavingHandler);
	}

	#unbindEvents(): void
	{
		Event.unbind(this.#select, 'change', this.#onModeChangeHandler);
		Event.unbind(this.#fieldsControl, 'change', this.#onFieldsChangeHandler);
		Event.EventEmitter.unsubscribe(NODE_SETTINGS_SAVING_EVENT, this.#onSettingsSavingHandler);
	}

	async #renderSwitcher(): Promise<void>
	{
		const { RadioButton } = await this.#radioButtonExtension;
		if (this.#isDestroyed || !Type.isFunction(RadioButton))
		{
			return;
		}

		const group = `crm-trigger-reaction-mode-${Text.getRandom()}`;
		const options = REACTION_MODES.map((mode) => this.#createOption(RadioButton, mode, group));
		if (options.some((option) => option === null))
		{
			options.forEach((option) => option?.button.destroy());

			return;
		}

		this.#options = options;
		this.#switcher = Tag.render`
			<div
				class="crm-trigger-reaction-mode"
				role="radiogroup"
				data-testid="${SWITCHER_TEST_ID}"
			></div>
		`;
		this.#nameSwitcher();
		this.#options.forEach(({ node }) => Dom.append(node, this.#switcher));

		Dom.insertAfter(this.#switcher, this.#select);
		// Inline style, not the hidden attribute: the form stylesheet gives `.field-row select`
		// an explicit display, and an author rule wins over the browser rule for [hidden].
		Dom.style(this.#select, 'display', 'none');
		this.#syncOptions();
	}

	/**
	 * The form renders the field caption as a plain div, so the group is named by reference to it.
	 */
	#nameSwitcher(): void
	{
		const caption = this.#select.closest(SETTINGS_BOX_SELECTOR)?.querySelector(SETTINGS_CAPTION_SELECTOR);
		if (!caption)
		{
			return;
		}

		if (!Type.isStringFilled(caption.id))
		{
			caption.id = `crm-trigger-reaction-mode-caption-${Text.getRandom()}`;
		}

		Dom.attr(this.#switcher, 'aria-labelledby', caption.id);
	}

	#createOption(RadioButton: Function, mode: string, group: string): ?ReactionModeOption
	{
		const title = this.#getOptionTitle(mode);
		if (title === null)
		{
			return null;
		}

		const button = new RadioButton({
			group,
			checked: this.#getMode() === mode,
			onChange: () => this.#selectMode(mode),
		});

		const titleId = `${group}-${mode}-title`;
		const caption = Tag.render`
			<span class="crm-trigger-reaction-mode__option-title" id="${titleId}"></span>
		`;
		caption.textContent = title;

		const radio = button.render();
		this.#prepareRadio(radio, titleId);

		const optionTestId = `${OPTION_TEST_ID_PREFIX}${mode}`;
		const node = Tag.render`
			<div class="crm-trigger-reaction-mode__option" data-testid="${optionTestId}"></div>
		`;
		Dom.append(radio, node);
		Dom.append(caption, node);
		Event.bind(node, 'click', () => this.#selectMode(mode));

		return { mode, node, button };
	}

	/**
	 * A form owner that does not exist keeps the radio out of `form.elements`, so the mode travels
	 * to the server as the single `ReactionMode` field of the standard control. The design system
	 * renders its own label around the input alone, so the visible title is bound by reference.
	 */
	#prepareRadio(radio: HTMLElement, titleId: string): void
	{
		const input = radio.querySelector('input');

		Dom.attr(input, 'form', DETACHED_FORM_ID);
		Dom.attr(input, 'aria-labelledby', titleId);

		const controlledRowId = this.#getControlledRowId();
		if (controlledRowId)
		{
			Dom.attr(input, 'aria-controls', controlledRowId);
		}
	}

	// Settings panels may share row ids, so the link is expressed only for the own fields block.
	#getControlledRowId(): ?string
	{
		const isOwnRow = this.#fieldsRow && document.getElementById(FIELDS_ROW_ID) === this.#fieldsRow;

		return isOwnRow ? FIELDS_ROW_ID : null;
	}

	#getOptionTitle(mode: string): ?string
	{
		const option = Array.from(this.#select.options).find((item) => item.value === mode);

		return option ? option.textContent : null;
	}

	#getMode(): string
	{
		return this.#select?.value ?? '';
	}

	#selectMode(mode: string): void
	{
		if (this.#getMode() === mode)
		{
			return;
		}

		this.#select.value = mode;
		this.#select.dispatchEvent(new window.Event('change'));
	}

	#onModeChange(): void
	{
		this.#syncOptions();
		this.#applyFieldsVisibility();
		this.#clearFieldsError();
	}

	#syncOptions(): void
	{
		const currentMode = this.#getMode();
		this.#options.forEach(({ mode, node, button }) => {
			const isSelected = mode === currentMode;
			button.setChecked(isSelected);
			Dom.toggleClass(node, '--selected', isSelected);
		});
	}

	#applyFieldsVisibility(): void
	{
		if (!this.#fieldsRow)
		{
			return;
		}

		// The value of the fields block is never touched, so switching back restores the selection.
		if (this.#getMode() === MODE_ANY)
		{
			Dom.hide(this.#fieldsRow);
		}
		else
		{
			Dom.show(this.#fieldsRow);
		}
	}

	#onSettingsSaving(event: BaseEvent): void
	{
		const { formData } = event.getData();

		if (!this.#ownsSave() || !Type.isPlainObject(formData))
		{
			return;
		}

		if (this.#getMode() !== MODE_FIELDS || !this.#isFieldsValueEmpty(formData[FIELDS_FIELD_NAME]))
		{
			return;
		}

		// Without a text there is nothing to report the rejection with, so the save is left to travel:
		// the server runs the same check and its message is localised.
		if (!Type.isStringFilled(this.#requiredErrorMessage))
		{
			return;
		}

		this.#showFieldsError();
		this.#fieldsControl?.focus();

		// The editor offers no way to refuse a save from a listener: its own required check is disabled
		// (`validateForm()`) and what a listener returns is dropped, so raising is what keeps the request
		// from leaving and the typed values on screen. The exception lands in the try/catch of
		// `submitForm()` and, carrying no `errors`, shows no message box; listeners subscribed after this
		// one are skipped for the rejected save. The server-side check stays an independent one.
		throw new Error('CrmEntityFieldChangedTrigger: tracked fields are required in the fields reaction mode');
	}

	/**
	 * The saving event carries no reference to the form it was collected from, so the panel is told by
	 * the own fields row. The editor keeps a single settings form mounted: it destroys the previous
	 * renderer on block change and on unmount, and empties the containers before the next render. A row
	 * still attached to the document therefore belongs to the panel being saved. Without the row there
	 * is nothing to point the user at either, and the check is left to the server.
	 */
	#ownsSave(): boolean
	{
		return Boolean(this.#fieldsRow?.isConnected);
	}

	#isFieldsValueEmpty(value: mixed): boolean
	{
		if (Type.isArray(value))
		{
			return value.every((item) => String(item).trim() === '');
		}

		return String(value ?? '').trim() === '';
	}

	#showFieldsError(): void
	{
		if (!this.#fieldsRow || this.#fieldsError)
		{
			return;
		}

		Dom.addClass(this.#fieldsControl, 'has-error');
		Dom.attr(this.#fieldsControl, 'aria-invalid', 'true');

		const errorId = `crm-trigger-reaction-mode-fields-error-${Text.getRandom()}`;
		this.#fieldsError = Tag.render`
			<div
				class="crm-trigger-reaction-mode__fields-error"
				id="${errorId}"
				role="alert"
				data-testid="${FIELDS_ERROR_TEST_ID}"
			></div>
		`;
		// The text is written once the alert is in the document, so its appearance is announced.
		Dom.append(this.#fieldsError, this.#fieldsRow);
		this.#fieldsError.textContent = this.#requiredErrorMessage;
		Dom.attr(this.#fieldsControl, 'aria-describedby', errorId);
	}

	#clearFieldsError(): void
	{
		Dom.removeClass(this.#fieldsControl, 'has-error');
		Dom.attr(this.#fieldsControl, 'aria-invalid', null);

		if (this.#fieldsError)
		{
			Dom.attr(this.#fieldsControl, 'aria-describedby', null);
			Dom.remove(this.#fieldsError);
			this.#fieldsError = null;
		}
	}
}
