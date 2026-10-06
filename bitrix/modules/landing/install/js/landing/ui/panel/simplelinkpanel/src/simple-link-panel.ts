import { Dom, Event, Tag, Text, Type } from 'main.core';
import { Button, ButtonSize, AirButtonStyle, type ButtonOptions } from 'ui.buttons';
import { Loc } from 'landing.loc';
import { PageObject } from 'landing.pageobject';
import 'ui.forms';
// provides the --bitrix-gpt glyph of the AI select button
import 'ui.icon-set.outline';

import './css/style.css';

export type SimpleLinkPanelOptions = {
	// initial value of the input; empty string leaves the field empty
	href?: string;
	// called with the trimmed non-empty URL on save
	onSave?: (url: string) => void;
	// called on save with an empty field
	onRemove?: () => void;
	// called on the AI select button click; the button is rendered
	// only when the handler is provided
	onAiSelect?: () => void;
};

const PANEL_INSET = 12;
// Fixed panel widths from css/style.css (base and --with-ai variants); used
// only as a fallback when the layout has not measured yet
// (getBoundingClientRect returns 0 width).
const PANEL_WIDTH = 340;
const PANEL_WIDTH_WITH_AI = 380;
const CLASS_SHOW = 'landing-ui-show';
const CLASS_HIDE = 'landing-ui-hide';

// Matches links pointing at a page block: `#block7108` or `block:#block7108`.
// The optional `block:` prefix is normalized away; the captured digits are the block id.
const BLOCK_LINK_REGEXP = /^(?:block:)?#block(\d+)$/;

/**
 * Lightweight floating inline panel for editing a link URL.
 *
 * Renders a single row (URL input + Save button), positions itself next to
 * the given anchor element and returns the result through callbacks. It knows
 * nothing about the link node or the selection: only the anchor, the initial
 * value and the callbacks.
 *
 * Singleton: only one panel exists at a time (`getInstance()`); a repeated
 * `show()` re-targets it to the new anchor. The layout is appended to the
 * anchor's own document, so inside an editor iframe the panel is placed and
 * positioned in the right document.
 *
 * @memberOf BX.Landing.UI.Panel
 */
export class SimpleLinkPanel
{
	static #instance: SimpleLinkPanel | null = null;

	#layout: HTMLElement;

	#field: HTMLElement;

	#inputWrapper: HTMLElement;

	#input: HTMLInputElement;

	#chip: HTMLElement;

	#chipText: HTMLElement;

	// Block id currently rendered as a chip, or null when the chip is not shown.
	#blockId: string | null = null;

	#anchorEl: HTMLElement | null = null;

	#boundDocument: Document | null = null;

	#onSave: ((url: string) => void) | null = null;

	#onRemove: (() => void) | null = null;

	#onAiSelect: (() => void) | null = null;

	#aiButton: HTMLElement;

