/* eslint-disable */
this.BX = this.BX || {};
this.BX.Landing = this.BX.Landing || {};
this.BX.Landing.Ui = this.BX.Landing.Ui || {};
this.BX.Landing.Ui.Panel = this.BX.Landing.Ui.Panel || {};
this.BX.Landing.Ui.Panel.Formsettingspanel = this.BX.Landing.Ui.Panel.Formsettingspanel || {};
this.BX.Landing.Ui.Panel.Formsettingspanel.Content = this.BX.Landing.Ui.Panel.Formsettingspanel.Content || {};
(function (exports, landing_loc, landing_ui_card_headercard, landing_ui_card_messagecard, landing_ui_panel_basepresetpanel, main_core, main_core_events, landing_ui_field_paysystemsselectorfield, landing_ui_form_formsettingsform, landing_ui_panel_formsettingspanel_content_crm_schememanager) {
	'use strict';

	var messageIcon = "/bitrix/js/landing/ui/panel/formsettingspanel/content/pay-systems/dist/assets/message-icon.svg";

	class PaySystems extends landing_ui_panel_basepresetpanel.ContentWrapper {
		#moduleNotIncludedErrorCode = 'MODULE_NOT_INCLUDED';
		#schemeManager;
		constructor(options) {
			super(options);
			this.setEventNamespace('BX.Landing.UI.Panel.FormSettingsPanel.PaySystemContent');
			this.#schemeManager = new landing_ui_panel_formsettingspanel_content_crm_schememanager.SchemeManager([...options.dictionary.document.schemes]);
			this.addItem(this.#getHeaderCard());
			this.addItem(this.#getMessageCard());
			this.addItem(this.#getPaySystemsSelectorForm());
		}
		getLayout() {
			return this.cache.remember('layout', () => main_core.Tag.render`<div class="landing-ui-content-pay-system"></div>`);
		}
		#showErrorPlaceholder(title, subtitle = '') {
			main_core.Dom.clean(this.getLayout());
			main_core.Dom.append(this.getErrorPlaceholderLayout(title, subtitle), this.getLayout());
		}
		getErrorPlaceholderLayout(title, subtitle = '') {
			return this.cache.remember(`errorTitle`, () => main_core.Tag.render`
			<div class="ui-slider-no-access">
				<div class="ui-slider-no-access-inner">
					<div class="ui-slider-no-access-title">${title}</div>
					<div class="ui-slider-no-access-subtitle">${subtitle}</div>
					<div class="ui-slider-no-access-img">
						<div class="ui-slider-no-access-img-inner"></div>
					</div>
				</div>
			</div>
		`);
		}
		#getHeaderCard() {
			return new landing_ui_card_headercard.HeaderCard({
				title: landing_loc.Loc.getMessage('LANDING_FORM_PAY_SYSTEMS_TITLE')
			});
		}
		#getMessageCard() {
			return new landing_ui_card_messagecard.MessageCard({
				id: 'paymentMessage',
				header: landing_loc.Loc.getMessage('LANDING_FORM_PAY_SYSTEMS_MESSAGE_HEADER'),
				description: landing_loc.Loc.getMessage('LANDING_FORM_PAY_SYSTEMS_MESSAGE_DESCRIPTION'),
				icon: messageIcon,
				restoreState: true
			});
		}
		#getPaySystemsSelectorForm() {
			return this.cache.remember('paySystemsSelectorForm', () => {
				return new landing_ui_form_formsettingsform.FormSettingsForm({
					id: 'paySystemsForm',
					title: landing_loc.Loc.getMessage('LANDING_FORM_PAY_SYSTEMS_GET_PAYMENT'),
					toggleable: true,
					opened: this.options.formOptions.payment.use,
					fields: [this.#getPaySystemsSelectorField()]
				});
			});
		}
		#getPaySystemsSelectorField() {
			return this.cache.remember('paySystemSelectorField', () => new landing_ui_field_paysystemsselectorfield.PaySystemsSelectorField({
				id: 'paySystemsSelector',
				selector: 'paySystemsSelector',
				disabledPaySystems: [...this.options.formOptions.payment.disabledSystems],
				onFetchPaySystemsError: errors => this.onFetchPaySystemsError(errors),
				showMorePaySystemsBtn: true,
				morePaySystemsBtnSidePanelPath: this.options.dictionary.payment.moreSystemSliderPath
			}));
		}
		getValue() {
			const schemeId = main_core.Text.toNumber(this.options.formOptions.document.scheme);
			const usePayment = this.#getPaySystemsSelectorForm().isOpened();
			if (!this.#schemeManager.isInvoice(schemeId) && usePayment) {
				this.options.formOptions.document.scheme = this.#schemeManager.getSpecularSchemeId(schemeId);
			}
			return super.getValue();
		}
		valueReducer(value) {
			const paySystemsSelectorData = value.paySystemsSelector;
			const payment = this.options.formOptions.payment;
			const document = this.options.formOptions.document;
			payment.disabledSystems = paySystemsSelectorData.disabledPaySystems;
			payment.use = this.#getPaySystemsSelectorForm().isOpened();
			if (document.payment) {
				document.payment = {
					...document.payment,
					...payment
				};
			} else {
				document.payment = payment;
			}
			return {
				document
			};
		}
		onChange(event) {
			this.emit('onChange', {
				skipPrepare: true
			});
		}
		onFetchPaySystemsError(errors) {
			const firstError = errors[0];
			if (firstError.code === this.#moduleNotIncludedErrorCode) {
				this.#showErrorPlaceholder(firstError.message);
			} else {
				this.#showErrorPlaceholder('Network error');
			}
		}
	}

	exports.Content = PaySystems;
	exports.PaySystems = PaySystems;

})(this.BX.Landing.Ui.Panel.Formsettingspanel.Content.PaySystems = this.BX.Landing.Ui.Panel.Formsettingspanel.Content.PaySystems || {}, BX.Landing, BX.Landing.UI.Card, BX.Landing.UI.Card, BX.Landing.UI.Panel, BX, BX.Event, BX.Landing.Ui.Field, BX.Landing.UI.Form, BX.Landing.Ui.Panel.Formsettingspanel.Content.Crm.SchemeManager);
//# sourceMappingURL=pay-systems.bundle.js.map
