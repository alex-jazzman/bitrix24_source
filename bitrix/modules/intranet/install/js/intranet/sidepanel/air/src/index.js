import { Reflection } from 'main.core';
import { SliderManager, SidePanel } from 'main.sidepanel';
import { Slider } from './slider';

SliderManager.registerSliderClass(
	'BX.Intranet.Bitrix24.Slider',
	{
		startPosition: 'bottom',
		overlayBgColor: '#00204E',
		overlayOpacity: 52,
	},
	{
		animationDuration: 200,
		label: {
			text: '',
			bgColor: '#0075FF',
		},
	},
);

const namespace = Reflection.namespace('BX.Bitrix24');

Object.defineProperty(namespace, 'Slider', {
	get: () => {
		// eslint-disable-next-line no-console
		console.warn('Don\'t use BX.Bitrix24.Slider.');

		return SidePanel.Instance;
	},
});

Object.defineProperty(namespace, 'PageSlider', {
	get: () => {
		// eslint-disable-next-line no-console
		console.warn('Don\'t use BX.Bitrix24.PageSlider.');

		return SidePanel.Instance;
	},
});

export {
	Slider,
};
