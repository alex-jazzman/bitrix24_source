/**
 * @module user/theme
 */
jn.define('user/theme', (require, exports, module) => {
	const { Color } = require('tokens');
	const { Feature } = require('feature');
	const { NativeAppearanceBundleService } = require('settings-v2/services/native');
	const { EventType } = require('settings-v2/const');

	/**
	 * @type {TextColors}
	 */
	const TextDefaults = {
		light: Color.baseWhiteFixed,
		dark: Color.baseBlackFixed,
		unknown: Color.base1,
	};

	/**
	 * @public
	 * @param {UserTheme} theme
	 * @param {TextColors} textColors
	 * @return {Color}
	 */
	function getTextColorByTheme(theme, textColors = TextDefaults)
	{
		if (!theme)
		{
			return textColors.unknown ?? TextDefaults.unknown;
		}

		if (isLightTheme(theme))
		{
			return textColors.light ?? TextDefaults.light;
		}

		return textColors.dark ?? TextDefaults.dark;
	}

	/**
	 * @public
	 * @return {Promise<string|null>}
	 */
	async function resolveAppearanceTextColorMode()
	{
		if (!Feature.isAppearanceBundlesEnabled())
		{
			return null;
		}

		try
		{
			return await NativeAppearanceBundleService.getBackgroundTextColorMode();
		}
		catch (e)
		{
			console.error(e);

			return null;
		}
	}

	/**
	 * @public
	 * @param {UserTheme} theme
	 * @param {string|null} textColorMode
	 * @return {UserTheme}
	 */
	function applyAppearanceTextColorMode(theme, textColorMode)
	{
		return textColorMode ? { ...theme, id: textColorMode } : theme;
	}

	/**
	 * @public
	 * @param {function(): (string|null)} getCurrentTextColorMode
	 * @param {function(string|null): void} onChange
	 * @return {function(): void}
	 */
	function subscribeToAppearanceTextColorModeChange(getCurrentTextColorMode, onChange)
	{
		const handler = async () => {
			const textColorMode = await resolveAppearanceTextColorMode();

			if (textColorMode !== getCurrentTextColorMode())
			{
				onChange(textColorMode);
			}
		};

		BX.addCustomEvent(EventType.changeAppearanceBundle, handler);

		return () => BX.removeCustomEvent(EventType.changeAppearanceBundle, handler);
	}

	/**
	 * @public
	 * @param {UserTheme} theme
	 * @return {boolean}
	 */
	function isLightTheme(theme)
	{
		if (!theme || !theme.id)
		{
			return false;
		}

		const baseThemeId = theme.id.split(':')[0];

		return baseThemeId === 'light';
	}

	module.exports = {
		getTextColorByTheme,
		isLightTheme,
		resolveAppearanceTextColorMode,
		applyAppearanceTextColorMode,
		subscribeToAppearanceTextColorModeChange,
	};
});
