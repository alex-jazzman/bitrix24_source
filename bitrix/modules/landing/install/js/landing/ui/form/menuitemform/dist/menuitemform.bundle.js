/* eslint-disable */
this.BX = this.BX || {};
this.BX.Landing = this.BX.Landing || {};
this.BX.Landing.UI = this.BX.Landing.UI || {};
(function (exports, main_core, landing_loc, landing_ui_form_baseform) {
	'use strict';

	const depthKey = Symbol('depth');
	const onHeaderClick = Symbol('onHeaderClick');
	const onTextChange = Symbol('onTextChange');
	const NBSP = '\u00A0';
	const NBSP_ENTITY_PATTERN = /&(?:amp;)*(?:nbsp|#160|#x0*a0);/gi;

	/**
	 * @memberOf BX.Landing.UI.Form
	 */
	class MenuItemForm extends landing_ui_form_baseform.BaseForm {
		constructor(options = {}) {
			super(options);
			this.setEventNamespace('BX.Landing.UI.Form.MenuItemForm');
			this.cache = new main_core.Cache.MemoryCache();
			this[onHeaderClick] = this[onHeaderClick].bind(this);
			this[onTextChange] = this[onTextChange].bind(this);
			this.onRemoveButtonClick = this.onRemoveButtonClick.bind(this);
			main_core.Dom.addClass(this.layout, 'landing-ui-form-menuitem');
			main_core.Dom.append(this.getHeaderLeftLayout(), this.header);
			main_core.Dom.append(this.getHeaderRightLayout(), this.header);
			this.setDepth(options.depth);
			const [firstField] = this.fields;
			if (firstField) {
				const {
					text
				} = firstField.getValue();
				this.setTitle(text);
				main_core.Event.bind(firstField.input.input, 'input', this[onTextChange]);
			}
			main_core.Event.bind(this.getHeader(), 'click', this[onHeaderClick]);
		}
		[onHeaderClick](event) {
			event.preventDefault();
			if (this.isFormShown()) {
				this.hideForm();
			} else {
				this.showForm();
			}
		}
		[onTextChange]() {
			const [firstField] = this.fields;
			if (firstField) {
				const {
					text
				} = firstField.getValue();
				this.setTitle(text);
			}
		}
		onRemoveButtonClick() {
			this.emit('remove', {
				form: this
			});
			main_core.Dom.remove(this.layout);
		}
		showForm() {
			main_core.Dom.addClass(this.layout, 'landing-ui-form-menuitem-open');
			main_core.Dom.style(this.body, 'display', 'block');
		}
		hideForm() {
			main_core.Dom.removeClass(this.layout, 'landing-ui-form-menuitem-open');
			main_core.Dom.style(this.body, 'display', null);
		}
		isFormShown() {
			return main_core.Dom.hasClass(this.layout, 'landing-ui-form-menuitem-open');
		}
		getDragButton() {
			return this.cache.remember('dragButton', () => {
				return main_core.Tag.render`
				<div
					class="landing-ui-form-header-drag-button landing-ui-drag"
					role="button"
					tabindex="0"
					aria-label="${landing_loc.Loc.getMessage('LANDING_MENUITEM_DRAG_HANDLE_LABEL')}"
					aria-keyshortcuts="Alt+ArrowUp Alt+ArrowDown"
				></div>
			`;
			});
		}
		getTitleLayout() {
			return this.cache.remember('titleLayout', () => {
				return main_core.Tag.render`
				<div class="landing-ui-form-header-title">${main_core.Text.encode(this.title)}</div>
			`;
			});
		}
		getHeaderLeftLayout() {
			return this.cache.remember('headerLeftLayout', () => {
				return main_core.Tag.render`
				<div class="landing-ui-form-header-left">
					${this.getDragButton()}
					${this.getTitleLayout()}
				</div>
			`;
			});
		}
		getRemoveButton() {
			return this.cache.remember('removeButton', () => {
				const button = main_core.Tag.render`<div class="landing-ui-form-header-remove-button"></div>`;
				main_core.Event.bind(button, 'click', this.onRemoveButtonClick);
				return button;
			});
		}
		getHeaderRightLayout() {
			return this.cache.remember('headerRightLayout', () => {
				return main_core.Tag.render`
				<div class="landing-ui-form-header-right">
					${this.getRemoveButton()}
				</div>
			`;
			});
		}
		setTitle(title) {
			if (main_core.Type.isString(title) || main_core.Type.isNumber(title)) {
				this.title = main_core.Text.decode(String(title)).replaceAll(NBSP_ENTITY_PATTERN, NBSP);
				this.getTitleLayout().innerText = this.title;
			}
		}
		setDepth(depth) {
			const offset = 20;
			this[depthKey] = main_core.Text.toNumber(depth);
			main_core.Dom.style(this.layout, 'margin-left', `${depth * offset}px`);
			main_core.Dom.attr(this.layout, 'data-depth', depth);
		}
		getDepth() {
			return main_core.Text.toNumber(main_core.Dom.attr(this.layout, 'data-depth'));
		}
		serialize() {
			const [firstField] = this.fields;
			return firstField.getValue();
		}
	}

	exports.MenuItemForm = MenuItemForm;

})(this.BX.Landing.UI.Form = this.BX.Landing.UI.Form || {}, BX, BX.Landing, BX.Landing.UI.Form);
//# sourceMappingURL=menuitemform.bundle.js.map
