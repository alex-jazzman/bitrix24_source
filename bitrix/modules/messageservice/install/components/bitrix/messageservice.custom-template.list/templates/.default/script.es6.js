import { Loc, Reflection, Runtime, Type } from 'main.core';

type DeleteOptions = {
	gridId: string,
	templateId: number,
	title: string,
	subject: string,
};

const namespace = Reflection.namespace('BX.MessageService.CustomTemplate.List');

const reloadGrid = (gridId: string): void => {
	BX.Main.gridManager.getInstanceById(gridId)?.reload();
};

const notifyError = (notification, err): void => {
	const message = err?.errors?.[0]?.message;
	notification.Center.notify({
		content: Type.isStringFilled(message)
			? message
			: Loc.getMessage('MSGSVC_CT_ERROR_GENERIC'),
		useAirDesign: true,
	});
};

const confirmDelete = (MessageBox): Promise<boolean> => {
	return new Promise((resolve) => {
		MessageBox.confirm(
			Loc.getMessage('MSGSVC_CT_LIST_CONFIRM_DELETE_TEXT'),
			Loc.getMessage('MSGSVC_CT_LIST_CONFIRM_DELETE_TITLE'),
			(messageBox) => {
				resolve(true);
				messageBox.close();
			},
			Loc.getMessage('MSGSVC_CT_LIST_CONFIRM_DELETE_OK'),
			(messageBox) => {
				resolve(false);
				messageBox.close();
			},
			Loc.getMessage('MSGSVC_CT_LIST_CONFIRM_DELETE_CANCEL'),
			true,
		);
	});
};

namespace.requestDelete = async function(options: DeleteOptions): Promise<void> {
	const { gridId, templateId } = options;

	// Load only the lightweight messagebox first so a cancelled confirm does
	// not pull in the heavy editor bundle and the notification extension.
	const { MessageBox } = await Runtime.loadExtension('ui.dialogs.messagebox');

	const confirmed = await confirmDelete(MessageBox);
	if (!confirmed)
	{
		return;
	}

	const [{ Center }, { CustomTemplateService }] = await Promise.all([
		Runtime.loadExtension('ui.notification'),
		Runtime.loadExtension('messageservice.custom-template.editor'),
	]);

	try
	{
		await new CustomTemplateService().delete(templateId);
		reloadGrid(gridId);
	}
	catch (err)
	{
		notifyError({ Center }, err);
	}
};