	static getInstance(): SimpleLinkPanel
	{
		if (!SimpleLinkPanel.#instance)
		{
			SimpleLinkPanel.#instance = new SimpleLinkPanel();
		}

		return SimpleLinkPanel.#instance;
	}

	constructor()
	{
		this.#input = Tag.render`
			<input
				type="text"
				class="ui-ctl-element"
				data-testid="landing-simplelinkpanel-input"
				placeholder="${Text.encode(Loc.getMessage('LANDING_SIMPLE_LINK_PANEL_INPUT_PLACEHOLDER'))}"
			>
		`;

		this.#inputWrapper = Tag.render`
			<div class="ui-ctl ui-ctl-textbox ui-ctl-sm landing-ui-panel-simple-link__input"></div>
		`;
		this.#inputWrapper.appendChild(this.#input);

		this.#chipText = Tag.render`
			<span class="landing-ui-panel-simple-link__chip-text"></span>
		`;
		const chipRemove: HTMLElement = Tag.render`
			<span
				class="landing-ui-panel-simple-link__chip-remove"
				role="button"
				tabindex="0"
				data-testid="landing-simplelinkpanel-chip-remove"
				aria-label="${Text.encode(Loc.getMessage('LANDING_SIMPLE_LINK_PANEL_CHIP_REMOVE'))}"
				title="${Text.encode(Loc.getMessage('LANDING_SIMPLE_LINK_PANEL_CHIP_REMOVE'))}"
			></span>
		`;
		this.#chip = Tag.render`
			<span
				class="landing-ui-panel-simple-link__chip ${CLASS_HIDE}"
				tabindex="0"
				data-testid="landing-simplelinkpanel-chip"
			></span>
		`;
		this.#chip.appendChild(this.#chipText);
		this.#chip.appendChild(chipRemove);
		Event.bind(chipRemove, 'click', this.#handleChipRemove);
		Event.bind(chipRemove, 'keydown', this.#handleChipRemoveKeyDown);
		Event.bind(this.#chip, 'keydown', this.#handleChipKeyDown);

		// `collapsedIcon` is erroneously non-optional in ButtonOptions typings, and
		// `size`/`style` are enum-typed, so the literal is cast through `unknown`.
		const saveButton = new Button({
			useAirDesign: true,
			size: ButtonSize.SMALL,
			style: AirButtonStyle.OUTLINE_NO_ACCENT,
			text: Loc.getMessage('LANDING_SIMPLE_LINK_PANEL_SAVE'),
		} as unknown as ButtonOptions);
		const saveButtonNode = saveButton.render();
		Dom.attr(saveButtonNode, 'data-testid', 'landing-simplelinkpanel-save');
		Event.bind(saveButtonNode, 'click', this.#handleSave);

		// Fixed-width slot holding both the input (text mode) and the chip (chip
		// mode). Keeping one slot of a stable width means the panel does not
		// resize when the chip is removed and the field switches modes.
		this.#field = Tag.render`
			<div class="landing-ui-panel-simple-link__field"></div>
		`;
		this.#field.appendChild(this.#inputWrapper);
		this.#field.appendChild(this.#chip);

		this.#layout = Tag.render`
			<div
				class="landing-ui-panel-simple-link ${CLASS_HIDE}"
				data-testid="landing-simplelinkpanel-panel"
			></div>
		`;
		this.#layout.appendChild(this.#field);
		this.#layout.appendChild(saveButtonNode);

		// Third fixed slot after Save. Not appended here: `show()` attaches it
		// only when an onAiSelect handler is provided (see #toggleAiButton).
		this.#aiButton = Tag.render`
			<button
				type="button"
				class="landing-ui-panel-simple-link__ai-button"
				data-testid="landing-simplelinkpanel-ai"
				title="${Text.encode(Loc.getMessage('LANDING_TITLE_OF_EDITOR_ACTION_AI_TEXT'))}"
			>
				<span class="ui-icon-set --bitrix-gpt landing-ui-panel-simple-link__ai-icon"></span>
			</button>
		`;
		Event.bind(this.#aiButton, 'click', this.#handleAiSelect);

		Event.bind(this.#input, 'keydown', this.#handleKeyDown);
	}

	/**
	 * Shows the panel next to the anchor and configures its callbacks.
	 * A repeated call re-targets the single panel to the new anchor.
	 */
	show(anchorEl: HTMLElement, options: SimpleLinkPanelOptions = {}): void
	{
		if (!Type.isDomNode(anchorEl))
		{
			return;
		}

		this.#unbindDismiss();

		this.#anchorEl = anchorEl;
		this.#onSave = Type.isFunction(options.onSave) ? options.onSave : null;
		this.#onRemove = Type.isFunction(options.onRemove) ? options.onRemove : null;
		this.#onAiSelect = Type.isFunction(options.onAiSelect) ? options.onAiSelect : null;
		this.#toggleAiButton();

		const href = Type.isStringFilled(options.href) ? options.href : '';
		const blockId = this.#resolveExistingBlockId(href);

		const targetDocument = anchorEl.ownerDocument;
		this.#boundDocument = targetDocument;
		Dom.append(this.#layout, targetDocument.body);

		Dom.removeClass(this.#layout, CLASS_HIDE);
		Dom.addClass(this.#layout, CLASS_SHOW);

		if (blockId !== null)
		{
			this.#enterChipMode(blockId);
		}
		else
		{
			this.#enterTextMode(href);
		}

		this.#adjustPosition();
		this.#focusActiveControl();
		this.#bindDismiss();
	}

	/**
	 * Returns the block id if `href` points at a block that exists in the editor
	 * document, or null otherwise (not a block link, or the block is missing).
	 */
	#resolveExistingBlockId(href: string): string | null
	{
		const match = BLOCK_LINK_REGEXP.exec(href);
		if (!match)
		{
			return null;
		}

		const blockId = match[1];
		const editorWindow = PageObject.getEditorWindow();
		// No editor context (panel opened outside a page) -> treat as non-existent.
		const blockExists = Boolean(editorWindow?.document.getElementById(`block${blockId}`));

		return blockExists ? blockId : null;
	}

	/**
	 * Chip ("brick") mode: hides the text field and shows a single non-editable
	 * chip for the block link. Focus is applied later, after positioning, so
	 * Backspace/Delete works without scrolling the page (see `#focusActiveControl`).
	 */
	#enterChipMode(blockId: string): void
	{
		this.#blockId = blockId;
		const label = this.#getBlockLabel(blockId);
		// Full name in a native tooltip so a truncated chip still shows it in full.
		this.#chipText.textContent = label;
		this.#chip.title = label;

		Dom.addClass(this.#inputWrapper, CLASS_HIDE);
		Dom.removeClass(this.#chip, CLASS_HIDE);
	}

	/**
	 * Chip caption for a block: the block type name from its front-end manifest
	 * (`manifest.block.name`), falling back to "К блоку {id}" when the block is
	 * missing from the storage, has no name, or the storage is unavailable.
	 */
	#getBlockLabel(blockId: string): string
	{
		const fallback = Loc.getMessage('LANDING_SIMPLE_LINK_PANEL_BLOCK_LABEL')
			.replace('#ID#', blockId);

		try
		{
			const blocks = PageObject.getBlocks();
			const block = blocks ? blocks.get(blockId) : null;
			const name = block && block.manifest && block.manifest.block
				? block.manifest.block.name
				: null;

			return (name && String(name).trim() !== '') ? String(name) : fallback;
		}
		catch (error)
		{
			// Root-window / block storage may be unavailable outside the editor.
			return fallback;
		}
	}

	/**
	 * Text mode: the regular editable URL field prefilled with `value`.
	 * Focus/selection are applied later, after positioning (`#focusActiveControl`).
	 */
	#enterTextMode(value: string): void
	{
		this.#blockId = null;
		this.#input.value = value;

		Dom.addClass(this.#chip, CLASS_HIDE);
		Dom.removeClass(this.#inputWrapper, CLASS_HIDE);
	}

	/**
	 * Moves focus to the currently visible control after the panel has been
	 * positioned. `preventScroll: true` stops the browser from scrolling the
	 * focused element into view, which — before positioning — would jump the page.
	 */
	#focusActiveControl(): void
	{
		if (this.#blockId !== null)
		{
			this.#chip.focus({ preventScroll: true });
		}
		else
		{
			this.#input.focus({ preventScroll: true });
			this.#input.select();
		}
	}

	hide(): void
	{
		if (!this.isShown())
		{
			return;
		}

		this.#unbindDismiss();
		Dom.removeClass(this.#layout, CLASS_SHOW);
		Dom.addClass(this.#layout, CLASS_HIDE);
		this.#anchorEl = null;
	}

	isShown(): boolean
	{
		return !Dom.hasClass(this.#layout, CLASS_HIDE);
	}

	#handleSave = (): void => {
		if (this.#blockId !== null)
		{
			// Chip mode: save the normalized block href regardless of input state.
			if (this.#onSave)
			{
				this.#onSave(`#block${this.#blockId}`);
			}

			this.hide();
			return;
		}

		const value = this.#input.value.trim();

		if (value === '')
		{
			if (this.#onRemove)
			{
				this.#onRemove();
			}
		}
		else if (this.#onSave)
		{
			this.#onSave(value);
		}

		this.hide();
	};

	// The AI slot exists only while a handler is provided: without it the
	// singleton keeps its regular 340px layout with no trace of the button.
	// Re-evaluated on every show(), so the same panel serves both modes.
	#toggleAiButton(): void
	{
		if (this.#onAiSelect)
		{
			Dom.addClass(this.#layout, '--with-ai');
			Dom.append(this.#aiButton, this.#layout);
		}
		else
		{
			Dom.removeClass(this.#layout, '--with-ai');
			Dom.remove(this.#aiButton);
		}
	}

	// A separate control on purpose: selecting the element for AI must not go
	// through #handleSave (no href write) and must not close the panel.
	#handleAiSelect = (event: MouseEvent): void => {
		event.preventDefault();
		event.stopPropagation();

		if (this.#onAiSelect)
		{
			this.#onAiSelect();
		}
	};

	// Removes the whole chip and switches to an empty text field for re-entry.
	// Focus moves to the now-visible input so it does not fall back to <body>
	// (WCAG 2.4.3: focus order stays inside the panel after the chip is gone).
	#handleChipRemove = (): void => {
		this.#enterTextMode('');
		this.#input.focus({ preventScroll: true });
	};

	// Keyboard activation of the chip remove control (role="button"): Enter and
	// Space trigger the same removal as a click.
	#handleChipRemoveKeyDown = (event: KeyboardEvent): void => {
		if (event.key === 'Enter' || event.key === ' ' || event.key === 'Spacebar')
		{
			event.preventDefault();
			// Stop the chip's own keydown from also handling the event.
			event.stopPropagation();
			this.#handleChipRemove();
		}
	};

	#handleChipKeyDown = (event: KeyboardEvent): void => {
		if (event.key === 'Backspace' || event.key === 'Delete')
		{
			event.preventDefault();
			this.#handleChipRemove();
		}
		else if (event.key === 'Enter')
		{
			event.preventDefault();
			this.#handleSave();
		}
		else if (event.key === 'Escape')
		{
			event.preventDefault();
			this.hide();
		}
	};

	#handleKeyDown = (event: KeyboardEvent): void => {
		if (event.key === 'Enter')
		{
			event.preventDefault();
			this.#handleSave();
		}
		else if (event.key === 'Escape')
		{
			event.preventDefault();
			this.hide();
		}
	};

	#handleOutsideClick = (event: MouseEvent): void => {
		const target = event.target;

		if (Type.isDomNode(target) && this.#layout.contains(target))
		{
			return;
		}

		this.hide();
	};

	#bindDismiss(): void
	{
		if (!this.#boundDocument)
		{
			return;
		}

		const targetWindow = this.#boundDocument.defaultView;
		// deferred so the click that opened the panel does not immediately close it
		targetWindow?.setTimeout(() => {
			if (this.isShown() && this.#boundDocument)
			{
				Event.bind(this.#boundDocument, 'pointerdown', this.#handleOutsideClick);
			}
		}, 0);
	}

	#unbindDismiss(): void
	{
		if (this.#boundDocument)
		{
			Event.unbind(this.#boundDocument, 'pointerdown', this.#handleOutsideClick);
			this.#boundDocument = null;
		}
	}

	#adjustPosition(): void
	{
		if (!this.#anchorEl)
		{
			return;
		}

		const targetWindow = this.#anchorEl.ownerDocument.defaultView;
		if (!targetWindow)
		{
			return;
		}

		const anchorRect = this.#anchorEl.getBoundingClientRect();

		// The panel is already in the DOM and shown here, so getBoundingClientRect
		// gives real dimensions; fall back to the fixed width if layout is not ready.
		const panelRect = this.#layout.getBoundingClientRect();
		const panelWidth = panelRect.width
			|| (this.#onAiSelect ? PANEL_WIDTH_WITH_AI : PANEL_WIDTH);
		const panelHeight = panelRect.height;

		const { pageXOffset, pageYOffset, innerWidth, innerHeight } = targetWindow;

		// Base position: just below the anchor, aligned to its left edge.
		let left = anchorRect.left + pageXOffset;
		let top = anchorRect.bottom + pageYOffset + PANEL_INSET;

		// Clamp horizontally into the visible viewport so a right-edge anchor does
		// not push the fixed-width panel off screen.
		const maxLeft = pageXOffset + innerWidth - panelWidth - PANEL_INSET;
		left = Math.min(left, maxLeft);
		left = Math.max(pageXOffset + PANEL_INSET, left);

		// Vertical safety: if the panel does not fit below the anchor, place it
		// above; never let it go above the top of the viewport.
		if (panelHeight > 0 && top + panelHeight > pageYOffset + innerHeight - PANEL_INSET)
		{
			const aboveTop = anchorRect.top + pageYOffset - panelHeight - PANEL_INSET;
			if (aboveTop >= pageYOffset + PANEL_INSET)
			{
				top = aboveTop;
			}
		}
		top = Math.max(pageYOffset + PANEL_INSET, top);

		Dom.style(this.#layout, {
			top: `${top}px`,
			left: `${left}px`,
		});
	}
}
