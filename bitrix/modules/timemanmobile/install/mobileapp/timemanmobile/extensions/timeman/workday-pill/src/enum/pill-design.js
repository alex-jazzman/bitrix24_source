/**
 * @module timeman/workday-pill/src/enum/pill-design
 */
jn.define('timeman/workday-pill/src/enum/pill-design', (require, exports, module) => {
	const { Color } = require('tokens');
	const { Icon } = require('ui-system/blocks/icon');
	const { BaseEnum } = require('utils/enums/base');

	class PillDesign extends BaseEnum
	{
		static NOT_STARTED = new PillDesign('NOT_STARTED', {
			bgColor: Color.accentMainPrimary,
			iconColor: Color.baseWhiteFixed,
			textColor: Color.baseWhiteFixed,
			icon: Icon.SOLID_PLAY,
		});

		static OPENED = new PillDesign('OPENED', {
			bgColor: Color.accentMainLink,
			iconColor: Color.baseWhiteFixed,
			textColor: Color.baseWhiteFixed,
			icon: Icon.SOLID_CLOCK,
		});

		static PAUSED = new PillDesign('PAUSED', {
			bgColor: Color.base8,
			iconColor: Color.base1,
			textColor: Color.base1,
			icon: Icon.SOLID_PAUSE,
		});

		static CLOSED = new PillDesign('CLOSED', {
			bgColor: Color.accentMainSuccess,
			iconColor: Color.baseWhiteFixed,
			textColor: Color.baseWhiteFixed,
			icon: Icon.SOLID_CHECK,
		});

		static EXPIRED = new PillDesign('EXPIRED', {
			bgColor: Color.accentMainAlert,
			iconColor: Color.baseWhiteFixed,
			textColor: Color.baseWhiteFixed,
			icon: Icon.SOLID_ALERT_ACCENT,
		});

		getBgColor()
		{
			return this.getValue().bgColor;
		}

		getBorderColor()
		{
			return this.getValue().borderColor;
		}

		getIconColor()
		{
			return this.getValue().iconColor;
		}

		getTextColor()
		{
			return this.getValue().textColor;
		}

		getIcon()
		{
			return this.getValue().icon;
		}
	}

	module.exports = {
		PillDesign: PillDesign.export(),
	};
});
