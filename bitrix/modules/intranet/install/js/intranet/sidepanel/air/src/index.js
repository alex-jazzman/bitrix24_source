import { Reflection } from 'main.core';
import { SliderManager, SidePanel } from 'main.sidepanel';
import { Slider } from './slider';

SliderManager.registerSliderClass(
	'BX.Intranet.Bitrix24.Slider',
	{
		startPosition: 'bottom',
		overlayBgColor: '#00204E',
		overlayBgCallback: (state, slider: Slider) => {
			const { intensity } = state;
			const overlayBgColor = slider.getOverlayBgColor();
			const overlayOpacity = slider.getOverlayOpacity();
			const start = Math.round(overlayOpacity * intensity / 100).toString(16).padStart(2, 0);
			const end = Math.round(100 * intensity / 100).toString(16).padStart(2, 0);

			const defaultBg = `linear-gradient(to bottom, ${overlayBgColor}${start} 0%, ${overlayBgColor}${end} 100%)`;

			const Template = Reflection.getClass('BX.Intranet.Bitrix24.Template');
			Template?.getRightSidebar().setOverlayBackground(defaultBg);

			if (slider.isMessengerSlider())
			{
				return `linear-gradient(to bottom, ${overlayBgColor}${end} 0%, ${overlayBgColor}${end} 35px, ${overlayBgColor}${start} 145px, ${overlayBgColor}${end} 100%)`;
			}

			return defaultBg;
		},
		overlayOpacity: 52,
		autoOffset: false,
		copyLinkLabel: true,
		newWindowLabel: true,
	},
	{
		focusTrap: {
			outsideExceptionSelectors: [
				'.aiassistant-marta',
				'#right-bar',
				'#avatar-area',
				'.side-panel-toolbar',
				'#im-chat-menu',
				'#app__right-panel',
				// The docked uploader outlives the page it was started from and keeps running
				// while a slider is open, so it has to stay reachable like the bars above it.
				'.disk-docked-uploader',
			],
			looped: false,
		},
		targetContainer: '#a11y-slider-container',
		animationDuration: 200,
		label: {
			text: '',
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
