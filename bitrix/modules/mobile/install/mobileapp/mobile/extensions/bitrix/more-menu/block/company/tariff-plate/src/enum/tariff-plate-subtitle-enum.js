/**
 * @module more-menu/block/company/tariff-plate/src/enum/tariff-plate-subtitle-enum
 */
jn.define('more-menu/block/company/tariff-plate/src/enum/tariff-plate-subtitle-enum', (require, exports, module) => {
	const { Color } = require('tokens');
	const { Loc } = require('loc');
	const { BaseEnum } = require('utils/enums/base');

	/**
	 * Subtitle text + color for the tariff plate. Each variant builds its own
	 * localized phrase as a single message with the value inside (#VALUE#).
	 * Critical states stay a plain alert-colored line, they are not badges.
	 *
	 * @extends {BaseEnum<TariffPlateSubtitleEnum>}
	 */
	class TariffPlateSubtitleEnum extends BaseEnum
	{
		// The name of the plan read as a subtitle: the free card leads with the word "tariff" and says
		// which one underneath, the other states do it the other way round. It is the line that carries
		// the card, so it keeps the primary color the headings of the other states have.
		static TARIFF_NAME = new TariffPlateSubtitleEnum('tariffName', {
			color: Color.base1,
			format: ({ tariffName }) => tariffName || null,
		});

		static EXPIRE_DATE = new TariffPlateSubtitleEnum('expireDate', {
			color: Color.base2,
			format: ({ expireText }) => (
				expireText
					? Loc.getMessage('M_TARIFF_PLATE_EXPIRE_DATE', { '#VALUE#': expireText })
					: null
			),
		});

		static DEMO_DATE = new TariffPlateSubtitleEnum('demoDate', {
			color: Color.base2,
			format: ({ expireText }) => (
				expireText
					? Loc.getMessage('M_TARIFF_PLATE_DEMO_DATE', { '#VALUE#': expireText })
					: null
			),
		});

		static DAYS_LEFT = new TariffPlateSubtitleEnum('daysLeft', {
			color: Color.accentSoftElementRed1,
			format: ({ daysLeft = 0 }) => (
				Loc.getMessagePlural('M_TARIFF_PLATE_DAYS_LEFT', daysLeft, { '#VALUE#': daysLeft })
			),
		});

		static EXPIRED = new TariffPlateSubtitleEnum('expired', {
			color: Color.accentSoftElementRed1,
			format: () => Loc.getMessage('M_TARIFF_PLATE_EXPIRED'),
		});

		/**
		 * @param {{expireText: ?string, daysLeft: ?number, tariffName: ?string}} data
		 * @return {{text: string, color: object}|null}
		 */
		build(data)
		{
			const { color, format } = this.getValue();
			const text = format(data);

			return text ? { text, color } : null;
		}
	}

	module.exports = { TariffPlateSubtitleEnum: TariffPlateSubtitleEnum.export() };
});
