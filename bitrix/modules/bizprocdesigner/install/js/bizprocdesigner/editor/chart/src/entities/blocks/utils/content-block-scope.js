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

/**
 * Live label the scope of the diagram answers the key of the consumer with, `null` when it has no
 * answer at all. The two are told apart on purpose: an empty answer is a producer without a label.
 */
function resolveScopeLabel(block: Block, scope: Scope, descriptor: ConsumerDescriptor): ?string
{
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

	return String(namespaceLabels[key] ?? '').trim();
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

	const label = resolveScopeLabel(block, scope, descriptor);
	if (label === null)
	{
		return null;
	}

	return { text: label === '' ? descriptor.emptyLabel : label };
}

/**
 * Whether the representation stored on the block is a placeholder instead of the state of the node.
 *
 * Asked by the places that read `activity.ContentBlock` directly, the settings panel among them. The
 * sign is structural - the descriptors of the catalog, the labelled values the representation carries
 * and the live labels of the diagram - never the text, which is one localized phrase on both sides:
 *  - a producer tells its state through its own label property, so an empty one leaves a placeholder;
 *  - a consumer carries no labelled value exactly when the server resolved no storage title for it
 *    (nothing chosen, or a representation rebuilt without the scope on save);
 *  - a consumer whose key the scope answers with an empty producer label is overtaken by it.
 */
export function isContentBlockPlaceholder(
	block: Block,
	scope: Scope,
	producers: Map<string, ProducerDescriptor>,
	consumers: Map<string, ConsumerDescriptor>,
): boolean
{
	const producer = producers.get(block.activity?.Type);
	if (producer)
	{
		return String(block.activity?.Properties?.[producer.labelProperty] ?? '').trim() === '';
	}

	const consumer = consumers.get(block.activity?.Type);
	if (!consumer)
	{
		return false;
	}

	const items = block.activity?.ContentBlock?.items;
	if (!Array.isArray(items) || items.length === 0)
	{
		return true;
	}

	return resolveScopeLabel(block, scope, consumer) === '';
}
