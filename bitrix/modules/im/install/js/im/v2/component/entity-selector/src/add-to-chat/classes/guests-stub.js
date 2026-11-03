import { BaseStub } from 'ui.entity-selector';

export class GuestsStub extends BaseStub
{
	render(): HTMLElement
	{
		return this.getOption('content');
	}
}
