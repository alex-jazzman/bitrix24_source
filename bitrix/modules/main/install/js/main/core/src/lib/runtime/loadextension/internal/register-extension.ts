import extensionsStorage from './extensions-storage';

const coreExtensionName: string = 'main.core';
const registeredNames: Set<string> = new Set();

// Derived from the same set the server is told about: a separate boolean would
// be a second source of truth for "the core is registered" and could drift from
// the reported list.
export function isCoreRegistered(): boolean
{
	return registeredNames.has(coreExtensionName);
}

// Names the client already runs, reported to the server so it can skip their
// branches. Only actual registrations count: a name queued by loadExtension is
// still "in flight", and skipping it for another batch would let that batch run
// before the phrases and settings of the branch have been applied (the ordering
// "data before assets" holds inside a batch, not between batches).
export function getRegisteredNames(): Array<string>
{
	return [...registeredNames];
}

// Records a registration without touching the extensions storage. After a
// minimal->full upgrade the registration itself goes through the freshly loaded
// BX.Runtime (a different module instance with its own storage), while the state
// gating the request parameters lives in this bundle and must stay in sync.
export function markRegistered(name: string): void
{
	if (typeof name === 'string' && name !== '')
	{
		registeredNames.add(name);
	}
}

// Test-only: resets the module-level registration state between unit tests.
export function resetRegisteredForTests(): void
{
	registeredNames.clear();
}

export default function registerExtension(options: any): void
{
	markRegistered(options?.name);

	if (!extensionsStorage.has(options.name))
	{
		const namespace = options?.namespace ?? 'window';
		extensionsStorage.set(options.name, Promise.resolve(namespace));
	}
}
