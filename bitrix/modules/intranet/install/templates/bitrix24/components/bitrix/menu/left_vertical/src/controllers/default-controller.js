import { EventEmitter } from 'main.core.events';
import Options from '../options';

export default class DefaultController
{
	container;
	popup = null;

	constructor(
		container, {
			events
		}
	)
	{
		this.container = container;
		if (events)
		{
			Array
				.from(Object.keys(events))
				.forEach((key) => {
					EventEmitter.subscribe(this, Options.eventName(key), events[key])
				})
			;
		}
	}

	getContainer(): ?Element
	{
		return this.container;
	}

	createPopup(): Popup
	{

	}

	getPopup()
	{
		return this.popup;
	}

	bindPopupEvents()
	{
		EventEmitter.subscribe(this.popup, 'onClose', () => {
			EventEmitter.emit(this, Options.eventName('onClose'));
		});
		EventEmitter.subscribe(this.popup, 'onShow', () => {
			EventEmitter.emit(this, Options.eventName('onShow'));
		});
		EventEmitter.subscribe(this.popup, 'onDestroy', () => {
			this.popup = null;
		});
	}

	show()
	{
		if (this.popup === null)
		{
			this.popup = this.createPopup(...arguments);

			this.bindPopupEvents();
		}
		this.popup.show();
	}

	hide()
	{
		if (this.popup)
		{
			this.popup.close();
		}
	}
}
