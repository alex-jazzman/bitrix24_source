/* eslint-disable */
(function (main_core, ui_buttons) {
	'use strict';

	const namespace = main_core.Reflection.namespace('BX.Crm.Component');
	const Viewer = main_core.Reflection.namespace('BX.UI.Viewer');
	let defaultComponent = null;

	/**
	 * @memberOf BX.Crm.Component
	 */
	class SignDocumentView {
		constructor(parameters) {
			this.pdfNode = parameters.pdfNode;
			this.pdfSource = parameters.pdfSource;
			this.printButton = ui_buttons.ButtonManager.createByUniqId('crm-document-print');
			this.downloadButton = ui_buttons.ButtonManager.createByUniqId('crm-document-download');
			this.#initViewer();
			this.#bindEvents();
			defaultComponent = this;
		}
		#initViewer() {
			const viewer = this.getViewer();
			if (!viewer) {
				return;
			}
			viewer.setItems([Viewer.buildItemByNode(this.pdfNode)]);
			viewer.setPdfSource(this.pdfSource);
			viewer.setScale(1.2);
			viewer.open();
		}
		getViewer() {
			if (!this.viewer && this.pdfNode) {
				this.viewer = new Viewer.SingleDocumentController({
					baseContainer: this.pdfNode,
					stretch: true
				});
			}
			return this.viewer ?? null;
		}
		#bindEvents() {
			if (this.printButton && this.getViewer()) {
				this.printButton.bindEvent('click', () => {
					this.getViewer().print();
				});
			}
			if (this.downloadButton) {
				this.downloadButton.bindEvent('click', () => {
					window.open(this.pdfSource, '_blank');
				});
			}
		}
		static getDefaultComponent() {
			return defaultComponent;
		}
	}
	class SignDocumentViewSendWidget {
		#container = null;
		#button = null;
		#docSend = undefined;
		#memberIds = [];
		constructor(options = {}) {
			this.#memberIds = options?.memberIds ?? [];
			this.#button = this.#createButton();
			if (!main_core.Type.isUndefined(BX?.Sign?.V2?.DocumentSend)) {
				this.#docSend = new BX.Sign.V2.DocumentSend();
				this.#docSend.subscribeOnce('ready', event => {
					if (event.getData()?.readyMembers?.length) {
						this.enableButton();
					}
				});
				this.#docSend.loadStatus(this.#memberIds);
			}
		}
		enableButton() {
			main_core.Dom.removeClass(this.#button, 'crm__sign-document-view-resend--button-disabled');
		}
		disableButton() {
			main_core.Dom.addClass(this.#button, 'crm__sign-document-view-resend--button-disabled');
		}
		isButtonDisabled() {
			return main_core.Dom.hasClass(this.#button, 'crm__sign-document-view-resend--button-disabled');
		}
		renderTo(node) {
			main_core.Dom.append(this.render(), node);
		}
		render() {
			if (!this.#container) {
				this.#container = main_core.Tag.render`
				<div class="crm__sign-document-view-resend--container">
					<div class="crm__sign-document-view-resend--list">
						${this.#button}
					</div>
				</div>
			`;
			}
			return this.#container;
		}
		send(memberIds) {
			return this.#docSend.send(memberIds);
		}
		#updateStatus(memberIds) {
			return this.#docSend.loadStatus(memberIds);
		}
		#createButton() {
			const onResendBtnClick = event => {
				if (this.isButtonDisabled()) {
					return;
				}
				this.#updateStatus(this.#memberIds).then(readyMembers => {
					if (readyMembers.length > 0) {
						return this.send(readyMembers).then(() => {
							this.disableWithTimer(60);
							BX.UI.Notification.Center.notify({
								content: main_core.Loc.getMessage('CRM_DOCUMENT_VIEW_DOCUMENT_SEND_NOTIFY_SUCCESS')
							});
						});
					}
					throw new Error('no members in appropriate status');
				});
			};
			return main_core.Tag.render`
			<div
				class="crm__sign-document-view-resend--button crm__sign-document-view-resend--button-disabled"
				onclick="${onResendBtnClick.bind(this)}"
			>
				<div class="crm__sign-document-view-resend--button-icon --service-sms"></div>
				<div class="crm__sign-document-view-resend--button-main-title">
					${main_core.Loc.getMessage('CRM_DOCUMENT_VIEW_DOCUMENT_SEND_SEND_AGAIN')}
				</div>
				<div class="crm__sign-document-view-resend--button-helper"></div>
			</div>
		`;
		}
		#createButtonText(remainingSeconds) {
			return remainingSeconds > 0 ? main_core.Loc.getMessage('CRM_DOCUMENT_VIEW_DOCUMENT_SEND_SEND_AGAIN_TIMER', {
				'#COUNTDOWN#': this.#formatSeconds(remainingSeconds)
			}) : main_core.Loc.getMessage('CRM_DOCUMENT_VIEW_DOCUMENT_SEND_SEND_AGAIN');
		}
		#setButtonText(text) {
			this.#button.querySelector('.crm__sign-document-view-resend--button-main-title').textContent = text;
		}
		disableWithTimer(sec) {
			this.disableButton();
			let remainingSeconds = sec;
			this.#setButtonText(this.#createButtonText(remainingSeconds));
			const timer = setInterval(() => {
				if (remainingSeconds < 1) {
					clearInterval(timer);
					this.#setButtonText(this.#createButtonText(0));
					this.enableButton();
					return;
				}
				remainingSeconds--;
				this.#setButtonText(this.#createButtonText(remainingSeconds));
			}, 1000);
		}
		#formatSeconds(sec) {
			const minutes = Math.floor(sec / 60);
			const seconds = sec % 60;
			const formatMinutes = this.#formatNumber(minutes);
			const formatSeconds = this.#formatNumber(seconds);
			return `${formatMinutes}:${formatSeconds}`;
		}
		#formatNumber(num) {
			return num < 10 ? `0${num}` : num;
		}
	}
	namespace.SignDocumentView = SignDocumentView;
	namespace.SignDocumentViewSendWidget = SignDocumentViewSendWidget;

})(BX, BX.UI);
//# sourceMappingURL=script.js.map
