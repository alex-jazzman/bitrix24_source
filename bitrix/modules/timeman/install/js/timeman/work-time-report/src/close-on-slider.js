import { EventEmitter } from 'main.core.events';

export const closeOnSliderOpen = (handler: () => void): () => void => {
	EventEmitter.subscribe('SidePanel.Slider:onOpenStart', handler);

	return (): void => {
		EventEmitter.unsubscribe('SidePanel.Slider:onOpenStart', handler);
	};
};
