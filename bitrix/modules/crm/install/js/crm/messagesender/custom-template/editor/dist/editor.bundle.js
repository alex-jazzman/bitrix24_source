/* eslint-disable */
this.BX = this.BX || {};
this.BX.Crm = this.BX.Crm || {};
this.BX.Crm.MessageSender = this.BX.Crm.MessageSender || {};
this.BX.Crm.MessageSender.CustomTemplate = this.BX.Crm.MessageSender.CustomTemplate || {};
(function (exports, main_core, ui_notification, messageservice_customTemplate_editor, crm_messagesender_editor) {
	'use strict';

	const notifyError = err => {
		const message = err?.errors?.[0]?.message;
		BX.UI.Notification.Center.notify({
			useAirDesign: true,
			content: main_core.Type.isStringFilled(message) ? message : main_core.Loc.getMessage('CRM_MS_CT_ERROR_GENERIC')
		});
	};
	const mountCrmEditor = (target, body, editorOptions) => {
		const editor = new crm_messagesender_editor.Editor({
			...editorOptions,
			renderTo: target,
			message: {
				text: body
			},
			// The modal already supplies the form padding; zero out the inner editor.
			layout: {
				...editorOptions.layout,
				padding: '0',
				paddingTop: '0',
				paddingBottom: '0',
				paddingLeft: '0',
				paddingRight: '0',
				contentMarginBottom: '0',
				isMessageLengthCounterShown: false
			}
		});
		void editor.render();
		return editor;
	};

	// CRM-only — Booking/Slots will provide their own openCustomTemplateForm
	// that wires zone='booking'/'slots' and a CRM-independent loadCustomTemplate.
	// Edit callers are expected to pass the current template text in the payload
	// instead of triggering an additional template read.
	// Resolves with the saved DTO, with `{ deleted: true, templateId }` when the
	// template is deleted from the modal footer, or null if the modal was
	// dismissed; any truthy result means the embedder should refresh its list.
	async function openCustomTemplateForm(payload) {
		const {
			mode,
			templateId = null,
			scene,
			targetId,
			titleInitial = '',
			bodyInitial = '',
			bindElement = null
		} = payload;
		if (mode === 'edit' && (!main_core.Type.isNumber(templateId) || templateId <= 0)) {
			return null;
		}
		let params = null;
		try {
			params = await new Promise((resolve, reject) => {
				main_core.ajax.runAction('crm.messagesender.editor.loadCustomTemplate', {
					json: {
						scene,
						targetId
					}
				}).then(resolve).catch(reject);
			});
		} catch (err) {
			notifyError(err);
			return null;
		}
		const bindingLabels = params?.data?.bindingLabels ?? [];
		const editorOptions = params?.data?.editor ?? {};
		const escapeService = new crm_messagesender_editor.EscapeService();
		const modal = new messageservice_customTemplate_editor.CustomTemplateEditor();
		modal.subscribe('onSlotRender', event => {
			const {
				target,
				body
			} = event.getData();
			const editor = mountCrmEditor(target, body ?? '', editorOptions);

			// CRM getState() returns a transport-encoded body ({/} -> &#123;/&#125;);
			// the persisted body must stay raw, matching the save-flow and edit-load paths.
			const rawBodyEditor = {
				getState: () => {
					const state = editor.getState();
					return state ? {
						...state,
						message: {
							...state.message,
							body: escapeService.decode(state.message.body)
						}
					} : null;
				},
				destroy: () => editor.destroy()
			};
			event.setData({
				editor: rawBodyEditor,
				bindingLabels,
				bindingHint: main_core.Loc.getMessage('CRM_MS_CT_EDITOR_BINDING_HINT')
			});
		});
		return modal.open({
			mode,
			templateId,
			titleInitial,
			bodyInitial,
			bindElement,
			binding: {
				zone: 'crm',
				scene,
				targetId
			},
			strategy: 'reject'
		});
	}

	exports.openCustomTemplateForm = openCustomTemplateForm;

})(this.BX.Crm.MessageSender.CustomTemplate.Editor = this.BX.Crm.MessageSender.CustomTemplate.Editor || {}, BX, BX.UI.Notification, BX.MessageService.CustomTemplate.Editor, BX.Crm.MessageSender.Editor);
//# sourceMappingURL=editor.bundle.js.map
