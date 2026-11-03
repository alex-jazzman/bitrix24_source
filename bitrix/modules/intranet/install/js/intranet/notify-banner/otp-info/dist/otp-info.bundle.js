/* eslint-disable */
this.BX = this.BX || {};
this.BX.Intranet = this.BX.Intranet || {};
(function (exports, main_core, ui_buttons, ui_analytics, main_popup, main_date) {
	'use strict';

	class BannerType {
		static DISABLED_ALL_2FA = 1;
		static MANDATORY_2FA = 2;
		static ENABLED_OLD_2FA = 3;
		static ENABLED_OLD_2FA_AND_NEED_PUSH_2FA = 4;
		static ONLY_ADMIN_ENABLED_NEW_2FA = 5;
	}

	class ButtonFactory {
		#settingsUrl;
		#pushOtpPopupProvider;
		#content;
		constructor(options, content) {
			this.#settingsUrl = main_core.Type.isStringFilled(options.settingsUrl) ? options.settingsUrl : '';
			this.#pushOtpPopupProvider = main_core.Type.isFunction(options.pushOtpPopupProvider) ? options.pushOtpPopupProvider : () => new Promise();
			this.#content = content;
		}
		createEnableBtn() {
			return new ui_buttons.Button({
				text: main_core.Loc.getMessage('NOTIFY_BANNER_INFO_ENABLE_BTN'),
				size: BX.UI.Button.Size.LARGE,
				style: BX.UI.AirButtonStyle.FILLED,
				useAirDesign: true,
				onclick: this.clickEnableOtp.bind(this),
				props: {
					'data-testid': 'bx-notify-banner-info-enable-otp-btn'
				}
			});
		}
		createLaterBtn() {
			return new ui_buttons.Button({
				text: main_core.Loc.getMessage('NOTIFY_BANNER_INFO_LATER_BTN'),
				size: BX.UI.Button.Size.LARGE,
				style: BX.UI.AirButtonStyle.PLAIN_NO_ACCENT,
				useAirDesign: true,
				onclick: event => {
					this.#content.onClickLater();
					event.context?.close();
				},
				props: {
					'data-testid': 'bx-notify-banner-info-later-btn'
				}
			});
		}
		createEnableMandatoryBtn() {
			return new ui_buttons.Button({
				text: main_core.Loc.getMessage('NOTIFY_BANNER_INFO_ENABLE_ALL_BTN'),
				size: BX.UI.Button.Size.LARGE,
				style: BX.UI.AirButtonStyle.FILLED,
				useAirDesign: true,
				onclick: event => {
					event.context?.close();
					this.#content.onClickEnable();
					BX.SidePanel.Instance.open(`${this.#settingsUrl}?page=security&analyticContext=popup_push_otp`);
				},
				props: {
					'data-testid': 'bx-notify-banner-info-enable-mandatory-otp-btn'
				}
			});
		}
		clickEnableOtp(event) {
			if (event.isWaiting()) {
				return;
			}
			this.#content.onClickEnable();
			event.setWaiting(true);
			this.#pushOtpPopupProvider(() => event.context?.close()).then(popup => {
				popup.show();
				event.setWaiting(false);
			}).catch(() => {
				event.setWaiting(false);
			});
		}
	}

	class BaseContent {
		constructor(options) {
			this.btnFactory = new ButtonFactory(options, this);
		}
		getId() {
			return '';
		}
		getTitle() {
			return '';
		}
		getFirstContentBlock() {
			return '';
		}
		getSecondContentBlock() {
			return '';
		}
		getButtons() {
			return [];
		}
		getAlertContentBlock() {
			return '';
		}
		getMiddleBlock() {
			return main_core.Tag.render``;
		}
		isTimeEnd() {
			return false;
		}
		onShow() {
			this.#sendAnalytics('show');
		}
		onClickEnable() {
			this.#sendAnalytics('click', 'on');
		}
		onClickLater() {
			this.#sendAnalytics('click', 'later');
		}
		getAnalyticsType() {
			return '';
		}
		getAnalyticsCategory() {
			return '';
		}
		#sendAnalytics(event, cSection = null) {
			const options = {
				tool: 'push',
				event
			};
			if (cSection) {
				options.c_section = cSection;
			}
			if (this.getAnalyticsType()) {
				options.type = this.getAnalyticsType();
			}
			if (this.getAnalyticsCategory()) {
				options.category = this.getAnalyticsCategory();
			}
			ui_analytics.sendData(options);
		}
	}

	class AdminEnableMandatory extends BaseContent {
		getId() {
			return 'admin-enable-mandatory';
		}
		getTitle() {
			return main_core.Loc.getMessage('NOTIFY_BANNER_INFO_DEF_TITLE_MSGVER_1');
		}
		getFirstContentBlock() {
			return main_core.Loc.getMessage('NOTIFY_BANNER_INFO_ALL_EMPLOYEE_BLOCK');
		}
		getSecondContentBlock() {
			return main_core.Loc.getMessage('NOTIFY_BANNER_INFO_IS_PROJECT_BLOCK');
		}
		getMiddleBlock() {
			return main_core.Tag.render`
			<ul class="intranet-otp-motivating-popup__list ui-text --md">
				<li class="intranet-otp-motivating-popup__list-item">
					<span class="ui-icon-set --lock-l"></span>
					${main_core.Loc.getMessage('NOTIFY_BANNER_INFO_LEAK_OPT')}
				</li>
				<li class="intranet-otp-motivating-popup__list-item">
					<span class="ui-icon-set --o-trend-down"></span>
					${main_core.Loc.getMessage('NOTIFY_BANNER_INFO_FIN_OPT')}
				</li>
				<li class="intranet-otp-motivating-popup__list-item">
					<span class="ui-icon-set --o-suitcase"></span>
					${main_core.Loc.getMessage('NOTIFY_BANNER_INFO_LEGAL_OPT')}
				</li>
			</ul>
		`;
		}
		getButtons() {
			return [this.btnFactory.createEnableMandatoryBtn(), this.btnFactory.createLaterBtn()];
		}
		getAnalyticsCategory() {
			return 'push_2fa_all';
		}
	}

	class EnableOtp extends BaseContent {
		getId() {
			return 'enable-otp';
		}
		getTitle() {
			return main_core.Loc.getMessage('NOTIFY_BANNER_INFO_DEF_COMPANY_DATA_TITLE_MSGVER_1');
		}
		getFirstContentBlock() {
			return main_core.Loc.getMessage('NOTIFY_BANNER_INFO_WARNING_BLOCK_MSGVER_1');
		}
		getSecondContentBlock() {
			return main_core.Loc.getMessage('NOTIFY_BANNER_INFO_DESC_BLOCK_MSGVER_1');
		}
		getButtons() {
			return [this.btnFactory.createEnableBtn(), this.btnFactory.createLaterBtn()];
		}
		getAnalyticsType() {
			return 'new_2fa';
		}
		getAnalyticsCategory() {
			return 'push_2fa';
		}
	}

	class EnablePushOtp extends BaseContent {
		getId() {
			return 'enable-push-otp';
		}
		getTitle() {
			return main_core.Loc.getMessage('NOTIFY_BANNER_INFO_CONFIRM_WITHOUT_TITLE_MSGVER_1', {
				'[SPAN]': '<span class="intranet-otp-motivating-popup__title--accent">',
				'[/SPAN]': '</span>'
			});
		}
		getFirstContentBlock() {
			return main_core.Loc.getMessage('NOTIFY_BANNER_INFO_EXIST_BLOCK_MSGVER_1');
		}
		getButtons() {
			return [this.btnFactory.createEnableBtn(), this.btnFactory.createLaterBtn()];
		}
		getAnalyticsType() {
			return 'renew_2fa';
		}
		getAnalyticsCategory() {
			return 'push_2fa';
		}
	}

	class MandatoryEnableOtp extends BaseContent {
		#endDateTs;
		#promoteMode;
		#formatEndDate;
		#blockMode;
		constructor(options) {
			super(options);
			this.#promoteMode = options.promoteMode;
			this.#endDateTs = options.endDate;
			this.#formatEndDate = options.formatEndDate;
			this.#blockMode = options.blockMode === true;
		}
		getId() {
			return 'mandatory-enable-otp';
		}
		getTitle() {
			return main_core.Loc.getMessage('NOTIFY_BANNER_INFO_DEF_COMPANY_DATA_TITLE_MSGVER_1');
		}
		getFirstContentBlock() {
			return main_core.Loc.getMessage('NOTIFY_BANNER_INFO_WARNING_BLOCK_MSGVER_1');
		}
		getSecondContentBlock() {
			return main_core.Loc.getMessage('NOTIFY_BANNER_INFO_DESC_BLOCK_MSGVER_1');
		}
		getAlertContentBlock() {
			if (!this.#endDateTs) {
				return '';
			}
			if (this.#promoteMode === 'high') {
				return main_core.Loc.getMessage('NOTIFY_BANNER_INFO_REQ_BLOCK_HIGH_PROMOTE_MSGVER_1', {
					'#END_DATE#': main_date.DateTimeFormat.format(this.#formatEndDate, this.#endDateTs)
				});
			}
			return main_core.Loc.getMessage('NOTIFY_BANNER_INFO_REQ_BLOCK_MSGVER_1', {
				'#END_DATE#': main_date.DateTimeFormat.format(this.#formatEndDate, this.#endDateTs)
			});
		}
		isTimeEnd() {
			const endDate = new Date(this.#endDateTs * 1000);
			const now = new Date();
			return endDate <= now;
		}
		getButtons() {
			const buttons = [this.btnFactory.createEnableBtn()];
			if (this.#blockMode) {
				return buttons;
			}
			if (!this.isTimeEnd() || !this.#endDateTs) {
				buttons.push(this.btnFactory.createLaterBtn());
			}
			return buttons;
		}
		getAnalyticsType() {
			return 'new_2fa';
		}
		getAnalyticsCategory() {
			return 'push_2fa_period';
		}
	}

	class MandatoryEnablePushOtp extends BaseContent {
		#endDateTs;
		#promoteMode;
		#formatEndDate;
		constructor(options) {
			super(options);
			this.#promoteMode = options.promoteMode;
			this.#endDateTs = options.endDate;
			this.#formatEndDate = options.formatEndDate;
		}
		getId() {
			return 'mandatory-enable-push-otp';
		}
		getTitle() {
			return main_core.Loc.getMessage('NOTIFY_BANNER_INFO_CONFIRM_WITHOUT_TITLE_MSGVER_1', {
				'[SPAN]': '<span class="intranet-otp-motivating-popup__title--accent">',
				'[/SPAN]': '</span>'
			});
		}
		getFirstContentBlock() {
			return main_core.Loc.getMessage('NOTIFY_BANNER_INFO_EXIST_BLOCK_MSGVER_1');
		}
		getAlertContentBlock() {
			if (this.#promoteMode === 'high') {
				return main_core.Loc.getMessage('NOTIFY_BANNER_INFO_REQ_BLOCK_HIGH_PROMOTE_MSGVER_1', {
					'#END_DATE#': main_date.DateTimeFormat.format(this.#formatEndDate, this.#endDateTs)
				});
			}
			return main_core.Loc.getMessage('NOTIFY_BANNER_INFO_REQ_BLOCK_MSGVER_1', {
				'#END_DATE#': main_date.DateTimeFormat.format(this.#formatEndDate, this.#endDateTs)
			});
		}
		isTimeEnd() {
			const endDate = new Date(this.#endDateTs * 1000);
			const now = new Date();
			return endDate <= now;
		}
		getButtons() {
			const buttons = [this.btnFactory.createEnableBtn()];
			if (!this.isTimeEnd()) {
				buttons.push(this.btnFactory.createLaterBtn());
			}
			return buttons;
		}
		getAnalyticsType() {
			return 'renew_2fa';
		}
		getAnalyticsCategory() {
			return 'push_2fa_period';
		}
	}

	class BannerFactory {
		create(type, options = {}) {
			const content = this.#createContent(type, options);
			return main_popup.PopupWindowManager.create(content.getId(), null, {
				content: this.#renderContent(content),
				buttons: content.getButtons(),
				closeByEsc: !content.isTimeEnd(),
				padding: 24,
				className: 'intranet-otp-motivating-popup',
				overlay: true,
				events: {
					onPopupShow: () => {
						BX.userOptions.save('intranet', 'push_otp_popup_last_show', null, BX.Main.DateTimeFormat.format('d.m.Y'));
						BX.userOptions.save('intranet', 'push_otp_popup_last_show_type', null, type);
						content.onShow();
					}
				}
			});
		}
		createForBlockOtp(type, options = {}) {
			const content = this.#createContent(type, {
				...options,
				blockMode: true
			});
			return main_popup.PopupWindowManager.create(content.getId(), null, {
				content: this.#renderContent(content),
				buttons: content.getButtons(),
				closeByEsc: false,
				padding: 24,
				className: 'intranet-otp-motivating-popup',
				overlay: true
			});
		}
		#renderContent(content) {
			return main_core.Tag.render`
			<div id="popup-content-1" class="intranet-otp-motivating-popup__content-wrapper">
				<div class="intranet-otp-motivating-popup__content">
					<div class="intranet-otp-motivating-popup__main-content">
						<h2 class="intranet-otp-motivating-popup__title ui-headline --lg">${content.getTitle()}</h2>
						<div class="intranet-otp-motivating-popup__text-wrapper">
							<p class="intranet-otp-motivating-popup__text ui-text --md">${content.getFirstContentBlock()}</p>
							${content.getMiddleBlock()}
							${this.#renderSecondContentBlock(content)}
						</div>
						<a onclick="top.BX.Helper.show('redirect=detail&code=26676294')" class="intranet-otp-motivating-popup__link ui-link ui-link-dashed">${main_core.Loc.getMessage('NOTIFY_BANNER_INFO_MORE_BTN')}</a>
						${this.#renderAlertBlock(content.getAlertContentBlock())}
					</div>
					<aside class="intranet-otp-motivating-popup__animation">
						${this.#renderVideo()}
					</aside>
				</div>
			</div>
		`;
		}
		#renderVideo() {
			const videoElement = main_core.Tag.render`
			<video
				src="/bitrix/js/intranet/notify-banner/otp-info/video/2fa-animation.webm"
				autoplay
				loop
				muted
				playsinline
				width="286"
				height="400"
			></video>
		`;
			main_core.Event.bindOnce(videoElement, 'canplay', () => {
				videoElement.muted = true;
				videoElement.play();
			});
			return videoElement;
		}
		#renderAlertBlock(alertContent) {
			if (alertContent.length > 0) {
				return main_core.Tag.render`
				<div data-testid="bx-notify-banner-otp-info-alert-block" class="ui-alert ui-alert-danger">
					<span class="ui-alert-message ui-text --md">${alertContent}</span>
				</div>
			`;
			}
			return null;
		}
		#renderSecondContentBlock(content) {
			if (!content.getSecondContentBlock()) {
				return null;
			}
			return main_core.Tag.render`
			<p class="intranet-otp-motivating-popup__text ui-text --md">${content.getSecondContentBlock()}</p>
		`;
		}
		#createContent(type, options = {}) {
			if (type === BannerType.DISABLED_ALL_2FA) {
				return new EnableOtp(options);
			}
			if (type === BannerType.MANDATORY_2FA) {
				return new MandatoryEnableOtp(options);
			}
			if (type === BannerType.ENABLED_OLD_2FA) {
				return new EnablePushOtp(options);
			}
			if (type === BannerType.ENABLED_OLD_2FA_AND_NEED_PUSH_2FA) {
				return new MandatoryEnablePushOtp(options);
			}
			if (type === BannerType.ONLY_ADMIN_ENABLED_NEW_2FA) {
				return new AdminEnableMandatory(options);
			}
			throw new Error(`Unexpected banner type: ${type}`);
		}
	}

	exports.BannerFactory = BannerFactory;
	exports.BannerType = BannerType;

})(this.BX.Intranet.NotifyBanner = this.BX.Intranet.NotifyBanner || {}, BX, BX.UI, BX.UI.Analytics, BX.Main, BX.Main);
//# sourceMappingURL=otp-info.bundle.js.map
