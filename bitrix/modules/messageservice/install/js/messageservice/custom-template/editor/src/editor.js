import { Dom, Loc, Runtime, Tag, Text, Type } from 'main.core';
import { BaseEvent, EventEmitter } from 'main.core.events';
import { AirButtonStyle, Button, ButtonSize } from 'ui.buttons';
import { Outline } from 'ui.icon-set.api.core';
import 'ui.icon-set.outline';
import { Dialog } from 'ui.system.dialog';
import { Chip, ChipDesign, ChipSize } from 'ui.system.chip';
import { Input, InputDesign, InputSize } from 'ui.system.input';
import { Hint } from 'ui.hint';
import 'ui.notification';

import { CustomTemplateService } from './service/custom-template-service.js';

import './editor.css';

const DIALOG_WIDTH = 600;
const TITLE_DUPLICATE_ERROR_CODE = 'CUSTOM_TEMPLATE_TITLE_DUPLICATE';

type Binding = {
	zone: string,
	scene: string,
	targetId: string,
};

type OpenOptions = {
	mode: 'create' | 'edit',
	templateId?: ?number,
	titleInitial?: string,
	bodyInitial?: string,
	bindElement?: ?HTMLElement,
	binding: Binding,
	strategy?: string,
};

type Content = {
	root: HTMLElement,
	slotNode: HTMLElement,
	bodyErrorNode: HTMLElement,
	bindingNode: HTMLElement,
};

/**
 * Modal form for creating / editing a user-managed (custom) message template.
 *
 * The modal owns persistence (via its own CustomTemplateService) and its own
 * lifecycle: open() resolves with the saved DTO, with `{ deleted: true,
 * templateId }` when the template is deleted from the edit-mode footer, or
 * with null when the dialog is dismissed without a change. Zone-specific
 * editor rendering is the only thing delegated to the embedder, through a
 * single async event:
 *
 *   - `onSlotRender({ target, body })` — embedder mounts a real message
 *     editor into `target` and may push back `{ editor }` so we can pull the
 *     resulting body on save, plus optional ready-to-render
 *     `{ bindingLabels }` strings shown as read-only chips in the bindings
 *     block under the editor (most significant label first — it also names
 *     the template's subject in the delete confirmation). The modal is
 *     zone-agnostic: the embedder composes all zone-specific wording. The
 *     `binding` passed to open() is an opaque key forwarded to the service.
 *
 * @emits BX.MessageService.CustomTemplate.Editor:onSlotRender
 */
export class CustomTemplateEditor extends EventEmitter
{
	#service: CustomTemplateService = new CustomTemplateService();
	#dialog: ?Dialog = null;
	#titleInput: ?Input = null;
	#slotNode: ?HTMLElement = null;
	#bindingNode: ?HTMLElement = null;
	#bodyErrorNode: ?HTMLElement = null;
	#mountedEditor: ?Object = null;
	#mode: 'create' | 'edit' = 'create';
	#templateId: ?number = null;
	#titleInitial: string = '';
	#binding: ?Binding = null;
	#bindingLabels: string[] = [];
	#bindingHint: string = '';
	#strategy: string = 'reject';
	#wasResolved: boolean = false;
	#isClosed: boolean = false;
	#resolveResult: ?(result: ?Object) => void = null;

	constructor()
	{
		super();
		this.setEventNamespace('BX.MessageService.CustomTemplate.Editor');
	}

	get dialog(): ?Dialog
	{
		return this.#dialog;
	}

