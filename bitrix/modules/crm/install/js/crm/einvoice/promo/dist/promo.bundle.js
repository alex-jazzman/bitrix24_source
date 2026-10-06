/* eslint-disable */
this.BX = this.BX || {};
this.BX.Crm = this.BX.Crm || {};
(function (exports, main_core, main_popup, ui_buttons, ui_iconSet_api_core, ui_iconSet_outline, ui_designTokens, ui_analytics, crm_integration_analytics) {
	'use strict';

	const PREVIEW_VIDEO_PATH = '/bitrix/js/crm/einvoice/promo/src/video/preview.webm';
	class Promo {
		#popup = null;
		#events;
		#analytics;
		#convertedViaPrimary = false;
		#listeners = {};
		constructor(options = {}) {
			this.#events = options.events ?? {};
			this.#analytics = options.analytics ?? null;
		}
		show() {
			this.#getPopup().show();
		}
		hide() {
			this.#popup?.close();
		}
		subscribe(eventName, callback) {
			(this.#listeners[eventName] ??= []).push(callback);
		}
		#emit(eventName) {
			(this.#listeners[eventName] ?? []).forEach(callback => callback());
		}
		#sendAnalytics(builderClass) {
			if (this.#analytics === null) {
				return;
			}
			const data = builderClass.createDefault(this.#analytics.c_section, this.#analytics.c_sub_section).buildData();
			if (data) {
				ui_analytics.sendData(data);
			}
		}
		#getPopup() {
			if (this.#popup === null) {
				this.#popup = this.#createPopup();
			}
			return this.#popup;
		}
		#createPopup() {
			return new main_popup.Popup({
				id: 'crm-einvoice-promo',
				className: 'crm__einvoice-promo-popup',
				content: this.#renderContent(),
				closeIcon: false,
				closeByEsc: true,
				padding: 0,
				borderRadius: '32px',
				overlay: {
					opacity: 40
				},
				animation: 'fading-slide',
				autoHide: false,
				cacheable: false,
				events: {
					onShow: () => {
						this.#sendAnalytics(crm_integration_analytics.Builder.EInvoicePromo.ViewEvent);
						this.#events.onShow?.();
						this.#emit('onShow');
					},
					onAfterClose: () => {
						if (!this.#convertedViaPrimary) {
							this.#sendAnalytics(crm_integration_analytics.Builder.EInvoicePromo.CloseEvent);
						}
						this.#events.onHide?.();
						this.#emit('onAfterHide');
						this.#popup = null;
					}
				}
			});
		}
		#renderContent() {
			return main_core.Tag.render`
			<div class="crm__einvoice-promo">
				${this.#renderCloseButton()}
				<div class="crm__einvoice-promo_content">
					<div class="crm__einvoice-promo_title">
						${main_core.Loc.getMessage('CRM_EINVOICE_PROMO_TITLE') || ''}
					</div>
					<div class="crm__einvoice-promo_description">
						<div class="crm__einvoice-promo_lead">
							${main_core.Loc.getMessage('CRM_EINVOICE_PROMO_DESCRIPTION') || ''}
						</div>
						${this.#renderBenefits()}
					</div>
					${this.#renderControls()}
				</div>
				${this.#renderAside()}
			</div>
		`;
		}
		#renderCloseButton() {
			const icon = new ui_iconSet_api_core.Icon({
				icon: ui_iconSet_api_core.Outline.CROSS_L,
				size: 24,
				color: 'var(--ui-color-accent-main-primary-alt-2)'
			}).render();
			return main_core.Tag.render`
			<div class="crm__einvoice-promo_close" onclick="${() => this.hide()}">
				${icon}
			</div>
		`;
		}
		#renderBenefits() {
			const benefit = (index, icon) => main_core.Tag.render`
			<div class="crm__einvoice-promo_benefit">
				<div class="crm__einvoice-promo_benefit-icon">
					${this.#renderBenefitIcon(icon)}
				</div>
				<div class="crm__einvoice-promo_benefit-text">
					${main_core.Loc.getMessage(`CRM_EINVOICE_PROMO_BENEFIT_${index}`) || ''}
				</div>
			</div>
		`;
			return main_core.Tag.render`
			<div class="crm__einvoice-promo_benefits">
				${benefit(1, ui_iconSet_api_core.Outline.REPEAT_CYCLE)}
				${benefit(2, ui_iconSet_api_core.Outline.EXCLAMATION_CIRCLE)}
			</div>
		`;
		}
		#renderBenefitIcon(icon) {
			return new ui_iconSet_api_core.Icon({
				icon,
				size: 28,
				color: 'var(--ui-color-accent-main-primary)'
			}).render();
		}
		#renderControls() {
			const primary = new ui_buttons.Button({
				text: main_core.Loc.getMessage('CRM_EINVOICE_PROMO_PRIMARY_BUTTON') || '',
				size: ui_buttons.ButtonSize.EXTRA_LARGE,
				style: ui_buttons.AirButtonStyle.FILLED,
				useAirDesign: true,
				onclick: () => {
					this.#convertedViaPrimary = true;
					this.#sendAnalytics(crm_integration_analytics.Builder.EInvoicePromo.ClickEvent);
					this.#events.onPrimaryClick?.();
				}
			});
			const secondary = new ui_buttons.Button({
				text: main_core.Loc.getMessage('CRM_EINVOICE_PROMO_SECONDARY_BUTTON') || '',
				size: ui_buttons.ButtonSize.EXTRA_LARGE,
				style: ui_buttons.AirButtonStyle.PLAIN,
				useAirDesign: true,
				onclick: () => this.#events.onRemindLater?.()
			});
			return main_core.Tag.render`
			<div class="crm__einvoice-promo_controls">
				${primary.render()}
				${secondary.render()}
			</div>
		`;
		}
		#renderAside() {
			return main_core.Tag.render`
			<div class="crm__einvoice-promo_aside">
				<div class="crm__einvoice-promo_preview">
					${this.#renderPreviewVideo()}
				</div>
				<div class="crm__einvoice-promo_mascot"></div>
			</div>
		`;
		}
		#renderPreviewVideo() {
			const video = main_core.Tag.render`
			<video
				class="crm__einvoice-promo_video"
				src="${PREVIEW_VIDEO_PATH}"
				autoplay
				preload
				loop
				muted
				playsinline
			></video>
		`;

			// eslint-disable-next-line @bitrix24/bitrix24-rules/no-native-events-binding
			video.addEventListener('canplay', () => {
				video.muted = true;
				video.play();
			});
			return video;
		}
	}

	exports.Promo = Promo;

})(this.BX.Crm.EInvoice = this.BX.Crm.EInvoice || {}, BX, BX.Main, BX.UI, BX.UI.IconSet, window, window, BX.UI.Analytics, BX.Crm.Integration.Analytics);
//# sourceMappingURL=promo.bundle.js.map
