/**
 * The notes of a template as the server describes them (DTO-01, DTO-02). Nothing is added here from
 * the client side: a field the answer does not carry has no place in the store either.
 */

export type NoteAnchorType = 'node' | 'connection' | 'free';

/**
 * What the note is pinned to. The kind of the anchor decides which of its parts exist at all: a note
 * on a node carries only the node, a note on a link only the two ends of it.
 */
export type NoteAnchor = {
	type: NoteAnchorType,
	nodeId?: string,
	sourceBlockId?: string,
	sourcePortId?: string,
	targetBlockId?: string,
	targetPortId?: string,
};

export type NotePoint = {
	x: number,
	y: number,
};

/**
 * DTO-01. A note without its conversation: `messageCount` is what the list tells about the
 * conversation, and the messages themselves come with the thread of the note.
 */
export type TemplateNote = {
	id: number,
	anchor: NoteAnchor,
	offset: NotePoint,
	position: NotePoint,
	authorId: number,
	createdAt: string,
	messageCount: number,
	canComplete: boolean,
};

/**
 * DTO-02. `text` travels in the markup it is stored in (DTO-03) and is rendered by the editor of the
 * client; `revision` is what an edit sends back so a concurrent one is refused instead of lost.
 */
export type TemplateNoteMessage = {
	id: number,
	noteId: number,
	authorId: number,
	text: string,
	revision: number,
	createdAt: string,
	modifiedAt: string | null,
	canEdit: boolean,
};

/**
 * The limits of the discussions, as they come with the list of the notes (API-01). The interface reads
 * them from here: a number written into the client would drift away from the server on its own.
 */
export type TemplateNoteLimits = {
	messageLength: number,
	notesPerTemplate: number,
	messagesPerNote: number,
	mentionsPerMessage: number,
};

/**
 * What it takes to create a note (API-02). A note is never created without its first message, so the
 * text of it is part of the request and not of a later one.
 */
export type NewNote = {
	templateId: number,
	anchor: NoteAnchor,
	offset: NotePoint,
	position: NotePoint,
	message: string,
};

/**
 * What the server answers to a written message (API-02, API-03, API-04). The message is saved either
 * way, so the outcome of notifying the people mentioned in it travels beside the message and not
 * instead of it: `unavailableMentions` are the ones the notification could not reach by their rights
 * (ERR-004), `notifyFailed` is a notification that failed over a message that is saved (ERR-003).
 * `note` belongs to a creation alone - a reply and an edit change no note.
 */
export type WrittenMessageOutcome = {
	note: TemplateNote | null,
	message: TemplateNoteMessage | null,
	notified: number[],
	unavailableMentions: number[],
	notifyFailed: boolean,
};

/**
 * The two slices of the notes are held apart on purpose: the list of the markers arrives without the
 * conversations, and a note whose conversation has not been read yet is a whole note, not a partial one.
 */
export type NotesState = {
	// the template the notes on the screen belong to: a refusal is asked about this one (ERR-005)
	templateId: number,
	notes: TemplateNote[],
	messages: { [noteId: number]: TemplateNoteMessage[] },
	limits: TemplateNoteLimits,
	openedNoteId: number | null,
	isLoading: boolean,
	loadingThreadId: number | null,
	lastFetchId: number,
	// ERR-005. The right to the template is gone: what is on the screen stays readable, and nothing
	// is written from here any more.
	isAccessLost: boolean,
};
