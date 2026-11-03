import {
	type SettingBinding,
	type SettingId,
	type SettingRegistration,
	type SettingValuePath,
	type SettingsSectionRegistration,
} from '../model/types';
import { settingsSectionRegistry } from './settings-section-registry';
import { settingBindingRegistry } from './setting-binding-registry';

const callToCode = 'crm.format.callto';
const callToValuePaths: readonly SettingValuePath[] = [
	'format',
	'urlTemplate',
	'clickHandler',
	'normalizeNumber',
];

type V2SettingBinding = Extract<SettingBinding, { kind: 'v2' }>;

function validateBindingIds(
	registry: ReadonlyMap<SettingId, SettingRegistration>,
	bindings: ReadonlyMap<SettingId, SettingBinding>,
): void
{
	for (const id of registry.keys())
	{
		if (!bindings.has(id))
		{
			throw new Error(`Missing setting binding: "${id}"`);
		}
	}

	for (const id of bindings.keys())
	{
		if (!registry.has(id))
		{
			throw new Error(`Unknown setting binding id: "${id}"`);
		}
	}
}

function validateValuePath(id: SettingId, binding: V2SettingBinding): void
{
	if (binding.valuePath === undefined)
	{
		if (binding.code === callToCode)
		{
			throw new Error(`Missing value path for setting binding: "${id}"`);
		}

		return;
	}

	if (binding.code !== callToCode || !callToValuePaths.includes(binding.valuePath))
	{
		throw new Error(`Unknown setting binding value path: "${binding.valuePath}"`);
	}
}

function validateCodeCounts(codeCounts: ReadonlyMap<string, number>): void
{
	for (const [code, count] of codeCounts)
	{
		if (count > 1 && code !== callToCode)
		{
			throw new Error(`Duplicate setting binding code: "${code}"`);
		}
	}
}

function validateV2Bindings(bindings: ReadonlyMap<SettingId, SettingBinding>): void
{
	const codeCounts = new Map<string, number>();
	const actualCallToPaths = new Set<SettingValuePath>();

	for (const [id, binding] of bindings)
	{
		if (binding.kind !== 'v2')
		{
			continue;
		}

		validateValuePath(id, binding);
		codeCounts.set(binding.code, (codeCounts.get(binding.code) ?? 0) + 1);
		if (binding.valuePath !== undefined)
		{
			actualCallToPaths.add(binding.valuePath);
		}
	}

	validateCodeCounts(codeCounts);

	if (
		codeCounts.get(callToCode) !== callToValuePaths.length
		|| actualCallToPaths.size !== callToValuePaths.length
	)
	{
		throw new Error(`Invalid repeated setting binding code: "${callToCode}"`);
	}
}

function validateNavigationBindings(
	registry: ReadonlyMap<SettingId, SettingRegistration>,
	bindings: ReadonlyMap<SettingId, SettingBinding>,
): void
{
	const navigationIds = new Set<string>();

	for (const [id, registration] of registry)
	{
		const binding = bindings.get(id);
		if (binding === undefined)
		{
			throw new Error(`Missing setting binding: "${id}"`);
		}

		const { navigationId } = registration;
		if (binding.kind === 'navigation')
		{
			if (navigationId === undefined || navigationId.trim() === '')
			{
				throw new Error(`Missing navigation id for setting registration: "${id}"`);
			}
		}
		else if (navigationId !== undefined)
		{
			throw new Error(`Unexpected navigation id for setting registration: "${id}"`);
		}

		if (navigationId !== undefined)
		{
			if (navigationIds.has(navigationId))
			{
				throw new Error(`Duplicate setting navigation id: "${navigationId}"`);
			}

			navigationIds.add(navigationId);
		}
	}
}

function validateSettingBindings(
	registry: ReadonlyMap<SettingId, SettingRegistration>,
	bindings: ReadonlyMap<SettingId, SettingBinding>,
): void
{
	validateBindingIds(registry, bindings);
	validateNavigationBindings(registry, bindings);
	validateV2Bindings(bindings);
}

export function createSettingRegistry(
	sections: readonly SettingsSectionRegistration[],
	bindings: ReadonlyMap<SettingId, SettingBinding> = settingBindingRegistry,
): ReadonlyMap<SettingId, SettingRegistration>
{
	const registry = new Map<SettingId, SettingRegistration>();

	for (const section of sections)
	{
		for (const block of section.blocks)
		{
			for (const setting of block.settings)
			{
				if (registry.has(setting.id))
				{
					throw new Error(`Duplicate setting registration id: "${setting.id}"`);
				}

				registry.set(setting.id, setting);
			}
		}
	}

	validateSettingBindings(registry, bindings);

	return registry;
}

export const settingRegistry = createSettingRegistry(settingsSectionRegistry);
