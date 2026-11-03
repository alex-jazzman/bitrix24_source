import { Dom } from 'main.core';
import { EventEmitter } from 'main.core.events';

export const ParticipantsStreamControlButtonEvents = {
	onTurnOffStreamForAll: 'onTurnOffStreamForAll',
};

export class ParticipantsStreamControlButton
{
	constructor(config = {})
	{
		this.label = config.label || '';
		this.typeOfStream = config.typeOfStream || '';
		this.eventEmitter = new EventEmitter(this, 'ParticipantsStreamControl');

		const events = config.events ?? {};
		for (const [eventName, handler = () => {}] of Object.entries(events))
		{
			this.eventEmitter.subscribe(eventName, handler);
		}
	}

	static create(config)
	{
		return new ParticipantsStreamControlButton(config);
	}

	render()
	{
		return Dom.create('button', {
			props: {
				type: 'button',
				className: 'bx-call-view-participants-control-stream-button',
			},
			attrs: {
				'data-testid': `participants-permission-popup-turn-off-${this.typeOfStream}`,
			},
			children: [
				Dom.create('span', {
					props: { className: `bx-call-view-participants-control-stream-button-icon bx-call-view-participants-control-stream-button-icon-${this.typeOfStream}` },
					attrs: { 'aria-hidden': 'true' },
				}),
				Dom.create('span', {
					props: { className: 'bx-call-view-participants-control-stream-button-action' },
					text: this.label,
				}),
			],
			events: {
				click: () => {
					this.eventEmitter.emit(ParticipantsStreamControlButtonEvents.onTurnOffStreamForAll, {
						typeOfStream: this.typeOfStream,
					});
				},
			},
		});
	}
}