	async open(options: OpenOptions): Promise<?Object>
	{
		const {
			mode,
			templateId = null,
			titleInitial = '',
			bodyInitial = '',
			binding,
			strategy = 'reject',
		} = options;

		this.#mode = mode;
		this.#templateId = templateId;
		this.#titleInitial = titleInitial;
		this.#binding = binding;
		this.#bindingLabels = [];
		this.#bindingHint = '';
		this.#strategy = strategy;
		this.#mountedEditor = null;
		this.#wasResolved = false;
		this.#isClosed = false;

		let rejectResult: (error: mixed) => void = () => {};
		const resultPromise: Promise<?Object> = new Promise((resolve, reject) => {
			this.#resolveResult = resolve;
			rejectResult = reject;
		});

		const titleBarMessage = mode === 'edit'
			? 'MSGSVC_CT_EDITOR_TITLE_EDIT'
			: 'MSGSVC_CT_EDITOR_TITLE_NEW';
		const titleText = Loc.getMessage(titleBarMessage);
		const { root, slotNode, bodyErrorNode, bindingNode } = this.#buildContent(titleInitial);
		this.#slotNode = slotNode;
		this.#bodyErrorNode = bodyErrorNode;
		this.#bindingNode = bindingNode;

		const deleteButton = this.#mode === 'edit' ? this.#buildDeleteButton() : null;

		this.#dialog = new Dialog({
			title: titleText,
			content: root,
			leftButtons: [
				this.#buildSaveButton(),
				this.#buildCancelButton(),
			],
			rightButtons: deleteButton ? [deleteButton] : [],
			hasCloseButton: true,
			closeByEsc: true,
			closeByClickOutside: true,
			hasOverlay: false,
			width: DIALOG_WIDTH,
			events: {
				// Dialog emits onHide for every close — including the one we trigger
				// ourselves after a successful save or delete. The `wasResolved`
				// flag disambiguates them, so the pending result is settled with null
				// only on a real cancel. Resolve is idempotent.
				onHide: () => {
					this.#isClosed = true;
					if (!this.#wasResolved)
					{
						this.#resolveResult?.(null);
					}
				},
				onAfterHide: () => {
					this.#destroyEditor(this.#mountedEditor);
					this.#mountedEditor = null;
					this.#dialog = null;
				},
			},
		});

		this.#dialog.show();

		void this.#renderSlot(bodyInitial, rejectResult);

