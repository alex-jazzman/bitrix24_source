import { EventEmitter, BaseEvent } from 'main.core.events';

export class Page
{
	constructor()
	{
		EventEmitter.subscribe(this, 'BX.Intranet.Invitation:submit', this.onSubmit.bind(this));
		EventEmitter.subscribe('BX.Intranet.Invitation:onInviteRequestSuccess', this.onInviteSuccess.bind(this));
	}

	render(): HTMLElement
	{
		return new HTMLElement();
	}

	onSubmit(event: BaseEvent)
	{}

	onInviteSuccess(event: BaseEvent)
	{}

	hasShownButtonPanel(): boolean
	{
		return true;
	}
}
