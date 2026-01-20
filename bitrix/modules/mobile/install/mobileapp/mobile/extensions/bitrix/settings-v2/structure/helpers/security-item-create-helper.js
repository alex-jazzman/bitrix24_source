/**
 * @module settings-v2/structure/helpers/security-item-create-helper
 */
jn.define('settings-v2/structure/helpers/security-item-create-helper', (require, exports, module) => {
	const { SettingItemType } = require('settings-v2/const');
	const { assertDefined } = require('settings-v2/structure/helpers/assert');

	/**
	 * @param {SecurityInfo} props
	 * @return {SecurityInfo}
	 */
	function createSecurityInfo(props)
	{
		const {
			id,
			title,
			subtitle,
			onClick,
			controller,
			isOtpMandatory,
			icon,
			iconColor,
			prefilter,
			divider,
		} = props;

		assertDefined(['id', 'title'], props, 'SecurityInfo');

		return {
			id,
			title,
			subtitle,
			onClick,
			controller,
			isOtpMandatory,
			icon,
			iconColor,
			prefilter,
			divider,
			type: SettingItemType.SECURITY_INFO,
		};
	}

	/**
	 * @param {SecurityBanner} props
	 * @return {SecurityBanner}
	 */
	function createSecurityBanner(props)
	{
		const {
			id,
			progress,
			controllers,
			prefilter,
			divider,
		} = props;

		assertDefined(['id', 'controllers'], props, 'SecurityBanner');

		return {
			id,
			progress,
			controllers,
			prefilter,
			divider,
			type: SettingItemType.SECURITY_BANNER,
		};
	}

	/**
	 * @param {SecurityAlertBanner} props
	 * @return {SecurityAlertBanner}
	 */
	function createSecurityAlertBanner(props)
	{
		const {
			id,
			controller,
			prefilter,
			divider,
		} = props;

		assertDefined(['id', 'controller'], props, 'SecurityAlertBanner');

		return {
			id,
			controller,
			prefilter,
			divider,
			type: SettingItemType.SECURITY_ALERT_BANNER,
		};
	}

	module.exports = {
		createSecurityInfo,
		createSecurityBanner,
		createSecurityAlertBanner,
	};
});
