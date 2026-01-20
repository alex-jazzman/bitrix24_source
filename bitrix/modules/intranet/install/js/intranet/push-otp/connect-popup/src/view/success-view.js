import { Tag, Loc, Browser, Dom } from 'main.core';
import { BaseView } from './base-view';
import { Confetti } from 'ui.confetti';
import { Analytics } from '../analytics';

export class SuccessView extends BaseView
{
	render(): HTMLElement
	{
		// eslint-disable-next-line no-undef
		return Tag.render`
			<div class="intranet-push-otp-connect-popup-success-box">
				<div class="intranet-push-otp-connect-popup-success-logo"></div>
				<div class="intranet-push-otp-connect-popup-success-title">${Loc.getMessage('INTRANET_PUSH_OTP_CONNECT_POPUP_SUCCESS_TITLE')}</div>
				<div class="intranet-push-otp-connect-popup-success-subtitle">${Loc.getMessage('INTRANET_PUSH_OTP_CONNECT_POPUP_SUCCESS_SUBTITLE')}</div>
			</div>
		`;
	}

	afterShow(option: Object)
	{
		Analytics.sendEvent(Analytics.ADD_PHONE_SUCCESS);
		setTimeout(() => {
			this.#setConfetti();
		}, 500);
	}

	#setConfetti(): void
	{
		if (Browser.isFirefox())
		{
			const canvas = Tag.render`
				<canvas></canvas>
			`;
			Dom.style(canvas, 'position', 'fixed');
			Dom.style(canvas, 'top', '0px');
			Dom.style(canvas, 'left', '0px');
			Dom.style(canvas, 'pointer-events', 'none');
			Dom.style(canvas, 'z-index', '11111');
			Dom.style(canvas, 'width', '100%');
			Dom.style(canvas, 'height', '100%');
			Dom.append(canvas, document.body);
			const confetti = Confetti.create(canvas, {
				resize: true,
				useWorker: true,
			});
			confetti({
				particleCount: 250,
				origin: { y: 0.65 },
				spread: 100,
			});
		}
		else
		{
			Confetti.fire({
				particleCount: 250,
				spread: 100,
				origin: { y: 0.65 },
				zIndex: 111_111,
			});
		}
	}
}
