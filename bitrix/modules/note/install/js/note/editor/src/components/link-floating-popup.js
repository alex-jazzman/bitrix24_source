import { reactive } from 'vue';
import { Event } from 'main.core';
import { LinkEditingState } from '../services/link-editing-state';
import { findLinkMarkRangeAtPos, commitLinkAtRange } from '../services/link-editing';
import { LinkEditFormComponent } from './toolbar/link-edit-form';

const VIEWPORT_PADDING = 8;
const ANCHOR_GAP = 6;

export const LinkFloatingPopupComponent = {
	name: 'NoteLinkFloatingPopup',
	components: {
		LinkEditForm: LinkEditFormComponent,
	},
	props: {
		editor: {
			type: Object,
			default: null,
		},
		editorTick: {
			type: Number,
			default: 0,
		},
	},
	data()
	{
		return {
			visible: false,
			posX: 0,
			posY: 0,
			linkAutofocus: false,
			caretDrivenOpen: false,
		};
	},
	created()
	{
		this.linkState = reactive(new LinkEditingState({
			getEditor: () => this.editor,
		}));
		this.currentAnchor = null;
		this.repositionFrame = null;
		this.committed = false;
		// One-shot guard against re-scheduling syncVisibilityWithCaret forever when the anchor
		// can't be resolved (e.g. DOM never settles into a matching <a>): retry once, then stop.
		this.anchorRetryPending = false;
		// Range the user dismissed manually (Escape / click outside). Visibility is caret-driven and
		// dismissal doesn't move the caret, so without this a "neutral" transaction (e.g. a remote
		// collaborator's cursor move) would re-run the sync and reopen the popup for the same range.
		this.dismissedRange = null;
		// Re-entrancy guard: close()/commit() dispatch transactions that bump editorTick and re-run
		// the caret sync; without this the popup could reopen from its own closing transaction.
		this.isClosing = false;
		// True when the current pointer interaction started inside the popup, so a drag-select that
		// ends outside the popup (mouseup beyond its bounds) isn't misread as a click-outside close.
		this.pointerDownInsidePopup = false;
		this.pointerInteractionActive = false;
		this.pointerStart = null;
		this.pointerWasDragged = false;
		this.explicitPopupOpen = false;
		// Tracks the isEditable false->true transition: on entering edit mode the caret may land inside
		// a link (e.g. a link at doc start), and we must not auto-open the popup for that programmatic
		// caret placement — only an explicit interaction should open it.
		this.wasEditable = false;
	},
	watch: {
		editorTick()
		{
			this.syncVisibilityWithCaret();
		},
	},
	mounted()
	{
		this.handleDocumentClick = this.handleDocumentClick.bind(this);
		this.handleDocumentKeydown = this.handleDocumentKeydown.bind(this);
		this.handleViewportChange = this.handleViewportChange.bind(this);
		this.handleDocumentPointerDown = this.handleDocumentPointerDown.bind(this);
		this.handleDocumentPointerUp = this.handleDocumentPointerUp.bind(this);

		Event.bind(document, 'mousedown', this.handleDocumentPointerDown, true);
		Event.bind(document, 'mouseup', this.handleDocumentPointerUp, true);
		Event.bind(document, 'click', this.handleDocumentClick, true);
		Event.bind(document, 'keydown', this.handleDocumentKeydown, true);
		// Capture phase on document to also catch scroll of `main.content`, not just window.
		Event.bind(document, 'scroll', this.handleViewportChange, { passive: true, capture: true });
		Event.bind(window, 'resize', this.handleViewportChange, { passive: true });
	},
	beforeUnmount()
	{
		Event.unbind(document, 'mousedown', this.handleDocumentPointerDown, true);
		Event.unbind(document, 'mouseup', this.handleDocumentPointerUp, true);
		Event.unbind(document, 'click', this.handleDocumentClick, true);
		Event.unbind(document, 'keydown', this.handleDocumentKeydown, true);
		Event.unbind(document, 'scroll', this.handleViewportChange, true);
		Event.unbind(window, 'resize', this.handleViewportChange);
		if (this.repositionFrame !== null)
		{
			cancelAnimationFrame(this.repositionFrame);
			this.repositionFrame = null;
		}
		this.commitOnce();
		this.linkState.close();
	},
	methods: {
		// Remember whether the pointer press started inside the popup: a drag-select that begins in
		// the link field and releases outside must not be treated as a click-outside close.
		handleDocumentPointerDown(event: MouseEvent): void
		{
			const target = event.target instanceof Element ? event.target : null;
			const popup = this.$refs.popup;
			this.pointerInteractionActive = true;
			this.pointerStart = { x: event.clientX, y: event.clientY };
			this.pointerWasDragged = false;
			const editorDom = this.editor?.view?.dom;
			if (this.explicitPopupOpen
				&& editorDom instanceof HTMLElement
				&& target !== null
				&& editorDom.contains(target)
				&& target.closest('a[href]') !== this.currentAnchor)
			{
				this.explicitPopupOpen = false;
			}
			this.pointerDownInsidePopup = this.visible
				&& popup instanceof HTMLElement
				&& target !== null
				&& popup.contains(target);
		},
		handleDocumentPointerUp(event: MouseEvent): void
		{
			this.pointerInteractionActive = false;
			if (this.pointerStart)
			{
				this.pointerWasDragged = Math.abs(event.clientX - this.pointerStart.x) > 2
					|| Math.abs(event.clientY - this.pointerStart.y) > 2;
				this.pointerStart = null;
			}
		},
		// Popup visibility is primarily caret-driven (see syncVisibilityWithCaret), but a click
		// outside both the popup and the editor DOM doesn't move ProseMirror selection, so it
		// needs an explicit close here. Also blocks native navigation on link click in editable.
		handleDocumentClick(event: MouseEvent): void
		{
			// Drag-select that started inside the popup (text selection in the link field) can end
			// outside it; that mouseup/click is not a real click-outside, so keep the popup open.
			if (this.pointerDownInsidePopup)
			{
				this.pointerDownInsidePopup = false;
				this.pointerWasDragged = false;

				return;
			}

			if (this.pointerWasDragged)
			{
				this.pointerWasDragged = false;

				return;
			}

			const target = event.target instanceof Element ? event.target : null;
			if (!target)
			{
				return;
			}

			if (this.visible)
			{
				const popup = this.$refs.popup;
				if (popup instanceof HTMLElement && popup.contains(target))
				{
					return;
				}
			}

			const editor = this.editor;
			const editorDom = editor?.view?.dom;
			const clickedInsideEditor = editor?.isEditable
				&& editorDom instanceof HTMLElement
				&& editorDom.contains(target);

			if (!clickedInsideEditor)
			{
				if (this.visible)
				{
					this.dismissCurrentRange();
					// Outside click: don't steal focus from whatever element the user actually clicked.
					this.close({ restoreFocus: false });
				}

				return;
			}

			const anchor = target.closest('a[href]');
			if (!(anchor instanceof HTMLAnchorElement))
			{
				// The click moved the caret outside the dismissed link. This must be synchronous: a
				// close() transaction may still be flushing and defer the caret-driven reset.
				this.dismissedRange = null;

				return;
			}

			if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)
			{
				return;
			}

			event.preventDefault();

			let range = null;
			try
			{
				range = findLinkMarkRangeAtPos(editor, editor.view.posAtDOM(anchor, 0));
			}
			catch
			{
				return;
			}

			if (!range)
			{
				return;
			}

			// Explicit click on a link must always be able to reopen the popup, even if this exact
			// range was just dismissed (Enter/Escape) with the caret still inside it.
			this.dismissedRange = null;
			this.explicitPopupOpen = true;
			if (!this.visible)
			{
				this.linkState.open(range);
				this.openAt(anchor, { autofocus: true });

				return;
			}

			if (anchor !== this.currentAnchor)
			{
				this.commitPendingRange();
				this.linkState.open(range);
				this.openAt(anchor, { autofocus: true });
			}
			else if (this.caretDrivenOpen)
			{
				this.caretDrivenOpen = false;
				this.linkState.updateRange(range);
				this.linkState.showSelectionOverlay();
				this.linkAutofocus = true;
			}
		},
		// Resolve the anchor from a position inside the mark range (not the left edge): domAtPos
		// at range.from tends to land on the block element (e.g. <p>), whose closest('a[href]')
		// only walks ancestors and never finds a freshly-created link (paste, input-rule).
		// A position inside the range lands on the link's text node instead, so closest()/parentElement
		// resolves to the <a> itself.
		// Remember the link range under the caret as user-dismissed so the caret-driven sync won't
		// reopen it until the caret actually moves to a different range (or leaves the link).
		dismissCurrentRange(): void
		{
			const editor = this.editor;
			if (!editor?.isEditable)
			{
				return;
			}

			this.dismissedRange = findLinkMarkRangeAtPos(editor, editor.state.selection.from);
		},
		anchorFromDomAtPos(editor: Object, pos: number, side: number): HTMLAnchorElement | null
		{
			try
			{
				const { node } = editor.view.domAtPos(pos, side);
				const element = node instanceof Element ? node : node?.parentElement;
				if (!(element instanceof Element))
				{
					return null;
				}

				// closest() walks ancestors (finds <a> when we land on its text node); querySelector
				// walks descendants (finds <a> when domAtPos returns the parent block for a boundary pos).
				return element.closest('a[href]') ?? element.querySelector('a[href]');
			}
			catch (error)
			{
				return null;
			}
		},
		domAnchorAt(editor: Object, range: Object): HTMLAnchorElement | null
		{
			// Probe positions with a bias side so domAtPos lands on the node INSIDE the <a>, not the
			// parent block. Covers links of any length >= 1 (single-char link: range.to === range.from+1).
			const inside = Math.min(range.from + 1, range.to);
			const probes = [
				[range.from, 1],
				[inside, -1],
				[range.to, -1],
				[range.from, -1],
			];

			for (const [pos, side] of probes)
			{
				const anchor = this.anchorFromDomAtPos(editor, pos, side);
				if (anchor instanceof HTMLAnchorElement)
				{
					return anchor;
				}
			}

			return null;
		},
		syncVisibilityWithCaret(): void
		{
			const editor = this.editor;
			if (!editor?.isEditable)
			{
				this.wasEditable = false;

				return;
			}

			const justEnabledEdit = !this.wasEditable;
			this.wasEditable = true;

			const selection = editor.state.selection;
			if (!selection.empty)
			{
				this.anchorRetryPending = false;
				this.dismissedRange = null;
				if (this.visible && this.caretDrivenOpen)
				{
					this.close({ restoreFocus: false });
				}

				if (!this.visible || this.caretDrivenOpen)
				{
					return;
				}
			}

			// Ignore transactions caused by our own close()/commit() to avoid reopening the popup.
			if (this.isClosing)
			{
				return;
			}

			if (!this.visible && this.pointerInteractionActive)
			{
				return;
			}

			let range = findLinkMarkRangeAtPos(editor, selection.from);

			// Consume the one-shot marker even when the caret is on an external link boundary. Otherwise
			// it survives until the next entry into the link and suppresses that real user interaction.
			const inputRuleRange = editor.storage?.link?.suppressPopupRange ?? null;
			if (inputRuleRange)
			{
				editor.storage.link.suppressPopupRange = null;
			}

			if ((!this.visible || this.caretDrivenOpen)
				&& range
				&& (selection.from === range.from || selection.from === range.to)
			)
			{
				range = null;
			}

			if (!range)
			{
				this.anchorRetryPending = false;
				if (this.visible && this.explicitPopupOpen)
				{
					return;
				}
				// Caret left the link: clear dismissal so re-entering it later reopens the popup.
				this.dismissedRange = null;
				if (this.visible)
				{
					// Caret already moved elsewhere in the editor (not an outside click); no explicit
					// keyboard/popup action happened here, so don't force focus.
					this.close({ restoreFocus: false });
				}

				return;
			}

			// Entering edit mode placed the caret inside a link (not an explicit user action): seed the
			// dismissal so the popup stays closed until the user clicks the link or moves into it.
			if (justEnabledEdit)
			{
				this.dismissedRange = range;

				return;
			}

			// A link just created by the markdown input rule (typing `[text](url)`) leaves the caret on it,
			// but that conversion is not an explicit "edit this link" interaction. Consume the one-shot
			// range handed over by LinkWithInputRule and seed the dismissal (same as entering edit mode),
			// so the popup stays closed until the user clicks the link or moves into it. Clear it
			// unconditionally so a later click can still reopen the popup for the same range.
			if (inputRuleRange
				&& !this.visible
				&& inputRuleRange.from === range.from
				&& inputRuleRange.to === range.to
			)
			{
				this.dismissedRange = range;

				return;
			}

			// Caret moved to a different link range: the previous dismissal no longer applies.
			if (this.dismissedRange
				&& (this.dismissedRange.from !== range.from || this.dismissedRange.to !== range.to))
			{
				this.dismissedRange = null;
			}

			// Same range the user dismissed and popup is closed: don't reopen (caret hasn't moved).
			if (!this.visible
				&& this.dismissedRange
				&& this.dismissedRange.from === range.from
				&& this.dismissedRange.to === range.to)
			{
				this.anchorRetryPending = false;

				return;
			}

			const anchor = this.domAnchorAt(editor, range);
			if (!(anchor instanceof HTMLAnchorElement))
			{
				// DOM may not be updated yet (e.g. right after paste/input-rule creates the mark).
				// Retry once on the next tick; if it still fails, stop instead of rescheduling forever
				// (that self-recursion never lets the microtask queue drain and hangs the tab).
				if (!this.anchorRetryPending)
				{
					this.anchorRetryPending = true;
					this.$nextTick(() => this.syncVisibilityWithCaret());
				}
				else
				{
					this.anchorRetryPending = false;
				}

				return;
			}

			this.anchorRetryPending = false;

			if (!this.visible)
			{
				this.linkState.open(range, { showSelectionOverlay: false });
				this.openAt(anchor, { caretDriven: true });
			}
			else if (anchor !== this.currentAnchor)
			{
				// Caret moved from link A to link B: commit A's pending edit onto A's own range first
				// (not via restoreLinkSelection, which would yank the caret back into A), then re-open
				// on B (re-read its href/selection).
				const caretDriven = this.caretDrivenOpen;
				this.commitPendingRange();
				this.linkState.open(range, { showSelectionOverlay: !caretDriven });
				this.openAt(anchor, {
					autofocus: !caretDriven,
					caretDriven,
				});
			}
			else if (this.caretDrivenOpen)
			{
				this.linkState.updateRange(range);
			}
		},
		// Lands the currently open link's pending edit on its own (now stale) range, without moving
		// the selection, before we switch `linkState` over to the next link (B). The dispatched
		// transaction only bumps editorTick (checked async by the watcher), so by the time that
		// re-run happens `currentAnchor` is already B and it's a no-op.
		commitPendingRange(): void
		{
			this.linkState.commitInPlace();
		},
		openAt(
			anchor: HTMLAnchorElement,
			{ autofocus = false, caretDriven = false }: { autofocus?: boolean, caretDriven?: boolean } = {},
		): void
		{
			this.currentAnchor = anchor;
			this.committed = false;
			this.linkAutofocus = autofocus;
			this.caretDrivenOpen = caretDriven;
			const rect = anchor.getBoundingClientRect();
			this.posX = Math.round(rect.left);
			this.posY = Math.round(rect.top - ANCHOR_GAP);
			this.visible = true;

			this.$nextTick(() => {
				this.adjustPosition();
			});
		},
		adjustPosition(): void
		{
			const popup = this.$refs.popup;
			const anchor = this.currentAnchor;
			if (!(popup instanceof HTMLElement) || !(anchor instanceof HTMLElement))
			{
				return;
			}

			const anchorRect = anchor.getBoundingClientRect();
			const popupRect = popup.getBoundingClientRect();
			const viewportWidth = window.innerWidth;
			const viewportHeight = window.innerHeight;

			let nextTop = Math.round(anchorRect.top - popupRect.height - ANCHOR_GAP);
			if (nextTop < VIEWPORT_PADDING)
			{
				nextTop = Math.round(anchorRect.bottom + ANCHOR_GAP);
			}

			if (nextTop + popupRect.height > viewportHeight - VIEWPORT_PADDING)
			{
				nextTop = Math.max(VIEWPORT_PADDING, viewportHeight - popupRect.height - VIEWPORT_PADDING);
			}

			let nextLeft = Math.round(anchorRect.left);
			const maxLeft = viewportWidth - popupRect.width - VIEWPORT_PADDING;
			if (nextLeft > maxLeft)
			{
				nextLeft = maxLeft;
			}
			if (nextLeft < VIEWPORT_PADDING)
			{
				nextLeft = VIEWPORT_PADDING;
			}

			this.posX = nextLeft;
			this.posY = nextTop;
		},
		// Guards against double-commit from close() racing beforeUnmount().
		commitOnce(): void
		{
			if (this.committed || !this.visible)
			{
				return;
			}

			this.committed = true;
			this.linkState.commit();
		},
		// `restoreFocus` must be false for outside-click: handleDocumentClick runs in the capture
		// phase, so an unconditional focus() here would steal focus from whatever the user actually
		// clicked (e.g. a sidebar button). Explicit keyboard/popup actions (Escape, Enter, Unset)
		// still want the caret visibly back in the editor, so they pass true.
		close({ restoreFocus = true }: { restoreFocus?: boolean } = {}): void
		{
			if (!this.visible)
			{
				return;
			}

			this.isClosing = true;
			this.explicitPopupOpen = false;
			this.commitOnce();
			this.visible = false;
			this.currentAnchor = null;
			this.linkAutofocus = false;
			this.caretDrivenOpen = false;
			this.linkState.close();
			if (restoreFocus)
			{
				// Return focus to the editor after commit/hide (a11y: focus must not be lost to <body>).
				// isClosing guards the resulting transaction so this focus doesn't reopen the popup.
				this.editor?.commands?.focus();
			}
			// Release the guard after the closing/commit transactions have flushed through the sync.
			this.$nextTick(() => {
				this.isClosing = false;
				this.syncVisibilityWithCaret();
			});
		},
		handleDocumentKeydown(event: KeyboardEvent): void
		{
			if (!this.visible)
			{
				return;
			}
			const editorDom = this.editor?.view?.dom;
			if (this.explicitPopupOpen
				&& editorDom instanceof HTMLElement
				&& event.target instanceof Node
				&& editorDom.contains(event.target))
			{
				this.explicitPopupOpen = false;
				this.$nextTick(() => this.syncVisibilityWithCaret());
			}

			if (event.key === 'Escape')
			{
				event.preventDefault();
				this.dismissCurrentRange();
				this.close();
			}
		},
		handleViewportChange(): void
		{
			if (!this.visible)
			{
				return;
			}

			if (this.repositionFrame !== null)
			{
				cancelAnimationFrame(this.repositionFrame);
			}

			this.repositionFrame = requestAnimationFrame(() => {
				this.repositionFrame = null;
				this.adjustPosition();
			});
		},
		handleApply(): void
		{
			// Enter is an explicit user close (like Escape): mark the range dismissed so the caret
			// staying inside the link after apply doesn't reopen the popup. Before creating a new link,
			// the editor selection has no link mark yet, so use the pending selection captured by linkState.
			this.dismissedRange = this.linkState.linkSelection ?? findLinkMarkRangeAtPos(
				this.editor,
				this.editor?.state.selection.from,
			);
			this.close();
		},
		handleUnset(): void
		{
			this.linkState.unset();
			this.committed = true;
			this.close();
		},
		handleLinkValueChange(value: string): void
		{
			this.linkState.setLinkValue(value);
		},
		handleFormFocus(): void
		{
			if (!this.visible || !this.caretDrivenOpen)
			{
				return;
			}

			this.caretDrivenOpen = false;
			this.linkState.showSelectionOverlay();
		},
	},
	// language=Vue
	template: `
		<teleport to="#note-editor-app">
			<div
				v-if="visible"
				ref="popup"
				class="note-editor-popover note-editor-popover--floating"
				data-testid="note-editor-link-floating-popup"
				:style="{ position: 'fixed', left: posX + 'px', top: posY + 'px' }"
			>
				<div class="note-editor-popover-card">
					<LinkEditForm
						:editor="editor"
						:editor-tick="editorTick"
						:link-value="linkState.linkValue"
						:link-is-active="true"
						:autofocus="linkAutofocus"
						@field-focus="handleFormFocus"
						@update:link-value="handleLinkValueChange"
						@apply="handleApply"
						@unset="handleUnset"
					/>
				</div>
			</div>
		</teleport>
	`,
};
