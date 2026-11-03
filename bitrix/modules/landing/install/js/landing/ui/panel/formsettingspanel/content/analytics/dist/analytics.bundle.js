/* eslint-disable */
this.BX = this.BX || {};
this.BX.Landing = this.BX.Landing || {};
this.BX.Landing.Ui = this.BX.Landing.Ui || {};
this.BX.Landing.Ui.Panel = this.BX.Landing.Ui.Panel || {};
this.BX.Landing.Ui.Panel.Formsettingspanel = this.BX.Landing.Ui.Panel.Formsettingspanel || {};
this.BX.Landing.Ui.Panel.Formsettingspanel.Content = this.BX.Landing.Ui.Panel.Formsettingspanel.Content || {};
(function (exports, landing_loc, landing_ui_card_headercard, landing_ui_panel_basepresetpanel, landing_ui_field_accordionfield, landing_ui_card_messagecard, ui_designTokens, main_core) {
	'use strict';

	var yandexIcon = "/bitrix/js/landing/ui/panel/formsettingspanel/content/analytics/dist/assets/yandex.svg";

	var googleIcon = "/bitrix/js/landing/ui/panel/formsettingspanel/content/analytics/dist/assets/google.svg";

	class ContentTableCell {
		constructor(options = {}) {
			this.options = {
				...options
			};
		}
		render() {
			return main_core.Tag.render`
			<div class="landing-ui-content-table-cell">
				${main_core.Text.encode(this.options.content)}
			</div>
		`;
		}
	}

	class ContentTableRow {
		constructor(options) {
			this.options = {
				...options
			};
		}
		render() {
			const headClass = this.options.head ? ' landing-ui-content-table-row-head' : '';
			return main_core.Tag.render`
			<div class="landing-ui-content-table-row${headClass}">
				${this.options.columns.map(cell => cell.render())}
			</div>
		`;
		}
	}

	class ContentTable {
		constructor(options) {
			this.options = {
				...options
			};
			this.headRow = new ContentTableRow({
				columns: this.options.columns.map(columnOptions => {
					return new ContentTableCell(columnOptions);
				}),
				head: true
			});
			this.rows = this.options.rows.map(rowOptions => {
				return new ContentTableRow({
					columns: rowOptions.columns.map(cellOptions => {
						return new ContentTableCell(cellOptions);
					})
				});
			});
		}
		getTitleLayout() {
			if (Type.isStringFilled(this.options.title)) {
				return main_core.Tag.render`
				<div class="landing-ui-content-table-title">${this.options.title}</div>
			`;
			}
			return '';
		}
		render() {
			return main_core.Tag.render`
			<div class="landing-ui-content-table-wrapper">
				
				<div class="landing-ui-content-table">
					${this.headRow.render()}
					${this.rows.map(row => row.render())}
				</div>
			</div>
		`;
		}
	}

	class AnalyticsContent extends landing_ui_panel_basepresetpanel.ContentWrapper {
		constructor(options) {
			super(options);
			this.setEventNamespace('BX.Landing.UI.Panel.FormSettingsPanel.AgreementsContent');
			const header = new landing_ui_card_headercard.HeaderCard({
				title: landing_loc.Loc.getMessage('LANDING_FORM_SETTINGS_ANALYTICS_TITLE')
			});
			const items = [];
			if (landing_loc.Loc.getMessage('LANGUAGE_ID') === 'ru') {
				items.push({
					id: 'yandex',
					title: landing_loc.Loc.getMessage('LANDING_FORM_SETTINGS_ANALYTICS_ITEM_YANDEX_METRIKA'),
					icon: yandexIcon,
					checked: true,
					switcher: false,
					content: this.getYandexTable()
				});
			}
			items.push({
				id: 'google',
				title: landing_loc.Loc.getMessage('LANDING_FORM_SETTINGS_ANALYTICS_ITEM_GOOGLE_ANALYTICS'),
				icon: googleIcon,
				checked: true,
				switcher: false,
				content: this.getGoogleTable()
			});
			const accordionField = new landing_ui_field_accordionfield.AccordionField({
				selector: 'analytics',
				title: landing_loc.Loc.getMessage('LANDING_FORM_SETTINGS_ANALYTICS_ITEMS_FIELD_TITLE'),
				items
			});
			const message = new landing_ui_card_messagecard.MessageCard({
				id: 'analyticsMessage',
				header: landing_loc.Loc.getMessage('LANDING_FORM_SETTINGS_ANALYTICS_MESSAGE_TITLE'),
				description: landing_loc.Loc.getMessage('LANDING_FORM_SETTINGS_ANALYTICS_MESSAGE_DESCRIPTION'),
				angle: false,
				restoreState: true
			});
			this.addItem(header);
			this.addItem(message);
			this.addItem(accordionField);
		}
		getYandexTable() {
			const table = new ContentTable({
				columns: [{
					id: 'title',
					content: landing_loc.Loc.getMessage('LANDING_FORM_SETTINGS_ANALYTICS_TABLE_NAME_COLUMN_TITLE')
				}, {
					id: 'id',
					content: landing_loc.Loc.getMessage('LANDING_FORM_SETTINGS_ANALYTICS_TABLE_ID_COLUMN_TITLE')
				}],
				rows: this.options.formOptions.analytics.steps.map(row => {
					return {
						columns: [{
							content: row.name
						}, {
							content: row.event
						}]
					};
				})
			});
			return table.render();
		}
		getGoogleTable() {
			const table = new ContentTable({
				columns: [{
					id: 'title',
					content: landing_loc.Loc.getMessage('LANDING_FORM_SETTINGS_ANALYTICS_TABLE_NAME_COLUMN_TITLE')
				}, {
					id: 'id',
					content: landing_loc.Loc.getMessage('LANDING_FORM_SETTINGS_ANALYTICS_TABLE_ID_COLUMN_TITLE')
				}],
				rows: this.options.formOptions.analytics.steps.map(row => {
					return {
						columns: [{
							content: row.name
						}, {
							content: row.code
						}]
					};
				})
			});
			return table.render();
		}
	}

	exports.AnalyticsContent = AnalyticsContent;
	exports.Content = AnalyticsContent;

})(this.BX.Landing.Ui.Panel.Formsettingspanel.Content.Analytics = this.BX.Landing.Ui.Panel.Formsettingspanel.Content.Analytics || {}, BX.Landing, BX.Landing.UI.Card, BX.Landing.UI.Panel, BX.Landing.UI.Field, BX.Landing.UI.Card, window, BX);
//# sourceMappingURL=analytics.bundle.js.map
