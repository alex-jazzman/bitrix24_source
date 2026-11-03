import { ajax as Ajax, Loc, Type } from 'main.core';
import { type BaseEvent } from 'main.core.events';
import 'ui.notification';

import { CustomTemplateEditor } from 'messageservice.custom-template.editor';

import { Editor as MessageEditor, EscapeService } from 'crm.messagesender.editor';

type OpenFormPayload = {
	mode: 'create' | 'edit',
	templateId?: ?number,
	scene: string,
	targetId: string,
	titleInitial?: string,
	bodyInitial?: string,
	bindElement?: ?HTMLElement,
};

const notifyError = (err) => {
	const message = err?.errors?.[0]?.message;
	BX.UI.Notification.Center.notify({
		useAirDesign: true,
		content: Type.isStringFilled(message)
			? message
			: Loc.getMessage('CRM_MS_CT_ERROR_GENERIC'),
	});
};

const mountCrmEditor = (target: HTMLElement, body: string, editorOptions: Object): MessageEditor => {
	const editor = new MessageEditor({
		...editorOptions,
		renderTo: target,
		message: { text: body },
		// The modal already supplies the form padding; zero out the inner editor.
		layout: {
			...editorOptions.layout,
			padding: '0',
			paddingTop: '0',
			paddingBottom: '0',
			paddingLeft: '0',
			paddingRight: '0',
			contentMarginBottom: '0',
			isMessageLengthCounterShown: false,
		},
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
export async function openCustomTemplateForm(payload: OpenFormPayload): Promise<?Object>
{
	const {
		mode,
		templateId = null,
		scene,
		targetId,
		titleInitial = '',
		bodyInitial = '',
		bindElement = null,
	} = payload;

	if (mode === 'edit' && (!Type.isNumber(templateId) || templateId <= 0))
	{
		return null;
	}

	let params = null;
	try
	{
		params = await new Promise((resolve, reject) => {
			Ajax.runAction('crm.messagesender.editor.loadCustomTemplate', {
				json: { scene, targetId },
			})
				.then(resolve)
				.catch(reject)
			;
		});
	}
	catch (err)
	{
		notifyError(err);

		return null;
	}

	const bindingLabels = params?.data?.bindingLabels ?? [];
	const editorOptions = params?.data?.editor ?? {};

	const escapeService = new EscapeService();

	const modal = new CustomTemplateEditor();
	modal.subscribe('onSlotRender', (event: BaseEvent) => {
		const { target, body } = event.getData();
		const editor = mountCrmEditor(target, body ?? '', editorOptions);

		// CRM getState() returns a transport-encoded body ({/} -> &#123;/&#125;);
		// the persisted body must stay raw, matching the save-flow and edit-load paths.
		const rawBodyEditor = {
			getState: () => {
				const state = editor.getState();

				return state
					? { ...state, message: { ...state.message, body: escapeService.decode(state.message.body) } }
					: null;
			},
			destroy: () => editor.destroy(),
		};

		event.setData({
			editor: rawBodyEditor,
			bindingLabels,
			bindingHint: Loc.getMessage('CRM_MS_CT_EDITOR_BINDING_HINT'),
		});
	});

	return modal.open({
		mode,
		templateId,
		titleInitial,
		bodyInitial,
		bindElement,
		binding: { zone: 'crm', scene, targetId },
		strategy: 'reject',
	});
}
