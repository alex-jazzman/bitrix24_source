/**
 * @module intranet/user-mini-profile
 */
jn.define('intranet/user-mini-profile', (require, exports, module) => {
	const { RunActionExecutor } = require('rest/run-action-executor');
	const { BackgroundUIManager } = require('background/ui-manager');

	const MINI_PROFILE_COMPONENT_NAME = 'intranet:user-mini-profile';

	/**
	 * @class UserMiniProfile
	 */
	class UserMiniProfile
	{
		static tryShowComponent = async () => {
			const userMiniProfile = new UserMiniProfile();
			void userMiniProfile.openBackgroundComponent();
		};

		static openComponent(portalLogoParams, profileDataParams)
		{
			PageManager.openComponent('JSStackComponent', {
				name: 'JSStackComponent',
				// eslint-disable-next-line no-undef
				scriptPath: availableComponents[MINI_PROFILE_COMPONENT_NAME].publicUrl,
				componentCode: MINI_PROFILE_COMPONENT_NAME,
				canOpenInDefault: true,
				rootWidget: {
					name: 'layout',
					settings: {
						objectName: 'layout',
						modal: true,
						backdrop: {
							showOnTop: true,
							swipeAllowed: false,
							hideNavigationBar: true,
						},
					},
				},
				params: {
					portalLogoParams,
					profileDataParams,
				},
			});
		}

		async openBackgroundComponent()
		{
			try
			{
				const isNeedToShowMiniProfile = await this.isNeedToShowMiniProfile();
				if (!isNeedToShowMiniProfile)
				{
					return;
				}

				BackgroundUIManager.openComponent(
					MINI_PROFILE_COMPONENT_NAME,
					this.openUserMiniProfile,
					1000,
				);
			}
			catch (e)
			{
				console.error(e);
			}
		}

		openUserMiniProfile = async () => {
			const { portalLogoParams, profileDataParams } = await this.getComponentParams();
			void this.markMiniProfileAsShown();
			void UserMiniProfile.openComponent(portalLogoParams, profileDataParams);
		};

		/**
		 * @return {Promise<boolean>}
		 */
		async markMiniProfileAsShown()
		{
			const isMarked = await this.runAction('markMiniProfileAsShown');
			if (isMarked)
			{
				Application.storage.set(this.getUserMiniProfileStorageKey(), false);

				return true;
			}

			return false;
		}

		isNeedToShowMiniProfile = async () => {
			const cachedValue = Application.storage.get(this.getUserMiniProfileStorageKey(), null);
			if (cachedValue !== null && cachedValue !== undefined)
			{
				return cachedValue;
			}

			return this.runAction('isNeedToShowMiniProfile');
		};

		getUserMiniProfileStorageKey()
		{
			return `intranet.miniProfile.needToShow_${env.userId}`;
		}

		async runAction(action)
		{
			const request = new RunActionExecutor(`intranetmobile.userprofile.${action}`, {});

			try
			{
				const response = await request.call(false);

				return response?.data;
			}
			catch (e)
			{
				console.error(e);

				return false;
			}
		}

		async getComponentParams()
		{
			return new Promise((resolve, reject) => {
				BX.rest.callBatch({
					profileDataParams: ['user.current'],
					portalLogoParams: ['intranet.portal.getLogo'],
				}, (response) => {
					if (response.error)
					{
						reject(response.error);

						return;
					}

					resolve({
						profileDataParams: response?.profileDataParams?.answer?.result,
						portalLogoParams: response?.portalLogoParams?.answer?.result,
					});
				});
			});
		}
	}

	module.exports = {
		UserMiniProfile,
		MINI_PROFILE_COMPONENT_NAME,
	};
});
