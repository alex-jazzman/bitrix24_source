import {Cache, Dom} from 'main.core';
import ColorValue from '../../color_value';
import GradientValue from '../../gradient_value';
import {PresetOptions, gradientType} from './types/preset-options';
import hexToHsl from '../../internal/hex-to-hsl';

export default class Generator
{
	static BITRIX_COLOR: string = '#2fc6f6';

	static cache = new Cache.MemoryCache();
	static defaultPresets: [] = [
		{
			id: 'blackAndWhite',
			items: [
				'#ffffff', '#f2f2f2', '#dbdbdb', '#b5b5b5', '#919191', '#808080',
				'#6e6e6e', '#5c5c5c', '#4a4a4a', '#242424', '#171717', '#000000',
			],
		},
		{
			id: 'agency',
			items: [
				'#ff6366', '#40191a', '#803233', '#bf4b4d', '#e65a5c', '#ffc1c2',
				'#363643', '#57dca3', '#ee76ba', '#ffa864', '#eaeaec', '#fadbdc',
				// '#ff6366', '#2b2b2b', '#595959', '#858585', '#ff4245', '#ffc1c2',
				// '#3d3d3d', '#33ffa7', '#ff66bd', '#ffa864', '#ebebeb', '#ffd6d8',
			],
		},
		{
			id: 'accounting',
			items: [
				'#a5c33c', '#384215', '#6f8228', '#8fa834', '#b0cf40', '#dae6ae',
				'#4c4c4c', '#5d84e6', '#cd506b', '#fe6466', '#dfdfdf', '#e9f0cf',
				// '#c8ff00', '#445700', '#84a800', '#acdb00', '#cbff0f', '#e8ff94',
				// '#4c4c4c', '#4278ff', '#ff1f4f', '#ff6164', '#dfdfdf', '#f2ffc2',
			],
		},
		{
			id: 'app',
			items: [
				'#4fd2c2', '#1f524c', '#379187', '#46b8aa', '#54dece', '#c8f1ec',
				'#6639b6', '#e81c62', '#9a69ca', '#6279d8', '#ffc337', '#e9faf8',
				// '#24ffe5', '#383838', '#636363', '#808080', '#33ffe7', '#b8fff7',
				// '#5800f0', '#ff055d', '#999999', '#3d64ff', '#ffc337', '#e5fffc',
			],
		},
		{
			id: 'architecture',
			items: [
				'#c94645', '#4a1919', '#8a2f2f', '#b03c3c', '#d64949', '#eec3c3',
				'#363643', '#446d90', '#a13773', '#c98145', '#eaeaec', '#f9e8e7',
				// '#ff0f0f', '#303030', '#5c5c5c', '#757575', '#ff1f1f', '#ffb3b3',
				// '#3d3d3d', '#6b6b6b', '#6b6b6b', '#ff7b0f', '#ebebeb', '#ffe2e0',
			],
		},
		{
			id: 'business',
			items: [
				'#3949a0', '#232c61', '#313e87', '#3e4fad', '#556ced', '#d8d7dc',
				'#14122c', '#1d1937', '#a03949', '#2f295a', '#c87014', '#f4f4f5',
				// '#6e6e6e', '#424242', '#5c5c5c', '#757575', '#425fff', '#d9d9d9',
				// '#1f1f1f', '#292929', '#6e6e6e', '#424242', '#db7100', '#f5f5f5',
			],
		},
		{
			id: 'charity',
			items: [
				'#f5f219', '#f58419', '#f5cc19', '#a8e32a', '#f9f76a', '#fcfbb6',
				'#000000', '#262e37', '#74797f', '#e569b1', '#edeef0', '#fefedf',
				// '#fffb0f', '#ff830f', '#ffd30f', '#b3ff0f', '#fffc66', '#fffeb3',
				// '#000000', '#2e2e2e', '#7a7a7a', '#ff4db5', '#f0f0f0', '#ffffe0',
			],
		},
		{
			id: 'construction',
			items: [
				'#f7b70b', '#382a02', '#785905', '#b88907', '#dea509', '#fdf1d1',
				'#111111', '#a3a3a3', '#f7410b', '#f70b4b', '#d6dde9', '#fef9ea',
				// '#ffbc05', '#382900', '#805e00', '#bd8a00', '#e6a800', '#fff3d1',
				// '#111111', '#a3a3a3', '#ff3f05', '#ff0548', '#e0e0e0', '#fffaeb',
			],
		},
		{
			id: 'consulting',
			items: [
				'#21a79b', '#38afa5', '#14665f', '#1c8c83', '#30f2e2', '#a9ddd9',
				'#ec4672', '#58d400', '#f0ac00', '#2d6faf', '#2da721', '#e6f5f4',
				// '#00c7b6', '#00e6d2', '#007a70', '#00a89a', '#24ffed', '#c2c2c2',
				// '#ff3369', '#58d400', '#f0ac00', '#006edb', '#11c700', '#ededed',
			],
		},
		{
			id: 'corporate',
			items: [
				'#6ab8ee', '#31556e', '#4e86ad', '#5fa3d4', '#70c1fa', '#d2e9f8',
				'#36e2c0', '#ffaa3c', '#ee6a76', '#ffa468', '#5feb99', '#ebf4fb',
				// '#57b9ff', '#4f4f4f', '#7d7d7d', '#33aaff', '#6bc1ff', '#ccebff',
				// '#1affd1', '#ffaa3c', '#ff5765', '#ffa468', '#4dff97', '#e5f4ff',
			],
		},
		{
			id: 'courses',
			items: [
				'#6bda95', '#2c593d', '#4b9969', '#5ebf83', '#70e69d', '#c2f0d3',
				'#31556e', '#ff947d', '#738ed3', '#f791ab', '#ffb67d', '#e2f8eb',
				// '#47ff8e', '#424242', '#737373', '#8f8f8f', '#57ff97', '#b3ffcf',
				// '#4f4f4f', '#ff947d', '#477bff', '#ff8aa7', '#ffb67d', '#dbffea',
			],
		},
		{
			id: 'event',
			items: [
				'#f73859', '#380d14', '#781c2b', '#b82a42', '#de334f', '#fdbbc6',
				'#151726', '#ffb553', '#30d59b', '#b265e0', '#edeef0', '#ffeaed',
				// '#ff2e51', '#47000c', '#940019', '#e00025', '#ff143c', '#ffb8c4',
				// '#1f1f1f', '#ffb553', '#05ffa8', '#bc47ff', '#f0f0f0', '#ffeaed',
			],
		},
		{
			id: 'gym',
			items: [
				'#6b7de0', '#2f3661', '#4d5aa1', '#5f6fc7', '#7284ed', '#e4e8fa',
				'#333333', '#ffd367', '#a37fe8', '#e06b7d', '#6dc1e0', '#f4f6fd',
				// '#4d67ff', '#474747', '#787878', '#949494', '#6179ff', '#e0e6ff',
				// '#333333', '#ffd367', '#9c66ff', '#ff4d67', '#4dcfff', '#f0f3ff',
			],
		},
		{
			id: 'lawyer',
			items: [
				'#e74c3c', '#69231b', '#a8382c', '#cf4536', '#f55240', '#f9d0cb',
				'#4e4353', '#5a505e', '#e7863c', '#38a27f', '#e2e1e3', '#fdeeec',
				// '#ff3a24', '#850d00', '#d61500', '#ff1e05', '#ff4c38', '#ffcdc7',
				// '#4a4a4a', '#575757', '#ff8324', '#6e6e6e', '#e3e3e3', '#ffedeb',
			],
		},
		{
			id: 'photography',
			items: [
				'#f7a700', '#382600', '#785200', '#b87d00', '#de9800', '#fde8ba',
				'#333333', '#0b5aa0', '#e93d18', '#06c4ed', '#3672a8', '#fff6e3',
				// '#f7a700', '#382600', '#785200', '#b87d00', '#de9800', '#ffe8b8',
				// '#333333', '#005cad', '#ff2f00', '#00c8f5', '#0078e0', '#fff6e3',
			],
		},
		{
			id: 'restaurant',
			items: [
				'#e6125d', '#660829', '#a60d43', '#cc1052', '#f21361', '#facfde',
				'#0eb88e', '#00946f', '#e04292', '#9b12e6', '#bfde00', '#fef2f6',
				// '#fa0057', '#700027', '#b3003e', '#db004d', '#ff055d', '#ffccde',
				// '#00c795', '#00946f', '#ff2491', '#a200fa', '#bfde00', '#fff0f5',
			],
		},
		{
			id: 'shipping',
			items: [
				'#ff0000', '#400000', '#800000', '#bf0000', '#e60000', '#ffb4b4',
				'#333333', '#ff822a', '#d63986', '#00ac6b', '#ffb800', '#fff3f3',
				// '#ff0000', '#400000', '#800000', '#bf0000', '#e60000', '#ffb4b4',
				// '#333333', '#ff822a', '#ff0f83', '#00ac6b', '#ffb800', '#fff3f3',
			],
		},
		{
			id: 'spa',
			items: [
				'#9dba04', '#313b01', '#667a02', '#86a103', '#a6c704', '#e4ecb9',
				'#ba7c04', '#cf54bb', '#049dba', '#1d7094', '#eead2f', '#f2f6dd',
				// '#9dbd00', '#333d00', '#667a00', '#88a300', '#aacc00', '#f2ffa8',
				// '#bd7e00', '#ff24da', '#009dbd', '#007db3', '#ffb41f', '#f8ffd6',
			],
		},
		{
			id: 'travel',
			items: [
				'#ee4136', '#6e1f19', '#ad3128', '#d43c31', '#fa4639', '#fef1f0',
				'#31353e', '#3e434d', '#ee8036', '#428abc', '#eaebec', '#c3c4c7',
				// '#ff3224', '#850900', '#d60e00', '#ff1605', '#ff4133', '#fff1f0',
				// '#383838', '#454545', '#ff7b24', '#808080', '#ebebeb', '#c4c4c4',
			],
		},
		{
			id: 'wedding',
			items: [
				'#d65779', '#572431', '#963e55', '#bd4d6b', '#e35d81', '#f7dfe5',
				'#af58a7', '#6bc34b', '#ec8c60', '#50a098', '#57b9d6', '#fdf4f6',
				// '#ff2e66', '#3d3d3d', '#6b6b6b', '#858585', '#ff4275', '#ffd6e0',
				// '#858585', '#4fff0f', '#ff854d', '#787878', '#2eceff', '#fff0f3',
			],
		},
	];

