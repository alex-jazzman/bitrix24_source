import { Type } from 'main.core';
import { BitrixVue } from 'ui.vue3';
import { NodeSelection } from '@tiptap/pm/state';
import { buildAttachmentAttrs } from './upload-node-view';

// Float images cap at 70% of the container so wrapped text keeps a usable column; center/no-align
// can fill the width.
const FLOAT_MAX_PCT = 70;

// Minimum readable text column width. If the hypothetical column beside a floated image (or
// between two facing floats) falls below this value, the image is demoted to a block.
const MIN_COLUMN_REM = 12;

// Text gap between a float and the adjacent text column (matches the 2rem margin in editor.css).
const FLOAT_GAP_REM = 2;

// Mirrors the `note-mobile` signal used by heading-block-node-view / code-block-overlay.
function isMobileLayout(): boolean
{
	return typeof document !== 'undefined'
		&& document.documentElement.classList.contains('note-mobile');
}

export class VueAttachmentNodeView
{
	node: Object;
	editor: Object;
	getPos: () => number | undefined;
	extension: Object;
	dataType: string;
	className: string;
	inline: boolean;
	uploadService: Object | null;
	app: Object | null;
	vm: Object | null;
	dom: HTMLElement;

	constructor({ node, editor, getPos, extension, dataType, className, inline, uploadService }: {
		node: Object,
		editor: Object,
		getPos: () => number | undefined,
		extension: Object,
		dataType: string,
		className: string,
		inline?: boolean,
		uploadService?: Object | null,
	})
	{
		this.node = node;
		this.editor = editor;
		this.getPos = getPos;
		this.extension = extension;
		this.dataType = dataType;
		this.className = className;
		this.inline = inline === true;
		this.uploadService = uploadService || null;
		// Capability flag: enables resize/align/stack logic for this node type.
		this.resizable = Boolean(extension?.options?.resizable);
		this.app = null;
		this.vm = null;

		this.dom = document.createElement(this.inline ? 'span' : 'div');
		this.dom.setAttribute('data-type', dataType);
		this.dom.className = className;
		this.dom.contentEditable = 'false';
		// Shared marker class so shared CSS modifiers (align, stacked) apply to any resizable node.
		if (this.resizable)
		{
			this.dom.classList.add('note-editor-media');
		}
		// Drag-resize drives the block width directly; suppress layout recompute while it runs.
		this.isResizing = false;
		this._stackRafId = undefined;
		// One observer watches both the block (this.dom — live drag width) and its container (the text
		// column). The container ref is tracked so we can re-observe after a DnD reparent.
		this._resizeObserver = null;
		this._observedParent = null;
		this._handleImgLoad = () => this.scheduleStackUpdate();
		this.syncLayout();

		this.mountVue();

		// ResizeObserver wiring is deferred to scheduleStackUpdate() because this.dom is not yet in the
		// document at construction time (ProseMirror inserts it after the view is created).

		// editable can flip after mount (doc loads read-only, then setEditable(true)) without a
		// node update, so sync the prop on every editor update to keep resize handles in sync.
		this.handleEditorUpdate = () => {
			if (this.vm)
			{
				this.vm.editable = Boolean(this.editor?.isEditable);
			}
			// Non-resizable nodes (e.g. files) have no stacking layout — skip the per-update layout work.
			if (!this.resizable)
			{
				return;
			}
			// Recompute stacking: a sibling image may have been added/removed or had its align changed.
			this.scheduleStackUpdate();
		};
		this.editor?.on('update', this.handleEditorUpdate);
	}

