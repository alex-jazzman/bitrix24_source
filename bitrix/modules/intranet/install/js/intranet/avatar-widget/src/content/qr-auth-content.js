import { Tag } from 'main.core';
import { EventEmitter } from 'main.core.events';
import { QrAuthorization } from 'ui.qrauthorization';
import { Content } from './content';
import { AirButtonStyle, Button } from 'ui.buttons';
import type { QrAuthContentOptions } from '../types';

export class QrAuthContent extends Content
{
	getOptions(): QrAuthContentOptions
	{
		return super.getOptions();
	}

	getConfig(): Object
	{
		if (this.getOptions().isSmall)
		{
			return {
				html: this.getLayout(),
			};
		}

		return {
			html: this.getLayout(),
			minHeight: '190px',
			flex: 0.5,
		};
	}

	getLayout(): HTMLElement
	{
		return this.cache.remember('layout', () => {
			if (this.getOptions().isSmall)
			{
				return this.#getSmallState();
			}

			return this.#getFullState();
		});
	}

	#getFullState(): HTMLElement
	{
		return this.cache.remember('fullState', () => {
			return Tag.render`
				<div class="intranet-avatar-widget-item__wrapper --column-format" data-id="bx-avatar-widget-content-qr-auth">
					<span class="intranet-avatar-widget-item__title --qr-auth-full">${this.getOptions().title}</span>
					<div class="intranet-avatar-widget-item-qr-auth__wrapper">
						<i class="intranet-avatar-widget-item-qr-auth__icon ui-icon-set --o-qr-code"></i>
					</div>
					${this.#getButton()}
				</div>
			`;
		});
	}

	#getSmallState(): HTMLElement
	{
		return this.cache.remember('smallState', () => {
			return Tag.render`
				<div class="intranet-avatar-widget-item__wrapper --column-format" data-id="bx-avatar-widget-content-qr-auth">
					<div class="intranet-avatar-widget-item__wrapper-title">
						<i class="ui-icon-set --o-qr-code intranet-avatar-widget-item__icon"/>
						<span class="intranet-avatar-widget-item__title --qr-auth-small">${this.getOptions().title}</span>
					</div>
					${this.#getButton()}
				</div>
			`;
		});
	}

	#getButton(): HTMLElement
	{
		return this.cache.remember('button', () => {
			const onclick = () => {
				EventEmitter.emit('BX.Intranet.AvatarWidget.Popup:openChild');
				(new QrAuthorization({
					title: this.getOptions().popup?.title,
					content: this.getOptions().popup?.description,
					intent: 'profile',
				})).show();
			};
			const button = new Button({
				size: Button.Size.EXTRA_EXTRA_SMALL,
				text: this.getOptions().buttonTitle,
				useAirDesign: true,
				style: AirButtonStyle.OUTLINE,
				noCaps: true,
				wide: true,
				onclick,
			});

			return button.render();
		});
	}
}