	static getDefaultPresets(): PresetOptions[]
	{
		return Generator.cache.remember('default', () => {
			const presets = [];
			Generator.defaultPresets.forEach(preset => {
				presets.push({
					id: preset.id,
					type: 'color',
					items: preset.items.map(item => new ColorValue(hexToHsl(item))),
				});
			});

			return presets;
		});
	}

	static getPrimaryColorPreset(): PresetOptions
	{
		return this.cache.remember('primary', () => {
			const preset = {
				id: 'defaultPrimary',
				items: [],
			};
			const primary = new ColorValue(Dom.style(document.documentElement, '--primary').trim());
			preset.items.push(new ColorValue(primary));

			if (primary.getHsl().s <= 10)
			{
				const lBeforeCount = (primary.getHsl().l > 50)
					? Math.ceil(primary.getHsl().l / 100 * 5)
					: Math.floor(primary.getHsl().l / 100 * 5);
				const lAfterCount = 5 - lBeforeCount;
				const deltaLBefore = primary.getHsl().l / (lBeforeCount + 1);
				const deltaLAfter = (100 - primary.getHsl().l) / (lAfterCount + 1);
				for (let i = 1; i <= lBeforeCount; i++)
				{
					preset.items.push(new ColorValue(primary).darken(deltaLBefore * i));
				}
				for (let ii = 1; ii <= lAfterCount; ii++)
				{
					preset.items.push(new ColorValue(primary).lighten(deltaLAfter * ii));
				}

				const deltaBitrixL = 15;
				const deltaBitrixS = 15;
				const bitrixColor = new ColorValue(Generator.BITRIX_COLOR);
				preset.items[6] = new ColorValue(bitrixColor);

				preset.items[7] = new ColorValue(bitrixColor.darken(deltaBitrixL).saturate(deltaBitrixS));
				preset.items[8] = new ColorValue(bitrixColor.darken(deltaBitrixL).saturate(deltaBitrixS));
				bitrixColor.lighten(deltaBitrixL * 2).desaturate(deltaBitrixS * 2);

				preset.items[9] = new ColorValue(bitrixColor.lighten(deltaBitrixL).desaturate(deltaBitrixS));
				preset.items[10] = new ColorValue(bitrixColor.lighten(deltaBitrixL).desaturate(deltaBitrixS));
				bitrixColor.darken(deltaBitrixL * 2).saturate(deltaBitrixS * 2);

				preset.items[11] = new ColorValue(bitrixColor).adjustHue(180);
			}
			else
			{
				const deltaL = (90 - primary.getHsl().l) / 3;
				const deltaL2 = (primary.getHsl().l - 10) / 3;
				const deltaS = (90 - primary.getHsl().s) / 3;
				const deltaS2 = (primary.getHsl().s - 10) / 3;

				preset.items[1] = new ColorValue(primary.darken(deltaL2).saturate(deltaS));
				preset.items[2] = new ColorValue(primary.darken(deltaL2).saturate(deltaS));
				preset.items[3] = new ColorValue(primary.darken(deltaL2).saturate(deltaS));
				primary.lighten(deltaL2 * 3).desaturate(deltaS * 3);

				preset.items[4] = new ColorValue(primary.desaturate(deltaS2).lighten(deltaL));
				preset.items[5] = new ColorValue(primary.desaturate(deltaS2).lighten(deltaL));
				preset.items[11] = new ColorValue(primary.desaturate(deltaS2).lighten(deltaL));
				primary.saturate(deltaS2 * 3).darken(deltaL * 3);

				preset.items[7] = new ColorValue(primary.adjustHue(40));
				preset.items[8] = new ColorValue(primary.adjustHue(-80));
				preset.items[9] = new ColorValue(primary.adjustHue(180));
				preset.items[6] = new ColorValue(primary.adjustHue(40));
				preset.items[10] = new ColorValue(primary.adjustHue(40));
			}
			return preset;
		});
	}

	static getGradientByColorOptions(options: PresetOptions): PresetOptions
	{
		const items = [];
		const pairs = [
			[1, 2],
			[1, 4],
			[5, 12],
			[1, 8],
			[8, 9],
			[1, 9],
			[10, 7],
			[7, 11],
		];
		pairs.forEach(pair => {
			items.push(new GradientValue({
				from: new ColorValue(options.items[pair[0] - 1]),
				to: new ColorValue(options.items[pair[1] - 1]),
				angle: GradientValue.DEFAULT_ANGLE,
				type: GradientValue.DEFAULT_TYPE,
			}));
		});

		return {
			type: gradientType,
			items: items,
		};
	}
}
