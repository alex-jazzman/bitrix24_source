import { Dom, Runtime, Tag, Type } from 'main.core';

import { useLoc } from './loc';

type FormPayload = {
	id: string,
	documentType: Array<string>,
	activity: string,
	workflow: {
		parameters: Array<{...}>,
		variables: Array<{...}>,
		template: Array<{...}>,
		constants: Array<{...}>
	},
};

const renderPropertyDialog = async (contentContainer: HTMLElement, formData: FormData): Promise<void> => {
	if (Type.isUndefined(window.rootActivity))
	{
		return null;
	}

	const { getMessage } = useLoc();
	const contentUrl = `/bitrix/tools/bizproc_activity_settings.php?mode=public&bxpublic=Y&lang=${getMessage('LANGUAGE_ID')}&app=vue`;
	const content = await fetch(contentUrl, {
		method: 'POST',
		body: formData,
	});
	const form = Tag.render`
		<form
			id="form-settings"
			class="bx-core-adm-dialog node-settings-form"
			name="bx_popup_form">
		</form>
	`;
	Dom.append(form, contentContainer);
	await Runtime.html(form, await content.text());

	return form;
};

const createFormData = ({ id, documentType, activity, workflow }: FormPayload): FormData => {
	const { parameters, variables, template, constants } = workflow;
	const postData = {
		id,
		decode: 'Y',
		module_id: documentType[0],
		entity: documentType[1],
		document_type: documentType[2],
		activity,
		arWorkflowParameters: JSON.stringify(parameters),
		arWorkflowVariables: JSON.stringify(variables),
		arWorkflowTemplate: JSON.stringify(template),
		arWorkflowConstants: JSON.stringify(constants),
		current_site_id: 's1',
		can_be_activated: 'Y',
		// eslint-disable-next-line @bitrix24/bitrix24-rules/no-bx
		sessid: BX.bitrix_sessid(),
	};
	const dialog = new BX.CDialog({ // temporary dialog
		content: '<div class="for-camp"></div>',
		width: 400,
		height: 200,
	});
	dialog.Show();
	const formData = new FormData();
	Object.entries(postData).forEach(([key, value]) => {
		formData.append(key, value);
	});

	return formData;
};

export function usePropertyDialog(): { createFormData: Function; renderPropertyDialog: Function }
{
	return {
		createFormData,
		renderPropertyDialog,
	};
}
