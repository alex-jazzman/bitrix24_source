import { Type, Dom } from 'main.core';

import { ConditionGroup } from '../condition/condition-group';
import { ConditionGroupSelector } from '../selectors/condition-group-selector';

// One mounted control per node. The designer render can invoke the mount twice
// (renderControlCollection + the self-bootstrap <script> from the server HTML),
// so decoration is guarded and idempotent.
const mountedControls: WeakMap<HTMLElement, ConditionGroupSelector> = new WeakMap();

/**
 * Mounts the standard `conditiongroup` control from its server-rendered node.
 * Reads (`data-config`): `{ config: { fields, documentType, value, prefix }, property, ... }`
 * and mounts a robot-free `ConditionGroupSelector` (auto-built `SimpleConditionContext`).
 * Idempotent: a repeated call for the same node returns the already-mounted control.
 *
 * @param {?HTMLElement} node - the `[data-role="bp-condition-group"]` element.
 * @returns {?ConditionGroupSelector}
 */
export function decorateConditionGroupField(node: ?HTMLElement): ?ConditionGroupSelector
{
	if (!Type.isDomNode(node))
	{
		return null;
	}

	if (mountedControls.has(node))
	{
		return mountedControls.get(node);
	}

	const params = parseConfig(node.dataset.config);
	const config = Type.isPlainObject(params.config) ? params.config : {};

	const fields = Type.isArray(config.fields) ? config.fields : [];
	const documentType = Type.isArray(config.documentType) ? config.documentType : null;
	const fieldPrefix = Type.isStringFilled(config.prefix) ? config.prefix : '';
	const title = Type.isPlainObject(params.property) ? (params.property.Name || '') : '';
	const caption = Type.isPlainObject(config.caption) ? config.caption : null;

	const selector = new ConditionGroupSelector(new ConditionGroup(config.value ?? null), {
		fields,
		fieldPrefix,
		documentType,
		rootGroupTitle: title,
		caption,
		// Default to expanded when the value carries no flag (e.g. activities saved before the flag moved into the value).
		isExpanded: config.isExpanded !== false,
		renderExpandedInput: true,
	});

	Dom.clean(node);
	Dom.append(selector.createNode(), node);

	mountedControls.set(node, selector);

	return selector;
}

/**
 * Returns the control already mounted into `node` (or `null`). Lets the hosting
 * activity reach it from `afterFormRender` to re-feed fields / wire the value
 * selector (`setFields` / `setValueSelector`).
 *
 * @param {?HTMLElement} node
 * @returns {?ConditionGroupSelector}
 */
export function getMountedConditionGroupField(node: ?HTMLElement): ?ConditionGroupSelector
{
	return (Type.isDomNode(node) && mountedControls.has(node)) ? mountedControls.get(node) : null;
}

function parseConfig(raw: ?string): Object
{
	if (!Type.isStringFilled(raw))
	{
		return {};
	}

	try
	{
		const parsed = JSON.parse(raw);

		return Type.isPlainObject(parsed) ? parsed : {};
	}
	catch (e)
	{
		return {};
	}
}
