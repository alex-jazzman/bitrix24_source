/**
 * The options of the text editor a note message is written in (CFG-01).
 *
 * The list of the plugins is given in full rather than trimmed from the defaults: the built-in set of
 * ui.text-editor carries formatting, attachments, tables and smileys, and none of them belongs to a
 * note. What is left is what it takes to type text, plus the mentions - the one construction the
 * storage format of a message knows besides plain text and line breaks (DTO-03).
 *
 * The options of the hint travel from here and are never resolved by the server rendering of the page:
 * the providers are cached by the name of the entity within a request, and a server-side resolution
 * beside an ordinary user selector would hand the hint the provider of that selector.
 */

import { Constants, type TextEditorOptions } from 'ui.text-editor';

/**
 * The entity the hint is declared with. Always `user`: the editor writes a mention with the tag equal
 * to the entity id of the item, and the markup of a message knows `user` alone. The narrowed provider
 * is named by `substituteEntityId` instead - the substitution is declared from the side of the entity
 * being substituted (TPL-01), and the items it answers with stay `user` items.
 */
const MENTION_ENTITY_ID = 'user';

/** The provider of the hint as it is registered on the server (TPL-01). */
const MENTION_PROVIDER_ID = 'bizproc-template-editor';

/**
 * Typing, mentions and nothing else. `RichText`, `Paragraph` and `Clipboard` are what the editor needs
 * to exist at all, `History` gives back an undo of a typo, `Placeholder` draws the prompt of the empty
 * field, and `Mention` is the feature itself. Everything else of the built-in set - the formatting, the
 * lists and links, the images, files and videos, the smileys, the tables and the toolbars - is left out.
 */
const EDITOR_PLUGINS = [
	'RichText',
	'Paragraph',
	'Clipboard',
	'History',
	'Placeholder',
	'Mention',
];

/**
 * The height the empty field opens at, and the height it stops growing at and starts scrolling inside
 * itself. The prompt is drawn over the field and not inside it, so a field left shorter than its own
 * prompt clips it and hands an empty field a scrollbar: a caller whose prompt does not fit in the
 * default says its own height with `minHeight`.
 */
const EDITOR_MIN_HEIGHT = 64;
const EDITOR_MAX_HEIGHT = 200;

export type NoteEditorOptionsParams = {
	templateId: number,
	placeholder: string,
	minHeight?: number,
};

export function createNoteEditorOptions(params: NoteEditorOptionsParams): TextEditorOptions
{
	return {
		placeholder: params.placeholder,
		minHeight: params.minHeight ?? EDITOR_MIN_HEIGHT,
		maxHeight: EDITOR_MAX_HEIGHT,
		// A message is one block of text with line breaks in it (DTO-03), so Enter breaks the line
		// instead of opening a paragraph, and a paste is inserted as plain text.
		newLineMode: Constants.NewLineMode.LINE_BREAK,
		plugins: [...EDITOR_PLUGINS],
		mention: {
			dialogOptions: {
				entities: [
					{
						id: MENTION_ENTITY_ID,
						substituteEntityId: MENTION_PROVIDER_ID,
						options: { templateId: params.templateId },
					},
				],
			},
		},
	};
}
