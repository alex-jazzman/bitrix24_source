import { Node, mergeAttributes } from '@tiptap/core';
import { Plugin, PluginKey, NodeSelection } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';
import { isSupportedType } from './mention-type-registry';
import { createMentionTriggerPlugin } from './mention-trigger-plugin';
import { MentionNodeView } from './mention-node-view';

const MENTION_SELECTION_KEY = new PluginKey('noteMentionSelection');

/**
 * Decorates noteMention nodes covered by a range/All selection with
 * `.note-mention-selected`. Single-node arrow/drag selections already get the
 * native `.ProseMirror-selectednode` class, so they are skipped here.
 */
function createMentionSelectionPlugin()
{
	const build = (state) => {
		const { selection, doc } = state;
		if (selection.empty || selection.from === selection.to)
		{
			return DecorationSet.empty;
		}

		// NodeSelection already gets .ProseMirror-selectednode natively — skip.
		if (selection instanceof NodeSelection)
		{
			return DecorationSet.empty;
		}

		const decorations = [];
		doc.nodesBetween(selection.from, selection.to, (node, pos) => {
			if (node.type.name === 'noteMention')
			{
				decorations.push(
					Decoration.node(pos, pos + node.nodeSize, { class: 'note-mention-selected' }),
				);
			}
		});

		return decorations.length > 0 ? DecorationSet.create(doc, decorations) : DecorationSet.empty;
	};

	return new Plugin({
		key: MENTION_SELECTION_KEY,
		state: {
			init: (_, state) => build(state),
			apply: (tr, value, _oldState, newState) => {
				// Rebuild only when selection or document changed.
				if (!tr.selectionSet && !tr.docChanged)
				{
					return value;
				}

				return build(newState);
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

// Regex that matches the canonical mention token @{type:id} where id is a positive integer.
// Used by both start() and tokenize() so the pattern is consistent.
const MENTION_TOKEN_RE = /^@\{([a-z]+):(\d+)\}/;

/**
 * TipTap inline-atom node for entity mentions.
 *
 * Persisted attributes: entityType (wire REG-01) and entityId (positive integer).
 * Transient resolver attributes (label, avatar, url, available, isCurrentUser, unavailable)
 * are declared here so the schema knows them, but they are NOT serialised to markdown.
 *
 * atom:true ensures Backspace/Delete remove the node as a whole without a custom keymap.
 */
export const NoteMentionNode = Node.create({
	name: 'noteMention',

	group: 'inline',
	inline: true,
	atom: true,
	selectable: true,

	addOptions()
	{
		return {
			onMentionClick: null,
		};
	},

	addAttributes()
	{
		return {
			// --- persisted ---
			entityType: {
				default: null,
				parseHTML: (element) => {
					const raw = element.getAttribute('data-entity-type');

					return isSupportedType(raw) ? raw : null;
				},
			},
			entityId: {
				default: null,
				parseHTML: (element) => {
					const raw = element.getAttribute('data-entity-id');
					const id = raw !== null ? Number(raw) : null;

					return Number.isInteger(id) && id > 0 ? id : null;
				},
			},

			// --- transient (resolver-populated, not serialised to markdown) ---
			label: {
				default: null,
				rendered: false,
			},
			avatar: {
				default: null,
				rendered: false,
			},
			url: {
				default: null,
				rendered: false,
			},
			available: {
				default: null,
				rendered: false,
			},
			isCurrentUser: {
				default: false,
				rendered: false,
			},
			unavailable: {
				default: false,
				rendered: false,
			},
		};
	},

	parseHTML()
	{
		return [
			{
				tag: 'span[data-type="note-mention"]',
			},
		];
	},

	renderHTML({ node, HTMLAttributes })
	{
		return [
			'span',
			mergeAttributes(HTMLAttributes, {
				'data-type': 'note-mention',
				'data-entity-type': node.attrs.entityType,
				'data-entity-id': node.attrs.entityId,
				class: 'note-mention',
				contenteditable: 'false',
			}),
			`@${node.attrs.entityType}:${node.attrs.entityId}`,
		];
	},

	addNodeView()
	{
		return (props) => new MentionNodeView(props);
	},

	/**
	 * Inline markdown tokenizer for @{type:id} syntax.
	 *
	 * Additive and isolated from the block-only attachment tokenizer ([[…]]).
	 * The delimiter @{ is intentionally distinct from [[.
	 *
	 * start() hints the marked lexer at candidate positions; tokenize() validates
	 * and extracts the token. Only supported types (REG-01) are accepted — unknown
	 * types and non-integer ids are left as plain text.
	 */
	markdownTokenizer: {
		name: 'noteMention',
		level: 'inline',

		start(src)
		{
			return src.indexOf('@{');
		},

		tokenize(src)
		{
			const match = MENTION_TOKEN_RE.exec(src);
			if (!match)
			{
				return null;
			}

			const [raw, type, idStr] = match;
			const id = Number(idStr);

			if (!isSupportedType(type) || !Number.isInteger(id) || id <= 0)
			{
				return null;
			}

			return {
				type: 'noteMention',
				raw,
				entityType: type,
				entityId: id,
			};
		},

		childTokens: [],
	},

	parseMarkdown(token)
	{
		return {
			type: 'noteMention',
			attrs: {
				entityType: token.entityType,
				entityId: token.entityId,
			},
		};
	},

	/**
	 * Serialises the node back to canonical @{type:id} form.
	 * Only persisted attributes are written — transient resolver fields are intentionally omitted.
	 */
	renderMarkdown(node)
	{
		const { entityType, entityId } = node?.attrs ?? {};

		if (!entityType || !Number.isInteger(Number(entityId)) || Number(entityId) <= 0)
		{
			return '';
		}

		return `@{${entityType}:${entityId}}`;
	},

	/**
	 * Wires the '@' trigger plugin into the editor.
	 *
	 * The plugin opens MentionDialog when the user types '@' in editable text,
	 * tracks the typed query, and inserts a noteMention atom node on selection.
	 */
	addProseMirrorPlugins()
	{
		const { editor } = this;

		const insertMention = ({ from, to, entityType, id }) => {
			const { schema, tr } = editor.state;
			const nodeType = schema.nodes.noteMention;
			if (!nodeType)
			{
				return;
			}

			const node = nodeType.create({ entityType, entityId: id });

			// Replace the typed @query range with the atom node.
			editor.view.dispatch(
				tr.replaceRangeWith(from, to, node),
			);
		};

		return [
			createMentionTriggerPlugin({ editor, insertMention }),
			createMentionSelectionPlugin(),
		];
	},
});
