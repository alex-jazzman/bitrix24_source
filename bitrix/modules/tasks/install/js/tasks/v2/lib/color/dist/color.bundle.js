/* eslint-disable */
this.BX = this.BX || {};
this.BX.Tasks = this.BX.Tasks || {};
this.BX.Tasks.V2 = this.BX.Tasks.V2 || {};
(function (exports) {
	'use strict';

	class Color {
		#limit = 255;
		#components;
		constructor(color) {
			this.#components = this.parse(color);
		}
		toRgb() {
			const [r, g, b, a] = this.#components;
			return `rgb(${[r, g, b].map(x => limitComponent(setComponentAlpha(x, a), this.#limit)).join(', ')})`;
		}
		toRgba() {
			const [r, g, b, a] = this.#components.map(x => limitComponent(x, this.#limit));
			return `rgba(${r}, ${g}, ${b}, ${a})`;
		}
		setOpacity(alpha) {
			this.#components[3] = alpha;
			return this;
		}
		limit(limit) {
			this.#limit = limit;
			return this;
		}
		isDark() {
			const [r, g, b] = this.#components;
			const brightness = (r * 299 + g * 587 + b * 114) / 1000;
			return brightness < 170;
		}
		parse(color) {
			if (color.slice(0, 3) === 'rgb') {
				const [r, g, b, a] = color.match(/\d+(\.\d+)?/g).map(x => parseFloat(x));
				return [r, g, b, a ?? 1];
			}
			const [r, g, b, a] = color.match(/\w\w/g).map(x => parseInt(x, 16));
			return [r, g, b, a ?? 1];
		}
	}
	const setComponentAlpha = (x, a) => Math.round((a * (x / 255) + (1 - a)) * 255);
	const limitComponent = (x, limit) => x < limit ? x : limit;

	exports.Color = Color;

})(this.BX.Tasks.V2.Lib = this.BX.Tasks.V2.Lib || {});
//# sourceMappingURL=color.bundle.js.map