	mountVue(): void
	{
		const component = this.extension.options.nodeViewComponent;
		if (!component)
		{
			return;
		}

		this.app = BitrixVue.createApp({
			components: {
				AttachmentNodeViewComponent: component,
			},
			data: () => ({
				attrs: this.node.attrs,
				defaultTypeMessage: this.extension.options.defaultTypeMessage,
				editable: Boolean(this.editor?.isEditable),
				selected: false,
				// onReplace is null unless an uploadService was injected (image node only).
				canReplace: Boolean(this.uploadService),
			}),
			methods: {
				handleResize: (width) => this.applyWidth(width),
				handleResizeActive: (active) => {
					this.isResizing = Boolean(active);
					// On drag end, reconcile the layout (clears the raw drag px, re-applies the
					// committed width / stacking) even if the commit was a no-op that skips update().
					if (!active)
					{
						this.syncLayout();
						this.scheduleStackUpdate();
					}
				},
				// Per-frame drag tick: recompute stacking so the dragged image (and its partner) demote
				// live, not relying on ResizeObserver delivery timing.
				handleResizeProgress: () => this.scheduleStackUpdate(),
				handleAlign: (align) => this.applyAlign(align),
				handleReplace: () => this.replaceImage(),
			},
			// language=Vue
			template: `
				<AttachmentNodeViewComponent
					:attrs="attrs"
					:default-type-message="defaultTypeMessage"
					:editable="editable"
					:selected="selected"
					:on-resize="handleResize"
					:on-resize-active="handleResizeActive"
					:on-resize-progress="handleResizeProgress"
					:on-align="handleAlign"
					:on-replace="canReplace ? handleReplace : null"
				/>
			`,
		});
		this.vm = this.app.mount(this.dom);
	}

	update(node: Object): boolean
	{
		if (node.type !== this.node.type)
		{
			return false;
		}

		this.node = node;
		this.syncLayout();
		this.scheduleStackUpdate();
		if (this.vm)
		{
			this.vm.attrs = node.attrs;
			this.vm.editable = Boolean(this.editor?.isEditable);
		}

		return true;
	}

	// Effective rendered width of this node's block in px. offsetWidth reflects the live drag px, the
	// applied % and the max-width cap; attrs.width is only a fallback when the DOM isn't laid out yet.
	// The --stacked class never changes width/max-width, so this value is stable across demote, which
	// is what keeps the decision from oscillating.
	#ownWidth(containerWidth: number): number
	{
		const measured = this.dom.offsetWidth;
		if (measured > 0)
		{
			return measured;
		}

		const w = this.node.attrs.width;
		if (Number.isFinite(w) && w > 0)
		{
			return containerWidth * Math.min(w, FLOAT_MAX_PCT) / 100;
		}

		return containerWidth * 0.5;
	}

	// Effective rendered width of the partner block in px, measured from its own DOM via nodeDOM.
	#partnerWidth(partner: Object, containerWidth: number): number
	{
		const dom = this.editor.view?.nodeDOM?.(partner.pos);
		if (dom instanceof HTMLElement && dom.offsetWidth > 0)
		{
			return dom.offsetWidth;
		}

		const w = partner.node.attrs.width;
		if (Number.isFinite(w) && w > 0)
		{
			return containerWidth * Math.min(w, FLOAT_MAX_PCT) / 100;
		}

		return containerWidth * 0.5;
	}

	// Returns the adjacent sibling { node, pos } in the same parent that is an imageAttachment with the
	// opposite float align, or null if no such sibling exists. Partner is an immediate neighbour, so
	// its pos is derivable from this node's pos and nodeSize.
	#findOppositeFloatSibling(): Object | null
	{
		const pos = this.resolvePos();
		if (pos === null)
		{
			return null;
		}

		const myAlign = this.node.attrs.align;
		if (myAlign !== 'left' && myAlign !== 'right')
		{
			return null;
		}

		const oppositeAlign = myAlign === 'left' ? 'right' : 'left';
		const $pos = this.editor.state.doc.resolve(pos);
		const parent = $pos.parent;
		const myIndex = $pos.index();

		// Check immediately preceding sibling.
		if (myIndex > 0)
		{
			const prev = parent.child(myIndex - 1);
			if (prev.type.name === this.node.type.name
				&& prev.attrs.align === oppositeAlign)
			{
				return { node: prev, pos: pos - prev.nodeSize };
			}
		}

		// Check immediately following sibling.
		if (myIndex < parent.childCount - 1)
		{
			const next = parent.child(myIndex + 1);
			if (next.type.name === this.node.type.name
				&& next.attrs.align === oppositeAlign)
			{
				return { node: next, pos: pos + this.node.nodeSize };
			}
		}

		return null;
	}

