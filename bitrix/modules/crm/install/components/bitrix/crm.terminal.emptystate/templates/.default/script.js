/* eslint-disable */
(function (main_core, crm_terminal) {
	'use strict';

	const namespace = main_core.Reflection.namespace('BX.Crm.Component');
	class TerminalEmptyState {
		constructor(options = {}) {
			this.emptyState = null;
			this.renderNode = options.renderNode || null;
			this.zone = options.zone || null;
			this.templateFolder = options.templateFolder || '';
			this.sberbankPaySystemPath = options.sberbankPaySystemPath || null;
			this.spbPaySystemPath = options.spbPaySystemPath || null;
		}
		getEmptyState() {
			const phrase4 = main_core.Tag.render`<span>${main_core.Loc.getMessage('CRM_TERMINAL_EMPTY_STATE_COMPONENT_TEMPLATE_ITEM_4')}</span>`;
			const yookassaSbp = phrase4.querySelector('yookassa_sbp');
			if (this.spbPaySystemPath && main_core.Type.isDomNode(yookassaSbp)) {
				const yookassaSbpLink = main_core.Tag.render`<a href="javascript:void(0)">${yookassaSbp.innerHTML}</a>`;
				main_core.Event.bind(yookassaSbpLink, 'click', () => {
					this.#openPaySystemSlider(this.spbPaySystemPath);
				});
				phrase4.replaceChild(yookassaSbpLink, yookassaSbp);
			}
			const yookassaSberbank = phrase4.querySelector('yookassa_sberbank');
			if (this.sberbankPaySystemPath && main_core.Type.isDomNode(yookassaSberbank)) {
				const yookassaSberbankLink = main_core.Tag.render`<a href="javascript:void(0)">${yookassaSberbank.innerHTML}</a>`;
				main_core.Event.bind(yookassaSberbankLink, 'click', () => {
					this.#openPaySystemSlider(this.sberbankPaySystemPath);
				});
				phrase4.replaceChild(yookassaSberbankLink, yookassaSberbank);
			}
			if (!this.emptyState) {
				const container = main_core.Tag.render`
				<div class="crm-terminal-payment-list__empty--all-info">
					<div class="crm-terminal-payment-list__empty--info-text-container">
						<div class="crm-terminal-payment-list__empty--info-block-title">
							<div class="crm-terminal-payment-list__empty--title-quickly">${main_core.Loc.getMessage('CRM_TERMINAL_EMPTY_STATE_COMPONENT_TEMPLATE_TITLE_MSGVER_1')}</div>
							<div class="crm-terminal-payment-list__empty--title">${main_core.Loc.getMessage('CRM_TERMINAL_EMPTY_STATE_COMPONENT_TEMPLATE_SUB_TITLE')}</div>
						</div>
						<div class="crm-terminal-payment-list__empty--info-block-content">
							<ul class="crm-terminal-payment-list__empty--list-items">
								<li class="crm-terminal-payment-list__empty--list-item">${main_core.Loc.getMessage('CRM_TERMINAL_EMPTY_STATE_COMPONENT_TEMPLATE_ITEM_1')}</li>
								<li class="crm-terminal-payment-list__empty--list-item">${main_core.Loc.getMessage('CRM_TERMINAL_EMPTY_STATE_COMPONENT_TEMPLATE_ITEM_2')}</li>
								<li class="crm-terminal-payment-list__empty--list-item">${main_core.Loc.getMessage('CRM_TERMINAL_EMPTY_STATE_COMPONENT_TEMPLATE_ITEM_3')}</li>
								<li class="crm-terminal-payment-list__empty--list-item">${phrase4}</li>
								<li class="crm-terminal-payment-list__empty--list-item">${main_core.Loc.getMessage('CRM_TERMINAL_EMPTY_STATE_COMPONENT_TEMPLATE_ITEM_5')}</li>
							</ul>
							<div class="crm-terminal-payment-list__empty--bth-container">
								<a href="javascript:void(0)" class="ui-btn ui-btn-lg ui-btn-success crm-terminal-payment-list__empty--bth-radiance">
									<span class="crm-terminal-payment-list__empty--bth-radiance-left"></span>
									${main_core.Loc.getMessage('CRM_TERMINAL_EMPTY_STATE_COMPONENT_TEMPLATE_BUTTON')}
									<span class="crm-terminal-payment-list__empty--bth-radiance-right"></span>
								</a>
							</div>
						</div>
					</div>
					<div class="crm-terminal-payment-list__empty--info-image-block">
						<img src="${this.getImageSrc()}" alt="" class="crm-terminal-payment-list__empty--info-image"/>
					</div>
				</div>`;
				this.emptyState = container;
			}
			return this.emptyState;
		}
		getImageSrc() {
			if (this.zone === 'ru') {
				return this.templateFolder + '/images/terminal_ru.svg';
			}
			return this.templateFolder + '/images/terminal_en.svg';
		}
		#openPaySystemSlider(path) {
			const sliderOptions = {
				cacheable: false,
				allowChangeHistory: false,
				width: 1000,
				events: {
					onClose: () => {
						this.emptyState = null;
						main_core.ajax.runComponentAction('bitrix:crm.terminal.emptystate', 'prepareResult', {
							mode: 'class',
							data: {}
						}).then(response => {
							this.sberbankPaySystemPath = response.data.sberbankPaySystemPath;
							this.spbPaySystemPath = response.data.spbPaySystemPath;
							this.renderNode.innerHTML = '';
							this.render();
						}, () => window.location.reload());
					}
				}
			};
			BX.SidePanel.Instance.open(path, sliderOptions);
		}
		show() {
			main_core.Dom.append(this.getEmptyState(), this.renderNode);
		}
		render() {
			this.show();
			const buttonCreate = this.emptyState.querySelector('.crm-terminal-payment-list__empty--bth-radiance');
			buttonCreate.addEventListener('click', () => {
				new crm_terminal.QrAuth().show();
			});
		}
	}
	namespace.TerminalEmptyState = TerminalEmptyState;

})(BX, BX.Crm);
//# sourceMappingURL=script.js.map
