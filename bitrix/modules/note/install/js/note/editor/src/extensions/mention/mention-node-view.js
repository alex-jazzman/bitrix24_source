import { markRaw } from 'ui.vue3';
import { BitrixVue } from 'ui.vue3.bitrixvue';
import { Type } from 'main.core';
import { MentionChip } from 'note.ui.mention-chip';
import { MentionDialog } from './mention-dialog';
import { byType } from './mention-type-registry';
import { openLinkNative } from '../../utils/open-link';
import { buildInternalDocumentUrl } from '../../utils/internal-link';
import { createMentionSnapshot } from '../../utils/resolve-mentions';

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
	#projection: Object | null = null;
	#projectionKey: string = '';
	#projectionSnapshot: Object | null = null;
	#initialSnapshot: Object | null = null;
	#unsubscribeProjection: Function | null = null;

	constructor({ node, editor, getPos, extension })
	{
		this.node = node;
		this.editor = editor;
		this.getPos = getPos;
		this.options = extension?.options ?? {};
		this.app = null;
		this.vm = null;
		this.#projection = editor.storage?.noteMentionResolver ?? null;

		this.dom = document.createElement('span');
		this.dom.setAttribute('data-type', 'note-mention');
		this.dom.contentEditable = 'false';

		this.#subscribeProjection();
		this.#mountVue();
		this.#syncDiffState();
	}

	#buildPresentationAttrs(): Object
	{
		const fallbackLabel = this.node.attrs.entityType === 'document' ? this.node.attrs.label : null;
		const fallbackAvailable = fallbackLabel ? true : null;
		const snapshot = this.#projectionSnapshot ?? this.#initialSnapshot;

		return {
			...this.node.attrs,
			label: snapshot?.label ?? fallbackLabel ?? null,
			avatar: snapshot?.avatar ?? null,
			url: snapshot?.url ?? null,
			available: snapshot?.available ?? fallbackAvailable,
			isCurrentUser: snapshot?.isCurrentUser ?? false,
			unavailable: snapshot?.unavailable ?? false,
		};
	}

	#readInitialSnapshot(): ?Object
	{
		const { entityType, entityId } = this.node.attrs;
		const id = Number(entityId);
		if (entityType !== 'document' || !Number.isInteger(id) || id <= 0)
		{
			return null;
		}

		const cachedSnapshot = this.options.labelCache?.get(id);
		if (!cachedSnapshot)
		{
			return null;
		}

		return createMentionSnapshot({
			type: 'document',
			label: cachedSnapshot.label,
			available: cachedSnapshot.available,
		});
	}

	#subscribeProjection(): void
	{
		this.#unsubscribeProjection?.();
		this.#unsubscribeProjection = null;
		this.#projectionSnapshot = null;
		this.#initialSnapshot = this.#readInitialSnapshot();
		this.#projectionKey = `${this.node.attrs.entityType}:${this.node.attrs.entityId}`;

		if (typeof this.#projection?.subscribe !== 'function')
		{
			this.#syncPresentation();

			return;
		}

		this.#unsubscribeProjection = this.#projection.subscribe(this.#projectionKey, (snapshot) => {
			this.#projectionSnapshot = snapshot;
			this.#syncPresentation();
		});
	}

	#syncPresentation(): void
	{
		if (this.vm)
		{
			this.vm.attrs = this.#buildPresentationAttrs();
		}
	}

	// [version-diff] Reflect the diffState attr as a class on the chip wrapper. The attr is part of the
	// model and the mention resolver preserves it (spreads node.attrs), so the paint survives resolve.
	#syncDiffState()
	{
		const state = this.node.attrs.diffState;
		this.dom.classList.toggle('note-version-diff-node--added', state === 'added');
		this.dom.classList.toggle('note-version-diff-node--removed', state === 'removed');
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
					attrs: nodeView.#buildPresentationAttrs(),
					navigationPending: false,
					// Passed to the chip so it can gate keyboard/tabindex enhancements.
					// Reactive: updated by MentionNodeView.update() when editor state changes.
					isEditable: nodeView.editor.isEditable,
				};
			},
			methods: {
				async handleClick(event)
				{
					if (nodeView.editor.isEditable)
					{
						nodeView.#openEditDialog();

						return;
					}

					const { entityType, entityId, url, unavailable } = nodeView.#buildPresentationAttrs();
					const entry = byType(entityType);
					if (!entry)
					{
						return;
					}

					// Dispatch navigation by navKind:
					// internal-link (document/collection) → delegate to onMentionClick (feature emits open-internal-link)
					// slider (user/task/diskfolder) → open in a new browser tab
					// (mobile app: native card via the bridge).
					if (entry.navKind === 'internal-link')
					{
						const internalUrl = url || (
							entityType === 'document' && Number(entityId) > 0
								? buildInternalDocumentUrl(entityId)
								: ''
						);
						const isMiddleClick = event?.type === 'auxclick' && event?.button === 1;
						const isModifiedClick = event?.button === 0
							&& (event?.metaKey || event?.ctrlKey || event?.shiftKey || event?.altKey)
						;
						if ((isMiddleClick || isModifiedClick) && !unavailable)
						{
							if (internalUrl)
							{
								openLinkNative(internalUrl);
							}

							return;
						}

						const isUnavailableDocumentActivation = unavailable
							&& entityType === 'document'
							&& (isMiddleClick || isModifiedClick)
						;
						if (event?.button > 0 && !isUnavailableDocumentActivation)
						{
							return;
						}

						if (unavailable && entityType !== 'document')
						{
							return;
						}

						if (entityType === 'document' && this.navigationPending)
						{
							return;
						}

						const onMentionClick = nodeView.options?.onMentionClick;
						if (Type.isFunction(onMentionClick))
						{
							this.navigationPending = entityType === 'document';
							try
							{
								await onMentionClick({
									type: entityType,
									id: entityId,
									url: internalUrl,
									origin: event?.type === 'keydown' ? 'keyboard' : 'pointer',
								});
							}
							finally
							{
								this.navigationPending = false;
							}
						}

						return;
					}

					if (!unavailable && entry.navKind === 'slider' && url)
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
					:allow-unavailable-activation="attrs.entityType === 'document' && Number(attrs.entityId) > 0"
					:navigation-pending="navigationPending"
					@click="handleClick"
					@auxclick="handleClick"
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

		const previousProjectionKey = this.#projectionKey;
		this.node = node;
		this.#syncDiffState();
		const nextProjectionKey = `${node.attrs.entityType}:${node.attrs.entityId}`;
		if (nextProjectionKey !== previousProjectionKey)
		{
			this.#subscribeProjection();
		}
		if (this.vm)
		{
			this.vm.attrs = this.#buildPresentationAttrs();
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
		if (event.type === 'click' || event.type === 'auxclick')
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
		this.#unsubscribeProjection?.();
		this.#unsubscribeProjection = null;
		this.#editDialog?.destroy();
		this.#editDialog = null;
		this.app?.unmount();
		this.app = null;
		this.vm = null;
	}
}
