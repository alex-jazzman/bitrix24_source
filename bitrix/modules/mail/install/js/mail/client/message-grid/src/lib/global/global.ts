import { Reflection } from 'main.core';

/**
 * Something the screen or the platform has published into the global namespace. `Reflection` promises
 * a function and hands back whatever stands at the path, so the shape of it is stated by the caller.
 */
export function resolveGlobal<T>(path: string): T | null
{
	return (Reflection.getClass(path) as unknown as T | null) ?? null;
}
