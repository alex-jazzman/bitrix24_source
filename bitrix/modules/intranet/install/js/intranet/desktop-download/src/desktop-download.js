import { Extension, Browser, Loc, Dom } from 'main.core';
import { Menu } from 'main.popup';

export type DesktopLinksType = {
	windows: string,
	macos: string,
	linuxDeb: string,
	linuxRpm: string,
	msi: string,
	macosArm: string,
}

export class DesktopDownload
{
	links: DesktopLinksType;
	menuMac: ?Menu;
	menuLinux: ?Menu;

	constructor()
	{
		this.links = DesktopDownload.getLinks();
	}

	static getLinks(): DesktopLinksType
	{
		return Extension.getSettings('intranet.desktop-download').downloadLinks;
	}

	static getLinkForCurrentUser(): string
	{
		const downloadLinks = this.getLinks();

		if (Browser.isMac())
		{
			return downloadLinks.macos;
		}

		if (Browser.isLinux())
		{
			const UA = navigator.userAgent.toLowerCase();

			if (
				UA.includes('Fedora')
				|| UA.includes('CentOS')
				|| UA.includes('Red Hat')
			)
			{
				return downloadLinks.linuxRpm;
			}

			return downloadLinks.linuxDeb;
		}

		return downloadLinks.windows;
	}

	showMenuForMac(target: HTMLElement): void
	{
		if (!this.menuMac)
		{
			this.menuMac = new Menu({
				items: [
					{
						text: Loc.getMessage('INTRANET_DESKTOP_DOWNLOAD_LINK_MAC_INTEL'),
						href: this.links.macos,
					},
					{
						text: Loc.getMessage('INTRANET_DESKTOP_DOWNLOAD_LINK_MAC_ARM'),
						href: this.links.macosArm,
					},
				],
				angle: true,
			});
		}

		this.menuMac.getPopupWindow().setBindElement(target);
		this.menuMac.getPopupWindow().setOffset({
			offsetLeft: Dom.getPosition(target).width / 2,
		});

		this.menuMac.toggle();
	}

	showMenuForLinux(target: HTMLElement): void
	{
		if (!this.menuLinux)
		{
			this.menuLinux = new Menu({
				items: [
					{
						text: Loc.getMessage('INTRANET_DESKTOP_DOWNLOAD_LINK_LINUX_DEB'),
						href: this.links.linuxDeb,
					},
					{
						text: Loc.getMessage('INTRANET_DESKTOP_DOWNLOAD_LINK_LINUX_RPM'),
						href: this.links.linuxRpm,
					},
				],
				angle: true,
			});
		}

		this.menuLinux.getPopupWindow().setBindElement(target);
		this.menuLinux.getPopupWindow().setOffset({
			offsetLeft: Dom.getPosition(target).width / 2,
		});

		this.menuLinux.toggle();
	}

	handleDownloadClick(target: HTMLElement): void
	{
		if (Browser.isMac())
		{
			this.showMenuForMac(target);
		}
		else if (Browser.isLinux())
		{
			this.showMenuForLinux(target);
		}
		else
		{
			document.location.href = this.links.windows;
		}
	}
}
