import { toValue } from 'ui.vue3';

export function getCompositeBlockPortId(block: DiagramBlock, port: DiagramPort): string
{
	return `${toValue(block).id}_${toValue(port).id}`;
}
