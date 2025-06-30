import { Browser, Tag } from 'main.core';
import { Menu } from 'main.popup';
import { AirButtonStyle, Button } from 'ui.buttons';
import { Content } from './content';
import { Analytics } from '../analytics';
import type { DesktopContentOptions, ConfigOptions } from '../types';

export class DesktopContent extends Content
{
	#isLinux: boolean;
	#isMac: boolean;
	#isWindows: boolean;

	constructor(options: DesktopContentOptions)
	{
		super(options);
		this.#isLinux = Browser.isLinux();
		this.#isWindows = Browser.isWin();
		this.#isMac = Browser.isMac();
	}

	getConfig(): ConfigOptions
	{
		return {
			html: this.getLayout(),
			displayBlock: !this.getOptions().isSmall,
		};
	}

	getLayout(): HTMLElement
	{
		return this.cache.remember('layout', () => {
			if (this.#isInstalledState())
			{
				return this.#getInstalledState();
			}

			return this.#getDefaultState();
		});
	}

	#getInstalledState(): HTMLElement
	{
		return this.cache.remember('installedState', () => {
			return Tag.render`
				<div class="intranet-avatar-widget-item__wrapper --column-format" data-id="bx-avatar-widget-content-desktop">
					<div class="intranet-avatar-widget-item__wrapper-title">
						<i class="ui-icon-set --o-screen intranet-avatar-widget-item__icon"/>
						<div class="intranet-avatar-widget-item__info-wrapper">
							${this.#getTitle()}
							${this.#getLink()}
						</div>
					</div>
					<div class="intranet-avatar-widget-item__status">
						<i class="ui-icon-set --check-s"></i>
						${this.getOptions().statusName}
					</div>
				</div>
			`;
		});
	}

	#getDefaultState(): HTMLElement
	{
		return this.cache.remember('defaultState', () => {
			return Tag.render`
				<div class="intranet-avatar-widget-item__wrapper --column-format" data-id="bx-avatar-widget-content-desktop">
					<div class="intranet-avatar-widget-item__wrapper-title">
						<i class="ui-icon-set --o-screen intranet-avatar-widget-item__icon --active"/>
						${this.#getTitle()}
					</div>
					${this.#getButton()}
				</div>
			`;
		});
	}

	#isInstalledState(): boolean
	{
		if (this.#isLinux && this.getOptions().installInfo?.linux)
		{
			return true;
		}

		if (this.#isMac && this.getOptions().installInfo?.mac)
		{
			return true;
		}

		return this.#isWindows && this.getOptions().installInfo?.windows;
	}

	#getTitle(): HTMLElement
	{
		return this.cache.remember('title', () => {
			let title = '';

			if (this.#isLinux)
			{
				title = this.getOptions().title.linux;
			}
			else if (this.#isMac)
			{
				title = this.getOptions().title.mac;
			}
			else if (this.#isWindows)
			{
				title = this.getOptions().title.windows;
			}

			return Tag.render`
				<div class="intranet-avatar-widget-item__title">
					<span class="intranet-avatar-widget-item__title-text">${title}</span>
				</div>
			`;
		});
	}

	#getLink(): HTMLElement
	{
		return this.cache.remember('link', () => {
			return Tag.render`
				<span onclick="${(event) => this.#onClick(event)}" class="intranet-avatar-widget-item__link">
					${this.getOptions().linkName}
				</span>
			`;
		});
	}

	#getButton(): HTMLElement
	{
		return this.cache.remember('button', () => {
			const button = new Button({
				size: Button.Size.SMALL,
				text: this.getOptions().buttonName,
				useAirDesign: true,
				style: AirButtonStyle.OUTLINE_ACCENT_2,
				noCaps: true,
				wide: true,
				onclick: (event) => {
					this.#onClick(event);
				},
			});

			return button.render();
		});
	}

	#onClick(target): ?string
	{
		Analytics.send(Analytics.EVENT_CLICK_INSTALL_DESKTOP_APP);

		if (this.#isLinux)
		{
			this.#getLinuxMenu(target).toggle();
		}
		else if (this.#isMac && this.getOptions().downloadLinks?.macos)
		{
			document.location.href = this.getOptions().downloadLinks.macos;
		}
		else if (this.#isWindows && this.getOptions().downloadLinks?.windows)
		{
			document.location.href = this.getOptions().downloadLinks.windows;
		}
	}

	#getLinuxMenu(target: Button | HTMLElement): Menu
	{
		return this.cache.remember('linuxMenu', () => {
			let bindElement = null;
			let offsetLeft = 0;
			let offsetTop = 0;

			if (target instanceof Button)
			{
				bindElement = target.getContainer();
				offsetLeft = 83;
			}
			else
			{
				bindElement = target;
				offsetLeft = 5;
				offsetTop = 10;
			}

			return new Menu({
				bindElement,
				items: [
					{
						text: this.getOptions().linuxMenuTitles.deb,
						href: this.getOptions().downloadLinks.linuxDeb,
						onclick: () => {
							this.#getLinuxMenu().close();
						},
					},
					{
						text: this.getOptions().linuxMenuTitles.rpm,
						href: this.getOptions().downloadLinks.linuxRpm,
						onclick: () => {
							this.#getLinuxMenu().close();
						},
					},

				],
				angle: true,
				offsetLeft,
				offsetTop,
				fixed: true,
			});
		});
	}
}
