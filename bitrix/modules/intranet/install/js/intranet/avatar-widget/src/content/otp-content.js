import { Tag } from 'main.core';
import { AirButtonStyle, Button } from 'ui.buttons';
import { Content } from './content';
import { Analytics } from '../analytics';
import type { OtpContentOptions } from '../types';

export class OtpContent extends Content
{
	getOptions(): OtpContentOptions
	{
		return super.getOptions();
	}

	getLayout(): HTMLElement
	{
		return this.cache.remember('layout', () => {
			if (this.getOptions().isActive)
			{
				return this.#getConnectedState();
			}

			return this.#getCanConnectState();
		});
	}

	#getCanConnectState(): HTMLElement
	{
		return this.cache.remember('canConnectState', () => {
			return Tag.render`
				<div class="intranet-avatar-widget-item__wrapper --column-format" data-id="bx-avatar-widget-content-otp">
					<div class="intranet-avatar-widget-item__wrapper-title">
						<i class="ui-icon-set --o-shield intranet-avatar-widget-item__icon --active"/>
						<span class="intranet-avatar-widget-item__title">${this.getOptions().title}</span>
					</div>
					${this.#getButton()}
				</div>
			`;
		});
	}

	#getConnectedState(): HTMLElement
	{
		return this.cache.remember('canConnectState', () => {
			const onclick = () => {
				this.#openSettingsSlider();
			};

			return Tag.render`
				<div class="intranet-avatar-widget-item__wrapper --column-format" data-id="bx-avatar-widget-content-otp">
					<div class="intranet-avatar-widget-item__wrapper-title">
						<i class="ui-icon-set --o-shield intranet-avatar-widget-item__icon"/>
						<div class="intranet-avatar-widget-item__info-wrapper">
							<span class="intranet-avatar-widget-item__title">${this.getOptions().title}</span>
							<span onclick="${onclick}" class="intranet-avatar-widget-item__link">${this.getOptions().settingsButtonTitle}</span>
						</div>
					</div>
					<div class="intranet-avatar-widget-item__status">
						<i class="ui-icon-set --check-s"></i>
						${this.getOptions().connectStatus}
					</div>
				</div>
			`;
		});
	}

	#getButton(): HTMLElement
	{
		return this.cache.remember('button', () => {
			const button = new Button({
				size: Button.Size.SMALL,
				text: this.getOptions().connectButtonTitle,
				useAirDesign: true,
				style: AirButtonStyle.OUTLINE_ACCENT_2,
				noCaps: true,
				wide: true,
				onclick: () => {
					this.#openSettingsSlider();
				},
			});

			return button.render();
		});
	}

	#openSettingsSlider(): void
	{
		Analytics.send(Analytics.EVENT_CLICK_2FA_SETUP);
		BX.SidePanel.Instance.open(this.getOptions().settingsPath, { width: 1100 });
	}
}
