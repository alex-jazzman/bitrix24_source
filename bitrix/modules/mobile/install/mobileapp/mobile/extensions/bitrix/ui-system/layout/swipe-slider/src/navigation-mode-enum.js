/**
 * @module ui-system/layout/swipe-slider/src/navigation-mode-enum
 */
jn.define('ui-system/layout/swipe-slider/src/navigation-mode-enum', (require, exports, module) => {
	const { BaseEnum } = require('utils/enums/base');

	/**
	 * @class SliderNavigationMode
	 * @template TSliderNavigationMode
	 * @extends {BaseEnum<SliderNavigationMode>}
	 */
	class SliderNavigationMode extends BaseEnum
	{
		static SWIPE = new SliderNavigationMode('SWIPE', 'swipe');

		static BUTTON = new SliderNavigationMode('BUTTON', 'button');
	}

	module.exports = {
		SliderNavigationMode: SliderNavigationMode.export(),
	};
});
