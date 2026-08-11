import { markRaw } from 'ui.vue3';
import { BitrixVue } from 'ui.vue3.bitrixvue';
import { MentionChip } from 'note.ui.mention-chip';
import { MentionDialog } from './mention-dialog';
import { byType } from './mention-type-registry';
import { openLinkNative } from '../../utils/open-link';

/**
 * ProseMirror NodeView that mounts a Vue MentionChip for noteMention nodes.
 *
 * Mounted in both edit and view modes.
 *
 * View mode: click navigates to the entity (via onMentionClick or window.open).
 * Edit mode: click opens the entity-selector in edit mode (model B) with the
 *            current entity preselected; selecting a different item replaces this node.
 */
export class MentionNodeView
{
	node: Object;
	editor: Object;
	getPos: Function;
	options: Object;
	app: Object | null;
	vm: Object | null;
	dom: HTMLElement;
	#editDialog: MentionDialog | null = null;

	constructor({ node, editor, getPos, extension })
	{
		this.node = node;
		this.editor = editor;
		this.getPos = getPos;
		this.options = extension?.options ?? {};
		this.app = null;
		this.vm = null;

		this.dom = document.createElement('span');
		this.dom.setAttribute('data-type', 'note-mention');
		this.dom.contentEditable = 'false';

		this.#mountVue();
	}

	#mountVue()
	{
		const nodeView = this;
		const chipComponent = markRaw(MentionChip);

		this.app = BitrixVue.createApp({
			components: { MentionChip: chipComponent },
			data()
			{
				return {
					attrs: { ...nodeView.node.attrs },
					// Passed to the chip so it can gate keyboard/tabindex enhancements.
					// Reactive: updated by MentionNodeView.update() when editor state changes.
					isEditable: nodeView.editor.isEditable,
				};
			},
			methods: {
				handleClick()
				{
					if (nodeView.editor.isEditable)
					{
						nodeView.#openEditDialog();

						return;
					}

					const { entityType, entityId, url, unavailable } = nodeView.node.attrs;
					if (unavailable)
					{
						return;
					}

					const entry = byType(entityType);
					if (!entry)
					{
						return;
					}

					// Dispatch navigation by navKind:
					// internal-link (document/collection) → delegate to onMentionClick (feature emits open-internal-link)
					// slider (user/task) → open in a new browser tab (mobile app: native card via the bridge).
					if (entry.navKind === 'internal-link')
					{
						const onMentionClick = nodeView.options?.onMentionClick;
						if (typeof onMentionClick === 'function')
						{
							onMentionClick({ type: entityType, id: entityId, url });
						}

						return;
					}

					if (entry.navKind === 'slider' && url)
					{
						openLinkNative(url);
					}
				},
			},
			// language=Vue
			template: `
				<MentionChip
					:type="attrs.entityType || ''"
					:label="attrs.label"
					:avatar="attrs.avatar"
					:available="attrs.available"
					:is-current-user="attrs.isCurrentUser"
					:unavailable="attrs.unavailable"
					:is-editable="isEditable"
					@click="handleClick"
				/>
			`,
		});

		this.vm = this.app.mount(this.dom);
	}

	/**
	 * Opens the entity-selector in edit mode (model B).
	 * The chip's DOM node is used as anchor so the popup appears near the chip.
	 * On selection a new noteMention node replaces this one at the same position.
	 */
	#openEditDialog()
	{
		const { entityType, entityId } = this.node.attrs;
		const entry = byType(entityType);
		if (!entry)
		{
			return;
		}

		// Reuse existing instance or create fresh one for this chip.
		if (!this.#editDialog)
		{
			this.#editDialog = new MentionDialog({
				onSelect: ({ entityType: newType, id: newId }) => {
					const pos = this.getPos();
					if (pos === undefined)
					{
						return;
					}

					const { schema, tr } = this.editor.state;
					const nodeType = schema.nodes.noteMention;
					if (!nodeType)
					{
						return;
					}

					const newNode = nodeType.create({ entityType: newType, entityId: newId });

					// Replace this atom node with the newly selected one.
					this.editor.view.dispatch(
						tr.replaceWith(pos, pos + this.node.nodeSize, newNode),
					);
				},
			});
		}

		this.#editDialog.showEdit({
			anchor: this.dom,
			entityId: entry.entityId,
			id: Number(entityId),
		});
	}

	update(node: Object): boolean
	{
		if (node.type !== this.node.type)
		{
			return false;
		}

		this.node = node;
		if (this.vm)
		{
			this.vm.attrs = { ...node.attrs };
			this.vm.isEditable = this.editor.isEditable;
		}

		return true;
	}

	ignoreMutation(): boolean
	{
		return true;
	}

	stopEvent(event: Event): boolean
	{
		// Return true = ProseMirror ignores the event (won't place cursor inside atom).
		// The DOM event still bubbles so Vue's @click / @keydown handlers fire normally.
		if (event.type === 'click')
		{
			return true;
		}

		// In view mode (non-editable) the chip is focusable and handles Enter/Space.
		// Tell PM to ignore these keydown events so Vue's @keydown handler can activate the chip.
		// In edit mode we do NOT intercept keydown — PM must handle arrow keys, Enter etc. for the atom.
		if (event.type === 'keydown' && !this.editor.isEditable)
		{
			const key = /** @type {KeyboardEvent} */ (event).key;
			if (key === 'Enter' || key === ' ')
			{
				return true;
			}
		}

		return false;
	}

	destroy(): void
	{
		this.#editDialog?.destroy();
		this.#editDialog = null;
		this.app?.unmount();
		this.app = null;
		this.vm = null;
	}
}
