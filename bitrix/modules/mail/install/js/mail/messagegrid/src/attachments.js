// mirrors Bitrix\Mail\Internal\Service\Attachment\FileIcon::FALLBACK for an answer without an icon
const FALLBACK_ICON = 'empty';

export function buildAttachmentMenuItems(attachments)
{
	if (!Array.isArray(attachments))
	{
		return [];
	}

	return attachments.map((attachment) => {
		const url = attachment && attachment.url ? attachment.url : null;

		return {
			name: attachment && attachment.name ? String(attachment.name) : '',
			size: attachment && attachment.size ? String(attachment.size) : '',
			url,
			viewerAttrs: attachment && attachment.viewerAttrs && typeof attachment.viewerAttrs === 'object'
				? attachment.viewerAttrs
				: null,
			// the server resolves the file icon so the row and this window name the type the same way
			icon: attachment && attachment.icon ? String(attachment.icon) : FALLBACK_ICON,
			downloadable: url !== null,
		};
	});
}
