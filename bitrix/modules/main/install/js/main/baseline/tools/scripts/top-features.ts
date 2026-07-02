/**
 * Shows features that define or affect minimum browser versions.
 *
 * Two sections:
 * 1. Features whose disabling would immediately lower minimums
 * 2. Bottleneck features per browser — all features requiring the current minimum version
 *
 * Usage: npm run top
 */
import { features } from '../baseline.config';

const CORE_BROWSERS = ['chrome', 'edge', 'firefox', 'safari'] as const;

const BROWSER_LABELS: Record<string, string> = {
	chrome: 'Chrome',
	edge: 'Edge',
	firefox: 'Firefox',
	safari: 'Safari',
};

function main(): void
{
	const enabled = Object.entries(features).filter(([, f]) => f.enabled);

	if (enabled.length === 0)
	{
		console.log('No enabled features.');

		return;
	}

	// Current minimums
	const currentMins: Record<string, number> = {};
	for (const [, feature] of enabled)
	{
		for (const [browser, version] of Object.entries(feature.minVersions))
		{
			if (!currentMins[browser] || version > currentMins[browser])
			{
				currentMins[browser] = version;
			}
		}
	}

	console.log('Current minimums:');
	for (const browser of CORE_BROWSERS)
	{
		if (currentMins[browser])
		{
			console.log(`  ${BROWSER_LABELS[browser].padEnd(12)} >= ${currentMins[browser]}`);
		}
	}

	// Features whose disabling would lower minimums
	const costly: Array<{
		id: string;
		changes: Array<{ browser: string; from: number; to: number }>;
		totalDrop: number;
	}> = [];

	for (const [id] of enabled)
	{
		const withoutMins: Record<string, number> = {};
		for (const [otherId, feature] of enabled)
		{
			if (otherId === id)
			{
				continue;
			}

			for (const [browser, version] of Object.entries(feature.minVersions))
			{
				if (!withoutMins[browser] || version > withoutMins[browser])
				{
					withoutMins[browser] = version;
				}
			}
		}

		const changes: Array<{ browser: string; from: number; to: number }> = [];
		let totalDrop = 0;

		for (const browser of CORE_BROWSERS)
		{
			const current = currentMins[browser] ?? 0;
			const without = withoutMins[browser] ?? 0;
			if (without < current)
			{
				changes.push({ browser, from: current, to: without });
				totalDrop += current - without;
			}
		}

		if (changes.length > 0)
		{
			costly.push({ id, changes, totalDrop });
		}
	}

	costly.sort((a, b) => b.totalDrop - a.totalDrop);

	console.log(`\nDisable to lower minimums (${costly.length} of ${enabled.length}):\n`);

	if (costly.length === 0)
	{
		console.log('  None — all features share the same maximum versions.');
	}

	for (const { id, changes } of costly)
	{
		const detail = changes
			.map((c) => `${BROWSER_LABELS[c.browser]} ${c.from} → ${c.to}`)
			.join(', ');

		console.log(`  ${id}`);
		console.log(`    ${detail}`);
		console.log('');
	}

	// Bottleneck features per browser
	console.log('Bottleneck features by browser:\n');

	for (const browser of CORE_BROWSERS)
	{
		const min = currentMins[browser];
		if (!min)
		{
			continue;
		}

		const bottlenecks = enabled
			.filter(([, f]) => f.minVersions[browser] === min)
			.map(([id]) => id);

		console.log(`  ${BROWSER_LABELS[browser]} >= ${min} (${bottlenecks.length} features):`);
		for (const id of bottlenecks)
		{
			console.log(`    ${id}`);
		}

		console.log('');
	}
}

main();
