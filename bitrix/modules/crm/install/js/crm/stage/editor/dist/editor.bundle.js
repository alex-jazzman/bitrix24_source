/* eslint-disable */
this.BX = this.BX || {};
this.BX.Crm = this.BX.Crm || {};
(function (exports, main_core, crm_stage_descriptionTooltip, crm_stage_entityText, main_popup, ui_buttons, ui_dialogs_messagebox, ui_hint, ui_iconSet_api_core, ui_notification, ui_a11y, ui_system_typography, ui_system_input, ui_iconSet_outline, crm_stage_color) {
	'use strict';

	const StageEditorPalette = Object.freeze([Object.freeze(['ffe4e6', 'ffe2d6', 'ffedd5', 'fef3c7', 'ecf8c8', 'dcfce7', 'd1fae5', 'ccfbf1', 'cffafe', 'dbeafe', 'e0e7ff', 'ede9fe', 'fce7f3', 'f1f5f9']), Object.freeze(['fecdd3', 'ffc6ad', 'fed7aa', 'fde68a', 'd8ee8e', 'bbf7d0', 'a7f3d0', '99f6e4', 'a5f3fc', 'bfdbfe', 'c7d2fe', 'ddd6fe', 'fbcfe8', 'e2e8f0']), Object.freeze(['fd9fac', 'ffa385', 'fdb573', 'fcd357', 'beda69', '83eba8', '6ee3b5', '63e5d2', '64e3f5', '90c0fc', 'a4affb', 'c2b1fc', 'f8a1cf', 'bbc6d4']), Object.freeze(['fb7185', 'ff805d', 'fb923c', 'fbbf24', 'a3c644', '4ade80', '34d399', '2dd4bf', '22d3ee', '60a5fa', '818cf8', 'a78bfa', 'f472b6', '94a3b8']), Object.freeze(['e11d48', 'd9471f', 'ea580c', 'b7791f', '5f7f1f', '16a34a', '059669', '0d9488', '0891b2', '2563eb', '4f46e5', '7c3aed', 'db2777', '64748b']), Object.freeze(['9f1239', '8f2d13', '9a3412', '78350f', '365314', '166534', '065f46', '115e59', '155e75', '1e40af', '3730a3', '5b21b6', '9d174d', '334155'])]);
	function isStageEditorPaletteColor(color) {
		if (!main_core.Type.isStringFilled(color)) {
			return false;
		}
		const normalizedColor = color.replace(/^#/, '').toLowerCase();
		if (crm_stage_color.normalizeStageColor(color) !== normalizedColor) {
			return false;
		}
		return StageEditorPalette.some(row => row.includes(normalizedColor));
	}

	class ColorPalette {
		#selectedColor;
		#onSelect;
		#container = null;
		#customToggle = null;
		#customInput = null;
		#customField = null;
		#customColorPreview = null;
		#isCustomFieldVisible;
		#wasCustomFieldOpened = false;
		constructor(options) {
			this.#selectedColor = crm_stage_color.normalizeStageColor(options.selectedColor);
			this.#onSelect = options.onSelect;
			this.#isCustomFieldVisible = this.#wasCustomFieldOpened || !isStageEditorPaletteColor(this.#selectedColor);
		}
		render() {
			if (this.#container) {
				return this.#container;
			}
			const container = main_core.Tag.render`
			<div
				class="crm-stage-editor-color-palette"
				data-testid="crm-stage-editor-color-palette"
			>
				${this.#renderGrid()}
				${this.#renderCustomColor()}
			</div>
		`;
			this.#container = container;
			this.#syncSelectedState();
			this.#syncCustomInput();
			this.#syncCustomFieldVisibility();
			return container;
		}
		setSelectedColor(color) {
			this.#selectedColor = crm_stage_color.normalizeStageColor(color);
			this.#isCustomFieldVisible = this.#wasCustomFieldOpened || !isStageEditorPaletteColor(this.#selectedColor);
			this.#syncSelectedState();
			this.#syncCustomInput();
			this.#syncCustomFieldVisibility();
		}
		#renderGrid() {
			const colors = StageEditorPalette.flat();
			return main_core.Tag.render`
			<div
				class="crm-stage-editor-color-palette__grid"
				data-testid="crm-stage-editor-color-palette-grid"
				role="group"
				aria-label="${main_core.Text.encode(main_core.Loc.getMessage('CRM_STAGE_EDITOR_COLOR_PALETTE_LABEL') ?? '')}"
			>
				${colors.map(color => this.#renderColor(color))}
			</div>
		`;
		}
		#renderColor(color) {
			const button = main_core.Tag.render`
			<button
				class="crm-stage-editor-color-palette__item"
				type="button"
				aria-label="#${color.toUpperCase()}"
				aria-pressed="${color === this.#selectedColor ? 'true' : 'false'}"
				data-color="${color}"
				data-testid="crm-stage-editor-color-option-${color}"
			></button>
		`;
			main_core.Dom.style(button, {
				backgroundColor: `#${color}`,
				color: crm_stage_color.getStageTextColor(color)
			});
			main_core.Dom.append(this.#renderIcon(ui_iconSet_api_core.Outline.CHECK_L, 14, 'crm-stage-editor-color-palette__item-check', crm_stage_color.getStageTextColor(color)), button);
			main_core.Event.bind(button, 'click', () => {
				this.#handleColorSelected(color);
			});
			return button;
		}
		#renderCustomColor() {
			const customInputControl = new ui_system_input.Input({
				value: `#${this.#selectedColor.toUpperCase()}`,
				placeholder: '#',
				size: ui_system_input.InputSize.Md,
				design: ui_system_input.InputDesign.LightGrey,
				ariaLabel: main_core.Loc.getMessage('CRM_STAGE_EDITOR_CUSTOM_COLOR_LABEL') ?? ''
			});
			const customInputWrapper = customInputControl.render();
			main_core.Dom.addClass(customInputWrapper, 'crm-stage-editor-color-palette__custom-input');
			this.#customInput = customInputWrapper.querySelector('input');
			if (this.#customInput) {
				this.#customInput.dataset.testid = 'crm-stage-editor-color-custom-input';
				this.#customInput.maxLength = 7;
				main_core.Event.bind(this.#customInput, 'change', this.#handleCustomColorChange);
				main_core.Event.bind(this.#customInput, 'keydown', this.#handleCustomColorKeyDown);
			}
			this.#customColorPreview = main_core.Tag.render`
			<span
				class="crm-stage-editor-color-palette__custom-preview"
				data-testid="crm-stage-editor-color-custom-preview"
				aria-hidden="true"
			></span>
		`;
			main_core.Dom.append(this.#customColorPreview, customInputWrapper.querySelector('.ui-system-input-container'));
			const addCustomColorButton = new ui_buttons.Button({
				text: main_core.Loc.getMessage('CRM_STAGE_EDITOR_CUSTOM_COLOR_ADD') ?? '',
				icon: ui_iconSet_api_core.Outline.PLUS_L,
				collapsedIcon: ui_buttons.ButtonIcon.ADD,
				size: ui_buttons.ButtonSize.SMALL,
				useAirDesign: true,
				style: ui_buttons.AirButtonStyle.PLAIN_NO_ACCENT,
				onclick: () => {
					this.#showCustomField();
					return {};
				}
			}).render();
			main_core.Dom.addClass(addCustomColorButton, 'crm-stage-editor-color-palette__custom-add');
			addCustomColorButton.dataset.testid = 'crm-stage-editor-color-custom-add';
			this.#customToggle = main_core.Tag.render`
			<div class="crm-stage-editor-color-palette__custom-toggle">
				${addCustomColorButton}
			</div>
		`;
			this.#customField = main_core.Tag.render`
			<div class="crm-stage-editor-color-palette__custom-field --hidden">
				${customInputWrapper}
			</div>
		`;
			return main_core.Tag.render`
			<div class="crm-stage-editor-color-palette__custom">
				${this.#customToggle}
				${this.#customField}
			</div>
		`;
		}
		#handleColorSelected(color) {
			if (!isStageEditorPaletteColor(color)) {
				return;
			}
			this.#selectedColor = crm_stage_color.normalizeStageColor(color);
			this.#isCustomFieldVisible = this.#wasCustomFieldOpened;
			this.#syncSelectedState();
			this.#syncCustomInput();
			this.#syncCustomFieldVisibility();
			this.#onSelect(this.#selectedColor);
		}
		#handleCustomColorChange = () => {
			const input = this.#customInput?.value ?? '';
			const normalizedInput = input.replace(/^#/, '').toLowerCase();
			const color = crm_stage_color.normalizeStageColor(input, this.#selectedColor);
			if (color !== normalizedInput) {
				this.#syncCustomInput();
				return;
			}
			this.#selectedColor = color;
			this.#isCustomFieldVisible = this.#wasCustomFieldOpened || !isStageEditorPaletteColor(color);
			this.#syncSelectedState();
			this.#syncCustomInput();
			this.#syncCustomFieldVisibility();
			this.#onSelect(this.#selectedColor);
		};
		#showCustomField = () => {
			this.#wasCustomFieldOpened = true;
			this.#isCustomFieldVisible = true;
			this.#syncCustomFieldVisibility();
			this.#customInput?.focus();
		};
		#handleCustomColorKeyDown = event => {
			if (event.key === 'Enter') {
				event.preventDefault();
				this.#handleCustomColorChange();
			}
		};
		#syncSelectedState() {
			this.#container?.querySelectorAll('.crm-stage-editor-color-palette__item').forEach(node => {
				const item = node;
				const isSelected = item.dataset.color === this.#selectedColor;
				main_core.Dom.toggleClass(item, '--selected', isSelected);
				item.setAttribute('aria-pressed', isSelected ? 'true' : 'false');
			});
		}
		#syncCustomInput() {
			if (this.#customInput) {
				this.#customInput.value = `#${this.#selectedColor.toUpperCase()}`;
			}
			if (this.#customColorPreview) {
				main_core.Dom.style(this.#customColorPreview, 'backgroundColor', `#${this.#selectedColor}`);
			}
		}
		#syncCustomFieldVisibility() {
			if (this.#customToggle) {
				main_core.Dom.toggleClass(this.#customToggle, '--hidden', this.#isCustomFieldVisible);
			}
			if (this.#customField) {
				main_core.Dom.toggleClass(this.#customField, '--hidden', !this.#isCustomFieldVisible);
			}
		}
		#renderIcon(icon, size, className, color) {
			const container = main_core.Tag.render`
			<span class="${className}" aria-hidden="true"></span>
		`;
			new ui_iconSet_api_core.Icon({
				icon,
				size,
				color
			}).renderTo(container);
			return container;
		}
	}

	function getStageDescriptionFormatUpdate(value, start, end, tag) {
		const selectedText = value.slice(start, end);
		if (selectedText === '') {
			return {
				value,
				start,
				end,
				changed: false
			};
		}
		const leftTag = `[${tag}]`;
		const rightTag = `[/${tag}]`;
		const isWrapped = selectedText.startsWith(leftTag) && selectedText.endsWith(rightTag) && selectedText.length >= leftTag.length + rightTag.length;
		const replacement = isWrapped ? selectedText.slice(leftTag.length, selectedText.length - rightTag.length) : `${leftTag}${selectedText}${rightTag}`;
		return {
			value: `${value.slice(0, start)}${replacement}${value.slice(end)}`,
			start,
			end: start + replacement.length,
			changed: true
		};
	}
	function toggleStageDescriptionFormat(textarea, tag) {
		return applySelectionUpdate(textarea, getStageDescriptionFormatUpdate(textarea.value, textarea.selectionStart, textarea.selectionEnd, tag));
	}
	function wrapStageDescriptionLink(textarea, url) {
		const normalizedUrl = normalizeStageDescriptionUrl(url);
		const selectedText = textarea.value.slice(textarea.selectionStart, textarea.selectionEnd);
		if (!normalizedUrl || selectedText === '') {
			return textarea.value;
		}
		const start = textarea.selectionStart;
		const replacement = `[url=${normalizedUrl}]${selectedText}[/url]`;
		return applySelectionUpdate(textarea, {
			value: `${textarea.value.slice(0, start)}${replacement}${textarea.value.slice(textarea.selectionEnd)}`,
			start,
			end: start + replacement.length,
			changed: true
		});
	}
	function normalizeStageDescriptionUrl(value) {
		const trimmedValue = value.trim();
		if (!/^https?:\/\//i.test(trimmedValue)) {
			return null;
		}
		try {
			const url = new URL(trimmedValue);
			return ['http:', 'https:'].includes(url.protocol) ? url.href : null;
		} catch {
			return null;
		}
	}
	function applySelectionUpdate(textarea, update) {
		if (!update.changed) {
			return update.value;
		}
		const textArea = textarea;
		textArea.value = update.value;
		textArea.focus({
			preventScroll: true
		});
		textArea.selectionStart = update.start;
		textArea.selectionEnd = update.end;
		textArea.dispatchEvent(new window.Event('input', {
			bubbles: true
		}));
		return update.value;
	}

	const STAGE_DESCRIPTION_TOOLBAR_ITEMS = [{
		name: 'bold',
		tag: 'b',
		messageCode: 'CRM_STAGE_EDITOR_FORMAT_BOLD'
	}, {
		name: 'italic',
		tag: 'i',
		messageCode: 'CRM_STAGE_EDITOR_FORMAT_ITALIC'
	}, {
		name: 'underline',
		tag: 'u',
		messageCode: 'CRM_STAGE_EDITOR_FORMAT_UNDERLINE'
	}, {
		name: 'strikethrough',
		tag: 's',
		messageCode: 'CRM_STAGE_EDITOR_FORMAT_STRIKETHROUGH'
	}, {
		name: 'link',
		messageCode: 'CRM_STAGE_EDITOR_FORMAT_LINK'
	}];

	const FORMAT_ICONS = {
		bold: ui_iconSet_api_core.Outline.BOLD,
		italic: ui_iconSet_api_core.Outline.ITALIC,
		underline: ui_iconSet_api_core.Outline.UNDERLINE,
		strikethrough: ui_iconSet_api_core.Outline.STRIKETHROUGH
	};
	class TextFormatToolbar {
		#textarea;
		#popup = null;
		#animationFrameId = null;
		#linkInput = null;
		#linkInputElement = null;
		#linkApplyButton = null;
		#linkButton = null;
		#toolbarElement = null;
		#selectionStart = 0;
		#selectionEnd = 0;
		#restoreFocusOnClose = false;
		constructor(options) {
			this.#textarea = options.textarea;
			main_core.Event.bind(this.#textarea, 'mouseup', this.#handleMouseUp);
			main_core.Event.bind(this.#textarea, 'keydown', this.#handleTextareaKeyDown);
		}
		destroy() {
			main_core.Event.unbind(this.#textarea, 'mouseup', this.#handleMouseUp);
			main_core.Event.unbind(this.#textarea, 'keydown', this.#handleTextareaKeyDown);
			this.#cancelAnimationFrame();
			this.#destroyPopup(false);
		}
		#handleTextareaKeyDown = event => {
			if (event.key !== 'Tab' || event.shiftKey || !this.#hasSelection()) {
				return;
			}
			event.preventDefault();
			this.#selectionStart = this.#textarea.selectionStart;
			this.#selectionEnd = this.#textarea.selectionEnd;
			const textareaRect = this.#textarea.getBoundingClientRect();
			this.#show({
				left: textareaRect.left + window.scrollX + textareaRect.width / 2,
				top: textareaRect.top + window.scrollY
			}, true);
		};
		#handleToolbarKeyDown = event => {
			if (event.key !== 'Escape') {
				return;
			}
			event.preventDefault();
			event.stopPropagation();
			this.#destroyPopup();
		};
		#handleMouseUp = event => {
			this.#cancelAnimationFrame();
			const bindPosition = {
				left: event.pageX,
				top: event.pageY
			};
			this.#animationFrameId = window.requestAnimationFrame(() => {
				this.#animationFrameId = null;
				if (!this.#hasSelection()) {
					this.#destroyPopup();
					return;
				}
				this.#selectionStart = this.#textarea.selectionStart;
				this.#selectionEnd = this.#textarea.selectionEnd;
				this.#show(bindPosition);
			});
		};
		#hasSelection() {
			return this.#textarea.selectionStart !== this.#textarea.selectionEnd;
		}
		#show(bindPosition, focusToolbar = false) {
			this.#destroyPopup(false);
			this.#popup = new main_popup.Popup({
				bindElement: bindPosition,
				bindOptions: {
					forceBindPosition: true,
					position: 'top'
				},
				content: this.#renderToolbar(),
				className: 'crm-stage-editor-format-toolbar-popup',
				autoHide: true,
				closeByEsc: true,
				cacheable: false,
				padding: 0,
				contentBorderRadius: '12px',
				events: {
					onPopupDestroy: this.#handlePopupDestroy
				}
			});
			this.#restoreFocusOnClose = focusToolbar;
			this.#popup.show();
			if (focusToolbar && this.#toolbarElement) {
				ui_a11y.FocusNavigator.focusFirst(this.#toolbarElement, {
					focusVisible: true
				});
			}
		}
		#renderToolbar() {
			this.#destroyLinkEditor();
			const items = [];
			this.#linkButton = null;
			STAGE_DESCRIPTION_TOOLBAR_ITEMS.forEach(item => {
				if (item.name === 'link') {
					items.push(this.#renderSeparator());
					this.#linkButton = this.#renderIconButton(item.name, ui_iconSet_api_core.Outline.LINK, this.#getMessage(item.messageCode), this.#showLinkEditor);
					items.push(this.#linkButton);
					return;
				}
				items.push(this.#renderFormatButton(item));
			});
			const toolbarElement = main_core.Tag.render`
			<div
				class="crm-stage-editor-format-toolbar"
				data-testid="crm-stage-editor-format-toolbar"
			>${items}</div>
		`;
			if (toolbarElement === null) {
				throw new TypeError('Failed to render the stage description format toolbar');
			}
			this.#toolbarElement = toolbarElement;
			main_core.Event.bind(toolbarElement, 'keydown', this.#handleToolbarKeyDown);
			return toolbarElement;
		}
		#renderFormatButton(item) {
			return this.#renderIconButton(item.name, FORMAT_ICONS[item.name], this.#getMessage(item.messageCode), () => this.#applyFormat(item.tag));
		}
		#renderIconButton(name, iconName, title, handler) {
			const button = main_core.Tag.render`
			<button
				class="crm-stage-editor-format-toolbar__button"
				type="button"
				title="${main_core.Text.encode(title)}"
				aria-label="${main_core.Text.encode(title)}"
				data-testid="crm-stage-editor-format-${name}"
			></button>
		`;
			new ui_iconSet_api_core.Icon({
				icon: iconName,
				size: 20,
				hoverMode: ui_iconSet_api_core.IconHoverMode.DEFAULT
			}).renderTo(button);
			main_core.Event.bind(button, 'mousedown', event => {
				event.preventDefault();
			});
			main_core.Event.bind(button, 'click', handler);
			return button;
		}
		#renderSeparator() {
			return main_core.Tag.render`
			<div
				class="crm-stage-editor-format-toolbar__separator"
				role="separator"
				aria-orientation="vertical"
			></div>
		`;
		}
		#applyFormat(tag) {
			this.#restoreSelection();
			toggleStageDescriptionFormat(this.#textarea, tag);
			this.#saveSelection();
		}
		#showLinkEditor = () => {
			if (!this.#popup) {
				return;
			}
			this.#saveSelection();
			this.#popup.setContent(this.#renderLinkEditor());
			this.#popup.adjustPosition();
			this.#cancelAnimationFrame();
			this.#animationFrameId = window.requestAnimationFrame(() => {
				this.#animationFrameId = null;
				this.#linkInputElement?.focus();
			});
		};
		#renderLinkEditor() {
			this.#destroyLinkEditor();
			this.#linkInput = new ui_system_input.Input({
				value: '',
				size: ui_system_input.InputSize.Md,
				design: ui_system_input.InputDesign.Primary,
				active: true,
				placeholder: this.#getMessage('CRM_STAGE_EDITOR_FORMAT_LINK_PLACEHOLDER'),
				ariaLabel: this.#getMessage('CRM_STAGE_EDITOR_FORMAT_LINK'),
				onInput: this.#syncLinkApplyButton
			});
			const inputContainer = this.#linkInput.render();
			main_core.Dom.addClass(inputContainer, 'crm-stage-editor-format-toolbar__link-input');
			this.#linkInputElement = inputContainer.querySelector('input');
			if (this.#linkInputElement) {
				this.#linkInputElement.dataset.testid = 'crm-stage-editor-format-link-input';
				main_core.Event.bind(this.#linkInputElement, 'keydown', this.#handleLinkKeyDown);
			}
			this.#linkApplyButton = this.#renderIconButton('link-apply', ui_iconSet_api_core.Outline.CHECK_S, this.#getMessage('CRM_STAGE_EDITOR_FORMAT_LINK_APPLY'), this.#applyLink);
			this.#linkApplyButton.disabled = true;
			const cancelButton = this.#renderIconButton('link-cancel', ui_iconSet_api_core.Outline.CROSS_S, this.#getMessage('CRM_STAGE_EDITOR_FORMAT_LINK_CANCEL'), this.#showToolbarContent);
			return main_core.Tag.render`
			<div
				class="crm-stage-editor-format-toolbar crm-stage-editor-format-toolbar__link"
				data-testid="crm-stage-editor-format-link-editor"
			>
				${inputContainer}
				${this.#linkApplyButton}
				${cancelButton}
			</div>
		`;
		}
		#handleLinkKeyDown = event => {
			if (event.key === 'Enter') {
				event.preventDefault();
				this.#applyLink();
			} else if (event.key === 'Escape') {
				event.preventDefault();
				event.stopPropagation();
				this.#showToolbarContent(true);
			}
		};
		#syncLinkApplyButton = () => {
			if (this.#linkApplyButton) {
				this.#linkApplyButton.disabled = !normalizeStageDescriptionUrl(this.#linkInput?.getValue() ?? '');
			}
		};
		#applyLink = () => {
			const url = this.#linkInput?.getValue() ?? '';
			if (!normalizeStageDescriptionUrl(url)) {
				return;
			}
			this.#restoreSelection();
			wrapStageDescriptionLink(this.#textarea, url);
			this.#destroyPopup();
		};
		#showToolbarContent = (focusLinkButton = false) => {
			if (!this.#popup) {
				return;
			}
			this.#popup.setContent(this.#renderToolbar());
			this.#popup.adjustPosition();
			if (focusLinkButton) {
				ui_a11y.FocusNavigator.focusTarget(this.#linkButton, {
					focusVisible: true
				});
			}
		};
		#saveSelection() {
			this.#selectionStart = this.#textarea.selectionStart;
			this.#selectionEnd = this.#textarea.selectionEnd;
		}
		#restoreSelection() {
			this.#textarea.selectionStart = this.#selectionStart;
			this.#textarea.selectionEnd = this.#selectionEnd;
		}
		#destroyLinkEditor() {
			if (this.#linkInputElement) {
				main_core.Event.unbind(this.#linkInputElement, 'keydown', this.#handleLinkKeyDown);
			}
			this.#linkInput?.destroy();
			this.#linkInput = null;
			this.#linkInputElement = null;
			this.#linkApplyButton = null;
		}
		#destroyPopup(restoreFocus = true) {
			const shouldRestoreFocus = restoreFocus && this.#restoreFocusOnClose;
			this.#restoreFocusOnClose = false;
			const popup = this.#popup;
			this.#popup = null;
			popup?.destroy();
			this.#destroyLinkEditor();
			this.#toolbarElement = null;
			this.#linkButton = null;
			if (shouldRestoreFocus) {
				ui_a11y.FocusNavigator.restoreFocus(this.#textarea, {
					focusVisible: true
				});
			}
		}
		#handlePopupDestroy = () => {
			const shouldRestoreFocus = this.#restoreFocusOnClose;
			this.#restoreFocusOnClose = false;
			this.#popup = null;
			this.#destroyLinkEditor();
			this.#toolbarElement = null;
			this.#linkButton = null;
			if (shouldRestoreFocus) {
				ui_a11y.FocusNavigator.restoreFocus(this.#textarea, {
					focusVisible: true
				});
			}
		};
		#cancelAnimationFrame() {
			if (main_core.Type.isNumber(this.#animationFrameId)) {
				window.cancelAnimationFrame(this.#animationFrameId);
				this.#animationFrameId = null;
			}
		}
		#getMessage(code) {
			return main_core.Loc.getMessage(code) ?? '';
		}
	}

	function calculateStageEditorPopupPosition(options) {
		if (!main_core.Type.isNumber(options.anchorWidth) || !main_core.Type.isNumber(options.popupWidth) || options.popupWidth <= 0 || !main_core.Type.isNumber(options.angleWidth) || !main_core.Type.isNumber(options.angleLeftOffset)) {
			return null;
		}
		return {
			offsetLeft: options.angleLeftOffset + (options.anchorWidth - options.popupWidth) / 2,
			angleOffset: (options.popupWidth - options.angleWidth) / 2
		};
	}

	function notifyStageEditorError(error, fallbackMessage) {
		let message = fallbackMessage;
		if (main_core.Type.isStringFilled(error)) {
			message = error;
		} else if (error instanceof Error && main_core.Type.isStringFilled(error.message)) {
			message = error.message;
		} else {
			const typedError = error;
			if (main_core.Type.isPlainObject(error) && main_core.Type.isStringFilled(typedError.message)) {
				message = typedError.message;
			}
		}
		ui_notification.Center.notify({
			content: main_core.Text.encode(message)
		});
	}
	class StageEditorPopup {
		#options;
		#popup = null;
		#container = null;
		#nameInput = null;
		#nameBadge = null;
		#nameErrorNode = null;
		#nameErrorId = `crm-stage-editor-name-error-${main_core.Text.getRandom()}`;
		#descriptionLabelId = `crm-stage-editor-description-label-${main_core.Text.getRandom()}`;
		#paletteId = `crm-stage-editor-palette-${main_core.Text.getRandom()}`;
		#deleteBlockedReasonId = `crm-stage-editor-delete-blocked-${main_core.Text.getRandom()}`;
		#descriptionContainer = null;
		#descriptionAddButton = null;
		#palette;
		#paletteContainer = null;
		#textEditor = null;
		#textFormatToolbar = null;
		#saveButton = null;
		#cancelButton = null;
		#deleteButton = null;
		#styleButton = null;
		#closeButton = null;
		#closedByAction = false;
		#isSubmitting = false;
		#resizeObserver = null;
		constructor(options) {
			this.#options = options;
			this.#palette = new ColorPalette({
				selectedColor: this.#options.model.getColor(),
				onSelect: this.#handleColorSelect
			});
		}
		open() {
			this.#getPopup().show();
			this.#nameInput?.focus();
		}
		close() {
			if (this.#isSubmitting) {
				return;
			}
			this.#getPopup().close();
		}
		#getPopup() {
			if (this.#popup) {
				return this.#popup;
			}
			this.#popup = new main_popup.Popup({
				bindElement: this.#options.anchor,
				content: this.#render(),
				className: 'crm-stage-editor-popup',
				closeByEsc: false,
				autoHide: false,
				cacheable: false,
				focusTrap: true,
				closeIcon: false,
				padding: 0,
				angle: {
					position: 'top',
					offset: 42
				},
				events: {
					onPopupShow: popup => this.#handlePopupShow(popup),
					onPopupClose: this.#handlePopupClose,
					onPopupDestroy: this.#handlePopupDestroy
				}
			});
			return this.#popup;
		}
		#handlePopupShow(popup) {
			this.#adjustPopupPosition(popup);
			this.#observeAnchorResize(popup);
		}
		#adjustPopupPosition(popup) {
			const positionablePopup = popup;
			const angle = positionablePopup.angle;
			const position = calculateStageEditorPopupPosition({
				anchorWidth: main_core.Type.isElementNode(positionablePopup.bindElement) ? positionablePopup.bindElement.offsetWidth : null,
				popupWidth: popup.getPopupContainer().offsetWidth,
				angleWidth: angle?.element.offsetWidth ?? null,
				angleLeftOffset: main_popup.Popup.getOption('angleLeftOffset')
			});
			if (!position || !angle) {
				return;
			}
			positionablePopup.offsetLeft = position.offsetLeft;
			angle.defaultOffset = position.angleOffset;
			popup.adjustPosition({
				forceBindPosition: true
			});
		}
		#observeAnchorResize(popup) {
			this.#disconnectResizeObserver();
			const {
				bindElement
			} = popup;
			if (!main_core.Type.isFunction(window.ResizeObserver) || !main_core.Type.isElementNode(bindElement)) {
				return;
			}
			this.#resizeObserver = new window.ResizeObserver(() => {
				if (popup.isShown()) {
					this.#adjustPopupPosition(popup);
				}
			});
			this.#resizeObserver.observe(bindElement);
		}
		#disconnectResizeObserver() {
			this.#resizeObserver?.disconnect();
			this.#resizeObserver = null;
		}
		#render() {
			if (this.#container) {
				return this.#container;
			}
			const container = main_core.Tag.render`
			<div
				class="crm-stage-editor"
				role="dialog"
				aria-label="${this.#getMessage('CRM_STAGE_EDITOR_TITLE')}"
				data-testid="crm-stage-editor-dialog"
			>
				${this.#renderHeader()}
				${this.#renderName()}
				${this.#renderPalette()}
				${this.#renderDescription()}
				${this.#renderFooter()}
			</div>
		`;
			this.#container = container;
			this.#syncColor();
			return container;
		}
		#renderHeader() {
			this.#styleButton = new ui_buttons.Button({
				text: this.#getMessage('CRM_STAGE_EDITOR_STYLE'),
				icon: ui_iconSet_api_core.Outline.PALETTE,
				collapsedIcon: ui_buttons.ButtonIcon.SETTING,
				size: ui_buttons.ButtonSize.SMALL,
				useAirDesign: true,
				style: ui_buttons.AirButtonStyle.OUTLINE_NO_ACCENT,
				disabled: !this.#options.canEdit,
				props: {
					'aria-controls': this.#paletteId,
					'aria-expanded': 'false'
				},
				onclick: () => {
					this.#togglePalette();
					return {};
				}
			});
			const styleButton = this.#styleButton.getContainer();
			main_core.Dom.addClass(styleButton, 'crm-stage-editor__style-button');
			styleButton.dataset.testid = 'crm-stage-editor-style';
			const closeIcon = new ui_iconSet_api_core.Icon({
				icon: ui_iconSet_api_core.Outline.CROSS_L,
				size: 18,
				hoverMode: ui_iconSet_api_core.IconHoverMode.DEFAULT
			});
			const closeButton = main_core.Tag.render`
			<button
				class="crm-stage-editor__close"
				type="button"
				aria-label="${main_core.Text.encode(this.#getMessage('CRM_STAGE_EDITOR_CANCEL'))}"
				data-testid="crm-stage-editor-close"
			>${closeIcon.render()}</button>
		`;
			main_core.Event.bind(closeButton, 'click', this.#handleCancelClick);
			this.#closeButton = closeButton;
			return main_core.Tag.render`
			<div class="crm-stage-editor__header">
				${ui_system_typography.Headline.render(this.#getMessage('CRM_STAGE_EDITOR_TITLE'), {
			size: 'sm',
			wrap: 'truncate',
			className: 'crm-stage-editor__title'
		})}
				<div class="crm-stage-editor__header-actions">
					${this.#styleButton.render()}
					${this.#closeButton}
				</div>
			</div>
		`;
		}
		#renderName() {
			const nameInputControl = new ui_system_input.Input({
				value: this.#options.model.getName(),
				size: ui_system_input.InputSize.Md,
				design: ui_system_input.InputDesign.Naked,
				ariaLabel: this.#getMessage('CRM_STAGE_EDITOR_NAME_LABEL')
			});
			const nameInputWrapper = nameInputControl.render();
			main_core.Dom.addClass(nameInputWrapper, 'crm-stage-editor__name-input');
			const nameInput = nameInputWrapper.querySelector('input');
			this.#nameInput = nameInput;
			if (nameInput) {
				nameInput.dataset.testid = 'crm-stage-editor-name-input';
				nameInput.setAttribute('aria-describedby', this.#nameErrorId);
				nameInput.disabled = !this.#options.canEdit;
			}
			this.#nameBadge = main_core.Tag.render`
			<div class="crm-stage-editor__name-badge">${nameInputWrapper}</div>
		`;
			this.#nameErrorNode = main_core.Tag.render`
			<div id="${this.#nameErrorId}" class="crm-stage-editor__name-error" role="alert">
				${main_core.Text.encode(this.#getMessage('CRM_STAGE_EDITOR_NAME_REQUIRED'))}
			</div>
		`;
			this.#syncNameValidation();
			if (nameInput) {
				main_core.Event.bind(nameInput, 'input', this.#handleNameInput);
				main_core.Event.bind(nameInput, 'keydown', this.#handleNameKeyDown);
			}
			return main_core.Tag.render`
			<div class="crm-stage-editor__field crm-stage-editor__field--name">
				${this.#nameBadge}
				${this.#nameErrorNode}
			</div>
		`;
		}
		#renderPalette() {
			const paletteContainer = main_core.Tag.render`
			<div id="${this.#paletteId}" class="crm-stage-editor__palette --hidden">${this.#palette.render()}</div>
		`;
			this.#paletteContainer = paletteContainer;
			return paletteContainer;
		}
		#renderDescription() {
			const descriptionContainer = main_core.Tag.render`
			<div class="crm-stage-editor__description"></div>
		`;
			this.#descriptionContainer = descriptionContainer;
			if (this.#options.model.getDescription().trim() === '') {
				const descriptionAddButton = new ui_buttons.Button({
					text: this.#getMessage('CRM_STAGE_EDITOR_DESCRIPTION_ADD'),
					icon: ui_iconSet_api_core.Outline.PLUS_L,
					collapsedIcon: ui_buttons.ButtonIcon.ADD,
					size: ui_buttons.ButtonSize.SMALL,
					useAirDesign: true,
					style: ui_buttons.AirButtonStyle.PLAIN_NO_ACCENT,
					disabled: !this.#options.canEdit,
					onclick: () => {
						this.#showTextEditor();
						return {};
					}
				});
				main_core.Dom.addClass(descriptionAddButton.getContainer(), 'crm-stage-editor__description-add');
				descriptionAddButton.getContainer().dataset.testid = 'crm-stage-editor-description-add';
				this.#descriptionAddButton = descriptionAddButton;
				main_core.Dom.append(descriptionAddButton.render(), descriptionContainer);
			} else {
				this.#showTextEditor();
			}
			return descriptionContainer;
		}
		#renderFooter() {
			this.#saveButton = new ui_buttons.SaveButton({
				text: this.#getMessage('CRM_STAGE_EDITOR_SAVE'),
				size: ui_buttons.ButtonSize.MEDIUM,
				collapsedIcon: ui_buttons.ButtonIcon.DONE,
				useAirDesign: true,
				style: ui_buttons.AirButtonStyle.FILLED,
				onclick: () => {
					this.#handleSaveClick();
					return {};
				},
				disabled: !this.#options.canEdit || !this.#options.model.isNameValid(this.#getDefaultStageName())
			});
			this.#saveButton.getContainer().dataset.testid = 'crm-stage-editor-save';
			this.#cancelButton = new ui_buttons.CancelButton({
				text: this.#getMessage('CRM_STAGE_EDITOR_CANCEL'),
				size: ui_buttons.ButtonSize.MEDIUM,
				collapsedIcon: ui_buttons.ButtonIcon.CANCEL,
				useAirDesign: true,
				style: ui_buttons.AirButtonStyle.PLAIN_NO_ACCENT,
				onclick: () => {
					this.#handleCancelClick();
					return {};
				}
			});
			this.#cancelButton.getContainer().dataset.testid = 'crm-stage-editor-cancel';
			this.#deleteButton = new ui_buttons.Button({
				icon: ui_iconSet_api_core.Outline.TRASHCAN,
				size: ui_buttons.ButtonSize.SMALL,
				useAirDesign: true,
				style: ui_buttons.AirButtonStyle.PLAIN_NO_ACCENT,
				onclick: () => {
					this.#handleDeleteClick();
					return {};
				},
				disabled: false,
				props: {
					'aria-label': this.#getMessage('CRM_STAGE_EDITOR_DELETE'),
					'aria-disabled': this.#options.canDelete ? 'false' : 'true'
				}
			});
			this.#deleteButton.getContainer().dataset.testid = 'crm-stage-editor-delete';
			const deleteNode = this.#deleteButton.render();
			main_core.Dom.addClass(deleteNode, 'crm-stage-editor__delete');
			if (!this.#options.canDelete) {
				const reason = this.#getDeleteBlockedReason();
				deleteNode.dataset.hint = reason;
				deleteNode.dataset.hintNoIcon = 'y';
				deleteNode.setAttribute('aria-describedby', this.#deleteBlockedReasonId);
				ui_hint.Hint.initNode(deleteNode);
			}
			const deleteBlockedReason = this.#options.canDelete ? null : main_core.Tag.render`
				<visually-hidden id="${this.#deleteBlockedReasonId}">
					${main_core.Text.encode(this.#getDeleteBlockedReason())}
				</visually-hidden>
			`;
			return main_core.Tag.render`
			<div class="crm-stage-editor__footer">
				<div class="crm-stage-editor__footer-right">
					${this.#saveButton.render()}
					${this.#cancelButton.render()}
				</div>
				<div class="crm-stage-editor__footer-left">${deleteNode}${deleteBlockedReason}</div>
			</div>
		`;
		}
		#showTextEditor = () => {
			if (this.#textEditor || !this.#descriptionContainer) {
				return;
			}
			main_core.Dom.clean(this.#descriptionContainer);
			const textEditorContainer = main_core.Tag.render`
			<div class="crm-stage-editor__text-editor"></div>
		`;
			main_core.Dom.append(textEditorContainer, this.#descriptionContainer);
			this.#textEditor = new ui_system_input.Input({
				value: '',
				label: this.#getMessage('CRM_STAGE_EDITOR_DESCRIPTION_LABEL'),
				rowsQuantity: 3,
				resize: 'vertical',
				design: ui_system_input.InputDesign.LightGrey,
				placeholder: this.#options.descriptionPlaceholder,
				readonly: !this.#options.canEdit,
				active: this.#options.mode === 'create' && this.#options.model.getName().trim() !== '',
				onInput: this.#handleDescriptionChange
			});
			const textEditor = this.#textEditor.render();
			main_core.Dom.append(textEditor, textEditorContainer);
			this.#textEditor.setValue(this.#options.model.getDescription());
			const textarea = textEditor.querySelector('textarea');
			if (textarea) {
				textarea.dataset.testid = 'crm-stage-editor-description-input';
				const label = textEditor.querySelector('.ui-system-input-label');
				if (label) {
					label.id = this.#descriptionLabelId;
					textarea.setAttribute('aria-labelledby', this.#descriptionLabelId);
				}
			}
			if (this.#options.canEdit && textarea) {
				this.#textFormatToolbar = new TextFormatToolbar({
					textarea
				});
			}
		};
		#handleNameInput = () => {
			this.#options.model.setName(this.#nameInput?.value ?? '');
			this.#syncNameValidation();
			this.#notifyChange('name');
		};
		#syncNameValidation() {
			const isValid = this.#options.model.isNameValid(this.#getDefaultStageName());
			if (this.#nameBadge) {
				main_core.Dom.toggleClass(this.#nameBadge, '--invalid', !isValid);
			}
			if (this.#nameErrorNode) {
				main_core.Dom.toggleClass(this.#nameErrorNode, '--visible', !isValid);
			}
			this.#nameInput?.setAttribute('aria-invalid', isValid ? 'false' : 'true');
			this.#saveButton?.setDisabled(this.#isSubmitting || !this.#options.canEdit || !isValid);
		}
		#handleNameKeyDown = event => {
			if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
				event.preventDefault();
				void this.#save();
			}
		};
		#handleDescriptionChange = () => {
			this.#syncDescription();
			this.#notifyChange('description');
		};
		#syncDescription() {
			if (this.#textEditor) {
				this.#options.model.setDescription(this.#textEditor.getValue());
			}
		}
		#handleColorSelect = color => {
			this.#options.model.setColor(color);
			this.#syncColor();
			this.#notifyChange('color');
		};
		#togglePalette = () => {
			if (!this.#paletteContainer) {
				return;
			}
			main_core.Dom.toggleClass(this.#paletteContainer, '--hidden');
			this.#styleButton?.getContainer().setAttribute('aria-expanded', main_core.Dom.hasClass(this.#paletteContainer, '--hidden') ? 'false' : 'true');
		};
		#syncColor() {
			if (!this.#nameBadge) {
				return;
			}
			const color = this.#options.model.getColor();
			main_core.Dom.style(this.#nameBadge, {
				backgroundColor: `#${color}`,
				color: crm_stage_color.getStageTextColor(color)
			});
			this.#palette.setSelectedColor(color);
		}
		#notifyChange(field) {
			if (this.#options.canEdit) {
				this.#options.onChange(field);
			}
		}
		#getDefaultStageName() {
			return this.#getMessage('CRM_STAGE_EDITOR_NEW_STAGE');
		}
		#handleSaveClick = () => {
			void this.#save();
		};
		async #save() {
			if (this.#isSubmitting || !this.#options.canEdit) {
				return;
			}
			const defaultStageName = this.#getDefaultStageName();
			if (!this.#options.model.isNameValid(defaultStageName)) {
				this.#syncNameValidation();
				this.#nameInput?.focus();
				return;
			}
			this.#options.model.normalizeName(defaultStageName);
			if (this.#nameInput) {
				this.#nameInput.value = this.#options.model.getName();
			}
			this.#syncNameValidation();
			this.#setSubmitting(true);
			try {
				this.#syncDescription();
				await this.#options.onSave();
				this.#setSubmitting(false);
				this.#closedByAction = true;
				this.close();
			} catch (error) {
				this.#showError(error);
			} finally {
				this.#setSubmitting(false);
			}
		}
		#handleDeleteClick = () => {
			if (!this.#options.canDelete || this.#isSubmitting) {
				return;
			}
			const messageBox = ui_dialogs_messagebox.MessageBox.confirm(this.#getMessage('CRM_STAGE_EDITOR_DELETE_CONFIRM_TEXT'), this.#getMessage('CRM_STAGE_EDITOR_DELETE_CONFIRM_TITLE'), () => this.#delete(), this.#getMessage('CRM_STAGE_EDITOR_DELETE_CONFIRM_YES'), () => true, this.#getMessage('CRM_STAGE_EDITOR_CANCEL'), true);
			messageBox.getPopupWindow().getPopupContainer().dataset.testid = 'crm-stage-editor-delete-confirm';
			messageBox.getOkButton().getContainer().dataset.testid = 'crm-stage-editor-delete-confirm-submit';
			messageBox.getCancelButton().getContainer().dataset.testid = 'crm-stage-editor-delete-confirm-cancel';
		};
		async #delete() {
			this.#setSubmitting(true);
			try {
				await this.#options.onDelete();
				this.#setSubmitting(false);
				this.#closedByAction = true;
				this.close();
				return true;
			} catch (error) {
				this.#showError(error);
				return false;
			} finally {
				this.#setSubmitting(false);
			}
		}
		#handleCancelClick = () => {
			if (this.#isSubmitting) {
				return;
			}
			this.#closedByAction = true;
			this.#options.onCancel();
			this.close();
		};
		#handlePopupClose = () => {
			this.#disconnectResizeObserver();
			try {
				if (!this.#closedByAction) {
					this.#options.onCancel();
				}
			} finally {
				this.#destroyTextEditor();
				this.#options.onClose();
			}
		};
		#handlePopupDestroy = () => {
			this.#disconnectResizeObserver();
			try {
				this.#destroyTextEditor();
			} finally {
				this.#options.onClose();
			}
		};
		#destroyTextEditor() {
			this.#textFormatToolbar?.destroy();
			this.#textFormatToolbar = null;
			this.#textEditor?.destroy();
			this.#textEditor = null;
		}
		#setSubmitting(isSubmitting) {
			this.#isSubmitting = isSubmitting;
			this.#saveButton?.setDisabled(isSubmitting || !this.#options.canEdit || !this.#options.model.isNameValid(this.#getDefaultStageName()));
			this.#cancelButton?.setDisabled(isSubmitting);
			this.#closeButton?.toggleAttribute('disabled', isSubmitting);
			this.#closeButton?.setAttribute('aria-disabled', isSubmitting ? 'true' : 'false');
			this.#deleteButton?.setDisabled(isSubmitting);
			this.#deleteButton?.getContainer().setAttribute('aria-disabled', isSubmitting || !this.#options.canDelete ? 'true' : 'false');
			this.#styleButton?.setDisabled(isSubmitting || !this.#options.canEdit);
			this.#descriptionAddButton?.setDisabled(isSubmitting || !this.#options.canEdit);
		}
		#showError(error) {
			notifyStageEditorError(error, this.#getMessage('CRM_STAGE_EDITOR_ERROR'));
		}
		#getDeleteBlockedReason() {
			const reasons = this.#options.deleteBlockReasons.filter(reason => main_core.Type.isStringFilled(reason));
			return reasons.length > 0 ? reasons.join('\n') : this.#getMessage('CRM_STAGE_EDITOR_DELETE_BLOCKED');
		}
		#getMessage(code) {
			return main_core.Loc.getMessage(code) ?? '';
		}
	}

	function mapStageDtoToModelData(dto) {
		return {
			...dto,
			color: crm_stage_color.normalizeStageColor(dto.color),
			description: main_core.Type.isString(dto.description) ? dto.description : ''
		};
	}
	function mapStagePayloadToDto(payload) {
		return {
			...payload,
			color: crm_stage_color.normalizeStageColor(payload.color),
			description: main_core.Type.isString(payload.description) ? payload.description : '',
			name: main_core.Type.isString(payload.name) ? payload.name.trim() : ''
		};
	}

	class StageEditorService {
		#onSave;
		#onDelete;
		constructor(onSave, onDelete) {
			this.#onSave = onSave;
			this.#onDelete = onDelete;
		}
		async save(payload) {
			const dto = await this.#onSave(mapStagePayloadToDto(payload));
			return mapStageDtoToModelData(dto);
		}
		async delete(stage) {
			await this.#onDelete(mapStageDtoToModelData(stage));
		}
	}

	class StageEditorModel {
		#initialStage;
		#stage;
		constructor(stage) {
			this.#initialStage = StageEditorModel.cloneStage(stage);
			this.#stage = StageEditorModel.cloneStage(stage);
			this.#stage.color = crm_stage_color.normalizeStageColor(this.#stage.color, crm_stage_color.getDefaultStageColor());
			this.#stage.description = this.getDescription();
		}
		getSnapshot() {
			return StageEditorModel.cloneStage(this.#initialStage);
		}
		getStage() {
			return StageEditorModel.cloneStage(this.#stage);
		}
		getSavePayload() {
			return {
				...this.getStage(),
				name: this.getName(),
				color: this.getColor(),
				description: this.getDescription()
			};
		}
		getName() {
			return main_core.Type.isString(this.#stage.name) ? this.#stage.name : '';
		}
		setName(name) {
			this.#stage.name = main_core.Type.isString(name) ? name : '';
		}
		isNameValid(fallbackName = '') {
			return this.getName().trim() !== '' || main_core.Type.isStringFilled(fallbackName);
		}
		normalizeName(fallbackName) {
			if (this.getName().trim() === '' && main_core.Type.isStringFilled(fallbackName)) {
				this.setName(fallbackName);
			}
		}
		getColor() {
			return crm_stage_color.normalizeStageColor(this.#stage.color, crm_stage_color.getDefaultStageColor());
		}
		setColor(color) {
			this.#stage.color = crm_stage_color.normalizeStageColor(color, this.getColor());
		}
		getDescription() {
			return main_core.Type.isString(this.#stage.description) ? this.#stage.description : '';
		}
		setDescription(description) {
			this.#stage.description = main_core.Type.isString(description) ? description : '';
		}
		static cloneStage(stage) {
			return main_core.Type.isPlainObject(stage) ? {
				...stage
			} : {};
		}
	}

	class StageEditor {
		#options;
		#model;
		#service;
		#popup;
		#tooltipSuspension = null;
		static open(options) {
			const editor = new StageEditor(options);
			editor.open();
			return editor;
		}
		constructor(options) {
			if (!main_core.Type.isElementNode(options.anchor)) {
				throw new TypeError('StageEditor anchor must be an HTMLElement');
			}
			this.#options = {
				...options,
				canEdit: options.canEdit !== false,
				deleteBlockReasons: main_core.Type.isArray(options.deleteBlockReasons) ? options.deleteBlockReasons : []
			};
			this.#model = new StageEditorModel(this.#options.stage);
			this.#service = new StageEditorService(this.#options.onSave, this.#options.onDelete);
			this.#popup = new StageEditorPopup({
				model: this.#model,
				mode: this.#options.mode,
				anchor: this.#options.anchor,
				canEdit: this.#options.canEdit === true,
				canDelete: this.#options.canDelete,
				deleteBlockReasons: this.#options.deleteBlockReasons,
				descriptionPlaceholder: crm_stage_entityText.getEntityMessage('CRM_STAGE_EDITOR_DESCRIPTION_PLACEHOLDER', this.#options.entityTextContext),
				onChange: this.#handleChange,
				onSave: this.#handleSave,
				onDelete: this.#handleDelete,
				onCancel: this.#handleCancel,
				onClose: this.#handleClose
			});
		}
		open() {
			this.#tooltipSuspension ??= crm_stage_descriptionTooltip.stageDescriptionTooltipCoordinator.suspend();
			try {
				this.#popup.open();
			} catch (error) {
				this.#releaseTooltipSuspension();
				throw error;
			}
		}
		close() {
			this.#popup.close();
		}
		#handleChange = field => {
			this.#options.onChange?.(this.#model.getSavePayload(), field);
		};
		#handleSave = async () => {
			return this.#service.save(this.#model.getSavePayload());
		};
		#handleDelete = async () => {
			await this.#service.delete(this.#model.getStage());
		};
		#handleCancel = () => {
			this.#options.onCancel(this.#model.getSnapshot());
		};
		#handleClose = () => {
			this.#releaseTooltipSuspension();
		};
		#releaseTooltipSuspension() {
			this.#tooltipSuspension?.release();
			this.#tooltipSuspension = null;
		}
	}

	exports.StageEditor = StageEditor;

})(this.BX.Crm.Stage = this.BX.Crm.Stage || {}, BX, BX.Crm.Stage, BX.Crm.Stage, BX.Main, BX.UI, BX.UI.Dialogs, BX.UI, BX.UI.IconSet, BX.UI.Notification, BX.UI.Accessibility, BX.UI.System.Typography, BX.UI.System.Input, window, BX.Crm.Stage);
//# sourceMappingURL=editor.bundle.js.map
