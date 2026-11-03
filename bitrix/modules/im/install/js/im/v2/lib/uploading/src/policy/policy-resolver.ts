import { Core } from 'im.v2.application.core';
import { ChatType, type ChatTypeItem } from 'im.v2.const';

import { type FileUploadPolicy } from '../validator/file-validator';

/**
 * Default (non-copilot) chats currently impose no client-side format/size policy;
 * count limits live in utils/chunks. This is the extension point for a future
 * explicit default policy — plug a real policy here when one is needed.
 */
export const DEFAULT_FILE_UPLOAD_POLICY: FileUploadPolicy | null = null;

function getCopilotPolicy(): FileUploadPolicy | null
{
	const applicationData = (Core.getApplicationData?.() ?? {}) as { copilot?: { fileUploadPolicy?: FileUploadPolicy } };

	return applicationData.copilot?.fileUploadPolicy ?? null;
}

/**
 * Single source of truth for upload policies, keyed by chat type.
 * Add a case per chat type as new policies appear.
 */
export function getPolicyByChatType(chatType: ChatTypeItem | null): FileUploadPolicy | null
{
	switch (chatType)
	{
		case ChatType.copilot:
			return getCopilotPolicy();
		default:
			return DEFAULT_FILE_UPLOAD_POLICY;
	}
}

export function resolveFileUploadPolicy(dialogId: string): FileUploadPolicy | null
{
	const chat = Core.getStore().getters['chats/get'](dialogId);

	return getPolicyByChatType(chat?.type ?? null);
}
