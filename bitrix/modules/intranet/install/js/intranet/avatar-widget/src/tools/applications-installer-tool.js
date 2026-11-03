import { Loc, Tag } from 'main.core';
import { Button, AirButtonStyle } from 'ui.buttons';
import { BaseSecondaryTool } from './base-secondary-tool';
import { Menu } from 'main.popup';
import { EventEmitter } from 'main.core.events';
import { Analytics } from '../analytics';
import { DesktopDownload } from 'intranet.desktop-download';

export class ApplicationsInstallerTool extends BaseSecondaryTool
{
	getIconElement(): HTMLElement
	{
		return this.cache.remember('icon', () => {
			if (this.options.mobile.installed)
			{
				return Tag.render`
					<span class="intranet-avatar-widget-secondary-tool-icons__wrapper">
						${this.#getMobileIcon()}
						<div aria-hidden="true" class="intranet-avatar-widget-secondary-tool-icons__seporator"></div>
						${this.#getDesktopIcon()}
					</span>
				`;
			}

			return this.#getDesktopIcon();
		});
	}

	getActionElement(): HTMLElement
	{
		return this.cache.remember('actionElement', () => {
			if (this.options.desktop.installed && this.options.menu)
			{
				const onclick = (event) => {
					this.#getInstallMenu(event.currentTarget).toggle();
				};

				return Tag.render`
					<button
						type="button"
						onclick="${onclick}"
						aria-label="${Loc.getMessage('INTRANET_AVATAR_WIDGET_ADDITIONAL_INSTALL_OPTIONS')}"
						aria-haspopup="menu"
						aria-expanded="false"
						class="ui-icon-set --more-m intranet-avatar-widget-item__more"
					></button>
				`;
			}

			const desktopDownload = new DesktopDownload();

			const button = (new Button({
				size: Button.Size.EXTRA_SMALL,
				text: this.options.desktop.buttonName,
				useAirDesign: true,
				style: AirButtonStyle.FILLED,
				noCaps: true,
				onclick: () => {
					desktopDownload.handleDownloadClick(button);
				},
				wide: true,
			})).render();
			button.setAttribute('aria-label', `${this.options.desktop.buttonName} ${this.getTitle()}`);

			return Tag.render`
				<span class="intranet-avatar-widget-secondary-tool-application__button-wrapper">
					${button}
				</span>
			`;
		});
	}

	hasInteractiveAction(): boolean
	{
		return true;
	}

	#getMobileIcon(): HTMLElement
	{
		return this.cache.remember('mobileIcon', () => {
			let className = 'ui-icon-set --mobile-selected intranet-avatar-widget-secondary-tool-application__icon';

			if (this.options.mobile.installed)
			{
				className += ' --installed';
			}

			return Tag.render`
				<i aria-hidden="true" class="${className}"/>
			`;
		});
	}

	#getDesktopIcon(): HTMLElement
	{
		return this.cache.remember('desktopIcon', () => {
			let className = 'ui-icon-set intranet-avatar-widget-secondary-tool-application__icon';

			if (this.options.desktop.installed)
			{
				className += ' --screen-selected --installed';
			}
			else
			{
				className += ' --o-screen';
			}

			return Tag.render`
				<i aria-hidden="true" class="${className}"/>
			`;
		});
	}

	#getInstallMenu(bindElement: HTMLElement): Menu
	{
		return this.cache.remember('installMenu', () => {
			const items = this.#getInstallMenuItems();

			if (items.length === 0)
			{
				return null;
			}

			return new Menu({
				bindElement,
				ariaLabel: Loc.getMessage('INTRANET_AVATAR_WIDGET_ADDITIONAL_INSTALL_OPTIONS'),
				items,
				offsetLeft: 5,
				angle: true,
				fixed: true,
				events: {
					onShow: () => bindElement.setAttribute('aria-expanded', 'true'),
					onClose: () => bindElement.setAttribute('aria-expanded', 'false'),
				},
			});
		});
	}

	#getInstallMenuItems(): Array
	{
		const items = [];

		this.options.menu.forEach((item) => {
			if (item.type === 'desktop')
			{
				items.push({
					text: item.title,
					href: item.installLink,
					onclick: () => {
						Analytics.send(Analytics.EVENT_CLICK_INSTALL_DESKTOP_APP);
						this.#getInstallMenu().close();
					},
				});
			}
			else if (item.type === 'mobile')
			{
				items.push({
					text: item.title,
					onclick: () => {
						Analytics.send(Analytics.EVENT_CLICK_INSTALL_MOBILE_APP);
						this.#getInstallMenu().close();
						EventEmitter.emit('BX.Intranet.AvatarWidget.ApplicationInstallerTool:onClick', {
							focusTarget: this.getActionElement(),
						});
					},
				});
			}
		});

		return items;
	}

	onClick(): void
	{}

	getId(): string
	{
		return 'applications-installer';
	}
}
