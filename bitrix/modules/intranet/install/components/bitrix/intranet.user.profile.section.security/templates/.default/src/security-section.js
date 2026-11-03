import { Loc, Type, Text, Event, Runtime } from 'main.core';
import { SidePanel } from 'main.sidepanel';
import { sendData } from 'ui.analytics';
import { Counter, CounterStyle } from 'ui.cnt';
import { UI } from 'ui.notification';
import { Menu, MenuItemDesign } from 'ui.system.menu';

import { LogoutAllConfirm } from 'intranet.logout-all-confirm';

import { ComponentSlider } from './component-slider';

export class SecuritySection
{
	#signedParameters: string;
	#userId: number;
	#isCloud: boolean;
	#passwordNetworkUrl: string;
	#signedUserId: string;

	constructor(options)
	{
		this.#signedParameters = options.signedParameters;
		this.#signedUserId = options.signedUserId;
		this.#userId = options.userId;
		this.#isCloud = options.isCloud === true;
		this.#passwordNetworkUrl = Type.isStringFilled(options.passwordNetworkUrl) ? options.passwordNetworkUrl : '';
		this.#setAnalyticsEventHandlers(options);
		this.#bindMenuItems(options);
	}

	open2FaSlider(): void
	{
		new ComponentSlider({
			id: 'user_profile_2fa',
			title: Loc.getMessage('INTRANET_USER_SECURITY_PUSH_OTP_AUTH'),
			width: 600,
			extensions: [
				'intranet.push-otp.connect-popup',
			],
			componentContent: () => {
				return BX.ajax.runComponentAction(
					'bitrix:intranet.user.profile.security',
					'otpList',
					{
						signedParameters: this.#signedParameters,
						mode: 'ajax',
						data: {
							userId: this.#userId,
						},
					},
				);
			},
			events: {
				onClose: () => {
					this.reload();
				},
			},
		}).open();
	}

	openOld2Fa(): void
	{
		BX.Intranet.UserProfile.Security.changeContent('otpList');
	}

	openChangePassword(): void
	{
		if (this.#isCloud)
		{
			if (Type.isStringFilled(this.#passwordNetworkUrl))
			{
				window.open(this.#passwordNetworkUrl);
			}
			else
			{
				console.error('Password change URL is not defined.');
			}
		}
		else
		{
			this.openPasswordSlider();
		}
	}

	openPasswordSlider(): void
	{
		SidePanel.Instance.open(
			`/bitrix/components/bitrix/intranet.user.profile.password/index.php?userId=${Text.encode(this.#userId)}`,
			{
				cacheable: false,
				width: 700,
			},
		);
	}

	openOldPassword(): void
	{
		BX.Intranet.UserProfile.Security.changeContent('changePassword');
	}

	reload(): void
	{
		BX.Intranet.UserProfile.Security.changeContent('otpConnected');
	}

	logoutAll(): void
	{
		(new LogoutAllConfirm()).show();
	}

	renderPhoneConfirmationCounter(wrapper: HTMLElement): void
	{
		const counter = new Counter({
			color: Counter.Color.DANGER,
			size: Counter.Size.MEDIUM,
			value: 1,
			style: CounterStyle.FILLED_ALERT,
			useAirDesign: true,
		});
		counter.renderTo(wrapper);
	}

	#setAnalyticsEventHandlers(options): void
	{
		if (options.emailElement)
		{
			Event.bind(options.emailElement, 'click', () => {
				sendData({
					tool: 'user_settings',
					category: 'security',
					event: 'click',
					c_element: 'email',
				});
			});
		}

		if (options.phoneElement)
		{
			Event.bind(options.phoneElement, 'click', () => {
				sendData({
					tool: 'user_settings',
					category: 'security',
					event: 'click',
					c_element: 'phone',
				});
			});
		}

		if (options.socservElement)
		{
			Event.bind(options.socservElement, 'click', () => {
				sendData({
					tool: 'user_settings',
					category: 'security',
					event: 'click',
					c_element: 'socserv',
				});
			});
		}

		if (options.passwordElement)
		{
			Event.bind(options.passwordElement, 'click', () => {
				sendData({
					tool: 'user_settings',
					category: 'security',
					event: 'click',
					c_element: 'password',
				});
			});
		}

		if (options.profileManagementElement)
		{
			Event.bind(options.profileManagementElement, 'click', () => {
				sendData({
					tool: 'user_settings',
					category: 'security',
					event: 'click',
					c_element: 'profile_management',
				});
			});
		}
	}

	#bindMenuItems(options): void
	{
		if (!Type.isDomNode(options.profileManagementElement))
		{
			return;
		}

		Event.bind(
			options.profileManagementElement,
			'click',
			this.#showProfileManagementMenu.bind(this, options.profileManagementElement),
		);
	}

	#showProfileManagementMenu(bindElement): void
	{
		if (!Type.isDomNode(bindElement))
		{
			return;
		}

		if (!this.profileManagementMenu)
		{
			this.profileManagementMenu = new Menu({
				id: 'intranet-user-profile-security-profile-management',
				cacheable: true,
				bindOptions: {
					forceBindPosition: true,
					forceLeft: true,
				},
				items: [
					{
						title: Loc.getMessage('INTRANET_USER_SECURITY_PROFILE_MANAGEMENT_DELETE_PROFILE'),
						design: MenuItemDesign.Alert,
						dataset: {
							testid: 'intranet-user-security-delete-profile-menu-item',
						},
						onClick: this.#showSelfDeletePopup.bind(this),
					},
				],
				events: {
					onShow: () => {
						bindElement.setAttribute('aria-expanded', 'true');
					},
					onClose: () => {
						bindElement.setAttribute('aria-expanded', 'false');

						if (bindElement.isConnected)
						{
							bindElement.focus();
						}
					},
				},
			});
		}

		this.profileManagementMenu.show(bindElement);
		this.#adjustProfileManagementMenuPosition(bindElement);
	}

	#adjustProfileManagementMenuPosition(bindElement: HTMLElement): void
	{
		const popup = this.profileManagementMenu.getPopup();
		const popupWidth = popup.getPopupContainer().offsetWidth;
		const bindElementWidth = bindElement.getBoundingClientRect().width;

		popup.setOffset({
			offsetLeft: bindElementWidth - popupWidth,
			offsetTop: 0,
		});
		popup.adjustPosition({
			forceBindPosition: true,
			forceLeft: true,
		});
	}

	#showSelfDeletePopup(): Promise
	{
		return Runtime.loadExtension('intranet.user.self-delete-popup')
			.then((popupExports) => {
				const { SelfDeletePopup } = popupExports;

				return SelfDeletePopup.show();
			})
			.catch((error) => {
				UI.Notification.Center.notify({
					content: Loc.getMessage('INTRANET_USER_SECURITY_SELF_DELETE_POPUP_ERROR'),
					autoHide: true,
					useAirDesign: true,
				});

				console.error(error);
			})
		;
	}
}
