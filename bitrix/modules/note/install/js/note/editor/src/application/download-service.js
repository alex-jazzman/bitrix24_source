import { ajax, Loc, Type } from 'main.core';
import { extractErrorMessage } from '../utils/error-message';
import { showErrorToast } from '../utils/show-error-toast';
import { isMobileApp, openFileNative, openLinkNative } from '../utils/open-link';

const FORBIDDEN_FILENAME_CHARS_RE = /[\\/:*?"<>|\r\n]+/g;

const MD_EXTENSION = 'md';
const MD_MIME_TYPE = 'text/markdown;charset=utf-8';

function sanitizeFileName(rawTitle: string, documentId: number): string
{
	const sanitized = String(rawTitle ?? '')
		.replace(FORBIDDEN_FILENAME_CHARS_RE, '')
		.trim();

	return sanitized === '' ? `note-${documentId}` : sanitized;
}

function triggerBlobDownload(content: string, fileName: string, mimeType: string): void
{
	const blob = new Blob([content], { type: mimeType });
	const url = URL.createObjectURL(blob);
	const link = document.createElement('a');
	link.href = url;
	link.download = fileName;
	document.body.appendChild(link);
	link.click();
	link.remove();
	URL.revokeObjectURL(url);
}

async function getExportContent(feature: Object, mode: 'links' | 'zip'): Promise<string>
{
	const content = await feature?.getExportMarkdown?.(mode);

	// null/undefined means the serializer failed (editor-mount catches everything and returns null)
	// or the export API is unavailable — surface it so DownloadService.download shows a toast instead
	// of silently uploading an empty article. An empty string is a legitimately empty document.
	if (content === null || content === undefined)
	{
		throw new Error('Export serialization failed');
	}

	return String(content);
}

async function downloadPlain(
	{ feature, documentId, documentTitle }: { feature: Object, documentId: number, documentTitle: string },
): Promise<void>
{
	const content = await getExportContent(feature, 'links');
	const fileName = `${sanitizeFileName(documentTitle, documentId)}.${MD_EXTENSION}`;

	triggerBlobDownload(content, fileName, MD_MIME_TYPE);
}

async function downloadViaServer(
	{ feature, documentId, documentTitle }: { feature: Object, documentId: number, documentTitle: string },
): Promise<void>
{
	const content = await getExportContent(feature, 'zip');

	const response = await ajax.runAction('note.infrastructure.ExportController.prepareZip', {
		data: {
			documentId: Number(documentId),
			content,
		},
	});

	const token = response?.data?.token;
	if (!Type.isStringFilled(token))
	{
		throw new Error('Export token is missing');
	}

	const url = `/bitrix/services/main/ajax.php?action=note.infrastructure.ExportController.downloadZip&token=${encodeURIComponent(token)}`;
	const zipName = `${sanitizeFileName(documentTitle, documentId)}.zip`;

	// Inside the mobile app the download URL must go through the native document viewer so the app
	// session travels with the request; window.open would escape to the session-less OS browser and
	// the auth'd downloadZip action would reject it. On desktop openFileNative is a no-op and we open
	// a new tab, where the browser session authorizes the download.
	if (openFileNative(url, zipName))
	{
		return;
	}

	openLinkNative(url);
}

export class DownloadService
{
	static async download(
		{ feature, documentId, documentTitle }: {
			feature: Object,
			documentId: number,
			documentTitle: string,
		},
	): Promise<void>
	{
		try
		{
			// Server path when the document has attachments (needs a zip) OR we are on mobile, where a
			// Blob + <a download> click is silently ignored by the classic webview. On mobile a clean
			// document therefore arrives as a zip holding the single .md — a documented deviation from
			// the desktop bare-file download.
			if (Boolean(feature?.hasAttachments?.()) || isMobileApp())
			{
				await downloadViaServer({ feature, documentId, documentTitle });

				return;
			}

			await downloadPlain({ feature, documentId, documentTitle });
		}
		catch (error)
		{
			showErrorToast(extractErrorMessage(error, Loc.getMessage('NOTE_EDITOR_DOWNLOAD_ERROR')));
		}
	}
}
