// Closed set of file-validation failures for markdown import — do not extend without
// updating every switch/if that maps codes to user-facing messages (document-page.js).
export const ImportMdErrorCode = Object.freeze({
	INVALID_EXTENSION: 'INVALID_EXTENSION',
	FILE_TOO_LARGE: 'FILE_TOO_LARGE',
	UNREADABLE: 'UNREADABLE',
});

const MAX_FILE_SIZE = 1048576;

export class ImportMdError extends Error
{
	code: string;

	constructor(code: string)
	{
		super(code);
		this.name = 'ImportMdError';
		this.code = code;
	}
}

// Reads and validates a `.md` file. Knows nothing about the editor/markdown parsing —
// that is the job of applyImportedContent (feature/import/apply-imported-content.js).
export function readMarkdownFile(file: File): Promise<string>
{
	return new Promise((resolve, reject) => {
		const name = typeof file?.name === 'string' ? file.name : '';
		if (!name.toLowerCase().endsWith('.md'))
		{
			reject(new ImportMdError(ImportMdErrorCode.INVALID_EXTENSION));

			return;
		}

		if (Number(file?.size) > MAX_FILE_SIZE)
		{
			reject(new ImportMdError(ImportMdErrorCode.FILE_TOO_LARGE));

			return;
		}

		const reader = new FileReader();
		reader.onload = () => {
			resolve(typeof reader.result === 'string' ? reader.result : '');
		};
		reader.onerror = () => {
			reject(new ImportMdError(ImportMdErrorCode.UNREADABLE));
		};
		reader.readAsText(file);
	});
}
