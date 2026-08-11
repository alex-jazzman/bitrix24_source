import { markRaw } from 'ui.vue3';
import { Loc } from 'main.core';
import { Dialog } from 'ui.entity-selector';
import { NoteThemeContext } from 'note.ui.theme-context';
import { allTypes, byType } from './mention-type-registry';

const POPUP_CLASS = 'note-editor-mention-popup';

// Reverse map: entityId -> wire type string (e.g. 'note-document' -> 'document').
// Built once from the registry to avoid O(n) scan on every Item:onSelect.
const ENTITY_ID_TO_TYPE = Object.fromEntries(
	allTypes().map((type) => [byType(type).entityId, type]),
);

let dialogCounter = 0;

/**
 * Wrapper around EntitySelector.Dialog for mention entity selection.
 *
 * Supports two modes:
 *   suggestion — opened by '@' trigger; search field visible, selector owns focus.
 *   edit — opened by clicking an existing chip; search field visible, current entity preselected.
 *
 * A fresh Dialog instance is created for every open() call in suggestion mode so that
 * position, anchor, and selection state are never stale.
 *
 * Not a Vue component — must be stored as markRaw when held in reactive context.
 */
export class MentionDialog
{
	#dialog = null;
	#onSelect;
	#isSuggestionMode = false;

	// Zero-width marker element anchoring the popup at the caret position.
	// Created in showSuggestion, removed in #destroyDialog.
	#caretMarker = null;

	// Scroll handler attached to document in capture phase when the dialog is open.
	// Capture phase is required because 'scroll' does not bubble; main.content scroll
	// would never reach window listeners.
	#scrollListener = null;
	// Optional callback returning the live viewport caret rect; used to keep the
	// suggestion popup following the caret while the page scrolls.
	#getCaretRect = null;
	// Pending requestAnimationFrame handle for throttled repositioning on scroll.
	#repositionRaf = null;
	// Anchor DOM node in edit mode (the chip). Null in suggestion mode, where the
	// anchor position comes from #getCaretRect instead.
	#anchorEl = null;
	// Last known viewport position of the anchor, captured on show and updated on
	// every reposition tick. Used to compute the scroll delta applied to the popup.
	#lastAnchorTop = null;
	#lastAnchorLeft = null;

	/**
	 * @param {Object} options
	 * @param {Function} options.onSelect - Called with { entityType: string, id: number }.
	 */
	constructor({ onSelect = () => {} } = {})
	{
		this.#onSelect = onSelect;
	}