	// Pure decision: returns true when this resizable node should be demoted to a block.
	// Inputs: container width, own rendered width, optional partner rendered width, constants.
	// Does not touch the DOM.
	shouldStack(): boolean
	{
		if (!this.resizable)
		{
			return false;
		}

		const align = this.node.attrs.align;
		if (align !== 'left' && align !== 'right')
		{
			return false;
		}

		const container = this.dom.parentElement;
		if (!container)
		{
			return false;
		}

		// Content-box width of the container (same base used for % width resolution).
		const style = window.getComputedStyle(container);
		const containerWidth = container.clientWidth
			- parseFloat(style.paddingLeft || '0')
			- parseFloat(style.paddingRight || '0');

		if (containerWidth <= 0)
		{
			return false;
		}

		const rootFontSize = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
		const minColumnPx = MIN_COLUMN_REM * rootFontSize;
		const floatGapPx = FLOAT_GAP_REM * rootFontSize;

		const partner = this.#findOppositeFloatSibling();

		let usedWidth = this.#ownWidth(containerWidth) + floatGapPx;
		if (partner !== null)
		{
			usedWidth += this.#partnerWidth(partner, containerWidth) + floatGapPx;
		}

		const hypotheticalColumn = containerWidth - usedWidth;
		return hypotheticalColumn < minColumnPx;
	}

	// Applies the stack decision to the DOM. Runs even during drag-resize: toggling --stacked changes
	// only float/position, not width, so it can't fight the live px width (unlike syncLayout).
	applyStackDecision(): void
	{
		const stack = this.shouldStack();
		this.dom.classList.toggle('note-editor-media--stacked', stack);

		// Apply the same decision to the facing partner synchronously: the pair shares one
		// hypothetical column, so the boolean is identical for both. This makes the partner demote
		// during drag instead of lagging until the release transaction fires its 'update'. Toggling
		// the class doesn't change width, so the partner's ResizeObserver won't refire from this.
		const partner = this.#findOppositeFloatSibling();
		if (partner !== null)
		{
			const partnerDom = this.editor.view?.nodeDOM?.(partner.pos);
			if (partnerDom instanceof HTMLElement)
			{
				partnerDom.classList.toggle('note-editor-media--stacked', stack);
			}
		}
	}

	// Coalesces multiple calls within the same frame into a single applyStackDecision().
	// Also keeps the ResizeObserver and img load listener wired across re-render / DnD reparent.
	scheduleStackUpdate(): void
	{
		if (this.resizable)
		{
			this.#syncObserver();
			this.#ensureMediaLoadListener();
		}

		if (this._stackRafId !== undefined)
		{
			return;
		}

		this._stackRafId = requestAnimationFrame(() => {
			this._stackRafId = undefined;
			this.applyStackDecision();
		});
	}

	// Observe both this.dom (live drag width) and its container (text column). this.dom keeps its
	// identity for the node's lifetime; the container changes on a DnD reparent, so re-observe it.
	#syncObserver(): void
	{
		if (!this._resizeObserver)
		{
			this._resizeObserver = new ResizeObserver(() => this.scheduleStackUpdate());
			this._resizeObserver.observe(this.dom);
		}

		const parent = this.dom.parentElement;
		if (parent !== this._observedParent)
		{
			if (this._observedParent)
			{
				this._resizeObserver.unobserve(this._observedParent);
			}
			if (parent)
			{
				this._resizeObserver.observe(parent);
			}
			this._observedParent = parent;
		}
	}

