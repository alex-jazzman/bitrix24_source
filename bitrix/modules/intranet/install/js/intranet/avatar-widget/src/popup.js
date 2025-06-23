import { Cache } from 'main.core';
import { EventEmitter } from 'main.core.events';
import { PopupComponentsMaker } from 'ui.popupcomponentsmaker';
import { MainContent } from './content/main-content';
import { QrAuthContent } from './content/qr-auth-content';
import { DesktopContent } from './content/desktop-content';
import { OtpContent } from './content/otp-content';
import { SignDocumentsContent } from './content/sign-documents-content';
import { SalaryVacationContent } from './content/salary-vacation-content';
import { ExtensionContent } from './content/extension-content';
import { LogoutContent } from './content/logout-content';
import { ThemeContent } from './content/theme-content';
import { Analytics } from './analytics';
import type { ConfigOptions, PopupOptions } from './types';

export class Popup extends EventEmitter
{
	#cache = new Cache.MemoryCache();
	#popupsShowAfterBasePopup: Array<Popup> = [];

	constructor(options: PopupOptions)
	{
		super();
		this.setOptions(options);
		this.setEventNamespace('BX.Intranet.AvatarWidget.Popup');
		this.setEventHandlers();
	}

	setOptions(options: PopupOptions): void
	{
		this.#cache.set('options', options);
	}

	getOptions(): PopupOptions
	{
		return this.#cache.get('options', {});
	}

	show(): void
	{
		this.getBasePopup().show();
		this.emit('show');
		Analytics.send(Analytics.EVENT_OPEN_WIDGET);
	}

	close(): void
	{
		this.getBasePopup().close();
	}

	getBasePopup(): PopupComponentsMaker
	{
		return this.#cache.remember('popup', () => {
			this.emit('beforeInit');

			const popup = new PopupComponentsMaker({
				target: this.getOptions().target,
				width: 450,
				content: this.#getContent(),
				popupLoader: this.getOptions().loader,
			});
			this.#cache.set('popup', popup);

			this.emit('afterInit');

			return popup;
		});
	}

	#getContent(): Array<ConfigOptions>
	{
		return this.#cache.remember('content', () => {
			const content = [
				this.#getMainContent().getConfig(),
			];

			if (this.getOptions().content?.signDocuments?.isAvailable)
			{
				content.push(
					this.#getSignDocumentsContent().getConfig(),
					this.#getSalaryVacationContent().getConfig(),
				);
			}

			if (this.getOptions().content?.otp?.isAvailable)
			{
				content.push({
					html: [
						this.#getQrAuthContent().getConfig(),
						{
							html: [
								this.#getDesktopContent().getConfig(),
								this.#getOtpContent().getConfig(),
							],
						},
					],
				});
			}
			else
			{
				content.push({
					html: [
						this.#getQrAuthContent().getConfig(),
						this.#getDesktopContent().getConfig(),
					],
				});
			}

			if (this.getOptions().content?.extension?.isAvailable)
			{
				content.push(this.#getExtensionContent().getConfig());
			}

			content.push(
				{
					html: [
						this.#getThemeContent().getConfig(),
						this.#getLogoutContent().getConfig(),
					],
				},
			);

			return content;
		});
	}

	#getMainContent(): MainContent
	{
		return this.#cache.remember('mainContent', () => {
			return new MainContent({
				...this.getOptions().content.main,
			});
		});
	}

	#getSignDocumentsContent(): SignDocumentsContent
	{
		return this.#cache.remember('myDocumentsContent', () => {
			return new SignDocumentsContent({
				...this.getOptions().content.signDocuments,
			});
		});
	}

	#getSalaryVacationContent(): SalaryVacationContent
	{
		return this.#cache.remember('salaryVacationContent', () => {
			return new SalaryVacationContent({
				...this.getOptions().content.salaryVacation,
			});
		});
	}

	#getQrAuthContent(): QrAuthContent
	{
		return this.#cache.remember('qrAuthContent', () => {
			return new QrAuthContent({
				isSmall: !this.getOptions().content.otp?.isAvailable,
				...this.getOptions().content.qrAuth,
			});
		});
	}

	#getDesktopContent(): DesktopContent
	{
		return this.#cache.remember('desktopContent', () => {
			return new DesktopContent({
				isSmall: !this.getOptions().content.otp?.isAvailable,
				...this.getOptions().content.desktop,
			});
		});
	}

	#getOtpContent(): OtpContent
	{
		return this.#cache.remember('otpContent', () => {
			return new OtpContent({
				...this.getOptions().content.otp,
			});
		});
	}

	#getExtensionContent(): ExtensionContent
	{
		return this.#cache.remember('extensionContent', () => {
			return new ExtensionContent({
				...this.getOptions().content.extension,
			});
		});
	}

	#getThemeContent(): ThemeContent
	{
		return this.#cache.remember('settingsContent', () => {
			return new ThemeContent({
				...this.getOptions().content.theme,
			});
		});
	}

	#getLogoutContent(): LogoutContent
	{
		return this.#cache.remember('logoutContent', () => {
			return new LogoutContent({
				...this.getOptions().content.logout,
			});
		});
	}

	setEventHandlers(): void
	{
		this.subscribe('beforeInit', () => {
			EventEmitter.subscribe('BX.Intranet.AvatarWidget.Popup:makeWithHint', () => {
				this.subscribe('afterInit', () => {
					BX.UI.Hint.init(this.getBasePopup().getPopup().getPopupContainer());
				});
			});
			this.subscribe('afterInit', () => {
				this.#setAutoHideEventHandlers();

				const close = () => {
					this.close();
				};

				EventEmitter.subscribe('SidePanel.Slider:onOpenStart', close);
				EventEmitter.subscribe('BX.Intranet.AvatarWidget.Popup:openChild', close);
			});
		});
	}

	#setAutoHideEventHandlers(): void
	{
		EventEmitter.subscribe('BX.Main.Popup:onShow', (event) => {
			if (!this.getBasePopup().getPopup().isShown())
			{
				return;
			}

			const popup = event.getTarget();

			if (popup && popup.getId() === this.getBasePopup().getPopup().getId())
			{
				this.getBasePopup().getPopup().setAutoHide(true);
				EventEmitter.emit('BX.Intranet.AvatarWidget.Popup:enabledAutoHide');
			}
			else
			{
				this.getBasePopup().getPopup().setAutoHide(false);
				EventEmitter.emit('BX.Intranet.AvatarWidget.Popup:disabledAutoHide');

				if (!this.#popupsShowAfterBasePopup.includes(popup))
				{
					this.#popupsShowAfterBasePopup.push(popup);
				}

				const handler = () => {
					this.#popupsShowAfterBasePopup = this.#popupsShowAfterBasePopup.filter((item) => item !== popup);

					if (this.#popupsShowAfterBasePopup.length === 0)
					{
						this.getBasePopup().getPopup().setAutoHide(true);
						EventEmitter.emit('BX.Intranet.AvatarWidget.Popup:enabledAutoHide');
					}
				};

				popup.subscribeOnce('onClose', handler);
				popup.subscribeOnce('onDestroy', handler);
			}
		});
	}
}
