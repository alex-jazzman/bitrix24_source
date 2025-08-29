/* eslint-disable */
this.BX = this.BX || {};
this.BX.UI = this.BX.UI || {};
(function (exports,main_core) {
	'use strict';

	let _ = t => t,
	  _t;
	const Line = (width, height, radius) => {
	  const style = Object.entries({
	    width,
	    height,
	    radius
	  }).map(([prop, value]) => value ? `--${prop}: ${value}px;` : '');
	  return main_core.Tag.render(_t || (_t = _`<div class="ui-skeleton" style="${0}"></div>`), style.join(''));
	};

	const Circle = (size = 18) => Line(size, size, 99);

	exports.Line = Line;
	exports.Circle = Circle;

}((this.BX.UI.System = this.BX.UI.System || {}),BX));
//# sourceMappingURL=skeleton.bundle.js.map
