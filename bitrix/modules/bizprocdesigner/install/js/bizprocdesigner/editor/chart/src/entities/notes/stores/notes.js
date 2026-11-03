import { Type } from 'main.core';
import { defineStore } from 'ui.vue3.pinia';

import { editorAPI } from '../../../shared/api';
import { isTemplateId } from '../../../shared/utils/template-id';
import {
	type NewNote,
	type NoteAnchor,
	type NotePoint,
	type NotesState,
	type TemplateNote,
	type TemplateNoteLimits,
	type TemplateNoteMessage,
	type WrittenMessageOutcome,
} from '../types';

// Nothing is known about the limits until the list of the notes has answered, and a limit of zero
// stops nothing: the numbers belong to the server and are never written into the client.
const UNKNOWN_LIMITS: TemplateNoteLimits = Object.freeze({
	messageLength: 0,
	notesPerTemplate: 0,
	messagesPerNote: 0,
	mentionsPerMessage: 0,
});

/** The refusal of a right, the same for every operation of the notes (ERR-005). */
const ACCESS_DENIED = 'ACCESS_DENIED';

const EMPTY_OUTCOME: WrittenMessageOutcome = Object.freeze({
	note: null,
	message: null,
	notified: [],
	unavailableMentions: [],
	notifyFailed: false,
});

// A note and a message that exist only while their request is in flight. The identifier is negative,
// so it never collides with one given by the server, and the answer replaces the whole entry anyway.
function pendingId(): number
{
	return -Date.now();
}

function isAccessDenied(error: mixed): boolean
{
	return error?.code === ACCESS_DENIED;
}

function readNote(raw: mixed): TemplateNote | null
{
	if (!Type.isPlainObject(raw))
	{
		return null;
	}

	const note: TemplateNote = raw;

	return Type.isNumber(note.id) ? note : null;
}

function isSamePoint(left: NotePoint | null | undefined, right: NotePoint | null | undefined): boolean
{
	return left?.x === right?.x && left?.y === right?.y;
}

function isSameAnchor(left: NoteAnchor | null | undefined, right: NoteAnchor | null | undefined): boolean
{
	return left?.type === right?.type
		&& left?.nodeId === right?.nodeId
		&& left?.sourceBlockId === right?.sourceBlockId
		&& left?.sourcePortId === right?.sourcePortId
		&& left?.targetBlockId === right?.targetBlockId
		&& left?.targetPortId === right?.targetPortId
	;
}

/**
 * The note as it already stands when the answer brought nothing new about it (DTO-01). A note that
 * kept its identity leaves the marker of it alone: the whole list is read back on every refresh, and
 * a new object for an unchanged note would redraw every marker on the screen for nothing.
 */
function keepUnchanged(current: TemplateNote | null | undefined, incoming: TemplateNote): TemplateNote
{
	if (current === null || current === undefined)
	{
		return incoming;
	}

	const isSame = current.authorId === incoming.authorId
		&& current.createdAt === incoming.createdAt
		&& current.messageCount === incoming.messageCount
		&& current.canComplete === incoming.canComplete
		&& isSamePoint(current.offset, incoming.offset)
		&& isSamePoint(current.position, incoming.position)
		&& isSameAnchor(current.anchor, incoming.anchor)
	;

	return isSame ? current : incoming;
}

function readMessage(raw: mixed): TemplateNoteMessage | null
{
	if (!Type.isPlainObject(raw))
	{
		return null;
	}

	const message: TemplateNoteMessage = raw;

	return Type.isNumber(message.id) && Type.isNumber(message.noteId) ? message : null;
}

function readIds(raw: mixed): number[]
{
	const ids: number[] = Type.isArray(raw) ? raw : [];

	return ids.filter((id: number) => Type.isNumber(id));
}

function readLimit(raw: mixed): number
{
	const limit: number = raw;

	return Type.isNumber(limit) && limit > 0 ? limit : 0;
}

function readLimits(raw: mixed): TemplateNoteLimits
{
	const limits: TemplateNoteLimits | null = Type.isPlainObject(raw) ? raw : null;

	return {
		messageLength: readLimit(limits?.messageLength),
		notesPerTemplate: readLimit(limits?.notesPerTemplate),
		messagesPerNote: readLimit(limits?.messagesPerNote),
		mentionsPerMessage: readLimit(limits?.mentionsPerMessage),
	};
}

/**
 * The answer of every write over a message (API-02, API-03, API-04): the message itself and what
 * became of the notifications of the people mentioned in it.
 */
