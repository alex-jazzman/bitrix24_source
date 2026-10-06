import { Dom, Event } from 'main.core';
// eslint-disable-next-line @bitrix24/bitrix24-rules/need-alias
import { CodeBlockLowlight } from '@tiptap/extension-code-block-lowlight';
// eslint-disable-next-line @bitrix24/bitrix24-rules/need-alias
import { Plugin, NodeSelection } from '@tiptap/pm/state';

import { lowlight, DEFAULT_LANGUAGE } from '../lowlight-languages';
import { CodeBlockNodeView } from './node-view';

function mapDragOrigin(tr, origin, codeBlockType, newState)
{
	if (origin === null || !tr.docChanged)
	{
		return origin;
	}

	const mapped = tr.mapping.mapResult(origin.pos, 1);
	if (mapped.deleted || newState.doc.nodeAt(mapped.pos)?.type !== codeBlockType)
	{
		return null;
	}

	return {
		...origin,
		pos: mapped.pos,
	};
}

function getDragOrigin(view, event, codeBlockType)
{
	if (event.button !== 0
		|| event.altKey
		|| event.ctrlKey
		|| event.metaKey
		|| event.shiftKey
		|| !view.editable
		|| Dom.hasClass(document.documentElement, 'note-mobile'))
	{
		return null;
	}

	const selection = view.state.selection;
	const sourceDom = selection instanceof NodeSelection && selection.node.type === codeBlockType
		? view.nodeDOM(selection.from)
		: null;
	if (!(sourceDom instanceof HTMLElement))
	{
		return null;
	}

	const eventTarget = event.target instanceof Element ? event.target : null;
	const directHandle = eventTarget?.closest('[data-testid="note-code-block-gutter"], code');
	const gutter = sourceDom.querySelector('[data-testid="note-code-block-gutter"]');
	const code = sourceDom.querySelector('code');
	const isInside = (element, tolerance = 0) => {
		if (!element)
		{
			return false;
		}

		const rect = element.getBoundingClientRect();

		return event.clientX > rect.left - tolerance
			&& event.clientX < rect.right + tolerance
			&& event.clientY > rect.top - tolerance
			&& event.clientY < rect.bottom + tolerance;
	};

	return (directHandle && sourceDom.contains(directHandle)) || isInside(gutter, 2) || isInside(code)
		? { pos: selection.from, node: selection.node, dom: sourceDom }
		: null;
}

function getDragSourceSelection(view, event, origin, codeBlockType)
{
	const eventTarget = event.target instanceof Element ? event.target : null;
	if (eventTarget === null)
	{
		return null;
	}

	const selection = view.state.selection;
	if (selection instanceof NodeSelection && selection.node.type === codeBlockType)
	{
		const selectionDom = view.nodeDOM(selection.from);
		if (selectionDom === origin.dom && selectionDom.contains(eventTarget))
		{
			return selection;
		}
	}

	if (view.state.doc.nodeAt(origin.pos) !== origin.node)
	{
		return null;
	}

	const sourceDom = view.nodeDOM(origin.pos);
	if (!(sourceDom instanceof HTMLElement) || !sourceDom.contains(eventTarget))
	{
		return null;
	}

	return NodeSelection.create(view.state.doc, origin.pos);
}

function restoreDraggingNode(view, currentSelection, origin, mappedOrigin)
{
	const dragging = view.dragging;
	if (!dragging)
	{
		return;
	}

	if (currentSelection !== null
		&& view.state.doc.nodeAt(currentSelection.from) === currentSelection.node)
	{
		dragging.node = currentSelection;

		return;
	}

	if (mappedOrigin !== null
		&& mappedOrigin.dom === origin.dom
		&& view.state.doc.nodeAt(mappedOrigin.pos) === mappedOrigin.node)
	{
		dragging.node = NodeSelection.create(view.state.doc, mappedOrigin.pos);
	}
}

function createDragSourcePluginView(view, dragState)
{
	const handleDragStart = () => {
		const source = dragState.takePending();
		if (source !== null)
		{
			restoreDraggingNode(view, source.selection, source.origin, dragState.origin);
		}
	};

	Event.bind(view.dom, 'dragstart', handleDragStart);

	return {
		destroy: () => Event.unbind(view.dom, 'dragstart', handleDragStart),
	};
}

export const CodeBlock = CodeBlockLowlight.extend({
	selectable: true,

	addNodeView()
	{
		return ({ node, editor, getPos }) => new CodeBlockNodeView({ node, editor, getPos });
	},

	addProseMirrorPlugins()
	{
		const codeBlockType = this.type;
		const dragState = {
			origin: null,
			pending: null,
			takePending()
			{
				const source = this.pending;
				this.pending = null;

				return source;
			},
		};

		return [
			...(this.parent?.() ?? []),
			new Plugin({
				state: {
					init()
					{
						return null;
					},
					apply(tr, value, _oldState, newState)
					{
						dragState.origin = mapDragOrigin(tr, dragState.origin, codeBlockType, newState);

						return value;
					},
				},
				props: {
					handleDOMEvents: {
						mousedown(view, event)
						{
							dragState.origin = getDragOrigin(view, event, codeBlockType);
							dragState.pending = null;

							return false;
						},
						dragstart(view, event)
						{
							dragState.pending = null;
							const origin = dragState.origin;
							if (origin !== null)
							{
								const sourceSelection = getDragSourceSelection(
									view,
									event,
									origin,
									codeBlockType,
								);
								if (sourceSelection !== null)
								{
									view.dispatch(view.state.tr.setSelection(sourceSelection));
									dragState.pending = { selection: sourceSelection, origin };
								}
							}

							return false;
						},
						dragend()
						{
							dragState.origin = null;
							dragState.pending = null;

							return false;
						},
					},
				},
				view: (view) => createDragSourcePluginView(view, dragState),
			}),
		];
	},
}).configure({
	lowlight,
	defaultLanguage: DEFAULT_LANGUAGE,
	enableTabIndentation: true,
	tabSize: 4,
});
