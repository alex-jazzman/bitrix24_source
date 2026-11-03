import { Dom, Tag } from 'main.core';
import { type LicenseContentOptions } from '../types/options';
import { Content } from './content';
import { AdminRestrictedPopup } from '../popups/admin-restricted-popup';

export class LicenseContent extends Content
{
	constructor(options: LicenseContentOptions)
	{
		super(options);
		this.setEventNamespace('BX.Bitrix24.LicenseWidget.Content.License');
	}

	getLayout(): HTMLDivElement
	{
		return this.cache.remember('layout', () => {
			return Tag.render`
				<div data-id="license-widget-block-tariff"
					class="license-widget-item license-widget-item--main ${this.getOptions().isExpired || this.getOptions().isAlmostExpired ? 'license-widget-item--expired' : ''}"
				>
					<div class="license-widget-inner ${this.getOptions().isDemo ? '--demo' : ''}">
						<div class="license-widget-content">
							${this.getMainIcon()}
							<div class="license-widget-item-content">
								<div class="license-widget-item-name">
									<span>${this.getOptions().name}</span>
								</div>
								${this.getOptions().isExpired ? this.getExpiredMessage() : this.getRemainderMessage()}
								${this.getOptions().isExpired && this.getOptions().isAlmostBlocked ? this.getBlockMessage() : ''}
								${this.getOptions().isAlmostBlocked ? '' : this.getLink()}
							</div>
						</div>
						${this.getOptions().button.isAvailable ? this.getButton() : ''}
					</div>
				</div>
			`;
		});
	}

	getMainIcon(): HTMLElement
	{
		const icon = Tag.render`
			<div class="license-widget-item-icon" aria-hidden="true"/>
		`;

		if (this.getOptions().isAlmostExpired)
		{
			Dom.addClass(icon, 'license-widget-item-icon--low');
		}
		else if (this.getOptions().isExpired)
		{
			Dom.addClass(icon, 'license-widget-item-icon--expired');
		}
		else if (this.getOptions().isDemo)
		{
			Dom.addClass(icon, 'license-widget-item-icon--demo');
		}
		else
		{
			Dom.addClass(icon, 'license-widget-item-icon--pro');
		}

		return icon;
	}

	getButton(): HTMLElement
	{
		const className = `license-widget-item-btn ${
			this.getOptions().isDemo && !this.getOptions().isAlmostExpired && !this.getOptions().isExpired
				? 'license-widget-item-btn--green'
				: ''
		}`;

		if (this.getOptions().button.isAdminRestricted)
		{
			const onclick = (event) => {
				AdminRestrictedPopup.show(event.currentTarget);
			};

			return Tag.render`
				<button type="button" onclick="${onclick}" class="${className}">
					${this.getOptions().button.text}
				</button>
			`;
		}

		if (this.getOptions().button.type === 'POST')
		{
			return Tag.render`
				<form
					id="renew-license-form"
					class="license-widget-item-form"
					action="${this.getOptions().button.link}"
					method="post"
					target="_blank"
				>
					<input type="hidden" name="license_key" value="${this.getOptions().button.hashKey}">
					<button type="submit" class="${className}">
						${this.getOptions().button.text}
					</button>
				</form>
			`;
		}

		return Tag.render`
			<a
				href="${this.getOptions().button.link}"
				target="_blank"
				rel="noopener noreferrer"
				class="${className}"
			>
				${this.getOptions().button.text}
			</a>
		`;
	}

	getExpiredMessage(): HTMLElement
	{
		return this.cache.remember('expired-message', () => {
			return Tag.render`
				<div class="license-widget-item-expired-message">
					<span class="license-widget-item-info-text">
						${this.getOptions().messages.expired}
					</span>
				</div>
			`;
		});
	}

	getBlockMessage(): HTMLElement
	{
		return this.cache.remember('block-message', () => {
			return Tag.render`
				<div class="license-widget-item-expired-message --scanner-info">
					<span class="license-widget-item-info-text">
						${this.getOptions().messages.block}
					</span>
				</div>
			`;
		});
	}

	getRemainderMessage(): HTMLElement
	{
		return this.cache.remember('block-message', () => {
			if (this.getOptions().isExpired || this.getOptions().isAlmostExpired)
			{
				return Tag.render`
					<div class="license-widget-item-expired-message --scanner-info">
						<span class="license-widget-item-info-text">
							${this.getOptions().messages.remainder}
						</span>
					</div>
				`;
			}

			return Tag.render`
				<div class="license-widget-item-info">
					<span class="license-widget-item-info-text">
						${this.getOptions().messages.remainder}
					</span>
				</div>
			`;
		});
	}

	getLink(): HTMLElement
	{
		if (this.getOptions().more.isAdminRestricted)
		{
			const onclick = (event) => {
				AdminRestrictedPopup.show(event.currentTarget);
			};

			return Tag.render`
				<button type="button" onclick="${onclick}" class="license-widget-item-link-text">
					${this.getOptions().more.text}
				</button>
			`;
		}

		return Tag.render`
			<a
				href="${this.getOptions().more.link}"
				class="license-widget-item-link-text"
				target="_blank"
				rel="noopener noreferrer"
			>
				${this.getOptions().more.text}
			</a>
		`;
	}
}
