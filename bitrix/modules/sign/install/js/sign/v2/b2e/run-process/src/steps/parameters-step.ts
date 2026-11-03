import { Dom, Tag } from 'main.core';
import { Loader } from 'main.loader';
import { Alert, AlertDesign } from 'ui.system.alert';
import { Text } from 'ui.system.typography';

import { clearInvalidControls, markInvalidControls } from 'bizproc.a11y';
import { FieldManager, RenderMode, type RenderCollectionItem } from 'bizproc.fields';

// The registry of the field types is filled by the extensions of the types themselves, and a type it does
// not know is drawn by the backend into a placeholder the manager keeps no instance for - such a field is
// left out of `getValues()`. The base types of bizproc are brought in here so the form gives its values
// back; anything a portal adds on top of them stays the risk Q-2 named.
import 'bizproc.fields.bool';
import 'bizproc.fields.date';
import 'bizproc.fields.datetime';
import 'bizproc.fields.double';
import 'bizproc.fields.file';
import 'bizproc.fields.int';
import 'bizproc.fields.select';
import 'bizproc.fields.string';
import 'bizproc.fields.text';
import 'bizproc.fields.user';

import { Api } from 'sign.v2.api';

import { type RunProcessStore } from '../store';
import {
	type FieldRenderItem,
	type FormError,
	hasFieldErrors,
	readErrors,
	readStartForm,
	type StartForm,
} from './parameters-form';

import './parameters-step.css';

const ERROR_ID_PREFIX = 'sign-b2e-run-process-parameter-error';
const FIELD_ERROR_CLASS = '--error';
const LOADER_SIZE = 48;

/** One message of the form together with the id a control is bound to it by. */
type DescribedError = FormError & { messageId: string };

export type ParametersStepOptions = {
	title: string,
	store: RunProcessStore,
};

/**
 * Step of the start fields of the process. What is asked here belongs to the template and not to this
 * slider: the descriptions come from API-02 and are drawn by the controls of bizproc exactly as they came,
 * so a process with a field type of its own needs no code here (Q-2). Ours is the form around them - the
 * order, the place of the errors and the moment the values are read.
 */
export class ParametersStep
{
	readonly title: string;

	#store: RunProcessStore;
	#api: Api = new Api();
	#container: HTMLElement;
	#errorBox: HTMLElement;
	#fieldBox: HTMLElement;
	#manager: FieldManager | null = null;
	#loading: Promise<void> | null = null;

