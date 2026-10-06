/* eslint-disable */
this.BX = this.BX || {};
this.BX.MessageService = this.BX.MessageService || {};
this.BX.MessageService.CustomTemplate = this.BX.MessageService.CustomTemplate || {};
(function (exports, main_core, main_core_events, ui_buttons, ui_iconSet_api_core, ui_iconSet_outline, ui_system_dialog, ui_system_chip, ui_system_input, ui_hint) {
	'use strict';

	class CustomTemplateService {
		create({
			zone,
			scene,
			targetId,
			title,
			body,
			strategy = 'reject'
		}) {
			return new Promise((resolve, reject) => {
				main_core.ajax.runAction('messageservice.api.CustomTemplate.CustomTemplate.create', {
					json: {
						zone,
						scene,
						targetId,
						title,
						body,
						strategy
					}
				}).then(response => resolve(response.data)).catch(reject);
			});
		}
		update(templateId, {
			title,
			body
		}) {
			return new Promise((resolve, reject) => {
				main_core.ajax.runAction('messageservice.api.CustomTemplate.CustomTemplate.update', {
					json: {
						templateId,
						title,
						body
					}
				}).then(response => resolve(response.data)).catch(reject);
			});
		}
		delete(templateId) {
			return new Promise((resolve, reject) => {
				main_core.ajax.runAction('messageservice.api.CustomTemplate.CustomTemplate.delete', {
					json: {
						templateId
					}
				}).then(response => resolve(response.data)).catch(reject);
			});
		}
	}

	const DIALOG_WIDTH = 600;
	const TITLE_DUPLICATE_ERROR_CODE = 'CUSTOM_TEMPLATE_TITLE_DUPLICATE';
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
	class CustomTemplateEditor extends main_core_events.EventEmitter {
		#service = new CustomTemplateService();
		#dialog = null;
		#titleInput = null;
		#slotNode = null;
		#bindingNode = null;
		#bodyErrorNode = null;
		#mountedEditor = null;
		#mode = 'create';
		#templateId = null;
		#titleInitial = '';
		#binding = null;
		#bindingLabels = [];
		#bindingHint = '';
		#strategy = 'reject';
		#wasResolved = false;
		#isClosed = false;
		#resolveResult = null;
		constructor() {
			super();
			this.setEventNamespace('BX.MessageService.CustomTemplate.Editor');
		}
		get dialog() {
			return this.#dialog;
		}
		async open(options) {
			const {
				mode,
				templateId = null,
				titleInitial = '',
				bodyInitial = '',
				binding,
				strategy = 'reject'
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
			let rejectResult = () => {};
			const resultPromise = new Promise((resolve, reject) => {
				this.#resolveResult = resolve;
				rejectResult = reject;
			});
			const titleBarMessage = mode === 'edit' ? 'MSGSVC_CT_EDITOR_TITLE_EDIT' : 'MSGSVC_CT_EDITOR_TITLE_NEW';
			const titleText = main_core.Loc.getMessage(titleBarMessage);
			const {
				root,
				slotNode,
				bodyErrorNode,
				bindingNode
			} = this.#buildContent(titleInitial);
			this.#slotNode = slotNode;
			this.#bodyErrorNode = bodyErrorNode;
			this.#bindingNode = bindingNode;
			const deleteButton = this.#mode === 'edit' ? this.#buildDeleteButton() : null;
			this.#dialog = new ui_system_dialog.Dialog({
				title: titleText,
				content: root,
				leftButtons: [this.#buildSaveButton(), this.#buildCancelButton()],
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
						if (!this.#wasResolved) {
							this.#resolveResult?.(null);
						}
					},
					onAfterHide: () => {
						this.#destroyEditor(this.#mountedEditor);
						this.#mountedEditor = null;
						this.#dialog = null;
					}
				}
			});
			this.#dialog.show();
			void this.#renderSlot(bodyInitial, rejectResult);
			return resultPromise;
		}
		async #renderSlot(bodyInitial, rejectResult) {
			// Let the embedder render an editor inside the slot and (optionally)
			// hand us back a handle to read the body from on save.
			const mountEvent = new main_core_events.BaseEvent({
				data: {
					target: this.#slotNode,
					body: bodyInitial
				}
			});
			try {
				await this.emitAsync('onSlotRender', mountEvent);
			} catch (error) {
				rejectResult(error);
				return;
			}
			const mountedEditor = mountEvent.getData().editor ?? null;
			if (this.#isClosed || !this.#dialog) {
				this.#destroyEditor(mountedEditor);
				return;
			}
			this.#mountedEditor = mountedEditor;
			this.#bindingHint = mountEvent.getData().bindingHint ?? '';
			this.#setBindingLabels(mountEvent.getData().bindingLabels ?? []);
		}
		#destroyEditor(editor) {
			if (main_core.Type.isFunction(editor?.destroy)) {
				editor.destroy();
			}
		}
		#buildContent(titleInitial) {
			const titleLabel = main_core.Loc.getMessage('MSGSVC_CT_EDITOR_TITLE_LABEL');
			this.#titleInput = new ui_system_input.Input({
				value: titleInitial,
				label: titleLabel,
				placeholder: main_core.Loc.getMessage('MSGSVC_CT_EDITOR_TITLE_PLACEHOLDER'),
				size: ui_system_input.InputSize.Md,
				design: ui_system_input.InputDesign.LightGrey,
				stretched: true,
				dataTestId: 'custom-template-title',
				onInput: () => this.#titleInput.setError('')
			});
			const slotNode = main_core.Tag.render`
			<div class="msgsvc-ct-form__slot" data-testid="custom-template-editor-body"></div>
		`;
			const bodyErrorNode = main_core.Tag.render`
			<div class="msgsvc-ct-form__body-error" data-testid="custom-template-editor-body-error" role="alert" hidden></div>
		`;
			const bindingNode = main_core.Tag.render`
			<div class="msgsvc-ct-form__binding" data-testid="custom-template-editor-binding" hidden></div>
		`;
			const formNode = main_core.Tag.render`
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
			return {
				root: formNode,
				slotNode,
				bodyErrorNode,
				bindingNode
			};
		}
		#buildSaveButton() {
			return new ui_buttons.Button({
				text: main_core.Loc.getMessage('MSGSVC_CT_EDITOR_BUTTON_SAVE'),
				style: ui_buttons.AirButtonStyle.FILLED,
				size: ui_buttons.ButtonSize.MEDIUM,
				useAirDesign: true,
				dataset: {
					testid: 'custom-template-editor-save-btn'
				},
				onclick: () => {
					void this.#handleSaveClick();
				}
			});
		}
		#buildCancelButton() {
			return new ui_buttons.Button({
				text: main_core.Loc.getMessage('MSGSVC_CT_EDITOR_BUTTON_CANCEL'),
				style: ui_buttons.AirButtonStyle.OUTLINE,
				size: ui_buttons.ButtonSize.MEDIUM,
				useAirDesign: true,
				dataset: {
					testid: 'custom-template-editor-cancel-btn'
				},
				onclick: () => this.#dialog?.hide()
			});
		}
		#setBindingLabels(labels) {
			if (!this.#bindingNode) {
				return;
			}
			this.#bindingLabels = labels.filter(label => main_core.Type.isStringFilled(label));
			main_core.Dom.clean(this.#bindingNode);
			this.#bindingNode.hidden = this.#bindingLabels.length === 0;
			if (this.#bindingNode.hidden) {
				return;
			}
			const chipsNode = main_core.Tag.render`<div class="msgsvc-ct-form__binding-chips"></div>`;
			this.#bindingLabels.forEach(label => {
				const chip = new ui_system_chip.Chip({
					// Chip interpolates its text as raw HTML, so encode the zone-provided labels.
					text: main_core.Text.encode(label),
					design: ui_system_chip.ChipDesign.TintedNoAccent,
					size: ui_system_chip.ChipSize.Md
				});

				// Binding chips are read-only markers (no onClick), so drop the
				// interactive affordances the chip renders by default (pointer cursor, focusability).
				const chipNode = chip.render();
				main_core.Dom.addClass(chipNode, 'msgsvc-ct-form__binding-chip');
				chipNode.removeAttribute('tabindex');
				main_core.Dom.append(chipNode, chipsNode);
			});

			// The hint text is zone-specific wording composed by the embedder; the
			// modal itself stays zone-agnostic and renders no hint without it.
			if (main_core.Type.isStringFilled(this.#bindingHint)) {
				const hintNode = ui_hint.Hint.createNode(this.#bindingHint);
				main_core.Dom.attr(hintNode, 'data-testid', 'custom-template-editor-binding-hint');
				main_core.Dom.append(hintNode, chipsNode);
			}
			main_core.Dom.append(main_core.Tag.render`
			<div class="msgsvc-ct-form__binding-content">
				${chipsNode}
			</div>
		`, this.#bindingNode);
		}
		#setBodyError(text) {
			if (!this.#bodyErrorNode) {
				return;
			}
			this.#bodyErrorNode.textContent = text;
			this.#bodyErrorNode.hidden = !main_core.Type.isStringFilled(text);
		}
		#clearFieldErrors() {
			this.#titleInput?.setError('');
			this.#setBodyError('');
		}
		#buildDeleteButton() {
			const deleteButton = new ui_buttons.Button({
				icon: ui_iconSet_api_core.Outline.TRASHCAN,
				style: ui_buttons.AirButtonStyle.PLAIN_NO_ACCENT,
				size: ui_buttons.ButtonSize.MEDIUM,
				useAirDesign: true,
				className: 'msgsvc-ct-delete-btn',
				dataset: {
					testid: 'custom-template-editor-delete-btn'
				},
				onclick: () => {
					void this.#handleDeleteClick();
				}
			});
			const deleteText = main_core.Loc.getMessage('MSGSVC_CT_EDITOR_BUTTON_DELETE');
			main_core.Dom.attr(deleteButton.getContainer(), {
				'aria-label': deleteText,
				title: deleteText
			});
			return deleteButton;
		}
		async #handleDeleteClick() {
			// Load the confirm dialog lazily: the messagebox chain is only needed on
			// this cold path, mirroring the grid delete flow of the list component.
			const {
				MessageBox
			} = await main_core.Runtime.loadExtension('ui.dialogs.messagebox');
			const confirmed = await this.#confirmDelete(MessageBox);
			if (!confirmed || this.#isClosed) {
				return;
			}
			try {
				await this.#service.delete(this.#templateId);
				this.#wasResolved = true;
				this.#resolveResult?.({
					deleted: true,
					templateId: this.#templateId
				});
				this.#dialog?.hide();
			} catch (error) {
				this.#showErrorToast(error);
			}
		}
		#confirmDelete(MessageBox) {
			// MessageBox renders the message string as HTML: encode the user-owned
			// title and the zone-provided subject label before interpolation.
			const title = this.#titleInitial.trim();
			const subject = this.#bindingLabels[0] ?? '';
			const hasContext = main_core.Type.isStringFilled(title) && main_core.Type.isStringFilled(subject);
			const text = hasContext ? main_core.Loc.getMessage('MSGSVC_CT_EDITOR_CONFIRM_DELETE_TEXT', {
				'#TITLE#': main_core.Text.encode(title),
				'#SUBJECT#': main_core.Text.encode(subject)
			}) : main_core.Loc.getMessage('MSGSVC_CT_EDITOR_CONFIRM_DELETE_TITLE');
			return new Promise(resolve => {
				MessageBox.confirm(`<div class="ui-typography-heading-h3">${text}</div>`, messageBox => {
					resolve(true);
					messageBox.close();
				}, main_core.Loc.getMessage('MSGSVC_CT_EDITOR_CONFIRM_DELETE_OK'), messageBox => {
					resolve(false);
					messageBox.close();
				}, main_core.Loc.getMessage('MSGSVC_CT_EDITOR_CONFIRM_DELETE_CANCEL'), true);
			});
		}
		async #handleSaveClick() {
			this.#clearFieldErrors();
			const title = (this.#titleInput?.getValue() ?? '').trim();
			const body = main_core.Type.isObject(this.#mountedEditor) && main_core.Type.isFunction(this.#mountedEditor.getState) ? this.#mountedEditor.getState()?.message?.body ?? '' : '';
			if (!title) {
				this.#titleInput?.setError(main_core.Loc.getMessage('MSGSVC_CT_VALIDATION_TITLE_EMPTY'));
				this.#titleInput?.focus();
				return;
			}
			if (!body) {
				this.#setBodyError(main_core.Loc.getMessage('MSGSVC_CT_VALIDATION_BODY_EMPTY'));
				return;
			}
			try {
				const dto = this.#mode === 'create' ? await this.#service.create({
					...this.#binding,
					title,
					body,
					strategy: this.#strategy
				}) : await this.#service.update(this.#templateId, {
					title,
					body
				});
				this.#wasResolved = true;
				this.#resolveResult?.(dto);
				this.#dialog?.hide();
			} catch (error) {
				this.#handleSaveError(error);
			}
		}
		#handleSaveError(error) {
			// A duplicate name is the one error the user fixes inline, so it is
			// surfaced under the title field; every other error stays a toast.
			if (error?.errors?.[0]?.code === TITLE_DUPLICATE_ERROR_CODE) {
				this.#titleInput?.setError(main_core.Loc.getMessage('MSGSVC_CT_VALIDATION_TITLE_DUPLICATE'));
				this.#titleInput?.focus();
				return;
			}
			this.#showErrorToast(error);
		}
		#showErrorToast(error) {
			const message = error?.errors?.[0]?.message;
			BX.UI.Notification.Center.notify({
				useAirDesign: true,
				content: main_core.Type.isStringFilled(message) ? message : main_core.Loc.getMessage('MSGSVC_CT_ERROR_GENERIC')
			});
		}
	}

	exports.CustomTemplateEditor = CustomTemplateEditor;
	exports.CustomTemplateService = CustomTemplateService;

})(this.BX.MessageService.CustomTemplate.Editor = this.BX.MessageService.CustomTemplate.Editor || {}, BX, BX.Event, BX.UI, BX.UI.IconSet, window, BX.UI.System, BX.UI.System.Chip, BX.UI.System.Input, BX.UI);
//# sourceMappingURL=editor.bundle.js.map