function readOutcome(raw: mixed): WrittenMessageOutcome
{
	if (!Type.isPlainObject(raw))
	{
		return { ...EMPTY_OUTCOME };
	}

	const answer: { [key: string]: mixed } = raw;

	return {
		note: readNote(answer.note),
		message: readMessage(answer.message),
		notified: readIds(answer.notified),
		unavailableMentions: readIds(answer.unavailableMentions),
		notifyFailed: answer.notifyFailed === true,
	};
}

function toTime(createdAt: string): number
{
	const time = Date.parse(createdAt);

	return Number.isNaN(time) ? 0 : time;
}

// The conversation reads from the oldest message down. The time of writing orders it, and messages
// written within the same second are ordered by the identifier the server gave them.
function byWritingOrder(left: TemplateNoteMessage, right: TemplateNoteMessage): number
{
	const written = toTime(left.createdAt) - toTime(right.createdAt);

	return written === 0 ? left.id - right.id : written;
}

function sortMessages(messages: TemplateNoteMessage[]): TemplateNoteMessage[]
{
	return [...messages].sort(byWritingOrder);
}

function readMessages(raw: mixed): TemplateNoteMessage[]
{
	if (!Type.isArray(raw))
	{
		return [];
	}

	const incoming: TemplateNoteMessage[] = raw;
	const messages: TemplateNoteMessage[] = incoming
		.map((message: TemplateNoteMessage) => readMessage(message))
		.filter((message: TemplateNoteMessage | null): boolean => message !== null)
	;

	return sortMessages(messages);
}

/**
 * The notes pinned to the scheme of the open template. Two slices are held apart: the markers, which
 * arrive with the whole list and carry the number of messages of every note, and the conversations,
 * read one at a time when a thread is opened. A note whose conversation has not been read is a whole
 * note - the marker needs nothing from it.
 *
 * Every edit of the person at the keyboard is applied at once and rolled back if the server refuses
 * it. The number of messages of a note is the exception: it is only ever taken from an answer of the
 * server (the list or the conversation) and never counted up locally - the same operation reaches this
 * tab twice, as its own optimistic edit and as the live signal of it (ALG-03).
 *
 * The refusals travel out as they came, as the typed ApiError: the phrases of the notes belong to the
 * interface, and the store would have to name a phrase for a code to keep one. A refusal that turns
 * out to be the loss of the right to the template takes nothing off the screen either - it only marks
 * the layer as read-only (ERR-005, `isAccessLost`).
 */
