/* eslint-disable */
this.BX = this.BX || {};
this.BX.IM = this.BX.IM || {};
(function (exports, main_core, main_core_events, main_popup, ui_buttons) {
	'use strict';

	class MessageTemplateSelector extends main_core_events.EventEmitter {
		#rows = [];
		constructor(options) {
			super();
			this.setEventNamespace('BX.IM.Robot.MessageTemplateSelector');
		}
		show(bindElement, selected) {
			const popup = new main_popup.Popup({
				bindElement: bindElement,
				width: 431,
				padding: 20,
				content: this.#createControlNode(selected),
				closeByEsc: true,
				events: {
					onClose: () => {
						this.#rows = [];
					}
				},
				buttons: [new ui_buttons.Button({
					text: main_core.Loc.getMessage('BX_IM_ROBOT_MESSAGE_TEMPLATE_SELECTOR_BUTTON_OK'),
					color: ui_buttons.Button.Color.PRIMARY,
					events: {
						click: () => {
							const form = popup.getContentContainer().querySelector('form');
							const value = new FormData(form).get('select-type-message');
							this.emit('select', {
								selected: value
							});
							popup.close();
						}
					}
				}), new ui_buttons.Button({
					text: main_core.Loc.getMessage('BX_IM_ROBOT_MESSAGE_TEMPLATE_SELECTOR_BUTTON_CANCEL'),
					color: ui_buttons.Button.Color.LINK,
					events: {
						click: () => {
							popup.close();
						}
					}
				})],
				autoHide: true,
				closeIcon: false,
				titleBar: false,
				angle: true
			});
			popup.setCacheable(false);
			popup.show();
		}
		#createControlNode(selected) {
			const templates = this.#getTemplates();
			templates.forEach(template => {
				const isSelected = template.id === selected;
				const {
					root: templateRow,
					templateRadio
				} = main_core.Tag.render`
				<div class="bizproc-automation-popup-settings__select-type_row ${isSelected ? '--active' : ''}">
						<label class="bizproc-automation-popup-settings__select-type_info">
							<div class="bizproc-automation-popup-settings__select-type_info-name ui-ctl ui-ctl-radio ui-ctl-wa">
								<input ref="templateRadio" type="radio" ${isSelected ? 'checked' : ''} onclick="${this.#onTemplateSelect.bind(this)}" name="select-type-message" value="${main_core.Text.encode(template.id)}" class="ui-ctl-element bizproc-automation-popup-settings__select-type_info-input">
								${main_core.Text.encode(template.name)}
							</div>
							<div class="bizproc-automation-popup-settings__select-type_info-description">
								${main_core.Text.encode(template.description)}
							</div>
						</label>
						<div class="bizproc-automation-popup-settings__select-type_images">
							<img src="/bitrix/js/im/robot/message-template-selector/images/template-${main_core.Text.encode(template.id)}.svg" alt="${main_core.Text.encode(template.name)}">
						</div>
					</div>
			`;
				this.#rows.push({
					template: templateRow,
					radioButton: templateRadio
				});
			});
			return main_core.Tag.render`
			<form class="bizproc-automation-popup-settings__select-type">
				${this.#rows.map(row => row.template)}
			</form>
		`;
		}
		#onTemplateSelect() {
			for (const row of this.#rows) {
				if (row.radioButton.checked) {
					main_core.Dom.addClass(row.template, '--active');
				} else {
					main_core.Dom.removeClass(row.template, '--active');
				}
			}
		}
		#getTemplates() {
			return [{
				id: 'plain',
				name: main_core.Loc.getMessage('BX_IM_ROBOT_MESSAGE_TEMPLATE_SELECTOR_PLAIN_NAME'),
				description: main_core.Loc.getMessage('BX_IM_ROBOT_MESSAGE_TEMPLATE_SELECTOR_PLAIN_DESC')
			}, {
				id: 'news',
				name: main_core.Loc.getMessage('BX_IM_ROBOT_MESSAGE_TEMPLATE_SELECTOR_NEWS_NAME'),
				description: main_core.Loc.getMessage('BX_IM_ROBOT_MESSAGE_TEMPLATE_SELECTOR_NEWS_DESC')
			}, {
				id: 'notify',
				name: main_core.Loc.getMessage('BX_IM_ROBOT_MESSAGE_TEMPLATE_SELECTOR_NOTIFY_NAME'),
				description: main_core.Loc.getMessage('BX_IM_ROBOT_MESSAGE_TEMPLATE_SELECTOR_NOTIFY_DESC')
			}, {
				id: 'important',
				name: main_core.Loc.getMessage('BX_IM_ROBOT_MESSAGE_TEMPLATE_SELECTOR_IMPORTANT_NAME'),
				description: main_core.Loc.getMessage('BX_IM_ROBOT_MESSAGE_TEMPLATE_SELECTOR_IMPORTANT_DESC')
			}, {
				id: 'alert',
				name: main_core.Loc.getMessage('BX_IM_ROBOT_MESSAGE_TEMPLATE_SELECTOR_ALERT_NAME'),
				description: main_core.Loc.getMessage('BX_IM_ROBOT_MESSAGE_TEMPLATE_SELECTOR_ALERT_DESC')
			}];
		}
	}

	exports.MessageTemplateSelector = MessageTemplateSelector;

})(this.BX.IM.Robot = this.BX.IM.Robot || {}, BX, BX.Event, BX.Main, BX.UI);
//# sourceMappingURL=message-template-selector.bundle.js.map
