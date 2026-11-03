/**
 * @module mail/message/theme-request
 */
jn.define('mail/message/theme-request', (require, exports, module) => {
	const AppTheme = require('apptheme');
	const { Color } = require('tokens');

	const DARK_COLOR_SCHEME = 'dark';

	/**
	 * Appearance parameters for a message body request: the color scheme the application is drawn in and
	 * the design system tokens the server maps the colors of the message into. A light appearance is
	 * reported by their absence, so the light theme yields an empty object.
	 *
	 * The token set is fixed by the server contract and must stay equal to it key by key; the values are
	 * the tokens of the current application theme, never literal colors.
	 *
	 * @param {string} [themeId] Theme to build the parameters for; the current application theme by default.
	 * @return {{
	 *     colorScheme: string,
	 *     themeColors: MessageThemeColors,
	 * }|{}}
	 */
	function getThemeRequestParams(themeId = AppTheme.id)
	{
		if (themeId !== DARK_COLOR_SCHEME)
		{
			return {};
		}

		return {
			colorScheme: DARK_COLOR_SCHEME,
			themeColors: {
				bgContentPrimary: Color.bgContentPrimary.toHex(),
				base1: Color.base1.toHex(),
				base2: Color.base2.toHex(),
				base3: Color.base3.toHex(),
				accentMainLink: Color.accentMainLink.toHex(),
				bgSeparatorPrimary: Color.bgSeparatorPrimary.toHex(),
			},
		};
	}

	module.exports = { getThemeRequestParams };
});
