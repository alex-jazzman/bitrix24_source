/**
 * @module mail/message/elements/avatar
 */
jn.define('mail/message/elements/avatar', (require, exports, module) => {
	const AppTheme = require('apptheme');
	const { IconView, Icon } = require('ui-system/blocks/icon');
	const { Color } = require('tokens');

	function stringToHashCode(string)
	{
		let hashCode = 0;

		for (let i = 0; i < string.length; i++)
		{
			hashCode = string.charCodeAt(i) + ((hashCode << 5) - hashCode);
		}

		return hashCode;
	}

	function alignChannelRangeColor(chanelCode)
	{
		if (chanelCode > 255)
		{
			return 255;
		}

		if (chanelCode < 0)
		{
			return 0;
		}

		return Math.ceil(chanelCode);
	}

	function hashToColor(hash)
	{
		const maxIntensityAllChannels = 255 * 3;
		const minIntensityAllChannels = 0;
		const differenceCoefficientForGrayDetection = 0.2;

		let r = (hash & 0xFF0000) >> 16;
		let g = (hash & 0x00FF00) >> 8;
		let b = (hash & 0x0000FF);

		const contrastRatioForPastelColors = 1.5;
		const contrastRatioForDarkColors = 2.5;
		const channelReductionCoefficientIfGray = 2;

		if (maxIntensityAllChannels - (r + g + b) < 100)
		{
			// Pastel colors or white
			r /= contrastRatioForPastelColors;
			g /= contrastRatioForPastelColors;
			b /= contrastRatioForPastelColors;
		}
		else if ((r + g + b) < (200 - minIntensityAllChannels))
		{
			// Very dark colors
			r *= contrastRatioForDarkColors;
			g *= contrastRatioForDarkColors;
			b *= contrastRatioForDarkColors;
		}

		const channels = [r, g, b];

		channels.sort((sortA, sortB) => sortA - sortB);

		if (((channels[channels.length - 1] - channels[0]) / channels[0]) < differenceCoefficientForGrayDetection)
		{
			// Shade of gray
			g /= channelReductionCoefficientIfGray;
		}

		r = alignChannelRangeColor(r);
		g = alignChannelRangeColor(g);
		b = alignChannelRangeColor(b);

		const color = `#${(`0${r.toString(16)}`).slice(-2)}${(`0${g.toString(16)}`).slice(-2)}${(`0${b.toString(16)}`).slice(
			-2)}`;

		return color.toUpperCase();
	}

	function stringToColor(name)
	{
		return hashToColor(stringToHashCode(name.toLowerCase()));
	}

	function getInitials(string, email)
	{
		string = string.replaceAll(/[\d"#$%&'()*+,./:<>?\\{}~\u00AB\u00BB-]/g, '');
		string = string.replaceAll(/^\s+|\s+$/g, '');

		const names = string.split(' ');

		let initials = names[0].slice(0, 1).toUpperCase();

		if (names.length > 1)
		{
			initials += names[names.length - 1].slice(0, 1).toUpperCase();
		}

		if (initials === '')
		{
			const firstChar = (typeof email === 'string' && email.length > 0) ? email.charAt(0) : '';
			initials = firstChar ? firstChar.toUpperCase() : '';
		}

		return initials;
	}

	/**
	 * @function Avatar
	 */
	function Avatar(props)
	{
		const {
			fullName = 'User Quest',
			email = 'info@example.com',
			size = 34,
			isSelected = false,
		} = props;

		const style = {
			backgroundColor: stringToColor(email),
			borderRadius: 100,
		};

		if (isSelected)
		{
			return View(
				{},
				IconView({
					icon: Icon.CHECK_SIZE_S,
					color: Color.baseWhiteFixed,
					size,
					style,
				}),
			);
		}

		return View(
			{
				style: {
					width: size,
					height: size,
					...style,
				},
			},
			Text({
				style: {
					height: '100%',
					width: '100%',
					color: AppTheme.colors.baseWhiteFixed,
					fontSize: Math.round(size * 0.5),
					textAlign: 'center',
				},
				text: getInitials(fullName, email),
			}),
		);
	}

	module.exports = { Avatar, stringToColor, getInitials };
});
