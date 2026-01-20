/**
 * @module ui-system/blocks/chips/chip-button/src/size-enum
 */
jn.define('ui-system/blocks/chips/chip-button/src/size-enum', (require, exports, module) => {
	const { Indent, Component } = require('tokens');
	const { BaseEnum } = require('utils/enums/base');
	const { Text4, Text5 } = require('ui-system/typography/text');

	/**
	 * @class ChipButtonSize
	 * @template TChipButtonSize
	 * @extends {BaseEnum<ChipButtonSize>}
	 */
	class ChipButtonSize extends BaseEnum
	{
		static S = new ChipButtonSize('S', {
			text: Text5,
			radius: Component.chipsSCorner,
			height: 24,
			avatar: {
				size: 20,
			},
			indent: {
				left: {
					text: Indent.L,
					icon: Indent.XS,
					avatar: Indent.S,
				},
				right: {
					text: Indent.L,
					dropdown: Indent.XS,
					icon: Indent.XS,
					avatar: Indent.S,
				},
			},
		});

		static M = new ChipButtonSize('M', {
			text: Text4,
			radius: Component.chipsMCorner,
			height: 32,
			avatar: {
				size: 20,
			},
			indent: {
				left: {
					text: Indent.XL,
					icon: Indent.M,
					avatar: Indent.M,
				},
				right: {
					text: Indent.XL,
					dropdown: Indent.XS,
					icon: Indent.M,
					avatar: Indent.M,
				},
			},
		});

		static L = new ChipButtonSize('L', {
			text: Text4,
			radius: Component.chipsLCorner,
			height: 38,
			avatar: {
				size: 20,
			},
			indent: {
				left: {
					text: Indent.XL2,
					icon: Indent.L,
					avatar: Indent.L,
				},
				right: {
					text: Indent.XL2,
					dropdown: Indent.S,
					icon: Indent.L,
					avatar: Indent.L,
				},
			},
		});

		getIndent(direction = 'right', type = 'text')
		{
			return this.getValue()?.indent?.[direction]?.[type];
		}

		getTypography()
		{
			return this.getValue().text;
		}

		getHeight()
		{
			return this.getValue().height;
		}

		getRadius()
		{
			return this.getValue().radius;
		}

		getAvatar()
		{
			return this.getValue().avatar;
		}
	}

	module.exports = {
		ChipButtonSize: ChipButtonSize.export(),
	};
});
