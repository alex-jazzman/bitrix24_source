/**
 * @module user-profile/common-tab/src/block/common-fields/src/utils
 */
jn.define('user-profile/common-tab/src/block/common-fields/src/utils', (require, exports, module) => {
	const { Type } = require('type');
	const { Social } = require('assets/icons');
	const { SocialPlatform } = require('utils/url/social');

	const isFieldValueEmpty = (field) => {
		const { value, isMultiple } = field;

		return isMultiple
			? !Type.isArrayFilled(value)
			: Type.isNil(value) || value === '' || value === '0';
	};

	const isFieldVisible = (field) => field.isVisible;

	const isFieldEditable = (field) => field.isEditable;

	const getSocialIconUriById = (id) => {
		const map = {
			UF_FACEBOOK: Social.FACEBOOK_SMALL,
			UF_LINKEDIN: Social.LINKEDIN_SMALL,
			UF_SKYPE: Social.MICROSOFT_TEAMS_SMALL,
			UF_TWITTER: Social.X_SMALL,
			UF_XING: Social.XING_SMALL,
			UF_ZOOM: Social.ZOOM_SMALL,
		};
		const icon = map[id] || Social.CUSTOM_SMALL;

		return encodeURI(`${currentDomain}${icon.getPath()}`);
	};

	const getSocialPlatformById = (id) => {
		const map = {
			UF_FACEBOOK: SocialPlatform.FACEBOOK,
			UF_LINKEDIN: SocialPlatform.LINKEDIN,
			UF_SKYPE: SocialPlatform.MICROSOFT_TEAMS,
			UF_TWITTER: SocialPlatform.X,
			UF_XING: SocialPlatform.XING,
			UF_ZOOM: SocialPlatform.ZOOM,
		};

		return map[id] || null;
	};

	module.exports = {
		isFieldValueEmpty,
		isFieldVisible,
		isFieldEditable,
		getSocialIconUriById,
		getSocialPlatformById,
	};
});
