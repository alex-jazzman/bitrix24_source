/**
 * @module ui-system/blocks/badges/counter/src/size-enum
 */
jn.define('ui-system/blocks/badges/counter/src/size-enum', (require, exports, module) => {
	const { Indent } = require('tokens');
	const { BaseEnum } = require('utils/enums/base');
	const { Text5, Text6, Text7 } = require('ui-system/typography/text');

	const isAndroid = Application.getPlatform() === 'android';

	// Android reserves more font padding above the glyph than below it, so the value of a badge this
	// small visibly drifts towards its bottom border. Neither includeFontPadding nor textAlignVertical
	// reaches the native text here, so the value is pulled back by shifting the text itself. iOS
	// centres the glyph on its own and needs no shift.
	const verticalTextShift = (value) => (isAndroid ? value : 0);

	/**
	 * @extends {BaseEnum<BadgeCounterSize>}
	 */
	class BadgeCounterSize extends BaseEnum
	{
		static DOT = new BadgeCounterSize('DOT', {
			height: 5,
		});

		static XS = new BadgeCounterSize('XS', {
			height: isAndroid ? 15 : 14,
			typography: Text7,
			paddingHorizontal: Indent.XS,
			textOffset: verticalTextShift(-0.5),
		});

		static S = new BadgeCounterSize('S', {
			height: isAndroid ? 17 : 16,
			typography: Text6,
			paddingHorizontal: Indent.XS,
			textOffset: verticalTextShift(-1),
		});

		static M = new BadgeCounterSize('M', {
			height: 18,
			typography: Text5,
			paddingHorizontal: Indent.S,
			textOffset: verticalTextShift(-1),
		});

		/**
		 * @returns {number}
		 */
		getHeight()
		{
			return this.getValue().height;
		}

		/**
		 * @returns {Indent}
		 */
		getPaddingHorizontal()
		{
			return this.getValue().paddingHorizontal;
		}

		/**
		 * @returns {number}
		 */
		getTextOffset()
		{
			return this.getValue().textOffset ?? 0;
		}

		/**
		 * @returns {TextBase}
		 */
		getTypography()
		{
			return this.getValue().typography;
		}

		isDot()
		{
			return this.equal(BadgeCounterSize.DOT);
		}
	}

	module.exports = {
		BadgeCounterSize,
	};
});
