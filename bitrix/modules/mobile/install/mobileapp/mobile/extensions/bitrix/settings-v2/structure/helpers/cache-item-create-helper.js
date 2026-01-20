/**
 * @module settings-v2/structure/helpers/cache-item-create-helper
 */
jn.define('settings-v2/structure/helpers/cache-item-create-helper', (require, exports, module) => {
	const { SettingItemType } = require('settings-v2/const');
	const { assertDefined } = require('settings-v2/structure/helpers/assert');

	/**
	 * @param {SettingCacheInfo} props
	 * @returns {SettingCacheInfo}
	 */
	function createCacheInfo(props)
	{
		const {
			id,
			title,
			subtitle,
			onClick,
			controller,
			icon,
			iconColor,
			modeText,
			modeColor,
			prefilter,
			divider,
		} = props;

		assertDefined(['id', 'title'], props, 'Info');

		return {
			id,
			title,
			subtitle,
			onClick,
			controller,
			icon,
			iconColor,
			modeText,
			modeColor,
			prefilter,
			divider,
			type: SettingItemType.CACHE_INFO,
		};
	}

	/**
	 * @param {SettingCacheIntervalSelector} props
	 * @return {SettingCacheIntervalSelector}
	 */
	function createCacheIntervalSelector(props)
	{
		const {
			id,
			controller,
			title,
			icon,
			divider,
		} = props;

		assertDefined(['id', 'controller'], props, 'CacheIntervalSelector');

		return {
			id,
			controller,
			title,
			icon,
			divider,
			type: SettingItemType.CACHE_INTERVAL,
		};
	}

	/**
	 * @param {SettingCacheBanner} props
	 * @return {SettingCacheBanner}
	 */
	function createCacheBanner(props)
	{
		const {
			id,
		} = props;

		assertDefined(['id'], props, 'CacheIntervalSelector');

		return {
			id,
			type: SettingItemType.CACHE_BANNER,
		};
	}

	/**
	 * @param {SettingCacheInfoButton} props
	 * @returns {SettingCacheInfoButton}
	 */
	function createCacheInfoButton(props)
	{
		const {
			id,
			prefilter,
			divider,
		} = props;

		assertDefined(['id'], props, 'CacheInfoButton');

		return {
			id,
			prefilter,
			divider,
			type: SettingItemType.CACHE_INFO_BUTTON,
		};
	}

	module.exports = {
		createCacheInfo,
		createCacheIntervalSelector,
		createCacheBanner,
		createCacheInfoButton,
	};
});
