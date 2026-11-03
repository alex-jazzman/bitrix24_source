/* eslint-disable */
this.BX = this.BX || {};
this.BX.Landing = this.BX.Landing || {};
this.BX.Landing.Ui = this.BX.Landing.Ui || {};
this.BX.Landing.Ui.Panel = this.BX.Landing.Ui.Panel || {};
this.BX.Landing.Ui.Panel.Formsettingspanel = this.BX.Landing.Ui.Panel.Formsettingspanel || {};
this.BX.Landing.Ui.Panel.Formsettingspanel.Content = this.BX.Landing.Ui.Panel.Formsettingspanel.Content || {};
(function (exports, main_core, main_core_events, booking_const, landing_loc, landing_ui_card_headercard, landing_ui_card_messagecard, landing_ui_panel_basepresetpanel, landing_ui_form_formsettingsform) {
	'use strict';

	var resourceAutoSelectionIcon = "/bitrix/js/landing/ui/panel/formsettingspanel/content/booking-resource-auto-selection/dist/assets/resource-auto-selection-icon.svg";

	class BookingResourceAutoSelection extends landing_ui_panel_basepresetpanel.ContentWrapper {
		#options;
		constructor(options) {
			super(options);
			this.#options = options;
			this.setEventNamespace('BX.Landing.UI.Panel.FormSettingsPanel.BookingResourceAutoSelectionContent');
			this.addItem(this.#getHeaderCard());
			this.addItem(this.#getMessageCard());
			this.addItem(this.#getSettingsForm());
		}
		getLayout() {
			return this.cache.remember('layout', () => main_core.Tag.render`<div class="landing-ui-content-booking-resource-auto-selection"></div>`);
		}
		valueReducer(value) {
			const checked = Boolean(this.#getSettingsForm().isOpened());
			return {
				data: this.#getFormOptionData(checked),
				bookingResourceAutoSelection: {
					...value,
					use: checked
				}
			};
		}
		onChange(event) {
			this.emit('onChange', {
				...event.getData(),
				skipPrepare: true
			});
		}
		#getFormOptionData(checked) {
			const bookingField = this.#options?.formOptions?.data?.fields?.find(({
				id
			}) => id === 'BOOKING_BOOKING');
			if (!bookingField) {
				return this.#options?.formOptions?.data;
			}
			const settingsData = bookingField.settingsData || {};
			settingsData[booking_const.CrmFormSettingsDataPropName.isAutoSelectionOn] = checked;
			settingsData[booking_const.CrmFormSettingsDataPropName.autoSelection] = Object.assign(settingsData[booking_const.CrmFormSettingsDataPropName.autoSelection] || {}, {
				hasSlotsAllAvailableResources: false
			});
			bookingField.settingsData = {
				...settingsData
			};
			return this.#options.formOptions.data;
		}
		#getHeaderCard() {
			return new landing_ui_card_headercard.HeaderCard({
				title: landing_loc.Loc.getMessage('LANDING_FORM_BOOKING_RESOURCE_AUTO_SELECTION_TITLE')
			});
		}
		#getMessageCard() {
			return new landing_ui_card_messagecard.MessageCard({
				id: 'bookingResourceAutoSelectionMessage',
				header: landing_loc.Loc.getMessage('LANDING_FORM_BOOKING_RESOURCE_AUTO_SELECTION_MESSAGE_HEADER'),
				description: landing_loc.Loc.getMessage('LANDING_FORM_BOOKING_RESOURCE_AUTO_SELECTION_MESSAGE_DESCRIPTION'),
				restoreState: true,
				closeable: false,
				angle: false,
				more: () => {
					const helper = main_core.Reflection.getClass('top.BX.Helper');
					if (helper) {
						BX.Helper.show('redirect=detail&code=25366370');
					}
				},
				icon: resourceAutoSelectionIcon
			});
		}
		#getSettingsForm() {
			return this.cache.remember('bookingResourceAutoSelectionForm', () => {
				return new landing_ui_form_formsettingsform.FormSettingsForm({
					id: 'bookingResourceAutoSelection',
					title: landing_loc.Loc.getMessage('LANDING_FORM_BOOKING_RESOURCE_AUTO_SELECTION_SELECTOR'),
					toggleable: true,
					opened: this.options.formOptions.bookingResourceAutoSelection.use,
					fields: []
				});
			});
		}
	}

	exports.BookingResourceAutoSelection = BookingResourceAutoSelection;
	exports.Content = BookingResourceAutoSelection;

})(this.BX.Landing.Ui.Panel.Formsettingspanel.Content.BookingResourceAutoSelection = this.BX.Landing.Ui.Panel.Formsettingspanel.Content.BookingResourceAutoSelection || {}, BX, BX.Event, BX.Booking.Const, BX.Landing, BX.Landing.UI.Card, BX.Landing.UI.Card, BX.Landing.UI.Panel, BX.Landing.UI.Form);
//# sourceMappingURL=booking-resource-auto-selection.bundle.js.map
