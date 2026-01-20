import { ComponentSlider } from './component-slider';
import { Loc, Type, Text, Event } from 'main.core';
import { Counter, CounterStyle } from 'ui.cnt';
import { SidePanel } from 'main.sidepanel';
import { sendData } from 'ui.analytics';

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

	logoutAllRequest(): Promise
	{
		return BX.ajax.runAction('intranet.v2.Otp.logoutAll', {
			data: {
				signedUserId: this.#signedUserId,
			},
		});
	}

	logoutAll(): void
	{
		this.logoutAllRequest()?.then((response) => {
			BX.UI.Notification.Center.notify({
				content: Loc.getMessage('INTRANET_USER_SECURITY_EXIT_SUCCESS'),
				autoHide: true,
				position: 'bottom-right',
				closeButton: false,
			});
		});
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
	}
}
