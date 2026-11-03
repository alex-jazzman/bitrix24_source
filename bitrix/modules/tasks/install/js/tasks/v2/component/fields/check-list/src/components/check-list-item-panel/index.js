export {
	ActionPlacement,
	EntityActionOrder,
	getActionDescriptors,
	registerAction,
} from './action-registry';
export type {
	ActionAccessContext,
	ActionDescriptor,
	ActionExecutionContext,
	ActionInteractionPolicy,
	ActionPlacementValue,
} from './action-registry';
export { resolveActions } from './action-access';
export type { ResolveActionOptions, ResolvedAction } from './action-access';
