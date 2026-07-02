/* eslint-disable */
this.BX = this.BX || {};
this.BX.Sign = this.BX.Sign || {};
this.BX.Sign.V2 = this.BX.Sign.V2 || {};
(function (exports, ui_buttons, ui_sidepanelContent, ui_designTokens, main_date, main_core, sign_v2_api, sign_v2_b2e_signingFrameEventHandler) {
	'use strict';

	const signLinkSliderUrl = 'sign:stub:sign-link';
	class SignLink {
		#container = null;
		#memberId = null;
		#loaded = false;
		#errorCode = null;
		#errorMessage = null;
		#uri = null;
		#showHelpdeskGoskey = false;
		#api;
		#requireBrowser = true;
		#mobileAllowed = true;
		#employeeData = {};
		#renderMemberInfo = false;
		#slider = null;
		#frameEventHandler = null;
		#sliderCloseCompleteHandler = null;
		#cache = new main_core.Cache.MemoryCache();
		static #signingFrameEventHandler = null;
		constructor(options = {}) {
			this.#api = new sign_v2_api.Api();
			this.#memberId = options.memberId;
			this.#requireBrowser = options?.requireBrowser || true;
			this.#mobileAllowed = options?.mobileAllowed || true;
			this.#slider = options?.slider || null;
			this.#initializeSigningFrameEventHandler();
		}
		#initializeSigningFrameEventHandler() {
			if (!SignLink.#signingFrameEventHandler) {
				SignLink.#signingFrameEventHandler = new sign_v2_b2e_signingFrameEventHandler.SigningFrameEventHandler();
			}
			const signingFrameEventHandler = SignLink.#signingFrameEventHandler;
			signingFrameEventHandler.startListening();
			signingFrameEventHandler.subscribeSliderCloseEvent();
		}
		preloadData() {
			return this.#loadData();
		}
		async openSlider(options) {
			if (!this.#loaded) {
				await this.#loadData();
			}
			const signLink = this;
			BX.SidePanel.Instance.open(signLinkSliderUrl, {
				width: 900,
				cacheable: false,
				allowCrossOrigin: true,
				allowCrossDomain: true,
				allowChangeHistory: false,
				// newWindowUrl: link,
				copyLinkLabel: true,
				newWindowLabel: true,
				loader: '/bitrix/js/intranet/sidepanel/bindings/images/sign_mask.svg',
				label: {
					text: main_core.Loc.getMessage('SIGN_V2_B2E_LINK_SLIDER_TITLE'),
					bgColor: '#C48300'
				},
				contentCallback() {
					return Promise.resolve(true).then(() => {
						return signLink.render();
					});
				},
				events: options?.events
			});
			this.#slider = BX.SidePanel.Instance.getSlider(signLinkSliderUrl);
		}
		renderTo(node) {
			if (!this.#container) {
				this.#container = document.createElement('div');
				main_core.Dom.addClass(this.#container, 'sign-ui-signing-link-container');
			}
			main_core.Dom.append(this.#container, node);
			this.render();
		}
		async render() {
			if (!this.#container) {
				this.#container = document.createElement('div');
				main_core.Dom.addClass(this.#container, 'sign-ui-signing-link-container');
			}
			if (!this.#loaded) {
				main_core.Dom.append(this.#getLoader(), this.#container);
				await this.#loadData();
				main_core.Dom.remove(this.#getLoader(), this.#container);
			}
			if (this.#uri) {
				if (this.#isNeedToContinueInBrowser() || this.#isNeedToContinueOnDesktop()) {
					this.#renderContinueInBrowserPage();
				} else if (this.#needToShowPageForEmployee()) {
					this.#renderDownloadSignedDocForEmployee();
				} else {
					this.#renderUrl();
				}
			} else {
				this.#renderError(this.#getErrorTitle(this.#errorCode), this.#errorMessage);
			}
			return this.#container;
		}
		async #loadData() {
			return this.#api.getLinkForSigning(this.#memberId, false).then(data => {
				if (data?.status === 'error') {
					throw data;
				}
				this.#uri = data.uri;
				this.#showHelpdeskGoskey = data.showHelpdeskGoskey;
				this.#requireBrowser = data?.requireBrowser ?? true;
				this.#mobileAllowed = data?.mobileAllowed ?? true;
				this.#employeeData = data?.employeeData ?? {};
				this.#loaded = true;
			}).catch(errors => {
				this.#loaded = true;
				this.#errorCode = errors?.errors?.[0]?.code;
				this.#errorMessage = errors?.errors?.[0]?.message;
			});
		}
		#getDownloadLink() {
			return this.#employeeData?.uri?.signedDocument;
		}
		async #getOrLoadDownloadLink() {
			if (!this.#employeeData?.uri?.signedDocument) {
				await this.#loadData();
			}
			return this.#getDownloadLink();
		}
		#getLoader() {
			return this.#cache.remember('mask', () => {
				return main_core.Tag.render`
				<div class="sign-ui-signing-link-loading-mask"></div>
			`;
			});
		}
		#renderError(title, message) {
			title = title || main_core.Loc.getMessage('SIGN_V2_B2E_LINK_ERROR_TITLE_PLACEHOLDER');
			title = main_core.Tag.safe`${title}`;
			message = message || main_core.Loc.getMessage('SIGN_V2_B2E_LINK_ERROR_MESSAGE_PLACEHOLDER');
			message = main_core.Tag.safe`${message}`;
			const el = main_core.Tag.render`
			<div class="ui-slider-no-access">
				<div class="ui-slider-no-access-inner">
					<div class="ui-slider-no-access-title">
						${title}
					</div>
					<div class="ui-slider-no-access-subtitle">
						${message}
					</div>
					<div class="ui-slider-no-access-img">
						<div class="ui-slider-no-access-img-inner"></div>
					</div>
				</div>
			</div>
		`;
			main_core.Dom.append(el, this.#container);
		}
		#getErrorTitle(errorCode) {
			if (errorCode === 'ACCESS_DENIED') {
				return main_core.Loc.getMessage('SIGN_V2_B2E_LINK_ERROR_CODE_ACCESS_DENIED');
			}
			return main_core.Loc.getMessage('SIGN_V2_B2E_LINK_ERROR_TITLE_PLACEHOLDER');
		}
		#renderUrl() {
			main_core.Dom.append(this.#getLoader(), this.#container);

			// redirect if opened directly (new tab)
			if (!BX.SidePanel.Instance.isOpen() || main_core.Browser.isMobile()) {
				window.location.href = this.#uri;
				return;
			}
			BX.SidePanel.Instance.newWindowUrl = window.location.href;
			this.#frameEventHandler = event => this.#handleIframeEvent(event);
			main_core.Event.bind(top, 'message', this.#frameEventHandler);
			this.#subscribeOnSliderCloseComplete();
			const frameStyles = 'position: absolute; left: 0; top: 0; padding: 0;' + ' border: none; margin: 0; width: 100%; height: 100%;';
			const onloadHandler = () => {
				main_core.Dom.remove(this.#getLoader());
			};
			const iframe = main_core.Tag.render`
			<iframe 
				src="${this.#uri}" 
				referrerpolicy="strict-origin" 
				style="${frameStyles}"
				onload="${onloadHandler}"
			></iframe>
		`;
			main_core.Dom.append(iframe, this.#container);
		}
		#renderContinueInBrowserPage() {
			main_core.Dom.append(main_core.Tag.render`
			<div class="sign-ui-signing-link__empty-state">
				<div class="sign-ui-signing-link__empty-state_icon"></div>
				<div class="sign-ui-signing-link__empty-state_title">
					${main_core.Text.encode(main_core.Loc.getMessage('SIGN_V2_B2E_LINK_DESKTOP_TITLE'))}
				</div>
				<div class="sign-ui-signing-link__empty-state_desc">
					${main_core.Text.encode(main_core.Loc.getMessage('SIGN_V2_B2E_LINK_DESKTOP_TEXT'))}
				</div>
				<a
					href="${main_core.Text.encode(this.#uri)}"
					target="_blank"
					class="ui-btn ui-btn-primary ui-btn-round"
					onclick="${this.#onContinueInBrowserClick.bind(this)}"
				>
					${main_core.Text.encode(main_core.Loc.getMessage('SIGN_V2_B2E_LINK_DESKTOP_BUTTON'))}
				</a>
			</div>
		`, this.#container);
		}
		#onContinueInBrowserClick(event) {
			if (this.#isDesktopApp()) {
				event?.preventDefault?.();
				BXDesktopSystem.ExecuteCommand('browse', this.#uri);
			}
			this.#slider?.close();
		}
		#renderDownloadSignedDocForEmployee() {
			main_core.Dom.append(main_core.Tag.render`
			<div class="sign-ui-signing-link__employee">
				<div class="sign-ui-signing-link__employee-header">
					<div class="sign-ui-signing-link__employee-header-header">
						<h2>${main_core.Text.encode(this.#employeeData.document.title)}</h2>
						<p>${main_core.Loc.getMessage('SIGN_V2_B2E_LINK_EMPLOYEE_DISCLAIMER_MSGVER1')}</p>
					</div>
					${this.#renderMemberInfo ? this.#renderMemberInfoBlock(this.#employeeData.member) : ''}
				</div>

				<div class="sign-ui-signing-link__employee-doc">
					<p>${main_core.Loc.getMessage('SIGN_V2_B2E_LINK_EMPLOYEE_SIGNED_DOC_MSG')}</p>
					<div>
						<div>
							<span class="sign-ui-signing-link__employee-doc--icon"></span>
							<div class="sign-ui-signing-link__employee-doc--info">
								<div class="sign-ui-signing-link__employee-doc--info-title">
									${main_core.Text.encode(this.#employeeData.document.title)}
								</div>
								<div class="sign-ui-signing-link__employee-doc--info-date">
									${main_core.Loc.getMessage('SIGN_V2_B2E_LINK_EMPLOYEE_DOCUMENT_DATE', {
			'#DATE#': main_date.DateTimeFormat.format(main_date.DateTimeFormat.getFormat('LONG_DATE_FORMAT'), this.#employeeData.dateSignedTs)
		})}
								</div>
							</div>
						</div>
						<a onclick="${this.#onDownloadButtonClick.bind(this)}" class="ui-btn ui-btn-success ui-btn-round ui-btn-sm" download>
							${main_core.Loc.getMessage('SIGN_V2_B2E_LINK_EMPLOYEE_SIGNED_DOC_BTN')}
						</a>
					</div>
				</div>
				
				<div onclick="BX.SidePanel.Instance.open('${main_core.Text.encode(this.#employeeData.uri.allDocuments)}')" class="sign-ui-signing-link__employee-alldocs" target="_blank">
					${main_core.Loc.getMessage('SIGN_V2_B2E_LINK_EMPLOYEE_BUTTON_ALLDOCS')}
				</div>
			</div>
		`, this.#container);
		}
		#renderMemberInfoBlock(memberInfo) {
			return main_core.Tag.render`
			<div class="sign-ui-signing-link__employee-header-person">
				<div class="sign-ui-signing-link__employee-header-person-photo">
					<img src="${main_core.Text.encode(memberInfo?.photo)}" alt="">
				</div>
				<div class="sign-ui-signing-link__employee-header-person-text">
					${main_core.Text.encode(memberInfo?.name)}
					<br>
					${main_core.Text.encode(memberInfo?.position)}
				</div>
			</div>
		`;
		}
		#needToShowPageForEmployee() {
			return this.#employeeData?.signed === true;
		}
		#isNeedToContinueInBrowser() {
			return this.#requireBrowser && this.#isDesktopApp();
		}
		#isNeedToContinueOnDesktop() {
			return main_core.Browser.isMobile() && !this.#mobileAllowed;
		}
		#isDesktopApp() {
			// return window.navigator.userAgent.includes('BitrixDesktop');
			return typeof BXDesktopSystem != "undefined" || typeof BXDesktopWindow != "undefined";
		}

		/**
		 * Calls when download button was clicked.
		 * @param {PointerEvent} event
		 */
		async #onDownloadButtonClick(event) {
			const target = event?.target;
			let downloadLink = this.#getDownloadLink();
			if (target && downloadLink) {
				target.href = downloadLink;
				return;
			}
			event?.preventDefault?.();
			event?.stopPropagation?.();
			downloadLink = await this.#getOrLoadDownloadLink();
			if (!target || !downloadLink) {
				window.top.BX.UI.Notification.Center.notify({
					content: main_core.Loc.getMessage('SIGN_V2_B2E_LINK_EMPLOYEE_SIGNED_DOC_NOT_READY')
				});
				return;
			}
			target.href = downloadLink;
			target.click();
		}
		#handleIframeEvent(event) {
			if (new URL(this.#uri).origin !== event.origin) {
				return;
			}
			if (main_core.Type.isString(event?.data)) {
				if (event.data === 'BX:SidePanel:close') {
					this.#closeSlider();
				}
				return;
			}
			if (!main_core.Type.isPlainObject(event?.data)) {
				return;
			}
			const message = event.data;
			if (message.type === 'BX:SidePanel:close') {
				this.#closeSlider();
			} else if (message.type === 'BX:Sign:processDone') {
				this.#closeSlider();
				this.#showProcessDoneNotification(message.role);
			}
		}
		#closeSlider() {
			this.#slider?.close();
			this.#unbindFrameEventHandler();
		}

		// 'onCloseComplete' instead of 'onClose': closing can be denied by the signing confirm popup,
		// unsubscribing on 'onClose' would lose the 'BX:Sign:processDone' message after such a deny
		#subscribeOnSliderCloseComplete() {
			if (this.#sliderCloseCompleteHandler) {
				return;
			}
			this.#sliderCloseCompleteHandler = event => {
				const [sliderEvent] = event.getData();
				if (sliderEvent?.getSlider()?.getUrl() !== signLinkSliderUrl) {
					return;
				}
				this.#unbindFrameEventHandler();
			};
			this.#getContext().BX.Event.EventEmitter.subscribe('SidePanel.Slider:onCloseComplete', this.#sliderCloseCompleteHandler);
		}
		#unbindFrameEventHandler() {
			main_core.Event.unbind(top, 'message', this.#frameEventHandler);
			if (this.#sliderCloseCompleteHandler) {
				this.#getContext().BX.Event.EventEmitter.unsubscribe('SidePanel.Slider:onCloseComplete', this.#sliderCloseCompleteHandler);
				this.#sliderCloseCompleteHandler = null;
			}
		}
		#getContext() {
			return window === top ? window : top;
		}
		#showProcessDoneNotification(role) {
			const messageKeyMap = {
				editor: 'SIGN_V2_B2E_LINK_PROCESS_DONE_EDITOR',
				reviewer: 'SIGN_V2_B2E_LINK_PROCESS_DONE_REVIEWER'
			};
			const messageKey = messageKeyMap[role];
			if (!messageKey) {
				return;
			}
			const content = main_core.Loc.getMessage(messageKey);
			if (content) {
				window.top.BX.UI.Notification.Center.notify({
					content,
					autoHideDelay: 5000
				});
			}
		}
	}

	exports.SignLink = SignLink;

})(this.BX.Sign.V2.B2e = this.BX.Sign.V2.B2e || {}, BX.UI, BX.UI.Sidepanel.Content, BX, BX.Main, BX, BX.Sign.V2, BX.Sign.V2.B2e);
//# sourceMappingURL=sign-link.bundle.js.map
