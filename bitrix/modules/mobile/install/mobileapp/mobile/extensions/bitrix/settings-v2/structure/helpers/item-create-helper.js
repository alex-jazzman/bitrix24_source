/**
 * @module settings-v2/structure/helpers/item-create-helper
 */
jn.define('settings-v2/structure/helpers/item-create-helper', (require, exports, module) => {
	const { SettingsPageId, SettingItemType } = require('settings-v2/const');
	const { assertDefined } = require('settings-v2/structure/helpers/assert');

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
			divider,
		} = props;

		assertDefined(['id', 'items'], props, 'Section');

		return {
			id,
			title,
			items,
			prefilter,
			prepareItems,
			divider,
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
			text,
			onClick,
			subtitle,
			divider,
			icon,
			prefilter,
			color,
		} = props;

		assertDefined(['id', 'text', 'onClick'], props, 'Button');

		return {
			id,
			text,
			onClick,
			subtitle,
			divider,
			icon,
			color,
			type: SettingItemType.BUTTON,
			prefilter,
		};
	}

	/**
	 * @param {SettingLinkButton} props
	 * @returns {SettingLinkButton}
	 */
	function createLinkButton(props)
	{
		const {
			id,
			title,
			onClick,
			subtitle,
			divider,
			icon,
			prefilter,
			color,
		} = props;

		assertDefined(['id', 'title', 'onClick'], props, 'Button');

		return {
			id,
			title,
			onClick,
			subtitle,
			divider,
			icon,
			color,
			type: SettingItemType.LINK_BUTTON,
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
			divider,
		} = props;

		assertDefined(['id', 'controller'], props, 'Theme');

		return {
			id,
			controller,
			divider,
			type: SettingItemType.THEME,
		};
	}

	/**
	 * @param {SettingStyleSwitch} props
	 * @returns {SettingStyleSwitch}
	 */
	function createStyleSwitch(props)
	{
		const {
			id,
			controller,
		} = props;

		assertDefined(['id', 'controller'], props, 'StyleSwitch');

		return {
			id,
			controller,
			type: SettingItemType.STYLE,
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
			divider,
		} = props;

		assertDefined(['id', 'controller'], props, 'LocSelector');

		return {
			id,
			controller,
			title,
			icon,
			divider,
			type: SettingItemType.LOC_SELECTOR,
		};
	}

	/**
	 * @param {SettingBanner} props
	 * @return {SettingBanner}
	 */
	function createBanner(props)
	{
		const {
			id,
			bannerImageName,
			text,
			divider,
		} = props;

		assertDefined(['id', 'text'], props, 'Banner');

		return {
			id,
			bannerImageName,
			text,
			divider,
			type: SettingItemType.BANNER,
		};
	}

	/**
	 * @param {SettingImage} props
	 * @return {SettingImage}
	 */
	function createImage(props)
	{
		const {
			id,
			name,
			externalStyle,
		} = props;

		assertDefined(['id', 'name'], props, 'Image');

		return {
			id,
			name,
			externalStyle,
			type: SettingItemType.IMAGE,
		};
	}

	function createUserSelector(props)
	{
		const {
			id,
			controller,
			title,
			isVisible,
			unselectLastMessage,
		} = props;

		assertDefined(['id', 'controller'], props, 'SecurityBanner');

		return {
			id,
			controller,
			title,
			isVisible,
			unselectLastMessage,
			divider: false,
			type: SettingItemType.USER_SELECTOR,
		};
	}

	module.exports = {
		createLink,
		createSection,
		createToggle,
		createButton,
		createLinkButton,
		createThemeSwitch,
		createStyleSwitch,
		createVideoQualitySwitch,
		createDescription,
		createVideoBanner,
		createLocSelector,
		createBanner,
		createImage,
		createUserSelector,
	};
});
