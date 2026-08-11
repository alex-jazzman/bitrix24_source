import { Plugin, PluginKey, NodeSelection, AllSelection } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';

const ATTACHMENT_NODE_TYPES = new Set(['imageAttachment', 'fileAttachment', 'video', 'uploadAsset']);

const ATTACHMENT_SELECTION_DECORATION_PLUGIN_KEY = new PluginKey('noteEditorAttachmentSelectionDecoration');

export function createAttachmentSelectionDecorationPlugin(): Object
{
	return new Plugin({
		key: ATTACHMENT_SELECTION_DECORATION_PLUGIN_KEY,
		props: {
			decorations(state)
			{
				const { selection, doc } = state;

				// NodeSelection is handled by selectNode/deselectNode in the node view itself.
				if (selection.empty || selection instanceof NodeSelection)
				{
					return DecorationSet.empty;
				}

				const { from, to } = selection;
				const decorations = [];

				// Decorate attachment nodes fully contained within the range selection.
				doc.nodesBetween(from, to, (node, pos) => {
					if (!ATTACHMENT_NODE_TYPES.has(node.type.name))
					{
						return true;
					}

					const nodeFrom = pos;
					const nodeTo = pos + node.nodeSize;
					if (nodeFrom >= from && nodeTo <= to)
					{
						decorations.push(Decoration.node(nodeFrom, nodeTo, { class: 'ProseMirror-selectednode' }));
					}

					// Attachment nodes are leaf-like; no need to descend further.
					return false;
				});

				if (decorations.length === 0)
				{
					return DecorationSet.empty;
				}

				return DecorationSet.create(doc, decorations);
			},
		},
	});
}
