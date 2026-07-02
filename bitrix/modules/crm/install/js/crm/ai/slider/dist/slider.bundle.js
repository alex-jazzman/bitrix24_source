/* eslint-disable */
this.BX = this.BX || {};
this.BX.Crm = this.BX.Crm || {};
(function (exports, crm_ai_nameService, crm_integration_ui_settings, main_core, ui_buttons, ui_sidepanel, ui_sidepanel_layout) {
	'use strict';

	class Slider {
		DEFAULT_OPTIONS = {
			title: crm_ai_nameService.NameService.copilotName(),
			allowChangeTitle: false,
			allowChangeHistory: false,
			cacheable: false,
			toolbar: this.getDefaultToolbarButtons,
			buttons: [],
			width: 795,
			extensions: [],
			events: {},
			label: {},
			design: {},
			sliderContentClass: null
		};
		isOpen = false;
		#openedLayout = null;
		get openedLayout() {
			return this.#openedLayout;
		}
		constructor(options) {
			this.initOptions(options);
		}
		initOptions(options) {
			this.title = main_core.Type.isString(options.title) ? options.title : this.DEFAULT_OPTIONS.title;
			this.sliderTitle = main_core.Type.isString(options.sliderTitle) ? options.sliderTitle : this.DEFAULT_OPTIONS.title;
			this.sliderContentClass = main_core.Type.isStringFilled(options.sliderContentClass) ? options.sliderContentClass : this.DEFAULT_OPTIONS.sliderContentClass;
			this.toolbar = main_core.Type.isFunction(options.toolbar) ? options.toolbar : this.DEFAULT_OPTIONS.toolbar;
			this.buttons = main_core.Type.isFunction(options.buttons) ? options.buttons : this.DEFAULT_OPTIONS.buttons;
			this.cacheable = main_core.Type.isBoolean(options.cacheable) ? options.cacheable : this.DEFAULT_OPTIONS.cacheable;
			this.width = main_core.Type.isInteger(options.width) ? options.width : this.DEFAULT_OPTIONS.width;
			this.label = main_core.Type.isPlainObject(options.label) ? options.label : this.DEFAULT_OPTIONS.label;
			this.extensions = main_core.Type.isArray(options.extensions) ? options.extensions : this.DEFAULT_OPTIONS.extensions;
			this.events = main_core.Type.isPlainObject(options.events) ? options.events : this.DEFAULT_OPTIONS.events;
			this.design = main_core.Type.isPlainObject(options.design) ? options.design : this.DEFAULT_OPTIONS.design;

			// Need to buttons to always be transparent-white when enable DependOnTheme in Button
			this.enableLightThemeIntoSlider = main_core.Type.isBoolean(options.enableLightThemeIntoSlider) ? options.enableLightThemeIntoSlider : true;
			this.allowChangeTitle = main_core.Type.isBoolean(options.allowChangeTitle) ? options.allowChangeTitle : this.DEFAULT_OPTIONS.allowChangeTitle;
			this.allowChangeHistory = main_core.Type.isBoolean(options.allowChangeHistory) ? options.allowChangeHistory : this.DEFAULT_OPTIONS.allowChangeHistory;
			this.setContent(options.content);
			this.url = main_core.Type.isString(options.url) ? options.url : this.getDefaultUrl();
		}
		setContent(content) {
			if (!main_core.Type.isFunction(content)) {
				this.content = () => {
					return content;
				};
				return;
			}
			this.content = content;
		}
		async open() {
			this.#openedLayout = await this.makeLayout();
			this.isOpen = ui_sidepanel.SidePanel.Instance.open(this.url, await this.getSliderOptions(this.#openedLayout));
			return this.isOpen;
		}
		close() {
			if (!this.isOpen) {
				return;
			}
			this.#openedLayout = null;
			ui_sidepanel.SidePanel.Instance.close();
		}
		destroy() {
			ui_sidepanel.SidePanel.Instance.destroy(this.url);
		}
		getInstance() {
			return ui_sidepanel.SidePanel.Instance;
		}
		getDefaultUrl() {
			return 'crm.copilot-wrapper';
		}
		async makeLayout() {
			return ui_sidepanel_layout.Layout.createLayout({
				title: this.sliderTitle,
				toolbar: this.toolbar,
				content: this.content,
				buttons: this.buttons,
				design: {
					section: false,
					...this.design
				},
				extensions: ['crm.ai.slider', ...this.extensions]
			});
		}
		async getSliderOptions(layout) {
			return {
				contentClassName: this.getSliderContentClassName(),
				title: this.title,
				allowChangeTitle: this.allowChangeTitle,
				width: this.width,
				cacheable: this.cacheable,
				allowChangeHistory: this.allowChangeHistory,
				label: this.label,
				contentCallback: slider => {
					return layout.render();
				},
				events: this.events
			};
		}
		getSliderContentClassName() {
			const classNames = ['crm-copilot-wrapper', '--ui-context-edge-dark'];
			if (this.enableLightThemeIntoSlider) {
				classNames.push('bitrix24-light-theme');
			}
			if (this.sliderContentClass) {
				classNames.push(this.sliderContentClass);
			}
			return classNames.join(' ');
		}
		getDefaultToolbarButtons() {
			return Slider.makeDefaultToolbarButtons();
		}
		static makeDefaultToolbarButtons() {
			const helpdeskCode = '18799442';
			const helpButton = new ui_buttons.Button({
				text: main_core.Loc.getMessage('CRM_COPILOT_WRAPPER_HELP_BUTTON_TITLE'),
				size: crm_integration_ui_settings.Settings.get(crm_integration_ui_settings.Setting.UseAirDesign) ? ui_buttons.Button.Size.SMALL : ui_buttons.Button.Size.MEDIUM,
				color: ui_buttons.Button.Color.LIGHT_BORDER,
				dependOnTheme: true,
				useAirDesign: crm_integration_ui_settings.Settings.get(crm_integration_ui_settings.Setting.UseAirDesign),
				style: ui_buttons.Button.AirStyle.OUTLINE,
				onclick: () => {
					if (top.BX.Helper) {
						top.BX.Helper.show(`redirect=detail&code=${helpdeskCode}`);
					}
				}
			});
			return [helpButton];
		}
		footerDisplay(show) {
			if (!this.#openedLayout) {
				return;
			}
			if (this.#openedLayout.getFooterContainer()) {
				main_core.Dom.style(this.#openedLayout.getFooterContainer(), 'display', show ? 'block' : 'none');
			}
			const footerAnchor = this.#openedLayout.getContainer()?.getElementsByClassName('ui-sidepanel-layout-footer-anchor')[0];
			if (footerAnchor) {
				main_core.Dom.style(footerAnchor, 'display', show ? 'block' : 'none');
			}
		}
	}

	exports.Slider = Slider;

})(this.BX.Crm.AI = this.BX.Crm.AI || {}, BX.Crm.AI, BX.Crm.Integration.UI, BX, BX.UI, BX, BX.UI.SidePanel);
//# sourceMappingURL=slider.bundle.js.map
