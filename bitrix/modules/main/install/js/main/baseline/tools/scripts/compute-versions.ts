/**
 * Computes minimum browser versions from enabled features.
 *
 * Usage:
 *   npm run compute                — show current minimum versions
 *   npm run compute -- subgrid     — what-if: show impact of enabling "subgrid"
 *
 * No side effects — only prints to stdout.
 */
import { features } from '../baseline.config';

const CORE_BROWSERS = ['chrome', 'edge', 'firefox', 'safari'] as const;

const BROWSER_LABELS: Record<string, string> = {
	chrome: 'Chrome',
	edge: 'Edge',
	firefox: 'Firefox',
	safari: 'Safari',
};

function computeMinVersions(
	extraEnabled?: Set<string>,
): Record<string, { version: number; feature: string }>
{
	const minimums: Record<string, { version: number; feature: string }> = {};

	for (const [id, feature] of Object.entries(features))
	{
		if (!feature.enabled && !extraEnabled?.has(id))
		{
			continue;
		}

		for (const [browser, version] of Object.entries(feature.minVersions))
		{
			if (!minimums[browser] || version > minimums[browser].version)
			{
				minimums[browser] = { version, feature: id };
			}
		}
	}

	return minimums;
}

function printVersions(
	minimums: Record<string, { version: number; feature: string }>,
): void
{
	for (const [browser, label] of Object.entries(BROWSER_LABELS))
	{
		const min = minimums[browser];
		if (min)
		{
			const link = `https://webstatus.dev/features/${min.feature}`;
			console.log(`  ${label.padEnd(20)} >= ${String(min.version).padEnd(6)} ${link}`);
		}
	}
}

function showWhatIf(featureId: string): void
{
	const feature = features[featureId];
	if (!feature)
	{
		console.error(`Feature "${featureId}" not found in baseline config.`);
		console.error('Available features:');
		for (const id of Object.keys(features))
		{
			console.error(`  ${id}`);
		}

		process.exit(1);
	}

	if (feature.enabled)
	{
		console.log(`Feature "${featureId}" is already enabled.\n`);
		console.log('Current minimum versions:\n');
		printVersions(computeMinVersions());

		return;
	}

	const current = computeMinVersions();
	const withFeature = computeMinVersions(new Set([featureId]));

	console.log(`What-if: enable "${featureId}"\n`);

	// Show feature's own versions
	console.log('Feature requires:');
	for (const [browser, label] of Object.entries(BROWSER_LABELS))
	{
		const ver = feature.minVersions[browser];
		if (ver)
		{
			console.log(`  ${label.padEnd(20)} >= ${ver}`);
		}
	}

	console.log('');

	// Show impact
	const changes: string[] = [];
	for (const browser of CORE_BROWSERS)
	{
		const before = current[browser]?.version ?? 0;
		const after = withFeature[browser]?.version ?? 0;
		if (after > before)
		{
			changes.push(
				`  ${BROWSER_LABELS[browser].padEnd(20)} ${before || '–'} → ${after} (+${after - before})`,
			);
		}
	}

	if (changes.length > 0)
	{
		console.log('Impact on minimum versions:');
		for (const change of changes)
		{
			console.log(change);
		}
	}
	else
	{
		console.log('No impact — feature fits within current minimum versions.');
	}
}

function main(): void
{
	const whatIfFeature = process.argv[2];

	if (whatIfFeature)
	{
		showWhatIf(whatIfFeature);

		return;
	}

	const minimums = computeMinVersions();
	const enabled = Object.entries(features).filter(([, f]) => f.enabled);
	const disabled = Object.entries(features).filter(([, f]) => !f.enabled);

	console.log(`Features: ${enabled.length} enabled, ${disabled.length} disabled\n`);

	// Display computed versions
	console.log('Computed minimum versions:\n');
	printVersions(minimums);

	// Show bottleneck analysis
	console.log('\nBottleneck analysis:');
	const bottleneckFeatures = new Set<string>();
	for (const browser of CORE_BROWSERS)
	{
		if (minimums[browser])
		{
			bottleneckFeatures.add(minimums[browser].feature);
		}
	}

	for (const bottleneckId of bottleneckFeatures)
	{
		const withoutMins: Record<string, number> = {};
		for (const [id, feature] of enabled)
		{
			if (id === bottleneckId)
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

		const changes: string[] = [];
		for (const browser of CORE_BROWSERS)
		{
			const current = minimums[browser]?.version ?? 0;
			const without = withoutMins[browser] ?? 0;
			if (without < current)
			{
				changes.push(`${BROWSER_LABELS[browser]} ${current} → ${without}`);
			}
		}

		if (changes.length > 0)
		{
			console.log(`\n  Disable "${bottleneckId}":`);

			for (const change of changes)
			{
				console.log(`    ${change}`);
			}
		}
	}

	if (disabled.length > 0)
	{
		console.log('\n\nDisabled features:');
		for (const [id] of disabled)
		{
			console.log(`  ${id}  https://webstatus.dev/features/${id}`);
		}
	}
}

main();
