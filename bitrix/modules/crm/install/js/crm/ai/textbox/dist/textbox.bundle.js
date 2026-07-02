/* eslint-disable */
this.BX = this.BX || {};
this.BX.Crm = this.BX.Crm || {};
(function (exports, main_core, ui_iconSet_api_core) {
	'use strict';

	const AttentionPresets = {
		DEFAULT: {
			className: '--crm-textbox-attention-default',
			iconOptions: {
				icon: ui_iconSet_api_core.Set.INFO_1,
				color: '#BDC1C6',
				size: 16
			}
		},
		COPILOT: {
			className: '--crm-textbox-attention-copilot',
			iconOptions: {
				icon: ui_iconSet_api_core.Set.EARTH,
				color: '#B6AAC8',
				size: 16
			}
		}
	};
	class Attention {
		constructor(options) {
			this.setContent(options.content);
			this.setPreset(options.preset ?? AttentionPresets.DEFAULT);
		}
		setContent(content) {
			if (main_core.Type.isElementNode(content)) {
				this.content = content;
				return;
			}
			this.content = main_core.Tag.render`<span>${content}</span>`;
		}
		setPreset(preset) {
			this.preset = preset;
		}
		render() {
			this.getContainer().innerHTML = '';
			main_core.Dom.append(this.#getIconNode(), this.getContainer());
			main_core.Dom.append(this.#getContentNode(), this.getContainer());
			return this.getContainer();
		}
		getContainer() {
			if (!this.container) {
				this.container = main_core.Tag.render`<div class="crm-textbox-attention ${this.preset.className}"></div>`;
			}
			return this.container;
		}
		#getIconNode() {
			const iconNode = main_core.Tag.render`<span class="crm-textbox-attention__icon"></span>`;
			const icon = new ui_iconSet_api_core.Icon(this.preset.iconOptions);
			main_core.Dom.append(icon.render(), iconNode);
			return iconNode;
		}
		#getContentNode() {
			const contentNode = main_core.Tag.render`<span class="crm-textbox-attention__content"></span>`;
			main_core.Dom.append(this.content, contentNode);
			return contentNode;
		}
	}

	const ID_TEXT_CONTAINER = 'crm-copilot-text-container';
	const CLASS_SEARCH_ICON = 'ui-ctl-icon-search';
	const CLASS_CLEAR_ICON = 'ui-ctl-icon-clear';
	const ROOT_CONTAINER_BOTTOM_PADDING = '28px';
	class Textbox {
		#id;
		#text;
		#title;
		#enableSearch;
		#enableCollapse;
		#isCollapsed;
		#previousTextContent = null;
		#attentions = null;
		#className = {
			searchIcon: '--search-1',
			clearIcon: '--cross-30',
			arrowTopIcon: '--chevron-up',
			arrowDownIcon: '--chevron-down',
			bodyExpanded: '--body-expanded',
			nodeHidden: '--hidden'
		};
		constructor(options = {}) {
			this.setText(options.text);
			this.#id = `crm-copilot-textbox-container-${main_core.Text.getRandom(8)}`;
			this.#title = main_core.Type.isString(options.title) ? options.title : '';
			this.#enableSearch = main_core.Type.isBoolean(options.enableSearch) ? options.enableSearch : true;
			this.#enableCollapse = main_core.Type.isBoolean(options.enableCollapse) ? options.enableCollapse : false;
			this.#isCollapsed = main_core.Type.isBoolean(options.isCollapsed) ? options.isCollapsed : false;
			this.#previousTextContent = main_core.Type.isElementNode(options.previousTextContent) ? options.previousTextContent : null;
			this.#attentions = options.attentions ?? [];
		}
		setText(text) {
			this.#text = main_core.Type.isString(text) ? this.#prepareText(text) : '';
		}
		render() {
			this.rootContainer = main_core.Tag.render`
			<div 
				id="${this.#id}" 
				class="crm-copilot-textbox"
			></div>
		`;
			if (this.#isCollapsed) {
				main_core.Dom.style(this.rootContainer, 'padding-bottom', 0);
			} else {
				main_core.Dom.style(this.rootContainer, 'padding-bottom', ROOT_CONTAINER_BOTTOM_PADDING);
			}
			const sectionWrapper = main_core.Tag.render`<div class="crm-copilot-textbox__wrapper ${this.#isCollapsed ? '' : this.#className.bodyExpanded} ${this.#enableCollapse ? 'clickable' : ''}"></div>`;
			main_core.Dom.append(this.#getHeaderContainer(), sectionWrapper);
			main_core.Dom.append(this.#getBodyContainer(), sectionWrapper);
			main_core.Dom.append(sectionWrapper, this.rootContainer);
		}
		get() {
			return this.rootContainer;
		}
		#prepareText(text) {
			return text.replaceAll(/\r?\n/g, '<br>');
		}
		#getHeaderContainer() {
			const collapseIconElement = this.#enableCollapse ? main_core.Tag.render`<div class="crm-copilot-textbox__collapse-icon clickable ui-icon-set ${this.#isCollapsed ? this.#className.arrowDownIcon : this.#className.arrowTopIcon}"></div>` : '';
			main_core.Event.bind(collapseIconElement, 'click', () => this.#handleCollapse());
			return main_core.Tag.render`
			<div class="crm-copilot-textbox__header">
				<div class="crm-copilot-textbox__title">${main_core.Text.encode(this.#title)}</div>
				<div class="crm-copilot-textbox__title-icon-container">
					${this.#getSearchContainer()}
					${collapseIconElement}
				</div>
			</div>
		`;
		}
		#getBodyContainer() {
			const bodyContainer = main_core.Tag.render`<div class="crm-copilot-textbox__body-container"></div>`;
			main_core.Dom.append(main_core.Tag.render`<div class="crm-copilot-textbox__previous-text">${this.#previousTextContent}</div>`, bodyContainer);
			main_core.Dom.append(this.#getContentContainer(), bodyContainer);
			main_core.Dom.append(this.#getAttentionsContainer(), bodyContainer);
			return main_core.Tag.render`<div class="crm-copilot-textbox__body">${bodyContainer}</div>`;
		}
		#getContentContainer() {
			const contentContainer = main_core.Tag.render`<div class="crm-copilot-textbox__content"></div>`;
			const textContainer = this.#getTextContainer();
			main_core.Event.bind(textContainer, 'beforeinput', e => {
				e.preventDefault();
			});
			main_core.Dom.append(textContainer, contentContainer);
			return contentContainer;
		}
		#getTextContainer() {
			if (this.textContainer) {
				return this.textContainer;
			}
			this.textContainer = main_core.Tag.render`
			<div 
				id="${ID_TEXT_CONTAINER}" 
				class="crm-copilot-textbox__text-container" 
				contenteditable="true" 
				spellcheck="false"
			>
				${this.#text}
			</div>
		`;
			return this.textContainer;
		}
		#getSearchContainer() {
			if (!this.#enableSearch) {
				return main_core.Tag.render``;
			}
			const searchNode = main_core.Tag.render`<div class="ui-ctl ui-ctl-after-icon ui-ctl-no-border crm-copilot-textbox__search ${this.#isCollapsed ? '--hidden' : ''}"></div>`;
			const searchBtn = main_core.Tag.render`<a class="ui-ctl-after ${CLASS_SEARCH_ICON} crm-copilot-textbox__search-btn"></a>`;
			const searchInput = main_core.Tag.render`
			<input 
				type="text" 
				placeholder="${main_core.Text.encode(main_core.Loc.getMessage('CRM_COPILOT_TEXTBOX_SEARCH_PLACEHOLDER'))}" 
				class="ui-ctl-element ui-ctl-textbox crm-copilot-textbox__search-input"
			>
		`;
			searchInput.oninput = () => {
				this.#resetTextContainer();
				const value = searchInput.value;
				if (!value) {
					this.#switchStyle(searchBtn, CLASS_CLEAR_ICON, CLASS_SEARCH_ICON);
					return;
				}
				this.#switchStyle(searchBtn, CLASS_SEARCH_ICON, CLASS_CLEAR_ICON);

				// Highlights pieces of text that are not part of a tag
				const regexp = new RegExp(`((?<!<[^>]*?)(${value})(?![^<]*?>))`, 'gi');
				const textContainer = this.#getTextContainer();
				textContainer.innerHTML = textContainer.innerHTML.replace(regexp, '<span class="search-item">$&</span>');
			};
			let searchInputFocused = false;
			searchInput.onblur = () => {
				if (searchInput.value.length === 0) {
					main_core.Dom.removeClass(searchNode, 'with-input-node');
					main_core.Dom.remove(searchInput);
					searchInputFocused = false;
				}
			};
			searchBtn.onclick = () => {
				if (searchNode.contains(searchInput)) {
					if (searchInput.value.length > 0) {
						searchInput.value = '';
						this.#switchStyle(searchBtn, CLASS_CLEAR_ICON, CLASS_SEARCH_ICON);
						this.#resetTextContainer();
					}
					searchInputFocused = true;
					searchInput.focus();
					return;
				}
				main_core.Dom.append(searchInput, searchNode);
				main_core.Dom.addClass(searchNode, ['with-input-node']);
				searchInputFocused = true;
				searchInput.focus();
			};
			searchBtn.onmousedown = event => {
				if (searchInputFocused) {
					event.preventDefault();
				}
			};
			main_core.Dom.append(searchBtn, searchNode);
			return searchNode;
		}
		#getAttentionsContainer() {
			if (!main_core.Type.isArrayFilled(this.#attentions)) {
				return main_core.Tag.render``;
			}
			const attentionsContainer = main_core.Tag.render`<div class="crm-copilot-textbox__attentions"></div>`;
			this.#attentions.forEach(attention => main_core.Dom.append(attention.render(), attentionsContainer));
			return attentionsContainer;
		}
		#resetTextContainer() {
			this.#getTextContainer().innerHTML = this.#text;
		}
		#switchStyle(node, fromStyle, toStyle) {
			if (main_core.Dom.hasClass(node, fromStyle) && !main_core.Dom.hasClass(node, toStyle)) {
				main_core.Dom.addClass(node, toStyle);
				main_core.Dom.removeClass(node, fromStyle);
			}
		}
		#handleCollapse() {
			this.#isCollapsed = !this.#isCollapsed;
			const rootNode = this.get();
			const wrapperNode = rootNode.querySelector('.crm-copilot-textbox__wrapper');
			const iconNode = rootNode.querySelector('.crm-copilot-textbox__collapse-icon');
			const bodyNode = rootNode.querySelector('.crm-copilot-textbox__body');
			const searchNode = rootNode.querySelector('.crm-copilot-textbox__search');

			// some animation
			main_core.Dom.removeClass(bodyNode, 'body-toggle-animation');
			main_core.Dom.addClass(bodyNode, 'body-toggle-animation');
			if (this.#isCollapsed) {
				main_core.Dom.style(rootNode, 'padding-bottom', 0);
				main_core.Dom.removeClass(wrapperNode, this.#className.bodyExpanded);
				main_core.Dom.addClass(searchNode, this.#className.nodeHidden);
				this.#switchStyle(iconNode, this.#className.arrowTopIcon, this.#className.arrowDownIcon);
			} else {
				main_core.Dom.style(rootNode, 'padding-bottom', ROOT_CONTAINER_BOTTOM_PADDING);
				main_core.Dom.addClass(wrapperNode, this.#className.bodyExpanded);
				main_core.Dom.removeClass(searchNode, this.#className.nodeHidden);
				this.#switchStyle(iconNode, this.#className.arrowDownIcon, this.#className.arrowTopIcon);
			}
		}
	}

	exports.Attention = Attention;
	exports.AttentionPresets = AttentionPresets;
	exports.Textbox = Textbox;

})(this.BX.Crm.AI = this.BX.Crm.AI || {}, BX, BX.UI.IconSet);
//# sourceMappingURL=textbox.bundle.js.map