	constructor(options: ParametersStepOptions)
	{
		this.title = options.title;
		this.#store = options.store;
		this.#errorBox = Tag.render`<div class="sign-b2e-run-process-parameters__errors"></div>`;
		this.#fieldBox = Tag.render`<div class="sign-b2e-run-process-parameters__fields"></div>`;
		this.#container = Tag.render`
			<div
				class="sign-b2e-run-process__step sign-b2e-run-process-parameters"
				data-testid="sign-b2e-run-process-step-parameters"
			>
				${this.#errorBox}
				${this.#fieldBox}
			</div>
		`;
	}

	/**
	 * The wizard asks for the content every time it draws the step; the fields are asked of the server
	 * once, on the first of those times.
	 */
	get content(): HTMLElement
	{
		void this.#load();

		return this.#container;
	}

	/**
	 * The values leave the controls into the store. Nothing here decides whether they are enough: an
	 * unfilled required field is the answer of the server at the launch (ERR-003), and a second rule on
	 * the client would be a copy of it that goes out of date with the template.
	 */
	async beforeCompletion(): Promise<boolean>
	{
		await this.#load();

		if (this.#manager === null)
		{
			return false;
		}

		this.#clearErrors();
		this.#store.setParameters(this.#manager.getValues());

		return true;
	}

	/**
	 * Errors of the launch (API-03). Only those the server bound to a start field belong to this step: the
	 * rest speaks about the selection of the employees and is answered there. `true` means the launch was
	 * refused over this form, and the wizard has to bring the personnel officer back to it (ERR-003).
	 */
	showParameterErrors(errors: FormError[]): boolean
	{
		this.#showErrors(errors.filter((error: FormError) => error.name !== ''));

		return hasFieldErrors(errors);
	}

	/**
	 * A field type may hold something that outlives its node - a picker whose popup the manager of popups
	 * keeps - so the fields are released and not merely dropped with the markup.
	 */
	destroy(): void
	{
		this.#manager?.destroy();
		this.#manager = null;
	}

	#load(): Promise<void>
	{
		this.#loading ??= this.#loadFields();

		return this.#loading;
	}

	async #loadFields(): Promise<void>
	{
		const loader = new Loader({ target: this.#fieldBox, size: LOADER_SIZE, mode: 'inline' });
		void loader.show();
		Dom.attr(this.#fieldBox, 'aria-busy', 'true');

		try
		{
			this.#renderFields(readStartForm(await this.#api.process.getStartFields(this.#getProcessId())));
		}
		catch (exception)
		{
			// a form that never arrived is no form to fill in, so the next press of the button asks again
			this.#loading = null;
			this.#showErrors(readErrors(exception));
		}
		finally
		{
			loader.destroy();
			Dom.attr(this.#fieldBox, 'aria-busy', null);
		}
	}

	#renderFields(form: StartForm): void
	{
		this.#manager = new FieldManager({
			documentType: form.documentType,
			renderMode: RenderMode.Public,
			showLabels: true,
			showDescriptions: true,
		});

		// The description travels to the control exactly as API-02 sent it: the normalized shape of
		// bizproc is wider than the `Property` its own renderer declares - name, options and settings may
		// all come empty - and the renderer reads them defensively.
		const rendered = this.#manager.renderCollection(form.items as unknown as RenderCollectionItem[]);

		form.items.forEach((item: FieldRenderItem, index: number) => {
			Dom.append(this.#renderField(item, rendered[index].node), this.#fieldBox);
		});
	}

	/**
	 * The control of bizproc stands inside a holder of ours: the mark of a refused field belongs to this
	 * form, and its own markup is the only place this extension may paint on.
	 */
	#renderField(item: FieldRenderItem, control: HTMLElement): HTMLElement
	{
		const field = Tag.render`
			<div class="sign-b2e-run-process-parameters__field" data-testid="sign-b2e-run-process-parameter">
				${control}
			</div>
		`;
		Dom.attr(field, 'data-field', item.fieldName);

		return field;
	}

	#showErrors(errors: FormError[]): void
	{
		this.#clearErrors();

		if (errors.length === 0)
		{
			return;
		}

		const described: DescribedError[] = errors.map((error: FormError, index: number) => ({
			...error,
			messageId: `${ERROR_ID_PREFIX}-${index}`,
		}));

		Dom.append(this.#renderAlert(described), this.#errorBox);
		described.forEach(({ name }: DescribedError) => {
			const field = this.#findField(name);
			if (field !== null)
			{
				Dom.addClass(field, FIELD_ERROR_CLASS);
			}
		});

		// the announcement alone leaves a keyboard user with no idea which field was refused
		markInvalidControls(this.#fieldBox, described)?.focus();
	}

	#renderAlert(described: DescribedError[]): HTMLElement
	{
		const alert = new Alert({
			design: AlertDesign.tintedAlert,
			content: Tag.render`
				<div class="sign-b2e-run-process-parameters__messages">
					${described.map((error: DescribedError) => this.#renderMessage(error))}
				</div>
			`,
		});

		return Tag.render`<div role="alert">${alert.render()}</div>`;
	}

	#renderMessage(error: DescribedError): HTMLElement
	{
		// the message comes from the template of a portal user, so it goes in as text and not as markup
		const message = Text.render(error.message, { size: '2xs', tag: 'div' });
		Dom.attr(message, 'id', error.messageId);

		return message;
	}

	#clearErrors(): void
	{
		Dom.clean(this.#errorBox);
		clearInvalidControls(this.#fieldBox);
		[...this.#fieldBox.children].forEach((field: Element) => {
			Dom.removeClass(field, FIELD_ERROR_CLASS);
		});
	}

	#findField(name: string): HTMLElement | null
	{
		const field = [...this.#fieldBox.children].find(
			(node: Element) => (node as HTMLElement).dataset.field === name,
		);

		return (field as HTMLElement) ?? null;
	}

	#getProcessId(): number
	{
		return this.#store.process?.id ?? 0;
	}
}