	// Idempotent across re-render / replaceImage: attach a one-shot load listener to the current
	// not-yet-loaded media element. Marking the element prevents double-binding.
	// Uses 'load' for <img> and 'loadedmetadata' for <video> (fires once dimensions are known).
	#ensureMediaLoadListener(): void
	{
		const img = this.dom.querySelector('img');
		if (img && !img.complete && img.dataset.noteStackLoadBound !== 'true')
		{
			img.dataset.noteStackLoadBound = 'true';
			img.addEventListener('load', this._handleImgLoad, { once: true });
		}

		const video = this.dom.querySelector('video');
		if (video && video.readyState < 1 && video.dataset.noteStackLoadBound !== 'true')
		{
			video.dataset.noteStackLoadBound = 'true';
			video.addEventListener('loadedmetadata', this._handleImgLoad, { once: true });
		}
	}

	// Layout (align float + width %) lives on the DOM element that participates in block flow
	// (this.dom), not inside the Vue component — only there does float make following text wrap, and
	// only the block can carry a percentage width (a shrink-to-fit float can't resolve a percentage
	// width on its child). Non-resizable blocks (file) have no layout.
	syncLayout(): void
	{
		if (!this.resizable)
		{
			return;
		}

		// A drag-resize drives the block width directly; recomputing here would overwrite the live
		// width (reset to the committed %) and cause visible jitter.
		if (this.isResizing)
		{
			return;
		}

		const align = this.node.attrs.align;
		const suffix = (align === 'left' || align === 'right') ? align : 'center';
		this.dom.classList.remove(
			'note-editor-media--align-left',
			'note-editor-media--align-right',
			'note-editor-media--align-center',
		);
		this.dom.classList.add(`note-editor-media--align-${suffix}`);

		const width = this.node.attrs.width;
		if (Number.isFinite(width) && width > 0)
		{
			this.dom.style.width = `${Math.min(width, 100)}%`;
		}
		else
		{
			// No width → natural size via CSS fit-content.
			this.dom.style.width = '';
		}
	}

	// ProseMirror calls these on selectable nodes when the NodeSelection enters/leaves.
	// Defining selectNode means PM no longer adds the ProseMirror-selectednode class itself,
	// so we add it manually to keep the selection outline.
	selectNode(): void
	{
		this.dom.classList.add('ProseMirror-selectednode');
		if (this.vm)
		{
			// Sync editable here too: a click changes the selection, not the doc, so the
			// 'update' listener may not have fired since a read-only → editable switch.
			this.vm.editable = Boolean(this.editor?.isEditable);
			this.vm.selected = true;
		}

		// On mobile, selecting an image focuses the contenteditable and pops the soft keyboard, which
		// just covers the image while resizing. Drop DOM focus — ProseMirror keeps the NodeSelection in
		// its own state, so the outline/handles/overlay stay; tapping text refocuses and reopens it.
		if (isMobileLayout())
		{
			requestAnimationFrame(() => {
				if (this.isNodeSelected())
				{
					this.editor?.view?.dom?.blur?.();
					if (document.activeElement instanceof HTMLElement && this.dom.contains(document.activeElement))
					{
						document.activeElement.blur();
					}
				}
			});
		}
	}

	deselectNode(): void
	{
		this.dom.classList.remove('ProseMirror-selectednode');
		if (this.vm)
		{
			this.vm.selected = false;
		}
	}

	applyWidth(width: number | null): void
	{
		const pos = this.resolvePos();
		if (pos === null)
		{
			return;
		}

		// width is a percentage of the container (>0..100), fractional allowed.
		const normalized = (Number.isFinite(width) && width > 0) ? Math.min(width, 100) : null;
		const tr = this.editor.state.tr.setNodeMarkup(pos, null, { ...this.node.attrs, width: normalized });
		// setNodeMarkup recreates the node and drops the NodeSelection — restore it so the
		// image stays selected (handles visible) right after a resize.
		tr.setSelection(NodeSelection.create(tr.doc, pos));
		this.editor.view.dispatch(tr);
	}