	/**
	 * Builds and returns a fresh Dialog instance.
	 * Always recreated in suggestion mode so anchor/selection are clean each time.
	 *
	 * @param {Object} opts
	 * @param {HTMLElement|null} opts.anchor
	 * @param {boolean} opts.suggestionMode
	 * @param {{ entityId: string, id: number }|null} [opts.preselected] - Preselected item for edit mode.
	 * @returns {Dialog}
	 */
	#createDialog({ anchor, suggestionMode, preselected = null })
	{
		const id = `note-mention-dialog-${++dialogCounter}`;
		const isMobile = document.documentElement.classList.contains('note-mobile');

		const popupClass = suggestionMode
			? `${POPUP_CLASS} ${POPUP_CLASS}--suggestion ${NoteThemeContext.getDesignSystemContext()}`
			: `${POPUP_CLASS} ${NoteThemeContext.getDesignSystemContext()}`;

		// Dialog.validateItemIds() only accepts tuples [entityId, id], not plain objects.
		const preselectedItems = preselected
			? [[preselected.entityId, preselected.id]]
			: [];

		const instance = new Dialog({
			id,
			targetNode: anchor,
			dropdownMode: false,
			multiple: false,
			hideOnSelect: true,
			enableSearch: true,
			alwaysShowLabels: false,
			showAvatars: true,
			compactView: false,
			width: 350,
			height: isMobile ? 300 : 400,
			preselectedItems,
			popupOptions: {
				className: popupClass,
			},
			tabs: [
				{ id: 'user', title: Loc.getMessage('NOTE_EDITOR_MENTION_TAB_USER'), icon: 'o-person' },
			],
			entities: [
				{
					id: 'user',
					dynamicLoad: true,
					dynamicSearch: true,
					options: {
						showAvatars: true,
						showInvitationFooter: false,
					},
				},
				{
					id: 'note-document',
					dynamicLoad: true,
					dynamicSearch: true,
				},
				{
					id: 'note-collection',
					dynamicLoad: true,
					dynamicSearch: true,
					options: {
						accessLevel: 'view',
					},
				},
				{
					id: 'task',
					dynamicLoad: true,
					dynamicSearch: true,
					options: { withTab: true },
				},
			],
			events: {
				'Item:onSelect': (event) => {
					const item = event.getData().item;
					const entityId = item.getEntityId();
					const id = Number(item.getId());
					const entityType = ENTITY_ID_TO_TYPE[entityId];

					if (entityType && Number.isInteger(id) && id > 0)
					{
						this.#onSelect({ entityType, id });
					}
				},
			},
		});

		NoteThemeContext.themeEntitySelector(instance);

		// Apply theme to the search field container before first paint to prevent
		// a white flash on dark theme. TagSelector is created eagerly in Dialog
		// constructor, so its outer container is available before show().
		// One-shot (no subscription) — live theme changes are handled by
		// themeEntitySelector above, which re-scopes .ui-tag-selector-outer-container
		// on every onShow. Using applyToTagSelector here would add a persistent
		// subscription on every '@' open, leaking subscriptions over time.
		const tagSelector = typeof instance.getTagSelector === 'function'
			? instance.getTagSelector()
			: null;
		if (tagSelector)
		{
			NoteThemeContext.applyToTagSelectorOnce(tagSelector);
		}

		// Clean up if the dialog closes itself internally (e.g. Escape handled by Popup
		// in edit mode), bypassing MentionDialog.hide(): detach the scroll listener and
		// remove the caret marker so no orphaned span lingers in body until next open.
		instance.subscribe('onHide', () => {
			this.#detachScrollListener();
			if (this.#caretMarker)
			{
				this.#caretMarker.remove();
				this.#caretMarker = null;
			}
		});

		return markRaw(instance);
	}

	/**
	 * Opens the dialog in suggestion mode (model A).
	 * Recreates the Dialog instance every time for clean anchor/state.
	 * The selector owns focus — it will focus its search field on show().
	 *
	 * @param {Object} opts
	 * @param {{ left: number, top: number, bottom: number }} opts.caretRect - Viewport-relative caret coords.
	 * @param {string} [opts.query=''] - Initial search query.
	 * @param {Function} [opts.getCaretRect] - Returns the live viewport caret rect so the popup can follow the caret on scroll.
	 */
	showSuggestion({ caretRect, query = '', getCaretRect = null })
	{
		this.#destroyDialog();
		this.#isSuggestionMode = true;
		this.#getCaretRect = getCaretRect;
		// Suggestion mode reads the anchor from #getCaretRect, not a DOM node.
		this.#anchorEl = null;

		// Zero-width marker at the caret position so the popup anchors to the cursor,
		// not the left edge of the containing paragraph element.
		const marker = document.createElement('span');
		marker.style.cssText = `position:fixed; left:${caretRect.left}px; top:${caretRect.top}px; width:0; height:${Math.max(1, caretRect.bottom - caretRect.top)}px; pointer-events:none;`;
		document.body.appendChild(marker);
		this.#caretMarker = marker;

		this.#dialog = this.#createDialog({ anchor: marker, suggestionMode: true });

		this.#dialog.show();

		this.#attachScrollListener();

		// Fix the anchor base position now so scroll deltas are measured from the
		// caret as it was when the popup opened. Must run after #attachScrollListener,
		// which resets anchor-tracking state via #cancelReposition.
		this.#lastAnchorTop = caretRect.top;
		this.#lastAnchorLeft = caretRect.left;

		if (query)
		{
			this.search(query);
		}
	}

	/**
	 * Opens the dialog in edit mode (model B).
	 * Creates a fresh Dialog with visible search field and a preselected entity.
	 *
	 * @param {Object} opts
	 * @param {HTMLElement|null} opts.anchor - Anchor element (e.g. the chip DOM node).
	 * @param {string} opts.entityId - entity-selector entityId of the current mention.
	 * @param {number} opts.id - Numeric entity id of the current mention.
	 */
	showEdit({ anchor, entityId, id })
	{
		this.#destroyDialog();
		this.#isSuggestionMode = false;
		// Edit mode anchors to the real chip DOM node (no caret marker); its live
		// viewport position is read from #anchorEl on every reposition tick.
		this.#getCaretRect = null;

		this.#dialog = this.#createDialog({
			anchor,
			suggestionMode: false,
			preselected: { entityId, id },
		});

