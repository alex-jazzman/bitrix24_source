/* eslint-disable */
this.BX = this.BX || {};
this.BX.Landing = this.BX.Landing || {};
this.BX.Landing.Ui = this.BX.Landing.Ui || {};
this.BX.Landing.Ui.Panel = this.BX.Landing.Ui.Panel || {};
this.BX.Landing.Ui.Panel.Formsettingspanel = this.BX.Landing.Ui.Panel.Formsettingspanel || {};
this.BX.Landing.Ui.Panel.Formsettingspanel.Content = this.BX.Landing.Ui.Panel.Formsettingspanel.Content || {};
(function (exports, main_core, landing_loc, landing_ui_card_headercard, landing_ui_panel_basepresetpanel, landing_ui_field_radiobuttonfield, main_core_events, landing_ui_field_presetfield, landing_ui_field_textfield, ui_designTokens, landing_ui_field_basefield, landing_ui_component_internal, landing_ui_card_messagecard) {
	'use strict';

	class ActionPagesField extends landing_ui_field_basefield.BaseField {
		constructor(options) {
			super(options);
			this.setEventNamespace('BX.Landing.UI.Field.ActionPagesField');
			this.subscribeFromOptions(landing_ui_component_internal.fetchEventsFromOptions(options));
			this.setLayoutClass('landing-ui-field-action-pages');
			main_core.Dom.append(this.getSuccess(), this.input);
			main_core.Dom.append(this.getFailure(), this.input);
			main_core.Event.bind(document, 'click', this.onDocumentClick.bind(this));
			main_core.Event.bind(window.top.document, 'click', this.onDocumentClick.bind(this));
		}
		static createPageBlock(options) {
			const classPrefix = 'landing-ui-field-action-pages-page';
			const onEditClick = event => {
				event.preventDefault();
				event.stopPropagation();
				const inner = event.currentTarget.closest(`.${classPrefix}-inner`);
				const textContainer = inner.querySelector(`.${classPrefix}-text`);
				main_core.Dom.attr(textContainer, 'contenteditable', !textContainer.isContentEditable);
				if (main_core.Type.isFunction(options.onEditClick)) {
					options.onEditClick(event);
				}
			};
			const onEditorClick = event => {
				event.stopPropagation();
			};
			const onViewClick = event => {
				event.preventDefault();
				if (main_core.Type.isFunction(options.onShowClick)) {
					options.onShowClick(event);
				}
			};
			const onBlur = event => {
				event.preventDefault();
				if (main_core.Type.isFunction(options.onBlur)) {
					options.onBlur(event);
				}
			};
			const onFocus = event => {
				event.preventDefault();
				if (main_core.Type.isFunction(options.onFocus)) {
					options.onFocus(event);
				}
			};
			return main_core.Tag.render`
			<div class="${classPrefix} ${classPrefix}-${options.type}">
				<div class="${classPrefix}-title">
					${options.title}
				</div>
				<div class="${classPrefix}-inner">
					<div class="${classPrefix}-header">
						<span class="${classPrefix}-header-view" onclick="${onViewClick}">
							${landing_loc.Loc.getMessage('LANDING_FORM_ACTIONS_EDIT_PAGE_SHOW')}
						</span>
					</div>
					<div class="${classPrefix}-icon"></div>
					<div class="${classPrefix}-text" onclick="${onEditorClick}" 
						onfocus="${onFocus}" onblur="${onBlur}" oninput="${options.onInput}">
						${main_core.Text.encode(options.text)}
					</div>
					<div class="${classPrefix}-footer">
						<span class="${classPrefix}-footer-edit" onclick="${onEditClick}">
							${landing_loc.Loc.getMessage('LANDING_FORM_ACTIONS_EDIT_PAGE_EDIT')}
						</span>
					</div>
				</div>
			</div>
		`;
		}
		onDocumentClick() {
			const successInput = this.getSuccess().querySelector('.landing-ui-field-action-pages-page-text');
			const failureInput = this.getFailure().querySelector('.landing-ui-field-action-pages-page-text');
			main_core.Dom.attr(successInput, 'contenteditable', null);
			main_core.Dom.attr(failureInput, 'contenteditable', null);
		}
		getSuccess() {
			return this.cache.remember('success', () => {
				return ActionPagesField.createPageBlock({
					type: 'success',
					title: landing_loc.Loc.getMessage('LANDING_FORM_ACTIONS_EDIT_SUCCESS_PAGE_TITLE'),
					text: this.options.successText,
					onFocus: () => {
						this.emit('onShowSuccess', new main_core.Event.BaseEvent({
							data: {
								show: true
							}
						}));
					},
					onInput: () => {
						this.emit('onChange');
						this.emit('onShowSuccess', new main_core.Event.BaseEvent({
							data: {
								show: true
							}
						}));
					},
					onShowClick: () => {
						this.emit('onShowSuccess');
					},
					onBlur: () => {
						this.emit('onBlur');
					}
				});
			});
		}
		getFailure() {
			return this.cache.remember('failure', () => {
				return ActionPagesField.createPageBlock({
					type: 'failure',
					title: landing_loc.Loc.getMessage('LANDING_FORM_ACTIONS_EDIT_FAILURE_PAGE_TITLE'),
					text: this.options.failureText,
					onFocus: () => {
						this.emit('onShowFailure', new main_core.Event.BaseEvent({
							data: {
								show: true
							}
						}));
					},
					onInput: () => {
						this.emit('onChange');
						this.emit('onShowFailure', new main_core.Event.BaseEvent({
							data: {
								show: true
							}
						}));
					},
					onShowClick: () => {
						this.emit('onShowFailure');
					},
					onBlur: () => {
						this.emit('onBlur');
					}
				});
			});
		}
		getSuccessText() {
			return this.getSuccess().querySelector('.landing-ui-field-action-pages-page-text').innerText;
		}
		getFailureText() {
			return this.getFailure().querySelector('.landing-ui-field-action-pages-page-text').innerText;
		}
		getValue() {
			return {
				success: this.getSuccessText(),
				failure: this.getFailureText()
			};
		}
	}

	var type1Icon = "/bitrix/js/landing/ui/panel/formsettingspanel/content/actions/dist/assets/type1.svg";

	var type2Icon = "/bitrix/js/landing/ui/panel/formsettingspanel/content/actions/dist/assets/type2.svg";

	var type3Icon = "/bitrix/js/landing/ui/panel/formsettingspanel/content/actions/dist/assets/type3.svg";

	class RefillActionPagesField extends ActionPagesField {
		constructor(options) {
			super(options);
		}
		getSuccess() {
			return this.cache.remember('success', () => {
				return RefillActionPagesField.createPageBlock({
					type: 'success',
					title: landing_loc.Loc.getMessage('LANDING_FORM_ACTIONS_EDIT_SUCCESS_PAGE_TITLE'),
					text: this.options.successText,
					buttonCaption: this.options.buttonCaption,
					onFocus: () => {
						this.emit('onShowSuccess', new main_core.Event.BaseEvent({
							data: {
								show: true
							}
						}));
					},
					onInput: () => {
						this.emit('onChange');
						this.emit('onShowSuccess', new main_core.Event.BaseEvent({
							data: {
								show: true
							}
						}));
					},
					onShowClick: () => {
						this.emit('onShowSuccess');
					},
					onBlur: () => {
						this.emit('onBlur');
					}
				});
			});
		}
		onDocumentClick() {
			const successInput = this.getSuccess().querySelector('.landing-ui-field-action-pages-page-text');
			const buttonInput = this.getSuccess().querySelector('.landing-ui-field-action-pages-page-button');
			const failureInput = this.getFailure().querySelector('.landing-ui-field-action-pages-page-text');
			main_core.Dom.attr(successInput, 'contenteditable', null);
			main_core.Dom.attr(buttonInput, 'contenteditable', null);
			main_core.Dom.attr(failureInput, 'contenteditable', null);
		}
		static createPageBlock(options) {
			const classPrefix = 'landing-ui-field-action-pages-page';
			const onEditClick = event => {
				event.preventDefault();
				event.stopPropagation();
				const inner = event.currentTarget.closest(`.${classPrefix}-inner`);
				const textContainer = inner.querySelector(`.${classPrefix}-text`);
				const buttonContainer = inner.querySelector(`.${classPrefix}-button`);
				main_core.Dom.attr(textContainer, 'contenteditable', !textContainer.isContentEditable);
				main_core.Dom.attr(buttonContainer, 'contenteditable', !buttonContainer.isContentEditable);
				if (main_core.Type.isFunction(options.onEditClick)) {
					options.onEditClick(event);
				}
			};
			const onEditorClick = event => {
				event.stopPropagation();
			};
			const onViewClick = event => {
				event.preventDefault();
				if (main_core.Type.isFunction(options.onShowClick)) {
					options.onShowClick(event);
				}
			};
			const onBlur = event => {
				event.preventDefault();
				if (main_core.Type.isFunction(options.onBlur)) {
					options.onBlur(event);
				}
			};
			const onFocus = event => {
				event.preventDefault();
				if (main_core.Type.isFunction(options.onFocus)) {
					options.onFocus(event);
				}
			};
			let buttonTag = '';
			if (options.type === 'success') {
				const buttonCaption = main_core.Text.encode(options.buttonCaption) || landing_loc.Loc.getMessage('LANDING_FORM_ACTIONS_REFILL_CAPTION');
				buttonTag = main_core.Tag.render`
				<div class="${classPrefix}-button" onclick="${onEditorClick}" 
					onfocus="${onFocus}" onblur="${onBlur}" oninput="${options.onInput}">
					${buttonCaption}
				</div>
			`;
			}
			return main_core.Tag.render`
			<div class="${classPrefix} ${classPrefix}-${options.type}">
				<div class="${classPrefix}-title">
					${options.title}
				</div>
				<div class="${classPrefix}-inner">
					<div class="${classPrefix}-header">
						<span class="${classPrefix}-header-view" onclick="${onViewClick}">
							${landing_loc.Loc.getMessage('LANDING_FORM_ACTIONS_EDIT_PAGE_SHOW')}
						</span>
					</div>
					<div class="${classPrefix}-icon"></div>
					<div class="${classPrefix}-text" onclick="${onEditorClick}" onfocus="${onFocus}" onblur="${onBlur}"  
						oninput="${options.onInput}">
						${main_core.Text.encode(options.text)}
					</div>
					${buttonTag}
					<div class="${classPrefix}-footer">
						<span class="${classPrefix}-footer-edit" onclick="${onEditClick}">
							${landing_loc.Loc.getMessage('LANDING_FORM_ACTIONS_EDIT_PAGE_EDIT')}
						</span>
					</div>
				</div>
			</div>
		`;
		}
		getButtonCaptionText() {
			return this.getSuccess().querySelector('.landing-ui-field-action-pages-page-button').innerText;
		}
		getValue() {
			return {
				success: this.getSuccessText(),
				buttonCaption: this.getButtonCaptionText(),
				failure: this.getFailureText()
			};
		}
	}

	class ActionsContent extends landing_ui_panel_basepresetpanel.ContentWrapper {
		#fieldsWithWarningStatus = new Set();
		constructor(options) {
			super(options);
			this.setEventNamespace('BX.Landing.UI.Panel.FormSettingsPanel.ActionsContent');
			main_core.Dom.addClass(this.getLayout(), 'landing-ui-actions-content-wrapper');
			this.addItem(this.getHeader());
			this.addItem(this.getTypeButtons());
			if (this.options.form) {
				this.options.form.sent = false;
				this.options.form.error = false;
			}
			const onBlur = () => {
				this.options.form.sent = false;
				this.options.form.error = false;
			};
			const showFailure = event => {
				const show = event.data.show || null;
				this.options.formOptions.result = this.getValue().result;
				this.options.form.stateText = this.options.formOptions.result.failure.text;
				this.options.form.sent = show === null ? !this.options.form.sent : show;
				this.options.form.error = this.options.form.sent;
			};
			this.getActionPages().subscribe('onShowSuccess', event => {
				const show = event.data.show || null;
				this.options.formOptions.result = this.getValue().result;
				this.options.form.stateText = this.options.formOptions.result.success.text;
				this.options.form.sent = show === null ? !this.options.form.sent : show;
				this.options.form.error = false;
			}).subscribe('onShowFailure', showFailure).subscribe('onBlur', onBlur);
			this.getRefillActionPages().subscribe('onShowSuccess', event => {
				const show = event.data.show || null;
				this.options.formOptions.result = this.getValue().result;
				this.options.form.stateText = this.options.formOptions.result.success.text;
				this.options.form.stateButton.text = this.options.formOptions.result.refill && this.options.formOptions.result.refill.active ? this.options.formOptions.result.refill.caption : '';
				this.options.form.sent = show === null ? !this.options.form.sent : show;
				this.options.form.error = false;
				if (!main_core.Type.isFunction(this.options.form.stateButton.handler)) {
					this.options.form.stateButton.handler = () => {};
				}
			}).subscribe('onShowFailure', showFailure).subscribe('onBlur', onBlur);
		}
		getHeader() {
			return this.cache.remember('header', () => {
				return new landing_ui_card_headercard.HeaderCard({
					title: landing_loc.Loc.getMessage('LANDING_FORM_ACTIONS_TITLE')
				});
			});
		}
		getMessage(type) {
			return new landing_ui_card_messagecard.MessageCard({
				id: 'actionsMessage' + type,
				header: landing_loc.Loc.getMessage('LANDING_ACTIONS_MESSAGE_HEADER_' + type),
				description: landing_loc.Loc.getMessage('LANDING_ACTIONS_MESSAGE_DESCRIPTION_' + type),
				restoreState: true
			});
		}
		getTypeButtons() {
			return this.cache.remember('typeButtons', () => {
				return new landing_ui_field_radiobuttonfield.RadioButtonField({
					selectable: true,
					value: (() => {
						if (this.options.formOptions.result.refill.active) {
							return 'type3';
						}
						if (main_core.Type.isStringFilled(this.options.formOptions.result.success.url) || main_core.Type.isStringFilled(this.options.formOptions.result.failure.url)) {
							return 'type2';
						}
						return 'type1';
					})(),
					items: [{
						id: 'type1',
						title: landing_loc.Loc.getMessage('LANDING_FORM_ACTIONS_TYPE_1'),
						icon: 'landing-ui-form-actions-type1'
					}, {
						id: 'type2',
						title: landing_loc.Loc.getMessage('LANDING_FORM_ACTIONS_TYPE_2'),
						icon: 'landing-ui-form-actions-type2'
					}, {
						id: 'type3',
						title: landing_loc.Loc.getMessage('LANDING_FORM_ACTIONS_TYPE_3'),
						icon: 'landing-ui-form-actions-type3'
					}],
					onChange: this.onTypeChange.bind(this)
				});
			});
		}
		getCheckbox() {
			return this.cache.remember('checkbox', () => {
				return new BX.Landing.UI.Field.Checkbox({
					items: [{
						name: landing_loc.Loc.getMessage('LANDING_FORM_ACTIONS_CHECKBOX_TITLE'),
						value: true
					}]
				});
			});
		}
		getTypeDropdown() {
			return this.cache.remember('typeDropdown', () => {
				const field = new landing_ui_field_presetfield.PresetField({
					events: {
						onClick: () => {
							this.clear();
							this.addItem(this.getHeader());
							this.addItem(this.getTypeButtons());
						}
					}
				});
				field.setTitle(landing_loc.Loc.getMessage('LANDING_FORM_ACTIONS_TYPE_DROPDOWN_TITLE'));
				field.setIcon(type1Icon);
				return field;
			});
		}
		getSuccessLinkField() {
			return this.cache.remember('successLinkField', () => {
				return new landing_ui_field_textfield.TextField({
					title: landing_loc.Loc.getMessage('LANDING_FORM_ACTIONS_SUCCESS_FIELD_TITLE'),
					footerText: landing_loc.Loc.getMessage('LANDING_FORM_ACTIONS_LINK_WARNING_MESSAGE'),
					placeholder: 'https://',
					textOnly: true,
					content: this.options.formOptions.result.success.url,
					onInput: this.onChange.bind(this),
					onValueChange: this.onLinkValueChange.bind(this)
				});
			});
		}
		getFailureLinkField() {
			return this.cache.remember('failureLinkField', () => {
				return new landing_ui_field_textfield.TextField({
					title: landing_loc.Loc.getMessage('LANDING_FORM_ACTIONS_FAILURE_FIELD_TITLE'),
					footerText: landing_loc.Loc.getMessage('LANDING_FORM_ACTIONS_LINK_WARNING_MESSAGE'),
					placeholder: 'https://',
					textOnly: true,
					content: this.options.formOptions.result.failure.url,
					onInput: this.onChange.bind(this),
					onValueChange: this.onLinkValueChange.bind(this)
				});
			});
		}
		getRefillCaptionField() {
			return this.cache.remember('refillCaptionFill', () => {
				return new landing_ui_field_textfield.TextField({
					title: landing_loc.Loc.getMessage('LANDING_FORM_ACTIONS_REFILL_CAPTION_FIELD_TITLE'),
					textOnly: true,
					content: this.options.formOptions.result.refill.caption || landing_loc.Loc.getMessage('LANDING_FORM_ACTIONS_REFILL_CAPTION'),
					onInput: this.onChange.bind(this)
				});
			});
		}
		getDelayField() {
			return this.cache.remember('delayField', () => {
				return new BX.Landing.UI.Field.Dropdown({
					selector: 'redirectDelay',
					title: landing_loc.Loc.getMessage('LANDING_FORM_ACTIONS_DELAY_TITLE'),
					content: this.options.formOptions.result.redirectDelay,
					items: Array.from({
						length: 11
					}, (item, index) => {
						return {
							name: landing_loc.Loc.getMessage(`LANDING_FORM_ACTIONS_DELAY_ITEM_${index}`),
							value: index
						};
					})
				});
			});
		}
		onChange() {
			this.emit('onChange', {
				skipPrepare: true
			});
		}
		getActionPages() {
			return this.cache.remember('actionPages', () => {
				return new ActionPagesField({
					successText: this.options.formOptions.result.success.text,
					failureText: this.options.formOptions.result.failure.text,
					onChange: this.onChange.bind(this)
				});
			});
		}
		getRefillActionPages() {
			return this.cache.remember('refillActionPages', () => {
				return new RefillActionPagesField({
					successText: this.options.formOptions.result.success.text,
					buttonCaption: this.options.formOptions.result.refill.caption,
					failureText: this.options.formOptions.result.failure.text,
					onChange: this.onChange.bind(this)
				});
			});
		}
		onTypeChange(event) {
			const data = event.getData();
			const typeDropdown = this.getTypeDropdown();
			this.clear();
			this.addItem(this.getHeader());
			this.addItem(this.getMessage(data.item.id));
			this.addItem(typeDropdown);
			typeDropdown.setLinkText(data.item.title.replace(/&nbsp;/, ' '));
			if (data.item.id === 'type1') {
				typeDropdown.setIcon(type1Icon);
				this.addItem(this.getActionPages());
			}
			if (data.item.id === 'type2') {
				typeDropdown.setIcon(type2Icon);
				this.addItem(this.getSuccessLinkField());
				this.addItem(this.getFailureLinkField());
				this.addItem(this.getDelayField());
			}
			if (data.item.id === 'type3') {
				typeDropdown.setIcon(type3Icon);
				this.addItem(this.getRefillActionPages());
			}
		}
		getValue() {
			const useRefill = this.getTypeButtons().getValue() === 'type3';
			const actionPagesValue = !useRefill ? this.getActionPages().getValue() : this.getRefillActionPages().getValue();
			const useRedirect = this.getTypeButtons().getValue() === 'type2';
			return {
				result: {
					success: {
						text: actionPagesValue.success,
						url: useRedirect ? main_core.Text.decode(this.getSuccessLinkField().getValue()) : ''
					},
					failure: {
						text: actionPagesValue.failure,
						url: useRedirect ? main_core.Text.decode(this.getFailureLinkField().getValue()) : ''
					},
					redirectDelay: this.getDelayField().getValue(),
					refill: {
						active: useRefill,
						caption: useRefill ? actionPagesValue.buttonCaption : ''
					}
				}
			};
		}
		onLinkValueChange(textField) {
			let url = textField.getValue();
			const urlLength = url.length;
			if (urlLength === 0) {
				this.unsetWarningStatusToLinkField(textField);
				return;
			}
			if (url.trim().length !== urlLength) {
				url = url.trim();
				this.#updateLinkField(textField, url);
			}
			const isHttps = url.startsWith('https://');
			if (isHttps) {
				this.unsetWarningStatusToLinkField(textField);
			} else {
				this.setWarningStatusToLinkField(textField);
			}
		}
		setWarningStatusToLinkField(textField) {
			const textFieldKey = textField.id;
			if (this.#fieldsWithWarningStatus.has(textFieldKey)) {
				return;
			}
			textField.setWarningStatus();
			textField.showFooter();
			this.#fieldsWithWarningStatus.add(textFieldKey);
		}
		unsetWarningStatusToLinkField(textField) {
			const textFieldKey = textField.id;
			if (!this.#fieldsWithWarningStatus.has(textFieldKey)) {
				return;
			}
			textField.unsetWarningStatus();
			textField.hideFooter();
			this.#fieldsWithWarningStatus.delete(textFieldKey);
		}
		#updateLinkField(textField, url) {
			const range = document.createRange();
			const selection = window.getSelection();
			const needToMove = selection.focusOffset > 1;
			textField.input.innerText = url;
			if (!needToMove) {
				return;
			}
			const node = selection.focusNode;
			range.setStart(node, node.childNodes.length);
			range.collapse(true);
			selection.removeAllRanges();
			selection.addRange(range);
		}
	}

	exports.ActionsContent = ActionsContent;
	exports.Content = ActionsContent;

})(this.BX.Landing.Ui.Panel.Formsettingspanel.Content.Actions = this.BX.Landing.Ui.Panel.Formsettingspanel.Content.Actions || {}, BX, BX.Landing, BX.Landing.UI.Card, BX.Landing.UI.Panel, BX.Landing.UI.Field, BX.Event, BX.Landing.UI.Field, BX.Landing.UI.Field, window, BX.Landing.UI.Field, BX.Landing.UI.Component, BX.Landing.UI.Card);
//# sourceMappingURL=actions.bundle.js.map
