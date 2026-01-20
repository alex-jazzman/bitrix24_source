import { BannerType } from './banner-type';
import { Tag, Loc, Event } from 'main.core';
import { AdminEnableMandatory } from './content/admin-enable-mandatory';
import type { BaseContent } from './content/base-content';
import { EnableOtp } from './content/enable-otp';
import { Popup, PopupWindowManager } from 'main.popup';
import { EnablePushOtp } from './content/enable-push-otp';
import { MandatoryEnableOtp } from './content/mandatory-enable-otp';
import { MandatoryEnablePushOtp } from './content/mandatory-enable-push-otp';

export class BannerFactory
{
	create(type: BannerType, options: Object = {}): Popup
	{
		const content = this.#createContent(type, options);

		return PopupWindowManager.create(
			content.getId(),
			null,
			{
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
					},
				},
			},
		);
	}

	createForBlockOtp(type: BannerType, options: Object = {}): Popup
	{
		const content = this.#createContent(type, options);

		return PopupWindowManager.create(
			content.getId(),
			null,
			{
				content: this.#renderContent(content),
				buttons: content.getButtons(),
				closeByEsc: !content.isTimeEnd(),
				padding: 24,
				className: 'intranet-otp-motivating-popup',
				overlay: true,
			},
		);
	}

	#renderContent(content: BaseContent): HTMLElement
	{
		return Tag.render`
			<div id="popup-content-1" class="intranet-otp-motivating-popup__content-wrapper">
				<div class="intranet-otp-motivating-popup__content">
					<div class="intranet-otp-motivating-popup__main-content">
						<h2 class="intranet-otp-motivating-popup__title ui-headline --lg">${content.getTitle()}</h2>
						<div class="intranet-otp-motivating-popup__text-wrapper">
							<p class="intranet-otp-motivating-popup__text ui-text --md">${content.getFirstContentBlock()}</p>
							${content.getMiddleBlock()}
							${this.#renderSecondContentBlock(content)}
						</div>
						<a onclick="top.BX.Helper.show('redirect=detail&code=26676294')" class="intranet-otp-motivating-popup__link ui-link ui-link-dashed">${Loc.getMessage('NOTIFY_BANNER_INFO_MORE_BTN')}</a>
						${this.#renderAlertBlock(content.getAlertContentBlock())}
					</div>
					<aside class="intranet-otp-motivating-popup__animation">
						${this.#renderVideo()}
					</aside>
				</div>
			</div>
		`;
	}

	#renderVideo(): HTMLElement
	{
		const videoElement = Tag.render`
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

		Event.bindOnce(videoElement, 'canplay', () => {
			videoElement.muted = true;
			videoElement.play();
		});

		return videoElement;
	}

	#renderAlertBlock(alertContent): ?HTMLElement
	{
		if (alertContent.length > 0)
		{
			return Tag.render`
				<div data-testid="bx-notify-banner-otp-info-alert-block" class="ui-alert ui-alert-danger">
					<span class="ui-alert-message ui-text --md">${alertContent}</span>
				</div>
			`;
		}

		return null;
	}

	#renderSecondContentBlock(content: BaseContent): ?HTMLElement
	{
		if (!content.getSecondContentBlock())
		{
			return null;
		}

		return Tag.render`
			<p class="intranet-otp-motivating-popup__text ui-text --md">${content.getSecondContentBlock()}</p>
		`;
	}

	#createContent(type: BannerType, options: Object = {}): BaseContent
	{
		if (type === BannerType.DISABLED_ALL_2FA)
		{
			return new EnableOtp(options);
		}

		if (type === BannerType.MANDATORY_2FA)
		{
			return new MandatoryEnableOtp(options);
		}

		if (type === BannerType.ENABLED_OLD_2FA)
		{
			return new EnablePushOtp(options);
		}

		if (type === BannerType.ENABLED_OLD_2FA_AND_NEED_PUSH_2FA)
		{
			return new MandatoryEnablePushOtp(options);
		}

		if (type === BannerType.ONLY_ADMIN_ENABLED_NEW_2FA)
		{
			return new AdminEnableMandatory(options);
		}

		throw new Error(`Unexpected banner type: ${type}`);
	}
}