		return resultPromise;
	}

	async #renderSlot(bodyInitial: string, rejectResult: (error: mixed) => void): Promise<void>
	{
		// Let the embedder render an editor inside the slot and (optionally)
		// hand us back a handle to read the body from on save.
		const mountEvent = new BaseEvent({
			data: { target: this.#slotNode, body: bodyInitial },
		});

		try
		{
			await this.emitAsync('onSlotRender', mountEvent);
		}
		catch (error)
		{
			rejectResult(error);

			return;
		}

		const mountedEditor = mountEvent.getData().editor ?? null;
		if (this.#isClosed || !this.#dialog)
		{
			this.#destroyEditor(mountedEditor);

			return;
		}

		this.#mountedEditor = mountedEditor;
		this.#bindingHint = mountEvent.getData().bindingHint ?? '';
		this.#setBindingLabels(mountEvent.getData().bindingLabels ?? []);
	}

	#destroyEditor(editor: ?Object): void
	{
		if (Type.isFunction(editor?.destroy))
		{
			editor.destroy();
		}
	}

	#buildContent(titleInitial: string): Content
	{
		const titleLabel = Loc.getMessage('MSGSVC_CT_EDITOR_TITLE_LABEL');
		this.#titleInput = new Input({
			value: titleInitial,
			label: titleLabel,
			placeholder: Loc.getMessage('MSGSVC_CT_EDITOR_TITLE_PLACEHOLDER'),
			size: InputSize.Md,
			design: InputDesign.LightGrey,
			stretched: true,
			dataTestId: 'custom-template-title',
			onInput: () => this.#titleInput.setError(''),
		});

		const slotNode = Tag.render`
			<div class="msgsvc-ct-form__slot" data-testid="custom-template-editor-body"></div>
		`;
		const bodyErrorNode = Tag.render`
			<div class="msgsvc-ct-form__body-error" data-testid="custom-template-editor-body-error" role="alert" hidden></div>
		`;
		const bindingNode = Tag.render`
			<div class="msgsvc-ct-form__binding" data-testid="custom-template-editor-binding" hidden></div>
		`;

		const formNode = Tag.render`
			<div class="msgsvc-ct-form" data-testid="custom-template-editor">
				${this.#titleInput.render()}
				${slotNode}
				${bodyErrorNode}
				${bindingNode}
			</div>
		`;

		// The DS input label is a plain div, so it does not give the field an
		// accessible name; duplicate the visible label text onto the input.
		formNode.querySelector('[data-test-id="custom-template-title"]')?.setAttribute('aria-label', titleLabel);

		return { root: formNode, slotNode, bodyErrorNode, bindingNode };
	}

	#buildSaveButton(): Button
	{
		return new Button({
			text: Loc.getMessage('MSGSVC_CT_EDITOR_BUTTON_SAVE'),
			style: AirButtonStyle.FILLED,
			size: ButtonSize.MEDIUM,
			useAirDesign: true,
			dataset: { testid: 'custom-template-editor-save-btn' },
			onclick: () => {
				void this.#handleSaveClick();
			},
		});
	}

	#buildCancelButton(): Button
	{
		return new Button({
			text: Loc.getMessage('MSGSVC_CT_EDITOR_BUTTON_CANCEL'),
			style: AirButtonStyle.OUTLINE,
			size: ButtonSize.MEDIUM,
			useAirDesign: true,
			dataset: { testid: 'custom-template-editor-cancel-btn' },
			onclick: () => this.#dialog?.hide(),
		});
	}

	#setBindingLabels(labels: string[]): void
	{
		if (!this.#bindingNode)
		{
			return;
		}

		this.#bindingLabels = labels.filter((label) => Type.isStringFilled(label));

		Dom.clean(this.#bindingNode);
		this.#bindingNode.hidden = this.#bindingLabels.length === 0;
		if (this.#bindingNode.hidden)
		{
			return;
		}

		const chipsNode = Tag.render`<div class="msgsvc-ct-form__binding-chips"></div>`;

		this.#bindingLabels.forEach((label) => {
			const chip = new Chip({
				// Chip interpolates its text as raw HTML, so encode the zone-provided labels.
				text: Text.encode(label),
				design: ChipDesign.TintedNoAccent,
				size: ChipSize.Md,
			});

			// Binding chips are read-only markers (no onClick), so drop the
			// interactive affordances the chip renders by default (pointer cursor, focusability).
			const chipNode = chip.render();
			Dom.addClass(chipNode, 'msgsvc-ct-form__binding-chip');
			chipNode.removeAttribute('tabindex');

			Dom.append(chipNode, chipsNode);
		});

		// The hint text is zone-specific wording composed by the embedder; the
		// modal itself stays zone-agnostic and renders no hint without it.
		if (Type.isStringFilled(this.#bindingHint))
		{
			const hintNode = Hint.createNode(this.#bindingHint);
			Dom.attr(hintNode, 'data-testid', 'custom-template-editor-binding-hint');
			Dom.append(hintNode, chipsNode);
		}

		Dom.append(Tag.render`
			<div class="msgsvc-ct-form__binding-content">
				${chipsNode}
			</div>
		`, this.#bindingNode);
	}

	#setBodyError(text: string): void
	{
		if (!this.#bodyErrorNode)
		{
			return;
		}

		this.#bodyErrorNode.textContent = text;
		this.#bodyErrorNode.hidden = !Type.isStringFilled(text);
	}

	#clearFieldErrors(): void
	{
		this.#titleInput?.setError('');
		this.#setBodyError('');
	}

	#buildDeleteButton(): Button
	{
		const deleteButton = new Button({
			icon: Outline.TRASHCAN,
			style: AirButtonStyle.PLAIN_NO_ACCENT,
			size: ButtonSize.MEDIUM,
			useAirDesign: true,
			className: 'msgsvc-ct-delete-btn',
			dataset: { testid: 'custom-template-editor-delete-btn' },
			onclick: () => {
				void this.#handleDeleteClick();
			},
		});

		const deleteText = Loc.getMessage('MSGSVC_CT_EDITOR_BUTTON_DELETE');
		Dom.attr(deleteButton.getContainer(), {
			'aria-label': deleteText,
			title: deleteText,
		});

		return deleteButton;
	}

	async #handleDeleteClick(): Promise<void>
	{
		// Load the confirm dialog lazily: the messagebox chain is only needed on
		// this cold path, mirroring the grid delete flow of the list component.
		const { MessageBox } = await Runtime.loadExtension('ui.dialogs.messagebox');

		const confirmed = await this.#confirmDelete(MessageBox);
		if (!confirmed || this.#isClosed)
		{
			return;
		}

		try
		{
			await this.#service.delete(this.#templateId);

			this.#wasResolved = true;
			this.#resolveResult?.({ deleted: true, templateId: this.#templateId });
			this.#dialog?.hide();
		}
		catch (error)
		{
			this.#showErrorToast(error);
		}
	}

	#confirmDelete(MessageBox: Object): Promise<boolean>
	{
		// MessageBox renders the message string as HTML: encode the user-owned
		// title and the zone-provided subject label before interpolation.
		const title = this.#titleInitial.trim();
		const subject = this.#bindingLabels[0] ?? '';
		const hasContext = Type.isStringFilled(title) && Type.isStringFilled(subject);
		const text = hasContext
			? Loc.getMessage('MSGSVC_CT_EDITOR_CONFIRM_DELETE_TEXT', {
				'#TITLE#': Text.encode(title),
				'#SUBJECT#': Text.encode(subject),
			})
			: Loc.getMessage('MSGSVC_CT_EDITOR_CONFIRM_DELETE_TITLE');

		return new Promise((resolve) => {
			MessageBox.confirm(
				`<div class="ui-typography-heading-h3">${text}</div>`,
				(messageBox) => {
					resolve(true);
					messageBox.close();
				},
				Loc.getMessage('MSGSVC_CT_EDITOR_CONFIRM_DELETE_OK'),
				(messageBox) => {
					resolve(false);
					messageBox.close();
				},
				Loc.getMessage('MSGSVC_CT_EDITOR_CONFIRM_DELETE_CANCEL'),
				true,
			);
		});
	}

	async #handleSaveClick(): Promise<void>
	{
		this.#clearFieldErrors();

		const title = (this.#titleInput?.getValue() ?? '').trim();
		const body = Type.isObject(this.#mountedEditor) && Type.isFunction(this.#mountedEditor.getState)
			? (this.#mountedEditor.getState()?.message?.body ?? '')
			: '';

		if (!title)
		{
			this.#titleInput?.setError(Loc.getMessage('MSGSVC_CT_VALIDATION_TITLE_EMPTY'));
			this.#titleInput?.focus();

			return;
		}

		if (!body)
		{
			this.#setBodyError(Loc.getMessage('MSGSVC_CT_VALIDATION_BODY_EMPTY'));

			return;
		}

		try
		{
			const dto = this.#mode === 'create'
				? await this.#service.create({ ...this.#binding, title, body, strategy: this.#strategy })
				: await this.#service.update(this.#templateId, { title, body });

			this.#wasResolved = true;
			this.#resolveResult?.(dto);
			this.#dialog?.hide();
		}
		catch (error)
		{
			this.#handleSaveError(error);
		}
	}

	#handleSaveError(error: Object): void
	{
		// A duplicate name is the one error the user fixes inline, so it is
		// surfaced under the title field; every other error stays a toast.
		if (error?.errors?.[0]?.code === TITLE_DUPLICATE_ERROR_CODE)
		{
			this.#titleInput?.setError(Loc.getMessage('MSGSVC_CT_VALIDATION_TITLE_DUPLICATE'));
			this.#titleInput?.focus();

			return;
		}

		this.#showErrorToast(error);
	}

	#showErrorToast(error: Object): void
	{
		const message = error?.errors?.[0]?.message;
		BX.UI.Notification.Center.notify({
			useAirDesign: true,
			content: Type.isStringFilled(message)
				? message
				: Loc.getMessage('MSGSVC_CT_ERROR_GENERIC'),
		});
	}
}
