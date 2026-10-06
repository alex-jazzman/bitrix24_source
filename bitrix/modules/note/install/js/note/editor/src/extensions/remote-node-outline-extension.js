import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';
import { relativePositionToAbsolutePosition, ySyncPluginKey } from '@tiptap/y-tiptap';
import * as Y from 'yjs';
import { normalizeUserColor } from '../utils/normalize';

export const remoteNodeOutlinePluginKey = new PluginKey('note-remote-node-outline');

const TABLE_ROLES = new Set(['cell', 'header_cell', 'row', 'table']);

const supportsRemoteOutline = (node) => {
	return (node.isAtom && node.isBlock) || node.type.name === 'codeBlock';
};

const toRelativePosition = (raw) => {
	if (raw === null || raw === undefined)
	{
		return null;
	}

	try
	{
		return Y.createRelativePositionFromJSON(raw);
	}
	catch
	{
		return null;
	}
};

const buildDecorations = (state, awareness) => {
	const ystate = ySyncPluginKey.getState(state);
	if (!ystate || !ystate.binding || !awareness)
	{
		return DecorationSet.empty;
	}

	const { doc: yDoc, type: yType, binding: { mapping } } = ystate;
	const localClientId = awareness.clientID;
	const decorations = [];

	awareness.states.forEach((remoteState, clientId) => {
		if (clientId === localClientId || !remoteState)
		{
			return;
		}

		const cursor = remoteState.cursor;
		const user = remoteState.user;
		if (!cursor || !user)
		{
			return;
		}

		const anchorRel = toRelativePosition(cursor.anchor);
		const headRel = toRelativePosition(cursor.head);
		if (!anchorRel || !headRel)
		{
			return;
		}

		let anchor;
		let head;
		try
		{
			anchor = relativePositionToAbsolutePosition(yDoc, yType, anchorRel, mapping);
			head = relativePositionToAbsolutePosition(yDoc, yType, headRel, mapping);
		}
		catch
		{
			return;
		}

		if (anchor === null || head === null || anchor === undefined || head === undefined || anchor === head)
		{
			return;
		}

		const docSize = state.doc.content.size;
		const from = Math.max(0, Math.min(anchor, head));
		const to = Math.min(docSize, Math.max(anchor, head));
		if (from >= to)
		{
			return;
		}

		let $from;
		try
		{
			$from = state.doc.resolve(from);
		}
		catch
		{
			return;
		}

		const nodeAfter = $from.nodeAfter;
		if (!nodeAfter || !supportsRemoteOutline(nodeAfter))
		{
			return;
		}

		if ($from.pos + nodeAfter.nodeSize !== to)
		{
			return;
		}

		if (TABLE_ROLES.has(nodeAfter.type.spec.tableRole))
		{
			return;
		}

		const color = normalizeUserColor(user.color);
		decorations.push(Decoration.node(from, to, {
			class: 'note-editor-remote-node-selected',
			style: `--remote-color: ${color}`,
		}));
	});

	if (decorations.length === 0)
	{
		return DecorationSet.empty;
	}

	return DecorationSet.create(state.doc, decorations);
};

const createRemoteNodeOutlinePlugin = (awareness) => new Plugin({
	key: remoteNodeOutlinePluginKey,
	state: {
		init(_, state)
		{
			try
			{
				return buildDecorations(state, awareness);
			}
			catch
			{
				return DecorationSet.empty;
			}
		},
		apply(tr, oldSet, _oldState, newState)
		{
			const meta = tr.getMeta(remoteNodeOutlinePluginKey);
			if (meta || tr.docChanged)
			{
				try
				{
					return buildDecorations(newState, awareness);
				}
				catch
				{
					return oldSet.map(tr.mapping, tr.doc);
				}
			}

			return oldSet.map(tr.mapping, tr.doc);
		},
	},
	props: {
		decorations(state)
		{
			return this.getState(state);
		},
	},
	view(view)
	{
		const handler = () => {
			if (view.isDestroyed)
			{
				return;
			}

			view.dispatch(view.state.tr.setMeta(remoteNodeOutlinePluginKey, { awarenessUpdate: true }));
		};

		awareness.on('update', handler);

		return {
			destroy()
			{
				awareness.off('update', handler);
			},
		};
	},
});

export function createRemoteNodeOutlineExtension({ provider }: { provider: Object }): Object
{
	return Extension.create({
		name: 'noteRemoteNodeOutline',
		priority: 998,
		addProseMirrorPlugins()
		{
			if (!provider?.awareness)
			{
				return [];
			}

			return [createRemoteNodeOutlinePlugin(provider.awareness)];
		},
	});
}
