(function()
{
	BX.namespace('BX.Intranet.UserOtpConnected');

	BX.Intranet.UserOtpConnected = {
		init(params)
		{
			this.signedParameters = params.signedParameters;
			this.componentName = params.componentName;
			this.otpDays = params.otpDays;
			this.provider = new BX.Intranet.PushOtp.EnablePushOtpProvider({
				intent: params.intent,
				ttl: params.ttl,
				pullConfig: params.pullConfig,
				phoneNumber: params.phoneNumber,
				isPhoneNumberConfirmed: params.isPhoneNumberConfirmed,
				signedUserId: params.signedUserId,
				events: {
					onPopupClose: () => {
						BX.SidePanel.Instance.reload();
					},
				},
			});
			const popup = params.provideSmsOtp
				? this.provider.full()
				: this.provider.onlyPushOtp();

			const changePhoneNode = document.querySelector("[data-role='intranet-otp-change-phone']");
			if (BX.type.isDomNode(changePhoneNode))
			{
				BX.bind(changePhoneNode, 'click', () => {
					if (BX.getClass('BX.Intranet.UserProfile.Security'))
					{
						BX.Intranet.UserProfile.Security.showOtpComponent();
					}
				});
			}

			const recoveryCodesNode = document.querySelector("[data-role='intranet-recovery-codes']");
			if (BX.type.isDomNode(recoveryCodesNode))
			{
				BX.bind(recoveryCodesNode, 'click', () => {
					if (BX.getClass('BX.Intranet.UserProfile.Security'))
					{
						BX.Intranet.UserProfile.Security.showRecoveryCodesComponent();
					}
				});
			}

			const deferNode = document.querySelector("[data-role='intranet-otp-defer']");
			if (BX.type.isDomNode(deferNode))
			{
				BX.bind(deferNode, 'click', () => {
					this.showOtpDaysPopup(deferNode, 'defer');
				});
			}

			const deactivateNode = document.querySelector("[data-role='intranet-otp-deactivate']");
			if (BX.type.isDomNode(deactivateNode))
			{
				BX.bind(deactivateNode, 'click', () => {
					this.showOtpDaysPopup(deactivateNode, 'deactivate');
				});
			}

			this.bannerPushOtp = null;
			if (params.canShowBannerPushOtp)
			{
				if (!params.isOtpActive)
				{
					this.bannerPushOtp = new BX.Intranet.NotifyBanner.PushOtp({
						clickEnableBtn: () => {
							popup.show();
						},
					});
				}
				else if (params.isNotPushOtp)
				{
					this.bannerPushOtp = new BX.Intranet.NotifyBanner.PushOtp({
						clickEnableBtn: () => {
							popup.show();
						},
						clickDisableBtn: (event) => {
							this.showOtpDaysPopup(event.target);
						},
					});
				}
			}
		},

		reload()
		{
			if (BX.getClass('BX.Intranet.UserProfile.Security'))
			{
				BX.Intranet.UserProfile.Security.showOtpConnectedComponent();
			}
		},

		deactivateUserOtp(numDays)
		{
			BX.ajax.runComponentAction(this.componentName, 'deactivateOtp', {
				signedParameters: this.signedParameters,
				mode: 'ajax',
				data: {
					numDays,
				},
			}).then((result) => {
				this.reload();
			}, (response) => {
				if (BX.getClass('BX.Intranet.UserProfile.Security'))
				{
					BX.Intranet.UserProfile.Security.showErrorPopup(response.errors[0].message);
				}
			});
		},

		activateUserOtp()
		{
			BX.ajax.runComponentAction(this.componentName, 'activateOtp', {
				signedParameters: this.signedParameters,
				mode: 'ajax',
				data: {},
			}).then((result) => {
				this.reload();
			}, (response) => {
				if (BX.getClass('BX.Intranet.UserProfile.Security'))
				{
					BX.Intranet.UserProfile.Security.showErrorPopup(response.errors[0].message);
				}
			});
		},

		deferUserOtp(numDays)
		{
			BX.ajax.runComponentAction(this.componentName, 'deferOtp', {
				signedParameters: this.signedParameters,
				mode: 'ajax',
				data: {
					numDays,
				},
			}).then((result) => {
				this.reload();
			}, (response) => {
				if (BX.getClass('BX.Intranet.UserProfile.Security'))
				{
					BX.Intranet.UserProfile.Security.showErrorPopup(response.errors[0].message);
				}
			});
		},

		getPopupOtpProvider()
		{
			return this.provider;
		},

		showOtpDaysPopup(bind, handler)
		{
			handler = (handler == 'defer') ? 'defer' : 'deactivate';
			const self = this;

			const daysObj = [];
			for (const i in this.otpDays)
			{
				daysObj.push({
					text: this.otpDays[i],
					numDays: i,
					onclick(event, item)
					{
						this.popupWindow.close();

						if (handler === 'deactivate')
						{
							self.deactivateUserOtp(item.numDays);
						}
						else
						{
							self.deferUserOtp(item.numDays);
						}
					},
				});
			}

			BX.PopupMenu.show(
				'securityOtpDaysPopup',
				bind,
				daysObj,
				{
					offsetTop: 10,
					offsetLeft: 0,
					events: {
						onPopupClose() {
							BX.PopupMenu.destroy('securityOtpDaysPopup');
						},
					},
				},
			);
		},
	};
})();
