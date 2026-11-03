import {
	ActionPlacement,
	getActionDescriptors,
	type ActionAccessContext,
	type ActionDescriptor,
	type ActionPlacementValue,
} from './action-registry';

export type ResolveActionOptions = ActionAccessContext & {
	placement: ActionPlacementValue,
};

export type ResolvedAction = ActionDescriptor & {
	active: boolean,
};

function isAvailableForItem(descriptor: ActionDescriptor, options: ResolveActionOptions): boolean
{
	if (options.item.parentId !== 0)
	{
		let placement = descriptor.placement;
		if (options.isGroupMode)
		{
			placement = descriptor.groupPlacement ?? placement;
		}

		return placement === options.placement;
	}

	return (
		descriptor.rootPlacement === options.placement
		|| (descriptor.rootVisible === true && descriptor.placement === options.placement)
	);
}

export function resolveActions(options: ResolveActionOptions): ResolvedAction[]
{
	if (options.item.parentId === 0 && options.placement === ActionPlacement.Entity)
	{
		return [];
	}

	return getActionDescriptors()
		.filter((descriptor) => isAvailableForItem(descriptor, options))
		.filter((descriptor) => descriptor.isAvailable(options))
		.sort((first, second) => {
			const firstOrder = getActionOrder(first, options);
			const secondOrder = getActionOrder(second, options);

			return firstOrder - secondOrder;
		})
		.map((descriptor) => ({
			...descriptor,
			active: descriptor.isSelected(options),
		}))
	;
}

function getActionOrder(descriptor: ActionDescriptor, options: ResolveActionOptions): number
{
	if (options.item.parentId === 0)
	{
		return descriptor.rootOrder ?? descriptor.order;
	}

	if (options.isGroupMode)
	{
		return descriptor.groupOrder ?? descriptor.order;
	}

	return descriptor.order;
}
