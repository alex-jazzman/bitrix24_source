import ConfigurableItem from '../configurable-item';

declare type ActionParams =
{
	action: String,
	actionType: String,
	actionData: ?Object,
	animationCallbacks: ?ActionAnimationCallbacks,
};

declare type ActionAnimationCallbacks =
{
	onStart: ?function,
	onStop: ?function,
};

export class Base
{
	onItemAction(item: ConfigurableItem, actionParams: ActionParams): void
	{

	}

	getContentBlockComponents(item: ConfigurableItem): Object
	{
		return {};
	}

	/**
	 * Will be executed before item node deleted from DOM
	 * @param item
	 */
	onBeforeItemClearLayout(item: ConfigurableItem): void
	{

	}

	static isItemSupported(item: ConfigurableItem): boolean
	{
		return false;
	}
}
