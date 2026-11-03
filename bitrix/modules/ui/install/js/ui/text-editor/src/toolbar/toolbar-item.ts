import { EventEmitter } from 'main.core.events';

export class ToolbarItem extends EventEmitter
{
	constructor()
	{
		super();
		this.setEventNamespace('BX.UI.TextEditor.ToolbarItem');
	}

	getContainer(): HTMLElement
	{
		throw new Error('You must implement getContainer() method.');
	}

	render(): HTMLElement
	{
		throw new Error('You must implement render() method.');
	}

	/**
	 * Releases whatever the item holds beyond its DOM. A plain item holds nothing, but one that
	 * subscribes to a signal outlives its toolbar through the signal's subscriber list unless the
	 * subscription is disposed here.
	 */
	destroy(): void
	{}
}
