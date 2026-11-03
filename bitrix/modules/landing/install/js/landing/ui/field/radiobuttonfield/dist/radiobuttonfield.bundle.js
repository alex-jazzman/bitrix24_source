/* eslint-disable */
this.BX = this.BX || {};
this.BX.Landing = this.BX.Landing || {};
this.BX.Landing.UI = this.BX.Landing.UI || {};
(function (exports, ui_designTokens, ui_fonts_opensans, main_core, landing_ui_field_basefield, ui_buttons, landing_ui_component_internal, landing_loc) {
	'use strict';

	/**
	 * @memberOf BX.Landing.UI.Field
	 */
	class RadioButtonField extends landing_ui_field_basefield.BaseField {
		constructor(options) {
			super(options);
			this.setEventNamespace('BX.Landing.UI.Field.RadioButtonField');
			this.subscribeFromOptions(landing_ui_component_internal.fetchEventsFromOptions(options));
			main_core.Dom.addClass(this.layout, 'landing-ui-field-radio-button');
			main_core.Dom.replace(this.input, this.getLayout());
			if (main_core.Type.isBoolean(this.options.selectable)) {
				this.setSelectable(this.options.selectable);
			} else {
				this.setSelectable(true);
			}
			this.options.items.forEach(item => {
				this.appendItem(item);
			});
			if (this.options.value) {
				this.setValue(this.options.value, true);
			} else {
				this.setValue(this.options.items[0].id, true);
			}
		}
		getLayout() {
			return this.cache.remember('remember', () => {
				return main_core.Tag.render`
				<div class="landing-ui-field-radio-button-layout" data-selector="${this.selector}" data-testid="landing-radiobuttonfield-root"></div>
			`;
			});
		}
		appendItem(options) {
			const element = main_core.Tag.render`
			<div 
				class="landing-ui-field-radio-button-item${options.disabled ? ' landing-ui-disabled' : ''}"
				data-value="${options.id}"
				data-testid="landing-radiobuttonfield-item-${options.id}"
				aria-disabled="${options.disabled === true ? 'true' : 'false'}"
				onclick="${this.onItemClick.bind(this, options)}"
			>
				<div class="landing-ui-field-radio-button-item-icon ${options.icon}"></div>
				<div class="landing-ui-field-radio-button-item-text">
					<span>${options.title}</span>
				</div>
				${options.soon ? this.createSoonLabel() : ''}
			</div>
		`;
			if (main_core.Type.isPlainObject(options.button)) {
				const button = new ui_buttons.Button({
					color: ui_buttons.Button.Color.PRIMARY,
					size: ui_buttons.Button.Size.EXTRA_SMALL,
					text: options.button.text,
					round: true,
					events: {
						click: options.button.onClick
					}
				});
				button.renderTo(element);
			}
			main_core.Dom.append(element, this.getLayout());
		}
		onItemClick(item, event) {
			event.preventDefault();
			if (item.disabled) {
				return;
			}
			if (this.options.selectable !== false) {
				[...this.getLayout().children].forEach(element => {
					main_core.Dom.removeClass(element, 'landing-ui-field-radio-button-item-active');
				});
				main_core.Dom.addClass(event.currentTarget, 'landing-ui-field-radio-button-item-active');
			}
			this.emit('onChange', {
				item
			});
		}
		getValue() {
			const activeElement = [...this.getLayout().children].find(item => {
				return main_core.Dom.hasClass(item, 'landing-ui-field-radio-button-item-active');
			});
			if (activeElement) {
				return main_core.Dom.attr(activeElement, 'data-value');
			}
			return '';
		}
		setValue(value, preventEvent) {
			const items = [...this.getLayout().children];
			items.forEach(element => {
				main_core.Dom.removeClass(element, 'landing-ui-field-radio-button-item-active');
			});
			const item = items.find(currentItem => {
				return String(main_core.Dom.attr(currentItem, 'data-value')) === String(value);
			});
			if (item) {
				if (this.options.selectable !== false) {
					main_core.Dom.addClass(item, 'landing-ui-field-radio-button-item-active');
				}
				if (!preventEvent) {
					this.emit('onChange', {
						item
					});
				}
			}
		}
		getSelectable() {
			return main_core.Text.toBoolean(this.cache.get('selectable'));
		}
		setSelectable(value) {
			this.cache.set('selectable', main_core.Text.toBoolean(value));
		}
		isSelectable() {
			return main_core.Text.toBoolean(this.cache.get('selectable'));
		}
		createSoonLabel() {
			return main_core.Tag.render`
			<div class="landing-ui-field-radio-button-item-soon-label">
				${landing_loc.Loc.getMessage('LANDING_UI_BASE_PRESET_PANEL_SOON_LABEL')}
			</div>
		`;
		}
	}

	exports.RadioButtonField = RadioButtonField;

})(this.BX.Landing.UI.Field = this.BX.Landing.UI.Field || {}, window, BX, BX, BX.Landing.UI.Field, BX.UI, BX.Landing.UI.Component, BX.Landing);
//# sourceMappingURL=radiobuttonfield.bundle.js.map
