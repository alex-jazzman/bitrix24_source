/* eslint-disable */
this.BX = this.BX || {};
this.BX.Landing = this.BX.Landing || {};
this.BX.Landing.UI = this.BX.Landing.UI || {};
(function (exports, main_core, ui_buttons, landing_loc, landing_pageobject) {
	'use strict';

	const PANEL_INSET = 12;
	const PANEL_WIDTH = 340;
	const PANEL_WIDTH_WITH_AI = 380;
	const CLASS_SHOW = 'landing-ui-show';
	const CLASS_HIDE = 'landing-ui-hide';
	const BLOCK_LINK_REGEXP = /^(?:block:)?#block(\d+)$/;
	class SimpleLinkPanel {
		static #instance = null;
		#layout;
		#field;
		#inputWrapper;
		#input;
		#chip;
		#chipText;
		#blockId = null;
		#anchorEl = null;
		#boundDocument = null;
		#onSave = null;
		#onRemove = null;
		#onAiSelect = null;
		#aiButton;
		static getInstance() {
			if (!SimpleLinkPanel.#instance) {
				SimpleLinkPanel.#instance = new SimpleLinkPanel();
			}
			return SimpleLinkPanel.#instance;
		}
		constructor() {
			this.#input = main_core.Tag.render`
			<input
				type="text"
				class="ui-ctl-element"
				data-testid="landing-simplelinkpanel-input"
				placeholder="${main_core.Text.encode(landing_loc.Loc.getMessage('LANDING_SIMPLE_LINK_PANEL_INPUT_PLACEHOLDER'))}"
			>
		`;
			this.#inputWrapper = main_core.Tag.render`
			<div class="ui-ctl ui-ctl-textbox ui-ctl-sm landing-ui-panel-simple-link__input"></div>
		`;
			this.#inputWrapper.appendChild(this.#input);
			this.#chipText = main_core.Tag.render`
			<span class="landing-ui-panel-simple-link__chip-text"></span>
		`;
			const chipRemove = main_core.Tag.render`
			<span
				class="landing-ui-panel-simple-link__chip-remove"
				role="button"
				tabindex="0"
				data-testid="landing-simplelinkpanel-chip-remove"
				aria-label="${main_core.Text.encode(landing_loc.Loc.getMessage('LANDING_SIMPLE_LINK_PANEL_CHIP_REMOVE'))}"
				title="${main_core.Text.encode(landing_loc.Loc.getMessage('LANDING_SIMPLE_LINK_PANEL_CHIP_REMOVE'))}"
			></span>
		`;
			this.#chip = main_core.Tag.render`
			<span
				class="landing-ui-panel-simple-link__chip ${CLASS_HIDE}"
				tabindex="0"
				data-testid="landing-simplelinkpanel-chip"
			></span>
		`;
			this.#chip.appendChild(this.#chipText);
			this.#chip.appendChild(chipRemove);
			main_core.Event.bind(chipRemove, 'click', this.#handleChipRemove);
			main_core.Event.bind(chipRemove, 'keydown', this.#handleChipRemoveKeyDown);
			main_core.Event.bind(this.#chip, 'keydown', this.#handleChipKeyDown);
			const saveButton = new ui_buttons.Button({
				useAirDesign: true,
				size: ui_buttons.ButtonSize.SMALL,
				style: ui_buttons.AirButtonStyle.OUTLINE_NO_ACCENT,
				text: landing_loc.Loc.getMessage('LANDING_SIMPLE_LINK_PANEL_SAVE')
			});
			const saveButtonNode = saveButton.render();
			main_core.Dom.attr(saveButtonNode, 'data-testid', 'landing-simplelinkpanel-save');
			main_core.Event.bind(saveButtonNode, 'click', this.#handleSave);
			this.#field = main_core.Tag.render`
			<div class="landing-ui-panel-simple-link__field"></div>
		`;
			this.#field.appendChild(this.#inputWrapper);
			this.#field.appendChild(this.#chip);
			this.#layout = main_core.Tag.render`
			<div
				class="landing-ui-panel-simple-link ${CLASS_HIDE}"
				data-testid="landing-simplelinkpanel-panel"
			></div>
		`;
			this.#layout.appendChild(this.#field);
			this.#layout.appendChild(saveButtonNode);
			this.#aiButton = main_core.Tag.render`
			<button
				type="button"
				class="landing-ui-panel-simple-link__ai-button"
				data-testid="landing-simplelinkpanel-ai"
				title="${main_core.Text.encode(landing_loc.Loc.getMessage('LANDING_TITLE_OF_EDITOR_ACTION_AI_TEXT'))}"
			>
				<span class="ui-icon-set --bitrix-gpt landing-ui-panel-simple-link__ai-icon"></span>
			</button>
		`;
			main_core.Event.bind(this.#aiButton, 'click', this.#handleAiSelect);
			main_core.Event.bind(this.#input, 'keydown', this.#handleKeyDown);
		}
		show(anchorEl, options = {}) {
			if (!main_core.Type.isDomNode(anchorEl)) {
				return;
			}
			this.#unbindDismiss();
			this.#anchorEl = anchorEl;
			this.#onSave = main_core.Type.isFunction(options.onSave) ? options.onSave : null;
			this.#onRemove = main_core.Type.isFunction(options.onRemove) ? options.onRemove : null;
			this.#onAiSelect = main_core.Type.isFunction(options.onAiSelect) ? options.onAiSelect : null;
			this.#toggleAiButton();
			const href = main_core.Type.isStringFilled(options.href) ? options.href : '';
			const blockId = this.#resolveExistingBlockId(href);
			const targetDocument = anchorEl.ownerDocument;
			this.#boundDocument = targetDocument;
			main_core.Dom.append(this.#layout, targetDocument.body);
			main_core.Dom.removeClass(this.#layout, CLASS_HIDE);
			main_core.Dom.addClass(this.#layout, CLASS_SHOW);
			if (blockId !== null) {
				this.#enterChipMode(blockId);
			} else {
				this.#enterTextMode(href);
			}
			this.#adjustPosition();
			this.#focusActiveControl();
			this.#bindDismiss();
		}
		#resolveExistingBlockId(href) {
			const match = BLOCK_LINK_REGEXP.exec(href);
			if (!match) {
				return null;
			}
			const blockId = match[1];
			const editorWindow = landing_pageobject.PageObject.getEditorWindow();
			const blockExists = Boolean(editorWindow?.document.getElementById(`block${blockId}`));
			return blockExists ? blockId : null;
		}
		#enterChipMode(blockId) {
			this.#blockId = blockId;
			const label = this.#getBlockLabel(blockId);
			this.#chipText.textContent = label;
			this.#chip.title = label;
			main_core.Dom.addClass(this.#inputWrapper, CLASS_HIDE);
			main_core.Dom.removeClass(this.#chip, CLASS_HIDE);
		}
		#getBlockLabel(blockId) {
			const fallback = landing_loc.Loc.getMessage('LANDING_SIMPLE_LINK_PANEL_BLOCK_LABEL').replace('#ID#', blockId);
			try {
				const blocks = landing_pageobject.PageObject.getBlocks();
				const block = blocks ? blocks.get(blockId) : null;
				const name = block && block.manifest && block.manifest.block ? block.manifest.block.name : null;
				return name && String(name).trim() !== '' ? String(name) : fallback;
			} catch (error) {
				return fallback;
			}
		}
		#enterTextMode(value) {
			this.#blockId = null;
			this.#input.value = value;
			main_core.Dom.addClass(this.#chip, CLASS_HIDE);
			main_core.Dom.removeClass(this.#inputWrapper, CLASS_HIDE);
		}
		#focusActiveControl() {
			if (this.#blockId !== null) {
				this.#chip.focus({
					preventScroll: true
				});
			} else {
				this.#input.focus({
					preventScroll: true
				});
				this.#input.select();
			}
		}
		hide() {
			if (!this.isShown()) {
				return;
			}
			this.#unbindDismiss();
			main_core.Dom.removeClass(this.#layout, CLASS_SHOW);
			main_core.Dom.addClass(this.#layout, CLASS_HIDE);
			this.#anchorEl = null;
		}
		isShown() {
			return !main_core.Dom.hasClass(this.#layout, CLASS_HIDE);
		}
		#handleSave = () => {
			if (this.#blockId !== null) {
				if (this.#onSave) {
					this.#onSave(`#block${this.#blockId}`);
				}
				this.hide();
				return;
			}
			const value = this.#input.value.trim();
			if (value === '') {
				if (this.#onRemove) {
					this.#onRemove();
				}
			} else if (this.#onSave) {
				this.#onSave(value);
			}
			this.hide();
		};
		#toggleAiButton() {
			if (this.#onAiSelect) {
				main_core.Dom.addClass(this.#layout, '--with-ai');
				main_core.Dom.append(this.#aiButton, this.#layout);
			} else {
				main_core.Dom.removeClass(this.#layout, '--with-ai');
				main_core.Dom.remove(this.#aiButton);
			}
		}
		#handleAiSelect = event => {
			event.preventDefault();
			event.stopPropagation();
			if (this.#onAiSelect) {
				this.#onAiSelect();
			}
		};
		#handleChipRemove = () => {
			this.#enterTextMode('');
			this.#input.focus({
				preventScroll: true
			});
		};
		#handleChipRemoveKeyDown = event => {
			if (event.key === 'Enter' || event.key === ' ' || event.key === 'Spacebar') {
				event.preventDefault();
				event.stopPropagation();
				this.#handleChipRemove();
			}
		};
		#handleChipKeyDown = event => {
			if (event.key === 'Backspace' || event.key === 'Delete') {
				event.preventDefault();
				this.#handleChipRemove();
			} else if (event.key === 'Enter') {
				event.preventDefault();
				this.#handleSave();
			} else if (event.key === 'Escape') {
				event.preventDefault();
				this.hide();
			}
		};
		#handleKeyDown = event => {
			if (event.key === 'Enter') {
				event.preventDefault();
				this.#handleSave();
			} else if (event.key === 'Escape') {
				event.preventDefault();
				this.hide();
			}
		};
		#handleOutsideClick = event => {
			const target = event.target;
			if (main_core.Type.isDomNode(target) && this.#layout.contains(target)) {
				return;
			}
			this.hide();
		};
		#bindDismiss() {
			if (!this.#boundDocument) {
				return;
			}
			const targetWindow = this.#boundDocument.defaultView;
			targetWindow?.setTimeout(() => {
				if (this.isShown() && this.#boundDocument) {
					main_core.Event.bind(this.#boundDocument, 'pointerdown', this.#handleOutsideClick);
				}
			}, 0);
		}
		#unbindDismiss() {
			if (this.#boundDocument) {
				main_core.Event.unbind(this.#boundDocument, 'pointerdown', this.#handleOutsideClick);
				this.#boundDocument = null;
			}
		}
		#adjustPosition() {
			if (!this.#anchorEl) {
				return;
			}
			const targetWindow = this.#anchorEl.ownerDocument.defaultView;
			if (!targetWindow) {
				return;
			}
			const anchorRect = this.#anchorEl.getBoundingClientRect();
			const panelRect = this.#layout.getBoundingClientRect();
			const panelWidth = panelRect.width || (this.#onAiSelect ? PANEL_WIDTH_WITH_AI : PANEL_WIDTH);
			const panelHeight = panelRect.height;
			const {
				pageXOffset,
				pageYOffset,
				innerWidth,
				innerHeight
			} = targetWindow;
			let left = anchorRect.left + pageXOffset;
			let top = anchorRect.bottom + pageYOffset + PANEL_INSET;
			const maxLeft = pageXOffset + innerWidth - panelWidth - PANEL_INSET;
			left = Math.min(left, maxLeft);
			left = Math.max(pageXOffset + PANEL_INSET, left);
			if (panelHeight > 0 && top + panelHeight > pageYOffset + innerHeight - PANEL_INSET) {
				const aboveTop = anchorRect.top + pageYOffset - panelHeight - PANEL_INSET;
				if (aboveTop >= pageYOffset + PANEL_INSET) {
					top = aboveTop;
				}
			}
			top = Math.max(pageYOffset + PANEL_INSET, top);
			main_core.Dom.style(this.#layout, {
				top: `${top}px`,
				left: `${left}px`
			});
		}
	}

	exports.SimpleLinkPanel = SimpleLinkPanel;

})(this.BX.Landing.UI.Panel = this.BX.Landing.UI.Panel || {}, BX, BX.UI, BX.Landing, BX.Landing);
//# sourceMappingURL=simplelinkpanel.bundle.js.map
