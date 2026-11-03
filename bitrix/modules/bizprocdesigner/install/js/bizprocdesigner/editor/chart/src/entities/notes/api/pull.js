/**
 * EVENT-01, ALG-03. The live channel of the note discussions of the open template: what one editor
 * writes reaches the others without their asking for it.
 *
 * The signal carries no text - only the address of the change - so the handler reads the change back
 * over the usual requests: the list of the markers (API-01) and the conversation of the open note
 * (API-07). The list is read once for a burst of signals: it answers with the whole set of the notes,
 * so reading it per signal of a live discussion would ask several times for one and the same answer.
 * Nothing is counted here. The signal reaches the author of the operation as well and carries no
 * author to tell one's own echo from a stranger's, so every number is replaced by the one the server
 * answers with, and a repeated signal about the same change leaves the state as it is.
 *
 * The subscription to the tag of the template is handed out by the server, where the right to the
 * template has been checked; the client subscribes to the command alone and never builds a tag.
 * Without the module of the live updates, or with the feature off, the signals simply never come: the
 * state is then read at the next load of the template or the next opening of a thread (AC-037e).
 */

import { Type } from 'main.core';
import { PULL } from 'pull.client';

import { isTemplateId } from '../../../shared/utils/template-id';
import { useNotesStore } from '../stores/notes';

const MODULE_ID = 'bizprocdesigner';
const COMMAND = 'bizprocdesigner_template_note_updated';

const NOTE_REMOVED = 'note_removed';

/**
 * The actions that change the set of the markers or the number of messages of one of them. An edit of
 * a message changes neither, so the list is not read again for it (ALG-03).
 */
const COUNT_CHANGING_ACTIONS = Object.freeze(['note_created', 'message_created', 'message_removed']);

/**
 * How long the reading of the list is held back for. The signal carries no counter (EVENT-01), so the
 * whole list has to be read back over API-01, and a live discussion of several people would ask for it
 * on every message written - in every tab, the author's own included. The signals of one burst are
 * answered by one request, and the delay is short enough for the markers to catch up while the eye is
 * still on the schema.
 */
const NOTES_REFRESH_DELAY = 500;

/** EVENT-01. Three numbers and nothing else: what has changed and where. */
type TemplateNoteSignal = {
	templateId: number,
	noteId: number,
	action: string,
};

function readSignal(raw: mixed): TemplateNoteSignal | null
{
	const signal: TemplateNoteSignal | null = Type.isPlainObject(raw) ? raw : null;
	const templateId = Number(signal?.templateId);
	const noteId = Number(signal?.noteId);

	if (!isTemplateId(templateId) || !Number.isInteger(noteId) || noteId <= 0)
	{
		return null;
	}

	return { templateId, noteId, action: String(signal?.action) };
}

/**
 * The handler of the signals of one editor, together with the way to drop what it has put off: an
 * editor that unmounts leaves no request behind, and the store it would have asked is gone with it.
 */
export type TemplateNoteSignalHandler = {
	handle: (raw: mixed) => Promise<void>,
	cancel: () => void,
};

/**
 * ALG-03. The handling of one signal. It owns no state of its own and writes nothing into the model
 * by hand: whatever changed, the store is asked to read it anew, so the same signal handled twice
 * ends in the same state as handled once.
 *
 * The list of the markers is read back once for a burst of signals and not once per signal: the delay
 * is the whole of the coalescing, as reading the list twice in a row would answer the same thing.
 *
 * @param getTemplateId the template the editor holds open, read at the moment of the signal
 */
export function createTemplateNoteSignalHandler(getTemplateId: () => number): TemplateNoteSignalHandler
{
	let refreshTimeout = null;

	const cancel = (): void => {
		if (refreshTimeout !== null)
		{
			clearTimeout(refreshTimeout);
			refreshTimeout = null;
		}
	};

	// The window opens with the first signal of a burst and is not pushed further by the ones after
	// it: a discussion writing faster than the delay would otherwise put the reading off for as long
	// as it goes on.
	const scheduleNotesRefresh = (templateId: number): void => {
		if (refreshTimeout !== null)
		{
			return;
		}

		refreshTimeout = setTimeout(async () => {
			refreshTimeout = null;

			// the template on the screen may be another one by now, and its list is not this one
			if (templateId !== Number(getTemplateId()))
			{
				return;
			}

			try
			{
				await useNotesStore().loadNotes(templateId);
			}
			catch
			{
				// A refresh that could not be read leaves the state as it was, and the editor keeps
				// working: it is read again at the next load of the template or opening of a thread.
			}
		}, NOTES_REFRESH_DELAY);
	};

	const handle = async (raw: mixed): Promise<void> => {
		const signal = readSignal(raw);

		// a signal of another template says nothing about the one on the screen
		if (signal === null || signal.templateId !== Number(getTemplateId()))
		{
			return;
		}

		const notesStore = useNotesStore();

		// The note is gone for everyone: it has been completed, or its last message deleted. The
		// store takes its thread away with it, so an open one closes here.
		if (signal.action === NOTE_REMOVED)
		{
			notesStore.dropLocally(signal.noteId);

			return;
		}

		if (COUNT_CHANGING_ACTIONS.includes(signal.action))
		{
			scheduleNotesRefresh(signal.templateId);
		}

		try
		{
			// The conversation is read again for the open thread alone: otherwise every reply in any
			// discussion of the template would make every editor read all of them. The text typed in
			// reply and not sent yet is held by the input field and not by the store, so replacing
			// the messages of the thread leaves it where it was (AC-037d).
			if (notesStore.openedNoteId === signal.noteId)
			{
				await notesStore.loadThread(signal.noteId);
			}
		}
		catch
		{
			// A refresh that could not be read leaves the state as it was, and the editor keeps
			// working: it is read again at the next load of the template or opening of the thread.
		}
	};

	return { handle, cancel };
}

/**
 * Subscribes to the command of the live updates of the notes. The subscription to the tag itself is
 * renewed by `pull.client` while the editor is open and taken again when the connection comes back.
 *
 * @return the unsubscribe, to be called when the editor unmounts: a handler outliving the application
 *   would go on asking a store that is gone
 */
export function initTemplateNotesPull(getTemplateId: () => number): () => void
{
	const handler = createTemplateNoteSignalHandler(getTemplateId);
	const unsubscribe = PULL.subscribe({
		moduleId: MODULE_ID,
		command: COMMAND,
		callback: handler.handle,
	});

	return (): void => {
		handler.cancel();
		unsubscribe();
	};
}
