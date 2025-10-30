/**
 * @module settings-v2/structure/src/item-create-helper
 */
jn.define('settings-v2/structure/src/item-create-helper', (require, exports, module) => {
	const { SettingsPageId, SettingItemType } = require('settings-v2/const');
	const { Type } = require('type');

	function assertDefined(expectedKeys, props, entityName)
	{
		expectedKeys.forEach((key) => {
			if (Type.isNil(props[key]))
			{
				throw new TypeError(`${entityName} must have ${key}, but got ${JSON.stringify(props)}`);
			}
		});
	}

	/**
	 * @param {SettingLink} props
	 * @returns {SettingLink}
	 */
	function createLink(props)
	{
		const {
			id,
			title,
			nextPage,
			subtitle,
			icon,
			prefilter,
			nextPageParams,
		} = props;

		assertDefined(['id', 'title', 'nextPage'], props, 'Link');

		if (!Object.values(SettingsPageId).includes(nextPage))
		{
			throw new Error(`Invalid nextPage "${nextPage}". Expected one of: ${Object.values(SettingsPageId).join(', ')}`);
		}

		return {
			id,
			title,
			nextPage,
			subtitle,
			icon,
			prefilter,
			nextPageParams,
			type: SettingItemType.LINK,
		};
	}

	/**
	 * @param {SettingSection} props
	 * @returns {SettingSection}
	 */
	function createSection(props)
	{
		const {
			id,
			title,
			items,
			prefilter,
			prepareItems,
		} = props;

		assertDefined(['id', 'items'], props, 'Section');

		return {
			id,
			title,
			items,
			prefilter,
			prepareItems,
			type: SettingItemType.SECTION,
		};
	}

	/**
	 * @param {SettingToggle} props
	 * @returns {SettingToggle}
	 */
	function createToggle(props)
	{
		const {
			id,
			title,
			subtitle,
			divider,
			icon,
			prefilter,
			controller,
		} = props;

		assertDefined(['id', 'title', 'controller'], props, 'Toggle');

		return {
			id,
			title,
			subtitle,
			divider,
			icon,
			prefilter,
			type: SettingItemType.TOGGLE,
			controller,
		};
	}

	/**
	 * @param {SettingButton} props
	 * @returns {SettingButton}
	 */
	function createButton(props)
	{
		const {
			id,
			title,
			onClick,
			subtitle,
			icon,
			prefilter,
		} = props;

		assertDefined(['id', 'title', 'onClick'], props, 'Button');

		return {
			id,
			title,
			onClick,
			subtitle,
			icon,
			type: SettingItemType.BUTTON,
			prefilter,
		};
	}

	/**
	 * @param {SettingThemeSwitch} props
	 * @returns {SettingThemeSwitch}
	 */
	function createThemeSwitch(props)
	{
		const {
			id,
			controller,
		} = props;

		assertDefined(['id', 'controller'], props, 'Theme');

		return {
			id,
			controller,
			type: SettingItemType.THEME,
		};
	}

	/**
	 * @param {SettingVideoQualitySwitch} props
	 * @returns {SettingVideoQualitySwitch}
	 */
	function createVideoQualitySwitch(props)
	{
		const {
			id,
			controller,
		} = props;

		assertDefined(['id', 'controller'], props, 'VideoQuality');

		return {
			id,
			controller,
			type: SettingItemType.VIDEO_QUALITY,
		};
	}

	/**
	 * @param {SettingDescription} props
	 * @return {SettingDescription}
	 */
	function createDescription(props)
	{
		const {
			id,
			text,
		} = props;

		assertDefined(['id', 'text'], props, 'Description');

		return {
			id,
			text,
			type: SettingItemType.DESCRIPTION,
		};
	}

	/**
	 * @param {SettingVideoBanner} props
	 * @return {SettingVideoBanner}
	 */
	function createVideoBanner(props)
	{
		const {
			id,
			controller,
		} = props;

		assertDefined(['id', 'controller'], props, 'VideoBanner');

		return {
			id,
			controller,
			type: SettingItemType.VIDEO_BANNER,
		};
	}

	/**
	 * @param {SettingLocSelector} props
	 * @return {SettingLocSelector}
	 */
	function createLocSelector(props)
	{
		const {
			id,
			controller,
			title,
			icon,
		} = props;

		assertDefined(['id', 'controller'], props, 'LocSelector');

		return {
			id,
			controller,
			title,
			icon,
			type: SettingItemType.LOC_SELECTOR,
		};
	}

	module.exports = {
		createLink,
		createSection,
		createToggle,
		createButton,
		createThemeSwitch,
		createVideoQualitySwitch,
		createDescription,
		createVideoBanner,
		createLocSelector,
	};
});
