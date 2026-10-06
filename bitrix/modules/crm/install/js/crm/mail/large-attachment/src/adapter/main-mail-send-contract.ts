import { Dom } from 'main.core';
import { type LargeAttachmentSendContract } from 'mail.client.large-attachment';

export function serializeMainMailSendContracts(
	formId: string,
	contracts: LargeAttachmentSendContract[],
): boolean
{
	const form = document.getElementById(formId);
	if (!(form instanceof HTMLFormElement))
	{
		return false;
	}

	form.querySelectorAll<HTMLInputElement>('input[name^="DATA[__largeAttachments]"]').forEach(
		(input: HTMLInputElement): void => {
			Dom.remove(input);
		},
	);

	contracts.forEach((contract: LargeAttachmentSendContract, index: number): void => {
		const tokenInput = document.createElement('input');
		tokenInput.type = 'hidden';
		tokenInput.name = `DATA[__largeAttachments][${index}][token]`;
		tokenInput.value = contract.token;
		form.append(tokenInput);

		contract.fileIds.forEach((fileId: number): void => {
			const fileIdInput = document.createElement('input');
			fileIdInput.type = 'hidden';
			fileIdInput.name = `DATA[__largeAttachments][${index}][fileIds][]`;
			fileIdInput.value = String(fileId);
			form.append(fileIdInput);
		});
	});

	return true;
}
