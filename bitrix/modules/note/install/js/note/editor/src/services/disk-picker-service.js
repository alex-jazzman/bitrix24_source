import { Runtime, Type, ajax } from 'main.core';
import { NoteThemeContext } from 'note.ui.theme-context';
import { extractErrorMessage } from '../utils/error-message';
import { toPositiveInt } from '../utils/normalize';

type PickedFile = {
	diskObjectId: number,
	assetType: 'image' | 'video' | 'file',
};

// Disk classifies a file into one of these; anything not visual becomes a plain file block. The
// block a document shows is decided by the KIND of file, never by where it came from — an image
// from Disk is the same image block as an uploaded one.
const DISK_FILE_TYPE_TO_ASSET_TYPE: { [string]: string } = {
	image: 'image',
	video: 'video',
};

/**
 * A failure of this service itself: there was no document to pick for, or the picker could not be
 * put on screen at all. The message is diagnostics for a developer — unlike a refusal from our own
 * controller, nobody wrote it for a user to read, so a caller that reports the failure must use a
 * localized text of its own and never this one.
 */
export class DiskPickerServiceError extends Error
{
	constructor(message: string)
	{
		super(message);
		this.name = 'DiskPickerServiceError';
	}
}

/**
 * Whose text the user sees when picking a file from Disk failed. A refusal from our own server
 * (feature switched off between render and click, lost rights) comes with the message it wrote for
 * the user; our own failure has none, and gets the localized fallback the caller passes in. A
 * request that never reached the server carries its English 'Network error' in the very same place,
 * so it is filtered out here before it can be mistaken for a message written for a user to read.
 */
export function resolveDiskPickerErrorMessage(error: mixed, fallback: string): string
{
	if (error instanceof DiskPickerServiceError)
	{
		return fallback;
	}

	const firstError = Type.isPlainObject(error) && Type.isArrayFilled(error.errors)
		? error.errors[0]
		: null
	;
	const isTransportFailure = Type.isPlainObject(firstError) && firstError.code === 'NETWORK_ERROR';

	return isTransportFailure
		? fallback
		: extractErrorMessage(error, fallback)
	;
}

/**
 * Opens Disk's file picker and turns the choice into attachment nodes.
 *
 * The picker is loaded on demand rather than declared as a dependency of the editor bundle: it only
 * exists on portals that have Disk with the universal picker switched on, and everybody else should
 * not pay for its stack. The entry point that calls this is already gated on the same server flag.
 *
 * Nothing about the picker is reimplemented here — no menu, no texts, no error messages. Its errors
 * are its own to show, so an error callback here stays silent by design. A refusal from our own
 * controller is the opposite case: the picker is not open yet and nobody else is going to report it,
 * so it travels to the caller untouched, carrying the message the server wrote for the user.
 */
export class DiskPickerService
{
	/**
	 * @throws the server's own rejection when it refuses to issue a config (feature off, document
	 *   gone, no edit right) — its message is meant to be shown to the user as it came.
	 * @throws DiskPickerServiceError when the refusal is ours and has no such message.
	 */
	static async fetchSignedConfig(documentId: number): Promise<Object>
	{
		const id = toPositiveInt(documentId);
		if (id === null)
		{
			throw new DiskPickerServiceError('Document context is required');
		}

		const response = await ajax.runAction('note.infrastructure.FileController.getDiskPickerConfig', {
			data: { documentId: id },
		});

		const signedConfig = response?.data?.signedConfig;
		if (!Type.isPlainObject(signedConfig))
		{
			throw new DiskPickerServiceError('Disk picker config is unavailable');
		}

		return signedConfig;
	}

	/**
	 * Resolves with the picked files, or with an empty array when the user cancelled or the picker
	 * failed to open. Cancelling must leave the document exactly as it was.
	 *
	 * What comes back is already attached to the document — see #attachPicked. The caller cannot be
	 * left to remember that: it is what decides whether the other readers of the document can open the
	 * file at all, and the block is inserted right after.
	 */
	static async pick(documentId: number): Promise<Array<PickedFile>>
	{
		const picked = await this.#openPicker(documentId);
		await this.#attachPicked(documentId, picked);

		return picked;
	}

	static async #openPicker(documentId: number): Promise<Array<PickedFile>>
	{
		const signedConfig = await this.fetchSignedConfig(documentId);
		const { DiskPicker } = await Runtime.loadExtension('disk.disk-picker');
		if (!DiskPicker)
		{
			throw new DiskPickerServiceError('Disk picker extension is unavailable');
		}

		return new Promise((resolve) => {
			let picked = [];
			let detachTheme = null;

			new DiskPicker().open({
				signedConfig,
				onOpen: ({ container }) => {
					detachTheme = NoteThemeContext.themeForeignContainer(container);
				},
				onSelect: (result) => {
					picked = (result?.items ?? [])
						.map((item) => this.#toPickedFile(item))
						.filter(Boolean)
					;
				},
				// onClose fires for every outcome the picker actually opened for — selection and cancel —
				// so the theme subscription is dropped in exactly one place and repeated opens cannot
				// pile them up.
				onClose: () => {
					detachTheme?.();
					detachTheme = null;
					resolve(picked);
				},
				// A picker that never opened (its bootstrap failed, or a session is already running)
				// reports the failure here and never reaches onClose. Without this the promise would
				// hang forever and every click would leave another one pending. The picker has already
				// told the user what happened; we only make sure the document stays as it was.
				onError: () => {
					detachTheme?.();
					detachTheme = null;
					resolve([]);
				},
			});
		});
	}

	/**
	 * Attaches the picked files to the document at once, without waiting for their tokens to reach the
	 * stored text.
	 *
	 * The attachment is what routes the permission question to the document: until it exists, Disk asks
	 * whether the reader may read somebody else's file and answers no, so every reader but the person
	 * who picked it sees the block as unavailable. Doing it here also means it is done on the rights of
	 * that person, at the one moment we know it is them asking.
	 *
	 * Done before the nodes are inserted, and awaited: the batch resolve is triggered by a block
	 * appearing, and its answer is remembered per object — resolved a moment too early, the block would
	 * keep the url that only its picker can open until something dropped that cache.
	 *
	 * A failure is silent and changes nothing for the user: the file still goes into the text, and the
	 * server brings the attachment in line with the text on the next materialization. All that is lost
	 * is the speed at which the other readers get access.
	 */
	static async #attachPicked(documentId: number, picked: Array<PickedFile>): Promise<void>
	{
		const id = toPositiveInt(documentId);
		const objectIds = [...new Set(picked.map((file) => file.diskObjectId))];
		if (id === null || objectIds.length === 0)
		{
			return;
		}

		try
		{
			await ajax.runAction('note.infrastructure.FileController.attachDiskObjects', {
				data: { documentId: id, objectIds },
			});
		}
		catch
		{
			// See above: the projection sync on the server is the fallback, there is nothing to say here.
		}
	}

	static #toPickedFile(item: Object): PickedFile | null
	{
		const diskObjectId = toPositiveInt(item?.objectId);
		if (diskObjectId === null)
		{
			return null;
		}

		return {
			diskObjectId,
			assetType: DISK_FILE_TYPE_TO_ASSET_TYPE[item?.fileType] ?? 'file',
		};
	}
}
