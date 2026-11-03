/* eslint-disable */
this.BX = this.BX || {};
this.BX.Crm = this.BX.Crm || {};
(function (exports, main_core) {
	'use strict';

	const DEFAULT_STAGE_COLOR = '22d3ee';
	const HEX_COLOR_PATTERN = /^#?([\da-f]{6})$/i;
	const SHORT_HEX_COLOR_PATTERN = /^#?([\da-f]{3})$/i;
	function normalizeHexColor(color) {
		if (!main_core.Type.isString(color)) {
			return null;
		}
		return color.match(HEX_COLOR_PATTERN)?.[1].toLowerCase() ?? null;
	}
	function expandShortHexColor(color) {
		if (!main_core.Type.isString(color)) {
			return null;
		}
		const shortColor = color.match(SHORT_HEX_COLOR_PATTERN)?.[1].toLowerCase();
		return shortColor ? [...shortColor].map(channel => channel.repeat(2)).join('') : null;
	}
	function getRelativeLuminance(color) {
		const channels = [color.slice(0, 2), color.slice(2, 4), color.slice(4, 6)].map(channel => Number.parseInt(channel, 16) / 255).map(channel => channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4);
		return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
	}
	function normalizeStageColor(color, fallback) {
		return normalizeHexColor(color) ?? normalizeHexColor(fallback) ?? DEFAULT_STAGE_COLOR;
	}
	function getDefaultStageColor() {
		return DEFAULT_STAGE_COLOR;
	}
	function getStageTextColor(color) {
		const luminance = getRelativeLuminance(normalizeHexColor(color) ?? expandShortHexColor(color) ?? DEFAULT_STAGE_COLOR);
		const blackContrastRatio = (luminance + 0.05) / 0.05;
		const whiteContrastRatio = 1.05 / (luminance + 0.05);
		return blackContrastRatio >= whiteContrastRatio ? '#000000' : '#ffffff';
	}

	exports.getDefaultStageColor = getDefaultStageColor;
	exports.getStageTextColor = getStageTextColor;
	exports.normalizeStageColor = normalizeStageColor;

})(this.BX.Crm.Stage = this.BX.Crm.Stage || {}, BX);
//# sourceMappingURL=color.bundle.js.map
