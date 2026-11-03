import { Type } from 'main.core';

import { hydrateSettingsPresentation } from '../settings/mappers';
import {
	type HydratedSettingsHubBootstrap,
	type NavigationTarget,
	type NavigationTargets,
} from './types';

type UnknownRecord = Record<string, unknown>;

function fail(path: string, message: string): never
{
	throw new TypeError(`Invalid Settings Hub bootstrap at ${path}: ${message}`);
}

function readRecord(value: unknown, path: string): UnknownRecord
{
	return Type.isPlainObject(value) ? value as UnknownRecord : fail(path, 'plain object expected');
}

function assertExactKeys(record: UnknownRecord, keys: readonly string[], path: string): void
{
	const actualKeys = Object.keys(record);
	if (
		actualKeys.length !== keys.length
		|| actualKeys.some((key) => !keys.includes(key))
	)
	{
		fail(path, `expected fields ${keys.join(', ')}`);
	}
}

function parseNavigationTarget(value: unknown, path: string): NavigationTarget
{
	const target = readRecord(value, path);
	if (target.available === false)
	{
		assertExactKeys(target, ['available'], path);

		return { available: false };
	}

	if (target.available !== true)
	{
		return fail(`${path}.available`, 'boolean expected');
	}

	assertExactKeys(target, ['available', 'url'], path);
	if (!Type.isString(target.url) || target.url.trim() === '')
	{
		return fail(`${path}.url`, 'non-empty string expected');
	}

	return { available: true, url: target.url };
}

function parseNavigationTargets(value: unknown, path: string): NavigationTargets
{
	const source = readRecord(value, path);
	const navigation: Record<string, NavigationTarget> = Object.create(null);

	for (const [navigationId, target] of Object.entries(source))
	{
		navigation[navigationId] = parseNavigationTarget(target, `${path}.${navigationId}`);
	}

	return navigation;
}

export function hydrateSettingsHubBootstrap(value: unknown): HydratedSettingsHubBootstrap
{
	const bootstrap = readRecord(value, 'root');
	assertExactKeys(bootstrap, ['settings', 'navigation'], 'root');

	return {
		settings: hydrateSettingsPresentation({ settings: bootstrap.settings }),
		navigation: parseNavigationTargets(bootstrap.navigation, 'root.navigation'),
	};
}
