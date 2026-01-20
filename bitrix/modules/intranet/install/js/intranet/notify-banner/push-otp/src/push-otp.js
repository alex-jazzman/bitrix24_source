import { Tag, Type, Loc, Dom } from 'main.core';
import 'ui.design-tokens';
import 'ui.system.typography';
import './style.css';
import { Button } from 'ui.buttons';

export class PushOtp
{
	#needShowAdditionalBtn: boolean;
	#clickEnableBtn: ?function;
	#clickDisableBtn: ?function;
	#title: ?string;
	#text: ?string;

	constructor(options)
	{
		this.#clickEnableBtn = Type.isFunction(options.clickEnableBtn) ? options.clickEnableBtn : null;
		this.#clickDisableBtn = Type.isFunction(options.clickDisableBtn) ? options.clickDisableBtn : null;
		this.#needShowAdditionalBtn = Type.isFunction(options.clickDisableBtn);
		this.#title = Type.isStringFilled(options.title) ? options.title : '';
		this.#text = Type.isStringFilled(options.text) ? options.text : '';
	}

	render(): HTMLElement
	{
		let additionalBtn = null;

		if (this.#needShowAdditionalBtn)
		{
			additionalBtn = new Button({
				text: Loc.getMessage('NOTIFY_BANNER_PUSH_OTP_TIP'),
				noCaps: true,
				size: Button.Size.MD,
				style: BX.UI.AirButtonStyle.PLAIN_NO_ACCENT,
				useAirDesign: true,
				onclick: this.#clickDisableBtn,
				props: {
					'data-testid': 'bx-notify-banner-push-otp-tip-btn',
				},
			});
		}

		const button = new Button({
			text: Loc.getMessage('NOTIFY_BANNER_PUSH_OTP_BTN'),
			noCaps: true,
			size: Button.Size.MD,
			useAirDesign: true,
			onclick: this.#clickEnableBtn,
			props: {
				'data-testid': 'bx-notify-banner-push-otp-enable-btn',
			},
		});

		return Tag.render`
			<div class="intranet-settings-info-banner">
				<div class="intranet-settings-info-banner__container">
					<div class="intranet-settings-info-banner__content">
						<h2 class="ui-headline --xs -accent">
							${this.#title}
						</h2>
						<p class="ui-text --xs">
							${this.#text}
						</p>
					</div>
					<div class="intranet-settings-info-banner__footer">
						${button.render()}
						${additionalBtn?.render()}
					</div>
				</div>
			</div>
		`;
	}

	renderTo(container: HTMLElement): void
	{
		if (Type.isDomNode(container))
		{
			Dom.append(this.render(), container);
		}
	}
}