		this.#dialog.show();

		this.#attachScrollListener();

		// Set anchor state after #attachScrollListener, which resets anchor-tracking
		// state via #cancelReposition. Fix the base position now so scroll deltas are
		// measured from the chip as it was when the popup opened.
		this.#anchorEl = anchor || null;
		const anchorRect = this.#readAnchorRect();
		if (anchorRect)
		{
			this.#lastAnchorTop = anchorRect.top;
			this.#lastAnchorLeft = anchorRect.left;
		}
	}

	/**
	 * Hides the dialog without triggering a selection.
	 */
	hide()
	{
		this.#detachScrollListener();
		if (this.#caretMarker)
		{
			this.#caretMarker.remove();
			this.#caretMarker = null;
		}

		this.#dialog?.hide?.();
	}

	/**
	 * Attaches a document-level scroll listener in capture phase.
	 * Capture is necessary because the 'scroll' event does not bubble; listeners on
	 * window/document in bubble phase never receive scroll events from inner containers
	 * such as main.content. The listener is idempotent — calling twice is safe.
	 *
	 * On page-level scroll the popup follows the caret instead of closing.
	 */
	#attachScrollListener()
	{
		this.#detachScrollListener();

		this.#scrollListener = (event) => {
			// Ignore scroll events originating from inside the popup itself
			// (e.g. the results list); only reposition on page-level scroll.
			if (event.target instanceof Element
				&& event.target.closest(`.${POPUP_CLASS}`))
			{
				return;
			}

			this.#scheduleReposition();
		};

		document.addEventListener('scroll', this.#scrollListener, true);
	}

	/**
	 * Removes the document scroll listener if it was attached and cancels any
	 * pending reposition frame.
	 */
	#detachScrollListener()
	{
		this.#cancelReposition();

		if (this.#scrollListener)
		{
			document.removeEventListener('scroll', this.#scrollListener, true);
			this.#scrollListener = null;
		}
	}

	/**
	 * Schedules a throttled reposition on the next animation frame.
	 * Coalesces bursts of scroll events into a single layout pass.
	 */
	#scheduleReposition()
	{
		if (this.#repositionRaf !== null)
		{
			return;
		}

		this.#repositionRaf = requestAnimationFrame(() => {
			this.#repositionRaf = null;
			this.#reposition();
		});
	}

	/**
	 * Cancels a pending reposition frame if one is scheduled.
	 */
	#cancelReposition()
	{
		if (this.#repositionRaf !== null)
		{
			cancelAnimationFrame(this.#repositionRaf);
			this.#repositionRaf = null;
		}

		// Reset anchor-tracking state so the next open seeds a fresh base position.
		this.#lastAnchorTop = null;
		this.#lastAnchorLeft = null;
		this.#anchorEl = null;
	}

	/**
	 * Returns the live viewport rect of the anchor as { left, top, bottom }, or null.
	 *
	 * Single source of anchor position for both modes:
	 *   suggestion — the live caret rect from #getCaretRect;
	 *   edit — the chip DOM node's bounding rect.
	 *
	 * @returns {{ left: number, top: number, bottom: number }|null}
	 */
	#readAnchorRect()
	{
		if (typeof this.#getCaretRect === 'function')
		{
			const rect = this.#getCaretRect();

			return rect ? { left: rect.left, top: rect.top, bottom: rect.bottom } : null;
		}

		if (this.#anchorEl)
		{
			const rect = this.#anchorEl.getBoundingClientRect();

			return { left: rect.left, top: rect.top, bottom: rect.bottom };
		}

		return null;
	}

	/**
	 * Repositions the popup to track the anchor (caret in suggestion mode, chip in
	 * edit mode) as the page scrolls.
	 *
	 * We translate the popup container by the same amount the anchor moved in the
	 * viewport, rather than calling adjustPosition. adjustPosition re-runs the
	 * framework's viewport-fit and clamps the popup to the viewport edge, which
	 * pins it over the header/toolbar once the caret scrolls past the top. The
	 * delta approach lets top go negative so the popup flies off-screen with the
	 * caret, while preserving the popup's original orientation and offset
	 * (including an upward flip if it was placed above the anchor).
	 */
	#reposition()
	{
		if (!this.#dialog)
		{
			return;
		}

		const popup = typeof this.#dialog.getPopup === 'function' ? this.#dialog.getPopup() : null;
		const container = popup && typeof popup.getPopupContainer === 'function'
			? popup.getPopupContainer()
			: null;
		if (!container)
		{
			return;
		}

		const rect = this.#readAnchorRect();
		if (!rect)
		{
			return;
		}

		// Keep the fixed caret marker in sync with the live caret (suggestion mode).
		if (this.#caretMarker)
		{
			this.#caretMarker.style.left = `${rect.left}px`;
			this.#caretMarker.style.top = `${rect.top}px`;
			this.#caretMarker.style.height = `${Math.max(1, rect.bottom - rect.top)}px`;
		}

		if (this.#lastAnchorTop === null)
		{
			this.#lastAnchorTop = rect.top;
			this.#lastAnchorLeft = rect.left;

			return;
		}

		const deltaTop = rect.top - this.#lastAnchorTop;
		const deltaLeft = rect.left - this.#lastAnchorLeft;
		this.#lastAnchorTop = rect.top;
		this.#lastAnchorLeft = rect.left;

		if (deltaTop === 0 && deltaLeft === 0)
		{
			return;
		}

		// Translate the popup by the same amount the caret moved in the viewport.
		// We set top/left directly (not adjustPosition) so the popup can fly off-screen
		// with the caret instead of being clamped to the viewport edge.
		const curTop = Number.parseFloat(container.style.top) || container.getBoundingClientRect().top;
		const curLeft = Number.parseFloat(container.style.left) || container.getBoundingClientRect().left;
		container.style.top = `${curTop + deltaTop}px`;
		container.style.left = `${curLeft + deltaLeft}px`;
	}

	/**
	 * Pushes a search query into the dialog's search field.
	 *
	 * @param {string} query
	 */
	search(query)
	{
		if (!this.#dialog || typeof this.#dialog.search !== 'function')
		{
			return;
		}

		this.#dialog.search(query);
	}

	/**
	 * Returns true if the dialog is currently visible.
	 *
	 * @returns {boolean}
	 */
	isOpen()
	{
		return typeof this.#dialog?.isOpen === 'function' && this.#dialog.isOpen();
	}

	/**
	 * Returns true if opened in suggestion mode (model A).
	 *
	 * @returns {boolean}
	 */
	isSuggestionMode()
	{
		return this.#isSuggestionMode;
	}

	/**
	 * Destroys the current Dialog instance and frees resources.
	 */
	#destroyDialog()
	{
		this.#detachScrollListener();

		// Remove the caret marker so no orphaned span is left in body.
		if (this.#caretMarker)
		{
			this.#caretMarker.remove();
			this.#caretMarker = null;
		}

		if (this.#dialog)
		{
			this.#dialog.hide?.();
			this.#dialog.destroy?.();
			this.#dialog = null;
		}
	}

	/**
	 * Destroys everything — called when the editor unmounts.
	 */
	destroy()
	{
		this.#destroyDialog();
	}
}
