/**
 * @module more-menu/aha-moment
 */
jn.define('more-menu/aha-moment', (require, exports, module) => {
	const { makeLibraryImagePath } = require('asset-manager');
	const { Tourist } = require('tourist');
	const { Loc } = require('loc');
	const { Type } = require('type');
	const { AhaMoment } = require('ui-system/popups/aha-moment');
	const { RefRegistry } = require('more-menu/ref-registry');

	const TYPE = {
		INVITATION: 'invitation',
		FIRST_INVITATION: 'first_invitation',
		RELOCATION: 'relocation',
		CALL_LIST: 'call_list',
		MAIL_LIST: 'mail_list',
	};

	const TYPE_CONFIG = {
		[TYPE.INVITATION]: {
			buttonText: Loc.getMessage('MOBILE_MENU_AHA_MOMENT_INVITATION_BUTTON'),
			imageName: 'invite.png',
			refKey: 'company_users_invite_button',
			testId: 'more-menu-aha-moment-invitation',
		},
		[TYPE.FIRST_INVITATION]: {
			badgeCode: 'more',
			buttonText: Loc.getMessage('MOBILE_MENU_AHA_MOMENT_INVITATION_BUTTON'),
			imageName: 'invite.png',
			testId: 'more-menu-aha-moment-first-invitation',
		},
		[TYPE.RELOCATION]: {
			badgeCode: 'more',
			imageName: 'ava-menu_relocation.png',
			testId: 'more-menu-aha-moment-relocation',
		},
		[TYPE.CALL_LIST]: {
			refKey: 'call_list_menu_settings_button',
			buttonText: Loc.getMessage('MOBILE_MENU_AHA_MOMENT_MENU_SETTINGS_BUTTON'),
			imageName: 'invite.png',
			testId: 'more-menu-aha-moment-call-list',
		},
		[TYPE.MAIL_LIST]: {
			refKey: 'mail_list_menu_settings_button',
			buttonText: Loc.getMessage('MOBILE_MENU_AHA_MOMENT_MENU_SETTINGS_BUTTON'),
			imageName: 'mail.png',
			testId: 'more-menu-aha-moment-mail-list',
		},
	};

	/**
	 * @typedef {Object} AhaMomentDto
	 * @property {string} type
	 * @property {string} title
	 * @property {string} description
	 * @property {string} [eventName]
	 */
	class AhaMomentFactory
	{
		static isFirstTimeEvent(eventName)
		{
			if (!Type.isStringFilled(eventName))
			{
				return true;
			}

			return Tourist.firstTime(eventName);
		}

		/**
		 * @param {AhaMomentDto} dto
		 * @param {object} menuNavigator
		 * @return {Object|null}
		 */
		static createConfig(dto, menuNavigator)
		{
			const { type, title, description } = dto || {};

			if (!title || !description)
			{
				return null;
			}

			switch (type)
			{
				case TYPE.INVITATION:
					return this.buildInvitationConfig(dto, menuNavigator);
				case TYPE.FIRST_INVITATION:
					return this.buildFirstInvitationConfig(dto, menuNavigator);
				case TYPE.RELOCATION:
					return this.buildRelocationConfig(dto);
				case TYPE.CALL_LIST:
					return this.buildTabPresetConfig(dto, TYPE.CALL_LIST);
				case TYPE.MAIL_LIST:
					return this.buildTabPresetConfig(dto, TYPE.MAIL_LIST);
				default:
					return null;
			}
		}

		static buildInvitationConfig(dto, menuNavigator)
		{
			const { eventName, title, description } = dto || {};
			if (!this.isFirstTimeEvent(eventName))
			{
				return null;
			}

			const def = TYPE_CONFIG[TYPE.INVITATION];
			const { imageName, buttonText, testId, refKey } = def;

			return {
				testId,
				refKey,
				title,
				description,
				image: imageName && Image({
					testId: `${testId}-image`,
					uri: makeLibraryImagePath(imageName, 'more-menu'),
					style: { width: 78, height: 78 },
				}),
				buttonText,
				onHide: () => {
					if (Type.isStringFilled(eventName))
					{
						Tourist.remember(eventName);
					}
				},
				onClick: () => {
					try
					{
						menuNavigator.onInviteNotification(false);
					}
					catch (error)
					{
						console.log('navigator error', error);
					}

					if (Type.isStringFilled(eventName))
					{
						Tourist.remember(eventName);
					}
				},
				shouldShowImageBackgroundColor: false,
				delay: 500,
				disableHideByOutsideClick: false,
			};
		}

		static buildFirstInvitationConfig(dto, menuNavigator)
		{
			const { eventName, title, description } = dto || {};
			if (!this.isFirstTimeEvent(eventName))
			{
				return null;
			}

			const def = TYPE_CONFIG[TYPE.FIRST_INVITATION];
			const { imageName, badgeCode, buttonText, testId } = def;

			return {
				testId,
				targetRef: badgeCode,
				title,
				description,
				image: Image({
					testId: `${testId}-image`,
					uri: makeLibraryImagePath(imageName, 'more-menu'),
					style: { width: 78, height: 78 },
				}),
				buttonText,
				onHide: () => {
					if (Type.isStringFilled(eventName))
					{
						Tourist.remember(eventName);
					}
				},
				onClick: () => {
					menuNavigator.onInviteNotification(false);

					if (Type.isStringFilled(eventName))
					{
						Tourist.remember(eventName);
					}
				},
				shouldShowImageBackgroundColor: false,
				disableHideByOutsideClick: false,
			};
		}

		static buildRelocationConfig(dto)
		{
			const { eventName, title, description } = dto || {};
			if (!this.isFirstTimeEvent(eventName))
			{
				return null;
			}
			const def = TYPE_CONFIG[TYPE.RELOCATION];
			const { imageName, badgeCode, testId } = def;

			return {
				testId,
				targetRef: badgeCode,
				title,
				description,
				image: imageName && Image({
					testId: `${testId}-image`,
					uri: makeLibraryImagePath(imageName, 'more-menu'),
					style: { width: 78, height: 78 },
				}),
				onHide: () => {
					if (Type.isStringFilled(eventName))
					{
						Tourist.remember(eventName);
					}
				},
				shouldShowImageBackgroundColor: false,
				disableHideByOutsideClick: false,
			};
		}

		static buildTabPresetConfig(dto, type)
		{
			const { eventName, title, description } = dto || {};
			if (!this.isFirstTimeEvent(eventName))
			{
				return null;
			}
			const def = TYPE_CONFIG[type];
			const { refKey, buttonText, imageName, testId } = def;

			return {
				refKey,
				testId,
				title,
				description,
				image: imageName && Image({
					testId: `${testId}-image`,
					uri: makeLibraryImagePath(imageName, 'more-menu'),
					style: { width: 78, height: 78, marginBottom: 30 },
				}),
				buttonText,
				onClick: () => {
					if (Type.isStringFilled(eventName))
					{
						Tourist.remember(eventName);
					}
					const { inAppUrl } = require('in-app-url');
					inAppUrl.open('/settings/tab.presets');
				},
				onHide: () => {
					if (Type.isStringFilled(eventName))
					{
						Tourist.remember(eventName);
					}
				},
				delay: 500,
				shouldShowImageBackgroundColor: false,
				disableHideByOutsideClick: false,
			};
		}
	}

	/**
	 * @param {AhaMomentDto} dto
	 * @param {MenuNavigator} menuNavigator
	 * @return {boolean} wasShown
	 */
	const showAhaMoment = (dto, menuNavigator) => {
		const config = AhaMomentFactory.createConfig(dto, menuNavigator);
		if (!config)
		{
			return false;
		}

		const refKey = config?.refKey;
		if (Type.isStringFilled(refKey))
		{
			RefRegistry.waitFor(refKey, 4000)
				.then((ref) => {
					if (ref)
					{
						AhaMoment.show({
							...config,
							targetRef: ref,
						});
					}
				})
				.catch((error) => {
					console.error('RefRegistry error', error);
				});

			return true;
		}

		AhaMoment.show(config);

		return true;
	};

	module.exports = { AhaMomentFactory, showAhaMoment };
});
