import { Extension } from '@tiptap/core';
import { gapCursor, GapCursor } from 'prosemirror-gapcursor';
import { Plugin } from 'prosemirror-state';
import { Decoration, DecorationSet } from 'prosemirror-view';

function isBlockAtomLike(node: ?Object): boolean
{
	if (!node)
	{
		return false;
	}

	const { type } = node;

	return type.isBlock && (type.isAtom || type.name === 'table');
}

function drawCustomGapCursor(state: Object): DecorationSet | null
{
	if (!(state.selection instanceof GapCursor))
	{
		return null;
	}

	const { $head } = state.selection;
	const needsShift = isBlockAtomLike($head.nodeBefore) && isBlockAtomLike($head.nodeAfter);

	const el = document.createElement('div');
	el.className = needsShift
		? 'ProseMirror-gapcursor note-editor-gapcursor-between-atoms'
		: 'ProseMirror-gapcursor';

	return DecorationSet.create(state.doc, [
		Decoration.widget($head.pos, el, { key: 'gapcursor' }),
	]);
}

export const NoteGapcursor = Extension.create({
	name: 'gapcursor',
	addProseMirrorPlugins(): Plugin[]
	{
		const base = gapCursor();

		return [
			new Plugin({
				props: {
					...base.props,
					decorations: drawCustomGapCursor,
				},
			}),
		];
	},
});
