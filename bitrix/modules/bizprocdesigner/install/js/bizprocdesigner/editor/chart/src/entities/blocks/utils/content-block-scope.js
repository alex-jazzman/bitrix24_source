import { type Block } from '../../../shared/types';

type ProducerDescriptor = { namespace: string, keyProperty: string, labelProperty: string };
type ConsumerDescriptor = { namespace: string, keyProperty: string, emptyLabel: string };
type Scope = { [namespace: string]: { [key: string]: string } };

export function buildContentBlockScope(blocks: Block[], producers: Map<string, ProducerDescriptor>): Scope
{
	const scope: Scope = {};
	for (const block of blocks)
	{
		const descriptor = producers.get(block.activity?.Type);
		if (!descriptor)
		{
			continue;
		}

		const key = String(block.activity?.Properties?.[descriptor.keyProperty] ?? '');
		if (key === '')
		{
			continue;
		}

		const label = String(block.activity?.Properties?.[descriptor.labelProperty] ?? '');
		if (!scope[descriptor.namespace])
		{
			scope[descriptor.namespace] = {};
		}
		scope[descriptor.namespace][key] = label;
	}

	return scope;
}

export function resolveConsumerContentBlock(
	block: Block,
	scope: Scope,
	consumers: Map<string, ConsumerDescriptor>,
): ?{ text: string }
{
	const descriptor = consumers.get(block.activity?.Type);
	if (!descriptor)
	{
		return null;
	}

	const key = String(block.activity?.Properties?.[descriptor.keyProperty] ?? '');
	if (key === '')
	{
		return null;
	}

	const namespaceLabels = scope[descriptor.namespace];
	if (!namespaceLabels || !(key in namespaceLabels))
	{
		return null;
	}

	const label = String(namespaceLabels[key] ?? '').trim();

	return { text: label === '' ? descriptor.emptyLabel : label };
}
