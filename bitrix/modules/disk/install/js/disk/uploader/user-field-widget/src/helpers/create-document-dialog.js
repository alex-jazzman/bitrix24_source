import { Type } from 'main.core';
import { Uploader } from 'ui.uploader.core';
import 'disk.document';
import { DocumentService, DocumentType } from '../const';

type CreateDocumentOptions = {
	uploader: Uploader,
	documentType: 'docx' | 'xlsx' | 'pptx' | 'board',
	onAddFile: Function,
};

export const createDocumentDialog = (options: CreateDocumentOptions = {}): void => {
	const uploader: ?Uploader = (options.uploader instanceof Uploader) ? options.uploader : null;
	const documentType: ?string = Type.isStringFilled(options.documentType) ? options.documentType : null;
	const onAddFile: ?Function = Type.isFunction(options.onAddFile) ? options.onAddFile : null;

	// TODO: load disk and disk.document extensions on demand
	if (!BX.Disk.getDocumentService())
	{
		const service = BX.Disk.isAvailableOnlyOffice() ? DocumentService.OnlyOffice : DocumentService.Local;
		BX.Disk.saveDocumentService(service);
	}

	let newTab = null;
	if (documentType === DocumentType.Board)
	{
		newTab = window.open('', '_blank');
	}

	if (BX.Disk.Document.Local.Instance.isSetWorkWithLocalBDisk() || documentType === 'board')
	{
		BX.Disk.Document.Local.Instance.createFile({ type: documentType }).then((response): void => {
			if (response.status === 'success')
			{
				if (documentType === 'board')
				{
					BX.UI.Analytics.sendData({
						event: 'create',
						tool: 'boards',
						category: 'boards',
						c_element: 'docs_attach_uploader_widget',
					});
				}

				uploader.addFile(
					`n${response.object.id}`,
					{
						name: response.object.name,
						preload: true,
					},
				);

				onAddFile?.();

				if (newTab !== null && response.openUrl)
				{
					newTab.location.href = response.openUrl;
				}
			}
		});
	}
	else
	{
		const createProcess = new BX.Disk.Document.CreateProcess({
			typeFile: documentType,
			serviceCode: BX.Disk.getDocumentService(),
			onAfterSave: (response): void => {
				if (response.status !== 'success')
				{
					return;
				}

				if (response.object)
				{
					uploader.addFile(
						`n${response.object.id}`,
						{
							name: response.object.name,
							size: response.object.size,
							preload: true,
						},
					);

					onAddFile?.();
				}
			},
		});

		createProcess.start();
	}
};
