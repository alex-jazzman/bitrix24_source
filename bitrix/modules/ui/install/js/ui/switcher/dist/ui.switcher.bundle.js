/* eslint-disable */
this.BX = this.BX || {};
(function (exports, main_core) {
	'use strict';

	const SwitcherSize = {
		extraLarge: 'extra-large',
		large: 'large',
		medium: 'medium',
		small: 'small',
		extraSmall: 'extra-small',
		extraExtraSmall: 'extra-extra-small'
	};
	const SwitcherColor = {
		primary: 'primary',
		green: 'green'
	};
	const AirSwitcherStyle = {
		FILLED: 'FILLED',
		SOLID: 'SOLID',
		TINTED: 'TINTED',
		FILLED_SUCCESS: 'FILLED_SUCCESS',
		FILLED_ALERT: 'FILLED_ALERT',
		FILLED_WARNING: 'FILLED_WARNING',
		FILLED_BLACK: 'FILLED_BLACK',
		FILLED_WHITE: 'FILLED_WHITE',
		FILLED_NO_ACCENT: 'FILLED_NO_ACCENT',
		FILLED_BITRIX_GPT: 'FILLED_BITRIX_GPT',
		FILLED_BOOST: 'FILLED_BOOST',
		TINTED_ACCENT_1: 'TINTED_ACCENT_1',
		TINTED_SUCCESS: 'TINTED_SUCCESS',
		TINTED_ALERT: 'TINTED_ALERT',
		TINTED_WARNING: 'TINTED_WARNING',
		TINTED_GREEN: 'TINTED_GREEN',
		TINTED_VIOLET: 'TINTED_VIOLET',
		TINTED_NO_ACCENT: 'TINTED_NO_ACCENT',
		TINTED_BITRIX_GPT: 'TINTED_BITRIX_GPT',
		OUTLINE: 'OUTLINE',
		OUTLINE_ACCENT_1: 'OUTLINE_ACCENT_1',
		OUTLINE_ACCENT_2: 'OUTLINE_ACCENT_2',
		OUTLINE_ALERT: 'OUTLINE_ALERT',
		OUTLINE_BOOST: 'OUTLINE_BOOST',
		OUTLINE_NO_ACCENT: 'OUTLINE_NO_ACCENT',
		OUTLINE_SUCCESS: 'OUTLINE_SUCCESS',
		OUTLINE_WARNING: 'OUTLINE_WARNING',
		OUTLINE_BITRIX_GPT: 'OUTLINE_BITRIX_GPT',
		SELECTION: 'SELECTION'
	};

	class Switcher {
		#classNameSize = {
			[SwitcherSize.extraExtraSmall]: 'ui-switcher-size-xss',
			[SwitcherSize.extraSmall]: 'ui-switcher-size-xs',
			[SwitcherSize.small]: 'ui-switcher-size-sm',
			[SwitcherSize.medium]: 'ui-switcher-size-md',
			[SwitcherSize.large]: 'ui-switcher-size-lg',
			[SwitcherSize.extraLarge]: 'ui-switcher-size-xl'
		};
		#classNameColor = {
			[SwitcherColor.primary]: '',
			[SwitcherColor.green]: 'ui-switcher-color-green'
		};
		#classNameStyle = {
			[AirSwitcherStyle.FILLED]: '--style-filled',
			[AirSwitcherStyle.SOLID]: '--style-filled',
			[AirSwitcherStyle.TINTED]: '--style-tinted',
			[AirSwitcherStyle.FILLED_SUCCESS]: '--style-filled-success',
			[AirSwitcherStyle.FILLED_ALERT]: '--style-filled-alert',
			[AirSwitcherStyle.FILLED_WARNING]: '--style-filled-warning',
			[AirSwitcherStyle.FILLED_BLACK]: '--style-filled-black',
			[AirSwitcherStyle.FILLED_WHITE]: '--style-filled-white',
			[AirSwitcherStyle.FILLED_NO_ACCENT]: '--style-filled-na',
			[AirSwitcherStyle.FILLED_BITRIX_GPT]: '--style-filled-bitrix-gpt',
			[AirSwitcherStyle.FILLED_BOOST]: '--style-filled-boost',
			[AirSwitcherStyle.TINTED_ACCENT_1]: '--style-tinted-a1',
			[AirSwitcherStyle.TINTED_SUCCESS]: '--style-tinted-success',
			[AirSwitcherStyle.TINTED_ALERT]: '--style-tinted-alert',
			[AirSwitcherStyle.TINTED_WARNING]: '--style-tinted-warning',
			[AirSwitcherStyle.TINTED_GREEN]: '--style-tinted-green',
			[AirSwitcherStyle.TINTED_VIOLET]: '--style-tinted-violet',
			[AirSwitcherStyle.TINTED_NO_ACCENT]: '--style-tinted-na',
			[AirSwitcherStyle.TINTED_BITRIX_GPT]: '--style-tinted-bitrix-gpt',
			[AirSwitcherStyle.OUTLINE]: '--style-outline',
			[AirSwitcherStyle.OUTLINE_ACCENT_1]: '--style-outline-a1',
			[AirSwitcherStyle.OUTLINE_ACCENT_2]: '--style-outline-a2',
			[AirSwitcherStyle.OUTLINE_ALERT]: '--style-outline-alert',
			[AirSwitcherStyle.OUTLINE_BOOST]: '--style-outline-boost',
			[AirSwitcherStyle.OUTLINE_NO_ACCENT]: '--style-outline-na',
			[AirSwitcherStyle.OUTLINE_SUCCESS]: '--style-outline-success',
			[AirSwitcherStyle.OUTLINE_WARNING]: '--style-outline-warning',
			[AirSwitcherStyle.OUTLINE_BITRIX_GPT]: '--style-outline-bitrix-gpt',
			[AirSwitcherStyle.SELECTION]: '--style-selection'
		};
		#useAirDesign = false;
		node;
		checked = false;
		id = '';
		handlers = {};
		inputNode;
		#disabled = false;
		#inputName = '';
		#loading = false;
		events = {
			toggled: 'toggled',
			checked: 'checked',
			unchecked: 'unchecked',
			lock: 'lock',
			unlock: 'unlock'
		};
		#classNameOff = 'ui-switcher-off';
		#classNameLock = 'ui-switcher-lock';
		#attributeName = 'data-switcher';
		#showStateTitle = true;
		#accessible = false;
		#semanticsNode = null;
		#ariaLabel = '';
		#ariaLabelledBy = '';
		#clickHandler = null;
		#keydownHandler = null;
		static #attributeInitName = 'data-switcher-init';
		static list = [];
		static className = 'ui-switcher';
		static classNameOff = 'ui-switcher-off';
		constructor(options) {
			this.init(options);
			Switcher.list.push(this);
		}
		static getById(id) {
			return Switcher.list.find(item => item.id === id) || null;
		}
		static initByClassName() {
			const nodes = document.getElementsByClassName(Switcher.className);
			[...nodes].forEach(node => {
				if (node.getAttribute(Switcher.#attributeInitName)) {
					return;
				}
				new Switcher({
					node: node
				});
			});
		}
		static getList() {
			return Switcher.list;
		}
		init(options = {}) {
			this.#attributeName = main_core.Type.isString(options.attributeName) ? options.attributeName : this.#attributeName;
			this.handlers = main_core.Type.isPlainObject(options.handlers) ? options.handlers : {};
			this.#inputName = main_core.Type.isString(options.inputName) ? options.inputName : '';
			this.#loading = false;
			this.#showStateTitle = main_core.Type.isBoolean(options.showStateTitle) ? options.showStateTitle : true;
			this.events = {
				toggled: 'toggled',
				checked: 'checked',
				unchecked: 'unchecked',
				lock: 'lock',
				unlock: 'unlock'
			};
			let accessibleFromNode = false;
			if (options.node) {
				if (!main_core.Type.isDomNode(options.node)) {
					throw new Error('Parameter `node` DOM Node expected.');
				}
				if (this.#semanticsNode !== null && this.#semanticsNode !== options.node) {
					this.#clearAccessibility(this.#semanticsNode);
				}
				this.node = options.node;
				const attributeValue = this.node.getAttribute(this.#attributeName);
				let data = {};
				try {
					data = JSON.parse(attributeValue ?? '') || {};
				} catch {
					data = {};
				}
				if (data.id) {
					this.id = data.id;
				}
				this.checked = Boolean(data.checked);
				this.#inputName = data.inputName;
				if (main_core.Type.isString(data.color) && Object.values(SwitcherColor).includes(data.color)) {
					options.color = data.color;
				}
				if (main_core.Type.isString(data.size) && Object.values(SwitcherSize).includes(data.size)) {
					options.size = data.size;
				}
				accessibleFromNode = data.accessible === true;
				if (main_core.Type.isString(data.ariaLabel) && data.ariaLabel.trim() !== '') {
					this.#ariaLabel = data.ariaLabel.trim();
				}
				if (main_core.Type.isString(data.ariaLabelledBy) && data.ariaLabelledBy.trim() !== '') {
					this.#ariaLabelledBy = data.ariaLabelledBy.trim();
				}
				if (main_core.Dom.hasClass(this.node, '--air')) {
					options.useAirDesign = true;
				}
			} else {
				this.node = document.createElement('span');
			}
			this.#useAirDesign = options.useAirDesign === true;
			if (this.#useAirDesign) {
				this.setAirDesign();
				this.#applyLookClassName(this.#classNameStyle, options.style ?? '');
			}
			this.#applyLookClassName(this.#classNameSize, options.size ?? '');
			if (this.#useAirDesign === false) {
				this.#applyLookClassName(this.#classNameColor, options.color ?? '');
			}
			if (main_core.Type.isString(options.id) || main_core.Type.isNumber(options.id)) {
				this.id = options.id;
			} else if (!this.id) {
				this.id = Math.random();
			}
			if (main_core.Type.isString(options.inputName)) {
				this.#inputName = options.inputName;
			}
			this.checked = main_core.Type.isBoolean(options.checked) ? options.checked : this.checked;
			this.#disabled = main_core.Type.isBoolean(options.disabled) ? options.disabled : this.#disabled;
			if (main_core.Type.isString(options.ariaLabel) && options.ariaLabel.trim() !== '') {
				this.#ariaLabel = options.ariaLabel.trim();
			}
			if (main_core.Type.isString(options.ariaLabelledBy) && options.ariaLabelledBy.trim() !== '') {
				this.#ariaLabelledBy = options.ariaLabelledBy.trim();
			}
			const accessibleRequested = options.accessible === true || accessibleFromNode || this.#accessible;
			this.#accessible = this.#resolveAccessible(accessibleRequested);
			this.#initNode();
			this.#applyAccessibility();
			this.check(this.checked, false);
			this.disable(this.#disabled, false);
		}
		#applyLookClassName(dictionary, value) {
			const className = dictionary[value];
			if (!className) {
				return;
			}
			main_core.Dom.removeClass(this.node, Object.values(dictionary).filter(Boolean));
			main_core.Dom.addClass(this.node, className);
		}
		#initNode() {
			if (this.node.getAttribute(Switcher.#attributeInitName)) {
				return;
			}
			this.node.setAttribute(Switcher.#attributeInitName, 'y');
			main_core.Dom.addClass(this.node, Switcher.className);
			if (this.#useAirDesign) {
				this.setAirDesign();
			}
			const element = main_core.Tag.render`
			<div>
				<span class="ui-switcher-cursor"></span>
				<span class="ui-switcher-enabled">
					${this.#showStateTitle ? main_core.Loc.getMessage('UI_SWITCHER_ON') : ''}
				</span>
				<span class="ui-switcher-disabled">
					${this.#showStateTitle ? main_core.Loc.getMessage('UI_SWITCHER_OFF') : ''}
				</span>
			</div>
		`;
			this.node.innerHTML = element.innerHTML;
			if (this.#inputName) {
				this.inputNode = main_core.Tag.render`
				<input type="hidden" name="${this.#inputName}" />
			`;
				main_core.Dom.append(this.inputNode, this.node);
			}
			this.#clickHandler = this.toggle.bind(this);
			main_core.bind(this.node, 'click', this.#clickHandler);
		}
		destroy() {
			const index = Switcher.list.indexOf(this);
			if (index !== -1) {
				Switcher.list.splice(index, 1);
			}
			if (this.#clickHandler) {
				main_core.unbind(this.node, 'click', this.#clickHandler);
				this.#clickHandler = null;
			}
			if (this.#keydownHandler) {
				main_core.unbind(this.node, 'keydown', this.#keydownHandler);
				this.#keydownHandler = null;
			}
			this.#clearAccessibility(this.node);
			this.#loading = false;
			this.#accessible = false;
			this.node?.removeAttribute(Switcher.#attributeInitName);
			this.handlers = {};
		}
		disable(disabled, fireEvents = true, event = {}) {
			if (this.isLoading()) {
				return;
			}
			this.#disabled = disabled;
			if (this.#accessible) {
				main_core.Dom.attr(this.node, 'aria-disabled', String(disabled));
			}
			fireEvents = fireEvents !== false;
			if (disabled) {
				main_core.Dom.addClass(this.node, this.#classNameLock);
				fireEvents ? this.#fireEvent(this.events.lock, event) : null;
			} else {
				main_core.Dom.removeClass(this.node, this.#classNameLock);
				fireEvents ? this.#fireEvent(this.events.unlock, event) : null;
			}
		}
		check(checked, fireEvents = true, event = {}) {
			if (this.isLoading()) {
				return;
			}
			this.checked = !!checked;
			if (this.inputNode) {
				this.inputNode.value = this.checked ? 'Y' : 'N';
			}
			if (this.#accessible) {
				main_core.Dom.attr(this.node, 'aria-checked', String(this.checked));
			}
			fireEvents = fireEvents !== false;
			if (this.checked) {
				main_core.Dom.removeClass(this.node, this.#classNameOff);
				fireEvents ? this.#fireEvent(this.events.unchecked, event) : null;
			} else {
				main_core.Dom.addClass(this.node, this.#classNameOff);
				fireEvents ? this.#fireEvent(this.events.checked, event) : null;
			}
			if (fireEvents) {
				this.#fireEvent(this.events.toggled, event);
			}
		}
		isDisabled() {
			return this.#disabled;
		}
		isChecked() {
			return this.checked;
		}
		toggle(event) {
			if (this.isDisabled()) {
				return;
			}
			this.check(!this.isChecked(), true, event);
		}
		setLoading(mode) {
			this.#loading = Boolean(mode);
			if (this.#accessible) {
				main_core.Dom.attr(this.node, 'aria-busy', String(this.#loading));
			}
			const cursor = this.getNode().querySelector('.ui-switcher-cursor');
			if (this.#loading) {
				const svg = main_core.Tag.render`
				<svg viewBox="25 25 50 50">
					<circle
						class="ui-sidepanel-wrapper-loader-path"
						cx="50"
						cy="50"
						r="19"
						fill="none"
						stroke-width="5"
						stroke-miterlimit="10"
					>
					</circle>
				</svg>
			`;
				main_core.Dom.append(svg, cursor);
			} else {
				cursor.innerHTML = '';
			}
		}
		isLoading() {
			return this.#loading;
		}
		setAirDesign(flag = true) {
			if (flag) {
				main_core.Dom.addClass(this.node, '--air');
			} else {
				main_core.Dom.removeClass(this.node, '--air');
			}
		}
		#applyAccessibility() {
			if (!this.#accessible) {
				return;
			}
			this.#applyAccessibleName();
			main_core.Dom.attr(this.node, 'aria-busy', String(this.#loading));
			if (this.#semanticsNode === this.node) {
				return;
			}
			this.#semanticsNode = this.node;
			main_core.Dom.attr(this.node, 'role', 'switch');
			main_core.Dom.attr(this.node, 'tabindex', '0');
			main_core.Dom.attr(this.node, 'aria-checked', String(this.checked));
			[...this.node.children].forEach(child => {
				main_core.Dom.attr(child, 'aria-hidden', 'true');
			});
			if (this.#keydownHandler === null) {
				this.#keydownHandler = this.#handleKeydown.bind(this);
				main_core.bind(this.node, 'keydown', this.#keydownHandler);
			}
		}
		#clearAccessibility(node) {
			if (!node || this.#semanticsNode !== node) {
				return;
			}
			if (this.#keydownHandler) {
				main_core.unbind(node, 'keydown', this.#keydownHandler);
				this.#keydownHandler = null;
			}
			['role', 'tabindex', 'aria-checked', 'aria-disabled', 'aria-busy', 'aria-label', 'aria-labelledby'].forEach(name => {
				main_core.Dom.attr(node, name, null);
			});
			[...node.children].forEach(child => {
				main_core.Dom.attr(child, 'aria-hidden', null);
			});
			this.#semanticsNode = null;
		}
		#applyAccessibleName() {
			main_core.Dom.attr(this.node, 'aria-labelledby', this.#ariaLabelledBy === '' ? null : this.#ariaLabelledBy);
			main_core.Dom.attr(this.node, 'aria-label', this.#ariaLabel === '' ? null : this.#ariaLabel);
		}
		#handleKeydown(event) {
			if (event.key !== ' ' && event.key !== 'Spacebar' && event.key !== 'Enter') {
				return;
			}
			if (this.isDisabled() || this.isLoading()) {
				return;
			}
			event.preventDefault();
			this.toggle(event);
		}
		#canDropName(other) {
			if (!this.#accessible || other.trim() !== '') {
				return true;
			}
			console.warn('ui.switcher: `ariaLabel` or `ariaLabelledBy` is required while accessible, name kept');
			return false;
		}
		#resolveAccessible(requested) {
			if (!requested) {
				return false;
			}
			if (this.#ariaLabel.trim() === '' && this.#ariaLabelledBy.trim() === '') {
				console.warn('ui.switcher: `accessible` needs `ariaLabel` or `ariaLabelledBy`, semantics not applied');
				return false;
			}
			return true;
		}
		#fireEvent(eventName, event) {
			main_core.onCustomEvent(this, eventName);
			if (this.handlers[eventName]) {
				this.handlers[eventName].call(this, event);
			}
		}
		renderTo(targetNode) {
			if (!main_core.Type.isDomNode(targetNode)) {
				throw new Error('Target node must be HTMLElement');
			}
			main_core.Dom.append(this.getNode(), targetNode);
		}
		getNode() {
			return this.node;
		}
		getAttributeName() {
			return this.#attributeName;
		}
		getInputName() {
			return this.#inputName;
		}
		setAriaLabel(value) {
			const next = main_core.Type.isString(value) ? value.trim() : '';
			if (next === '' && !this.#canDropName(this.#ariaLabelledBy)) {
				return;
			}
			this.#ariaLabel = next;
			this.#applyAccessibility();
		}
		getAriaLabel() {
			return this.#ariaLabel;
		}
		setAriaLabelledBy(value) {
			const next = main_core.Type.isString(value) ? value.trim() : '';
			if (next === '' && !this.#canDropName(this.#ariaLabel)) {
				return;
			}
			this.#ariaLabelledBy = next;
			this.#applyAccessibility();
		}
		getAriaLabelledBy() {
			return this.#ariaLabelledBy;
		}
	}

	exports.AirSwitcherStyle = AirSwitcherStyle;
	exports.Switcher = Switcher;
	exports.SwitcherColor = SwitcherColor;
	exports.SwitcherSize = SwitcherSize;

})(this.BX.UI = this.BX.UI || {}, BX);
//# sourceMappingURL=ui.switcher.bundle.js.map