export const useNotesStore = defineStore('bizprocdesigner-editor-notes', {
	state: (): NotesState => ({
		templateId: 0,
		notes: [],
		messages: {},
		limits: { ...UNKNOWN_LIMITS },
		openedNoteId: null,
		isLoading: false,
		loadingThreadId: null,
		lastFetchId: 0,
		isAccessLost: false,
	}),
	getters: {
		openedNote: (state: NotesState): TemplateNote | null => {
			return state.notes.find((note: TemplateNote) => note.id === state.openedNoteId) ?? null;
		},
		openedMessages: (state: NotesState): TemplateNoteMessage[] => {
			return state.openedNoteId === null ? [] : (state.messages[state.openedNoteId] ?? []);
		},
		// The server refuses a note over the limit (ERR-014); the interface says so beforehand, and a
		// limit that has not arrived yet holds nothing back.
		isNoteLimitReached: (state: NotesState): boolean => {
			return state.limits.notesPerTemplate > 0 && state.notes.length >= state.limits.notesPerTemplate;
		},
	},
	actions: {
		/**
		 * API-01. The markers of the whole template together with the limits. A late answer of an
		 * earlier request is dropped: the newest one owns the state.
		 */
		async loadNotes(templateId: number): Promise<void>
		{
			if (!isTemplateId(templateId))
			{
				return;
			}

			const fetchId = ++this.lastFetchId;
			this.templateId = templateId;
			this.isLoading = true;
			try
			{
				const data = await editorAPI.getNotes({ templateId });
				if (this.lastFetchId !== fetchId)
				{
					return;
				}

				this.isAccessLost = false;
				this.applyNotes(data?.notes, data?.limits);
			}
			catch (error)
			{
				// This request addresses the template itself, so its refusal is about the template and
				// not about one note of it: the right to it is gone (ERR-005). An answer overtaken by a
				// newer request decides nothing here either.
				if (this.lastFetchId === fetchId && isAccessDenied(error))
				{
					this.isAccessLost = true;
				}

				throw error;
			}
			finally
			{
				if (this.lastFetchId === fetchId)
				{
					this.isLoading = false;
				}
			}
		},
		/**
		 * API-07. The conversation of one note. The note travels with it, so its number of messages
		 * comes from the same answer as the messages themselves.
		 */
		async loadThread(noteId: number): Promise<void>
		{
			this.loadingThreadId = noteId;
			try
			{
				const data = await editorAPI.getNoteThread({ noteId });
				this.upsertNote(readNote(data?.note));
				this.messages[noteId] = readMessages(data?.messages);
			}
			catch (error)
			{
				void this.confirmAccess(error);

				throw error;
			}
			finally
			{
				if (this.loadingThreadId === noteId)
				{
					this.loadingThreadId = null;
				}
			}
		},
		// One thread is open at a time (AC-012), and it is read anew every time: another editor may
		// have written into it since the scheme was opened.
		async openThread(noteId: number): Promise<void>
		{
			this.openedNoteId = noteId;

			await this.loadThread(noteId);
		},
		closeThread(): void
		{
			this.openedNoteId = null;
		},
		/**
		 * ERR-005. Every operation is refused with the same code, so a right lost over the whole
		 * template has to be told apart from a refusal of this one operation - the message belongs to
		 * somebody else, the note is already completed. The list of the notes is what tells them
		 * apart, because it addresses the template itself: refused as well, the right is gone.
		 *
		 * It is asked without being waited for. The refusal of the operation is told where it was
		 * made, at once, and the layer turns read-only when the answer about the template arrives.
		 */
		async confirmAccess(error: mixed): Promise<void>
		{
			if (!isAccessDenied(error))
			{
				return;
			}

			try
			{
				await this.loadNotes(this.templateId);
			}
			catch
			{
				// the refusal of the list has already said what it means for the template
			}
		},
		/**
		 * API-02. The marker appears with the click and is taken away if the server refuses the note.
		 */
		async createNote(draft: NewNote): Promise<WrittenMessageOutcome>
		{
			const pending = {
				id: pendingId(),
				anchor: draft.anchor,
				offset: draft.offset,
				position: draft.position,
				// the author, the rights and the number of messages are what the server answers about
				// a note; this entry only stands for one until then and is replaced whole by the answer
				authorId: 0,
				createdAt: new Date().toISOString(),
				messageCount: 1,
				canComplete: false,
			};

			this.notes.push(pending);
			try
			{
				const outcome = readOutcome(await editorAPI.createNote(draft));

				this.dropLocally(pending.id);
				this.upsertNote(outcome.note);
				if (outcome.note !== null)
				{
					this.messages[outcome.note.id] = outcome.message === null ? [] : [outcome.message];
				}

				return outcome;
			}
			catch (error)
			{
				this.dropLocally(pending.id);
				void this.confirmAccess(error);

				throw error;
			}
		},
		/**
		 * API-03. The reply stands in the conversation while the request is in flight. The number of
		 * messages of the note is not touched by it: only the server tells what it is.
		 */
		async replyToNote(noteId: number, text: string): Promise<WrittenMessageOutcome>
		{
			const pending = {
				id: pendingId(),
				noteId,
				authorId: 0,
				text,
				revision: 0,
				createdAt: new Date().toISOString(),
				modifiedAt: null,
				canEdit: false,
			};

			this.putMessage(pending);
			try
			{
				const outcome = readOutcome(await editorAPI.replyToNote({ noteId, message: text }));

				this.dropMessage(noteId, pending.id);
				this.putMessage(outcome.message);

				return outcome;
			}
			catch (error)
			{
				this.dropMessage(noteId, pending.id);
				void this.confirmAccess(error);

				throw error;
			}
		},
		/**
		 * API-04. A refusal by the revision (ERR-007) carries the message as it stands now: it is an
		 * answer of the server, so it replaces the local one, and the edit that was refused is gone.
		 */
		async updateMessage(messageId: number, text: string, revision: number): Promise<WrittenMessageOutcome>
		{
			const previous = this.findMessage(messageId);
			if (previous === null)
			{
				return { ...EMPTY_OUTCOME };
			}

			this.putMessage({ ...previous, text });
			try
			{
				const outcome = readOutcome(
					await editorAPI.updateNoteMessage({ messageId, message: text, revision }),
				);

				this.putMessage(outcome.message);

				return outcome;
			}
			catch (error)
			{
				this.putMessage(previous);
				this.putMessage(readMessage(error?.data?.actual));
				void this.confirmAccess(error);

				throw error;
			}
		},
		/**
		 * API-05. The note is gone together with its last message, and the server is the one who says
		 * so: a local count of the messages would be wrong for everyone but the author of the deletion.
		 *
		 * @return boolean whether the note itself is gone with the message
		 */
		async deleteMessage(messageId: number): Promise<boolean>
		{
			const message = this.findMessage(messageId);
			if (message === null)
			{
				// the conversation holding it has not been read, or the message is already gone
				return false;
			}

			this.dropMessage(message.noteId, messageId);
			let noteRemoved = false;
			try
			{
				const data = await editorAPI.deleteNoteMessage({ messageId });
				noteRemoved = data?.noteRemoved === true;
			}
			catch (error)
			{
				this.putMessage(message);
				void this.confirmAccess(error);

				throw error;
			}

			if (noteRemoved)
			{
				this.dropLocally(message.noteId);
			}

			return noteRemoved;
		},
		/**
		 * API-06. The note is gone with everything written in it, so a refusal brings it all back.
		 */
		async completeNote(noteId: number): Promise<void>
		{
			const note = this.notes.find((item: TemplateNote) => item.id === noteId) ?? null;
			const messages = this.messages[noteId] ?? [];
			const wasOpened = this.openedNoteId === noteId;
			const restore = note === null ? null : { note: { ...note }, messages: [...messages] };

			this.dropLocally(noteId);
			try
			{
				await editorAPI.completeNote({ noteId });
			}
			catch (error)
			{
				if (restore !== null)
				{
					this.upsertNote(restore.note);
					this.messages[noteId] = restore.messages;
					this.openedNoteId = wasOpened ? noteId : this.openedNoteId;
				}

				void this.confirmAccess(error);

				throw error;
			}
		},
		applyNotes(notes: mixed, limits: mixed): void
		{
			const incoming: TemplateNote[] = Type.isArray(notes) ? notes : [];
			const current = new Map(this.notes.map((note: TemplateNote) => [note.id, note]));
			this.notes = incoming
				.map((note: TemplateNote) => readNote(note))
				.filter((note: TemplateNote | null): boolean => note !== null)
				.map((note: TemplateNote) => keepUnchanged(current.get(note.id), note))
			;
			this.limits = readLimits(limits);

			// the conversations of the notes that are gone have nothing left to belong to
			const present = new Set(this.notes.map((note: TemplateNote) => note.id));
			this.messages = Object.fromEntries(
				Object.entries(this.messages).filter(([noteId]) => present.has(Number(noteId))),
			);
			if (this.openedNoteId !== null && !present.has(this.openedNoteId))
			{
				this.openedNoteId = null;
			}
		},
		upsertNote(note: TemplateNote | null): void
		{
			if (note === null)
			{
				return;
			}

			const position = this.notes.findIndex((item: TemplateNote) => item.id === note.id);
			if (position === -1)
			{
				this.notes.push(note);

				return;
			}

			this.notes[position] = note;
		},
		putMessage(message: TemplateNoteMessage | null): void
		{
			if (message === null)
			{
				return;
			}

			const kept = (this.messages[message.noteId] ?? []).filter(
				(item: TemplateNoteMessage) => item.id !== message.id,
			);
			this.messages[message.noteId] = sortMessages([...kept, message]);
		},
		dropMessage(noteId: number, messageId: number): void
		{
			const thread = this.messages[noteId];
			if (thread === undefined)
			{
				return;
			}

			this.messages[noteId] = thread.filter((item: TemplateNoteMessage) => item.id !== messageId);
		},
		// The note is gone from this tab, whatever took it away: the deletion of its last message, its
		// completion here or the live signal of one made elsewhere. Repeating it changes nothing.
		dropLocally(noteId: number): void
		{
			this.notes = this.notes.filter((note: TemplateNote) => note.id !== noteId);
			delete this.messages[noteId];
			if (this.openedNoteId === noteId)
			{
				this.openedNoteId = null;
			}
		},
		findMessage(messageId: number): TemplateNoteMessage | null
		{
			for (const thread of Object.values(this.messages))
			{
				const messages: TemplateNoteMessage[] = thread;
				const message = messages.find(
					(item: TemplateNoteMessage) => item.id === messageId,
				);
				if (message !== undefined)
				{
					return { ...message };
				}
			}

			return null;
		},
	},
});
