import { Tag, Cache, Dom, Loc, Text, Event, ajax as Ajax } from 'main.core';
import { Button, AirButtonStyle } from 'ui.buttons';
import { Outline } from 'ui.icon-set.api.core';
import { sendData } from 'ui.analytics';

export type RecoveryCodesOptions = {
	codes: Array<{ VALUE: string }>;
	downloadLink: string;
};

export class RecoveryCodes
{
	#cache = new Cache.MemoryCache();
	#options: RecoveryCodesOptions;

	constructor(options)
	{
		this.#options = options;
	}

	renderTo(element: HTMLElement): HTMLElement
	{
		Dom.append(this.#getHeaderContainer(), element);
		Dom.append(this.#getBodyContainer(), element);
	}

	#getHeaderContainer(): HTMLElement
	{
		return this.#cache.remember('header-container', () => {
			Event.bind(this.#getStatusContainer(), 'click', () => {
				Dom.toggleClass(this.#getChevron(), '--show');
				Dom.toggleClass(this.#getBodyContainer(), '--show');
			});
			const onclick = (event) => {
				event.preventDefault();
				top.BX.Helper.show('redirect=detail&code=26676294');
			};

			return Tag.render`
				<div class="intranet-user-otp-list__section-row-header-wrapper">
					<div class="intranet-user-otp-list__section-row-header">
						<div class="intranet-user-otp-list__row-label ui-text --md">
							<span class="ui-icon-set --o-note"></span>
							${Loc.getMessage('INTRANET_USER_OTP_LIST_RECOVERED_CODES')}
						</div>
						${this.#getStatusContainer()}
					</div>
					<p class="intranet-user-otp-list__section-row-description">
						${Loc.getMessage('INTRANET_USER_OTP_LIST_CODE_DESCRIPTION')}
					</p>
					<a onclick="${onclick}" class="intranet-user-otp-list__section-row-link ui-link ui-link-secondary ui-link-dashed">
						${Loc.getMessage('INTRANET_USER_OTP_LIST_MORE_BTN')}
					</p>
				</div>
			`;
		});
	}

	#getBodyContainer(): HTMLElement
	{
		return this.#cache.remember('body-container', () => {
			return Tag.render`
				<div id="row-content" class="intranet-user-otp-list__section-row-content">
					<div class="intranet-user-otp-list__section-row-content-wrapper">
						<div class="intranet-user-otp-list__section-row-divider"></div>
						${this.#options.codes.length > 0 ? this.#getBodyContent() : this.#getButtonStub()}
					</div>
				</div>
			`;
		});
	}

	#getStatusContainer(): HTMLElement
	{
		return this.#cache.remember('status-container', () => {
			return Tag.render`
				<div id="row-status" class="intranet-user-otp-list__row-status intranet-user-otp-list__row-status--clickable">
					${this.#getRemainderCodes()}
					${this.#getChevron()}
				</div>
			`;
		});
	}

	#getRemainderCodes(): HTMLElement
	{
		let icon = null;
		let text = null;

		if (this.#options.codes.length > 0)
		{
			icon = Tag.render`<div class="ui-icon-set --o-circle-check"></div>`;
			text = Loc.getMessage('INTRANET_USER_OTP_LIST_RECOVERED_CODES_COUNT', {
				'#COUNT#': this.#options.codes.length,
			});
		}
		else
		{
			icon = Tag.render`<div class="ui-icon-set --o-alert-accent"></div>`;
			text = Loc.getMessage('INTRANET_USER_OTP_LIST_RECOVERED_CODES_ENDED');
		}

		const container = Tag.render`
			<div class="intranet-user-otp-list__row-value ui-text --md">
				${text}
			</div>
		`;
		Dom.prepend(icon, container);

		return container;
	}

	#getChevron(): HTMLElement
	{
		return this.#cache.remember('chevron', () => {
			return Tag.render`
				<div id="row-chevron" class="ui-icon-set --chevron-down-s"></div>
			`;
		});
	}

	#getBodyContent(): HTMLElement
	{
		return this.#cache.remember('recovery-codes-list', () => {
			return Tag.render`
				<div class="intranet-otp-codes">
					${this.#getRecoveryCodesGrid()}
					${this.#getButtonsContainer()}
				</div>
			`;
		});
	}

	#getRecoveryCodesGrid(): HTMLElement
	{
		return this.#cache.remember('recovery-codes-grid', () => {
			const container = Tag.render`
				<ol class="intranet-otp-codes__grid ui-alert ui-alert-primary"/>
			`;
			this.#setRecoveryCodes(container);

			return container;
		});
	}

	#setRecoveryCodes(container: HTMLElement): void
	{
		this.#options.codes.forEach((code) => {
			Dom.append(Tag.render`
				<li class="ui-text --sm intranet-otp-codes__grid-item">
					${Text.encode(code.VALUE)}
				</li>
			`, container);
		});
	}

	#getButtonsContainer(): HTMLElement
	{
		return this.#cache.remember('buttons-container', () => {
			return Tag.render`
				<div class="intranet-otp-codes__button-section">
					<div class="intranet-otp-codes__button-container">
						${this.#getPrintButton().render()}
						${this.#getDownloadButton().render()}
					</div>
					<div class="intranet-otp-codes__button-container">
						${this.#getReloadButton().render()}
					</div>
				</div>
			`;
		});
	}

	#getPrintButton(): Button
	{
		return this.#cache.remember('print-button', () => {
			return new Button({
				text: Loc.getMessage('INTRANET_USER_OTP_LIST_PRINT_BTN'),
				size: Button.Size.SMALL,
				style: AirButtonStyle.PLAIN_NO_ACCENT,
				useAirDesign: true,
				icon: Outline.PRINTER,
				onclick: () => {
					window.print();
					this.#sendAnalyticsEvent('print_codes_click');
				},
			});
		});
	}

	#getDownloadButton(): Button
	{
		return this.#cache.remember('download-button', () => {
			return new Button({
				text: Loc.getMessage('INTRANET_USER_OTP_LIST_DOWNLOAD_BTN'),
				size: Button.Size.SMALL,
				style: AirButtonStyle.PLAIN_NO_ACCENT,
				useAirDesign: true,
				icon: Outline.DOWNLOAD,
				tag: Button.Tag.LINK,
				link: this.#options.downloadLink,
				onclick: () => {
					this.#sendAnalyticsEvent('install_codes_click');
				},
			});
		});
	}

	#getReloadButton(): Button
	{
		return this.#cache.remember('reload-button', () => {
			return new Button({
				text: Loc.getMessage('INTRANET_USER_OTP_LIST_RELOAD_BTN'),
				size: Button.Size.SMALL,
				style: AirButtonStyle.PLAIN_ACCENT,
				useAirDesign: true,
				icon: Outline.REFRESH,
				onclick: (button: Button) => {
					this.#sendAnalyticsEvent('refresh_code_click', 'security');
					button.setWaiting(true);
					// eslint-disable-next-line promise/catch-or-return
					this.#reloadCodes().then(() => {
						button.setWaiting(false);
					});
				},
			});
		});
	}

	#getButtonStub(): HTMLElement
	{
		return this.#cache.remember('button-stub', () => {
			return Tag.render`
				<div class="intranet-otp-codes__button-section">
					${this.#getStubReloadButton().render()}
				</div>
			`;
		});
	}

	#getStubReloadButton(): Button
	{
		return this.#cache.remember('stub-reload-button', () => {
			return new Button({
				text: Loc.getMessage('INTRANET_USER_OTP_LIST_RELOAD_BTN'),
				size: Button.Size.MEDIUM,
				style: AirButtonStyle.FILLED,
				useAirDesign: true,
				icon: Outline.REFRESH,
				wide: true,
				onclick: (button: Button) => {
					this.#sendAnalyticsEvent('refresh_code_click', 'baloon');
					button.setWaiting(true);
					// eslint-disable-next-line promise/catch-or-return
					this.#reloadCodes().then(() => {
						button.setWaiting(false);
						Dom.replace(this.#getButtonStub(), this.#getBodyContent());
					});
				},
			});
		});
	}

	#reloadCodes(): Promise<void>
	{
		return new Promise((resolve, reject) => {
			Ajax.runComponentAction('bitrix:security.user.recovery.codes', 'regenerateRecoveryCodes', {
				mode: 'ajax',
			}).then((response) => {
				this.#options.codes = response.data;
				Dom.clean(this.#getRecoveryCodesGrid());
				this.#setRecoveryCodes(this.#getRecoveryCodesGrid());
				resolve();
			}).catch((error) => {
				reject(error);
			});
		});
	}

	#sendAnalyticsEvent(eventName: string, cSection: string = null): void
	{
		const data = {
			tool: 'user_settings',
			category: 'security',
			event: eventName,
		};

		if (cSection)
		{
			data.c_section = cSection;
		}

		sendData(data);
	}
}
