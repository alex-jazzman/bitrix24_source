import { Loc } from 'main.core';

import { Core } from 'im.v2.application.core';
import { ChatType, type ChatTypeItem } from 'im.v2.const';
import { Utils } from 'im.v2.lib.utils';

export type FileUploadPolicy = {
	allowedExtensions: string[],
	maxFileSize: number,
	maxFilesPerMessage: number,
};

function getCopilotPolicy(): FileUploadPolicy | null
{
	return Core.getApplicationData().copilot?.fileUploadPolicy ?? null;
}

export function getFileUploadPolicy(chatType: ChatTypeItem | null): FileUploadPolicy | null
{
	switch (chatType)
	{
		case ChatType.copilot:
			return getCopilotPolicy();
		default:
			return null;
	}
}

export function buildPolicyNote(policy: FileUploadPolicy): string
{
	return Loc.getMessagePlural('IM_TEXTAREA_UPLOAD_POLICY_HINT_LIMITS', policy.maxFilesPerMessage, {
		'#COUNT#': String(policy.maxFilesPerMessage),
		'#SIZE#': Utils.file.formatFileSize(policy.maxFileSize),
	});
}
