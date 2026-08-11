import { Extension } from '@tiptap/core';
import { gapCursor, GapCursor } from 'prosemirror-gapcursor';
import { Plugin, TextSelection } from 'prosemirror-state';

// Bottom edge of the lowest top-level block, in client coords. Floated media
// (align-left/right) is out of flow, so we measure every child instead of the
// container, whose height would collapse to the in-flow text only.
function contentBottom(view: Object): number
{
	let bottom = -Infinity;
	for (const child of view.dom.children)
	{
		bottom = Math.max(bottom, child.getBoundingClientRect().bottom);
	}

	return bottom;
}

// Block atom nodes (image/file/video/table) can become terminal blocks with no
// adjacent text position, so ProseMirror lands a GapCursor there. Instead of
// leaving the user with a bare horizontal cursor, materialize a real empty
// paragraph at that spot the moment the cursor enters it (click or arrows) and
// drop a text cursor inside. The document stays untouched until that happens.
export const NoteGapcursor = Extension.create({
	name: 'gapcursor',
	addProseMirrorPlugins(): Plugin[]
	{
		const { editor } = this;

		return [
			gapCursor(),
			new Plugin({
				props: {
					// A click in the empty zone below all content resolves to the nearest
					// in-flow text (e.g. end of the first paragraph when trailing media is
					// floated out of flow). Redirect it to the document end so a terminal
					// gap is produced and converted to a paragraph below.
					handleClick(view, pos, event): boolean
					{
						if (!view.editable || event.clientY <= contentBottom(view))
						{
							return false;
						}

						const endPos = view.state.doc.content.size;
						const $end = view.state.doc.resolve(endPos);
						const selection = GapCursor.valid($end)
							? new GapCursor($end)
							: TextSelection.create(view.state.doc, endPos);

						view.dispatch(view.state.tr.setSelection(selection).scrollIntoView());

						return true;
					},
				},
				appendTransaction(transactions, oldState, newState): ?Object
				{
					// Never mutate a read-only document; the gap cursor stays visible there.
					if (!editor.isEditable || !(newState.selection instanceof GapCursor))
					{
						return null;
					}

					const paragraphType = newState.schema.nodes.paragraph;
					const paragraph = paragraphType?.createAndFill();
					if (!paragraph)
					{
						return null;
					}

					const { pos } = newState.selection.$head;
					const tr = newState.tr.insert(pos, paragraph);
					tr.setSelection(TextSelection.create(tr.doc, pos + 1));

					return tr.scrollIntoView();
				},
			}),
		];
	},
});
