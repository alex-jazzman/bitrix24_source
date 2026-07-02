import { Document } from '@tiptap/extension-document';
import { Paragraph } from '@tiptap/extension-paragraph';
import { Text } from '@tiptap/extension-text';
import { HardBreak } from '@tiptap/extension-hard-break';
import { Heading } from '@tiptap/extension-heading';
import { Dropcursor } from '@tiptap/extension-dropcursor';
import { UndoRedo } from '@tiptap/extensions';
import { NoteGapcursor } from './note-gapcursor';

export function createCoreExtensions({ hasCollaborationProvider }: { hasCollaborationProvider: boolean }): Object[]
{
	return [
		Document,
		Paragraph,
		Text,
		HardBreak,
		Heading.configure({ levels: [1, 2, 3, 4] }),
		Dropcursor,
		NoteGapcursor,
		...(hasCollaborationProvider ? [] : [UndoRedo]),
	];
}
