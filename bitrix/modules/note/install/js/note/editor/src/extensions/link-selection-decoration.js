import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';

const LINK_SELECTION_DECORATION_PLUGIN_KEY = new PluginKey('noteEditorLinkSelectionDecoration');

export function createLinkSelectionDecorationPlugin(): Object
{
	return new Plugin({
		key: LINK_SELECTION_DECORATION_PLUGIN_KEY,
		state: {
			init()
			{
				return DecorationSet.empty;
			},
			apply(transaction, decorationSet)
			{
				// DecorationSet.map is ProseMirror API, not Array.map.
				// eslint-disable-next-line unicorn/no-array-callback-reference, unicorn/no-array-method-this-argument
				const mappedDecorationSet = decorationSet.map(transaction.mapping, transaction.doc);
				const meta = transaction.getMeta(LINK_SELECTION_DECORATION_PLUGIN_KEY)
					|| transaction.getMeta('noteEditorLinkSelectionDecoration');

				if (!meta)
				{
					return mappedDecorationSet;
				}

				if (meta.clear)
				{
					return DecorationSet.empty;
				}

				const from = Number(meta.from);
				const to = Number(meta.to);
				if (!Number.isInteger(from) || !Number.isInteger(to) || from >= to)
				{
					return DecorationSet.empty;
				}

				return DecorationSet.create(transaction.doc, [
					Decoration.inline(from, to, { class: 'note-editor-link-selection-retained' }),
				]);
			},
		},
		props: {
			decorations(state)
			{
				return this.getState(state);
			},
		},
	});
}
