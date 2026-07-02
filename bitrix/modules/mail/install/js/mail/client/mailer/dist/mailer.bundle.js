/* eslint-disable */
this.BX = this.BX || {};
this.BX.Mail = this.BX.Mail || {};
(function (exports, mail_client_filtertoolbar, mail_client_errorbox, mail_client_binding, mail_client_mailboxselector, main_core_events) {
	'use strict';

	class Mailer {
		#filter;
		#filterToolbar;
		#binding;
		#mailboxId;
		focusReset = false;
		constructor(config = {
			filterId: '',
			mailboxId: 0,
			syncAvailable: true,
			configPath: '',
			mailboxSelectorConfig: null
		}) {
			//delete the loader (the envelope is bouncing)
			let elements = top.document.getElementsByClassName('mail-loader-modifier');
			for (let element of elements) {
				element.classList.remove('mail-loader-modifier');
			}
			this.#mailboxId = config['mailboxId'];
			this.#filter = BX.Main.filterManager.getById(config['filterId']);
			this.#initMailboxSelector(config['mailboxSelectorConfig']);
			this.sendApplyFilterEventForMenuRefresh();

			//Removing the focus from the filter field
			if (document.activeElement) {
				document.activeElement.blur();
			}
			const mailCounterWrapper = document.querySelector('[data-role="mail-counter-toolbar"]');
			const mailErrorBoxWrapper = document.querySelector('[data-role="mail-error-box-wrapper"]');
			new mail_client_errorbox.ErrorBox({
				wrapper: mailErrorBoxWrapper,
				errorLink: config['configPath'],
				currentMailboxId: this.#mailboxId
			});
			const filterToolbar = new mail_client_filtertoolbar.FilterToolbar({
				wrapper: mailCounterWrapper,
				filter: this.#filter
			});
			filterToolbar.build();
			this.#filterToolbar = filterToolbar;
			this.#binding = new mail_client_binding.Binding(this.#mailboxId);
			mail_client_binding.Binding.initButtons();
			main_core_events.EventEmitter.subscribe('Grid::updated', event => {
				const [grid] = event.getCompatData();
				if (grid !== {} && grid !== undefined && BX.Mail.Home.Grid.getId() === grid.getId()) {
					mail_client_binding.Binding.initButtons();
				}
			});
			main_core_events.EventEmitter.subscribe('BX.Main.Filter:apply', event => {
				let dir = this.#filter.getFilterFieldsValues()['DIR'];
				BX.Mail.Home.Counters.setDirectory(dir);
			});
			if (!config['syncAvailable']) {
				top.BX.UI.InfoHelper.show('limit_contact_center_mail_box_number');
				let lock = false;
				const handler = () => {
					if (!lock) {
						lock = true;
						top.BX.removeCustomEvent("SidePanel.Slider:onCloseComplete", handler);
						top.BX.SidePanel.Instance.close();
					}
				};
				top.BX.addCustomEvent("SidePanel.Slider:onCloseComplete", handler);
			}
		}
		sendApplyFilterEventForMenuRefresh() {
			if (!!this.#filter && this.#filter instanceof BX.Main.Filter) {
				setTimeout(function () {
					main_core_events.EventEmitter.emit('BX.Main.Filter:apply', new main_core_events.BaseEvent());
				}, 1);
			}
		}
		setFilterDir(name) {
			if (!!this.#filter && this.#filter instanceof BX.Main.Filter) {
				const FilterApi = this.#filter.getApi();
				FilterApi.setFields({
					'DIR': name
				});
				FilterApi.apply();
			}
		}
		getFilterToolbar() {
			return this.#filterToolbar;
		}
		#initMailboxSelector(selectorConfig) {
			if (!selectorConfig) {
				return;
			}
			const root = document.querySelector('[data-role="mailbox-selector-root"]');
			if (!root) {
				return;
			}
			BX.Mail.Home = BX.Mail.Home || {};
			BX.Mail.Home.MailboxSelector = new mail_client_mailboxselector.MailboxSelector({
				root,
				selectorConfig
			});
		}
	}

	exports.Mailer = Mailer;

})(this.BX.Mail.Client = this.BX.Mail.Client || {}, BX.Mail.Client, BX.Mail.Client, BX.Mail.Client, BX.Mail.Client, BX.Event);
//# sourceMappingURL=mailer.bundle.js.map