	applyAlign(align: string | null): void
	{
		const pos = this.resolvePos();
		if (pos === null)
		{
			return;
		}

		// center is the default — store as null so it never serializes into markdown.
		const normalized = (align === 'left' || align === 'right') ? align : null;
		// Switching to a float caps the width at the float ceiling so the stored % matches the
		// rendered (CSS-capped) width — otherwise a 90%-wide centered image keeps 90 but renders 70.
		let width = this.node.attrs.width;
		if (normalized !== null && Number.isFinite(width) && width > FLOAT_MAX_PCT)
		{
			width = FLOAT_MAX_PCT;
		}
		const tr = this.editor.state.tr.setNodeMarkup(pos, null, { ...this.node.attrs, align: normalized, width });
		tr.setSelection(NodeSelection.create(tr.doc, pos));
		this.editor.view.dispatch(tr);
	}

	// Replace the image in place: pick a new file, upload it, then swap fileId/urls while keeping
	// width + align. The old fileId is left orphaned for the background cleanup to reclaim later.
	async replaceImage(): Promise<void>
	{
		if (!this.uploadService)
		{
			return;
		}

		const file = await this.uploadService.pickFile({ accept: 'image/*' });
		if (!file)
		{
			return;
		}

		const uploaded = await this.uploadService.uploadFileWithMeta(file);
		const attrs = buildAttachmentAttrs({
			name: uploaded.name,
			size: uploaded.size,
			mimeType: uploaded.type,
			fileId: uploaded.fileId,
			documentId: this.uploadService.documentId,
			showUrl: uploaded.showUrl,
			downloadUrl: uploaded.downloadUrl,
			viewerAttrs: uploaded.viewerAttrs,
		}, 'imageAttachment');
		if (!attrs)
		{
			return;
		}

		const pos = this.resolvePos();
		if (pos === null)
		{
			return;
		}

		const tr = this.editor.state.tr.setNodeMarkup(pos, null, {
			...attrs,
			width: this.node.attrs.width,
			align: this.node.attrs.align,
		});
		tr.setSelection(NodeSelection.create(tr.doc, pos));
		this.editor.view.dispatch(tr);
	}

	resolvePos(): number | null
	{
		if (!Type.isFunction(this.getPos))
		{
			return null;
		}

		const pos = this.getPos();

		return Number.isInteger(pos) && pos >= 0 ? pos : null;
	}

	isNodeSelected(): boolean
	{
		const pos = this.resolvePos();
		const selection = this.editor?.state?.selection;
		if (pos === null || !selection)
		{
			return false;
		}

		return selection.from === pos && selection.to === pos + this.node.nodeSize;
	}

	#isActivatableTarget(target: Element): boolean
	{
		return Boolean(
			target.closest('.note-editor-image-attachment-link')
			|| target.closest('.note-editor-file-attachment-link')
			|| target.closest('.note-editor-video-player'),
		);
	}

	stopEvent(event: Event): boolean
	{
		if (!(event.target instanceof Element) || !this.dom.contains(event.target))
		{
			return false;
		}

		// Resize handles and the overlay (align/replace) drive their own UI — keep ProseMirror out of
		// it so clicking a control doesn't move the selection or drop the NodeSelection.
		if (event.target.closest('.note-editor-media-resize-handle')
			|| event.target.closest('.note-editor-media-overlay'))
		{
			return true;
		}

		// Read-only: only let activatable targets (viewer link / video player) through.
		if (!this.editor?.isEditable)
		{
			return this.#isActivatableTarget(event.target);
		}

		// Editable: let ProseMirror own the event — click-to-select via handleClickOn, plus native
		// drag-and-drop of the selected node. The viewer opens via the link's native click once
		// the node is already selected (handleClickOn steps aside in that case).
		return false;
	}

	ignoreMutation(): boolean
	{
		return true;
	}

	destroy(): void
	{
		if (this.handleEditorUpdate)
		{
			this.editor?.off('update', this.handleEditorUpdate);
			this.handleEditorUpdate = null;
		}

		if (this._resizeObserver)
		{
			this._resizeObserver.disconnect();
			this._resizeObserver = null;
			this._observedParent = null;
		}

		if (this._stackRafId !== undefined)
		{
			cancelAnimationFrame(this._stackRafId);
			this._stackRafId = undefined;
		}

		this.app?.unmount();
		this.app = null;
		this.vm = null;
	}
}
