/* eslint-disable */
(function (main_core) {
	'use strict';

	const namespace = main_core.Reflection.namespace('BX.MessageService.CustomTemplate.List');
	const reloadGrid = gridId => {
		BX.Main.gridManager.getInstanceById(gridId)?.reload();
	};
	const notifyError = (notification, err) => {
		const message = err?.errors?.[0]?.message;
		notification.Center.notify({
			content: main_core.Type.isStringFilled(message) ? message : main_core.Loc.getMessage('MSGSVC_CT_ERROR_GENERIC'),
			useAirDesign: true
		});
	};
	const confirmDelete = MessageBox => {
		return new Promise(resolve => {
			MessageBox.confirm(main_core.Loc.getMessage('MSGSVC_CT_LIST_CONFIRM_DELETE_TEXT'), main_core.Loc.getMessage('MSGSVC_CT_LIST_CONFIRM_DELETE_TITLE'), messageBox => {
				resolve(true);
				messageBox.close();
			}, main_core.Loc.getMessage('MSGSVC_CT_LIST_CONFIRM_DELETE_OK'), messageBox => {
				resolve(false);
				messageBox.close();
			}, main_core.Loc.getMessage('MSGSVC_CT_LIST_CONFIRM_DELETE_CANCEL'), true);
		});
	};
	namespace.requestDelete = async function (options) {
		const {
			gridId,
			templateId
		} = options;

		// Load only the lightweight messagebox first so a cancelled confirm does
		// not pull in the heavy editor bundle and the notification extension.
		const {
			MessageBox
		} = await main_core.Runtime.loadExtension('ui.dialogs.messagebox');
		const confirmed = await confirmDelete(MessageBox);
		if (!confirmed) {
			return;
		}
		const [{
			Center
		}, {
			CustomTemplateService
		}] = await Promise.all([main_core.Runtime.loadExtension('ui.notification'), main_core.Runtime.loadExtension('messageservice.custom-template.editor')]);
		try {
			await new CustomTemplateService().delete(templateId);
			reloadGrid(gridId);
		} catch (err) {
			notifyError({
				Center
			}, err);
		}
	};

})(BX);
//# sourceMappingURL=script.js.map
