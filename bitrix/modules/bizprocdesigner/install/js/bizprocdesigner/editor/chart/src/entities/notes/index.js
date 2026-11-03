export { useNotesStore } from './stores/notes';
export { createConnectionIndex, resolveConnectionMidpoint, resolveMarkerPosition } from './utils/anchor';

export type {
	NewNote,
	NoteAnchor,
	NoteAnchorType,
	NotePoint,
	NotesState,
	TemplateNote,
	TemplateNoteLimits,
	TemplateNoteMessage,
	WrittenMessageOutcome,
} from './types';

export type { NoteConnectionIndex, NoteSchemaConnection, NoteSchemaRect, NotesSchema } from './utils/anchor';
