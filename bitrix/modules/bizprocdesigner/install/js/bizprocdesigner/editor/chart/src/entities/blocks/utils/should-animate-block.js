import { Type } from 'main.core';
import { type Block } from '../../../shared/types';

const ANIMATED_ACTIVITY_TYPES: Set<string> = new Set([
	'CreateStorageNode',
	'WriteDataStorageActivity',
	'ReadDataStorageActivity',
	'DeleteDataStorageActivity',
	'SetupTemplateActivity',
	'CrmDealComplexActivity',
	'TasksComplexActivity',
	'CrmDynamicComplexActivity',
	'AiAssistantAgentComplexActivity',
]);

export function shouldAnimateBlock(block: ?Block): boolean
{
	const activityType = block?.activity?.Type;

	return Type.isString(activityType) && ANIMATED_ACTIVITY_TYPES.has(activityType);
}
