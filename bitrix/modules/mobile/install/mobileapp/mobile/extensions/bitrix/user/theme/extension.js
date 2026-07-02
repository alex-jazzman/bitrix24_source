/**
 * @module user/theme
 */
jn.define('user/theme', (require, exports, module) => {
	const { Color } = require('tokens');

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

	module.exports = { getTextColorByTheme, isLightTheme };
});
