/**
 * Updates baseline.plan.ts with computed minimum versions.
 *
 * Reads enabled features from baseline config, computes minimum browser
 * versions, and adds a new entry to the transition plan if the versions
 * differ from existing entries.
 *
 * Usage: npm run plan
 */
import path from 'node:path';
import fs from 'node:fs';
import { features } from '../baseline.config';

const CORE_BROWSERS = ['chrome', 'edge', 'firefox', 'safari'] as const;

interface PlanEntry
{
	date: string;
	versions: Record<string, number>;
}

function computeMinVersions(): Record<string, number>
{
	const minimums: Record<string, number> = {};

	for (const [, feature] of Object.entries(features))
	{
		if (!feature.enabled)
		{
			continue;
		}

		for (const [browser, version] of Object.entries(feature.minVersions))
		{
			if (!minimums[browser] || version > minimums[browser])
			{
				minimums[browser] = version;
			}
		}
	}

	const coreOnly: Record<string, number> = {};
	for (const browser of CORE_BROWSERS)
	{
		if (minimums[browser])
		{
			coreOnly[browser] = minimums[browser];
		}
	}

	return coreOnly;
}

function loadExistingPlan(planPath: string): PlanEntry[]
{
	if (!fs.existsSync(planPath))
	{
		return [];
	}

	const content = fs.readFileSync(planPath, 'utf-8');
	const regex = /\{\s*date:\s*'([^']+)',\s*versions:\s*\{([^}]+)\}/g;

	const entries: PlanEntry[] = [];
	let match;
	while ((match = regex.exec(content)) !== null)
	{
		const date = match[1];
		const versions: Record<string, number> = {};
		const pairs = match[2].matchAll(/(\w+):\s*(\d+)/g);
		for (const pair of pairs)
		{
			versions[pair[1]] = parseInt(pair[2], 10);
		}

		entries.push({ date, versions });
	}

	return entries;
}

function versionsEqual(a: Record<string, number>, b: Record<string, number>): boolean
{
	for (const browser of CORE_BROWSERS)
	{
		if ((a[browser] ?? 0) !== (b[browser] ?? 0))
		{
			return false;
		}
	}

	return true;
}

function generatePlanFile(entries: PlanEntry[]): string
{
	const lines: string[] = [
		'/**',
		' * Baseline transition plan.',
		' *',
		' * Each entry defines minimum browser versions and the date they take effect.',
		' * The runtime uses this to determine:',
		' * - Current baseline: the latest entry whose date has passed',
		' * - Next baseline: the first entry whose date has not yet passed',
		' *',
		' * Browsers between current and next baseline see a soft warning.',
		' * Browsers below current baseline see a hard warning.',
		' *',
		' * Update: npm run plan',
		' */',
		'',
		'export interface BaselinePlanEntry',
		'{',
		'\tdate: string;',
		'\tversions: Record<string, number>;',
		'}',
		'',
		'export const plan: BaselinePlanEntry[] = [',
	];

	for (const entry of entries)
	{
		const versions = Object.entries(entry.versions)
			.map(([b, v]) => `${b}: ${v}`)
			.join(', ');

		lines.push(`\t{`);
		lines.push(`\t\tdate: '${entry.date}',`);
		lines.push(`\t\tversions: { ${versions} },`);
		lines.push(`\t},`);
	}

	lines.push('];');
	lines.push('');

	return lines.join('\n');
}

function main(): void
{
	const newVersions = computeMinVersions();

	const baseDir = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', '..');
	const planPath = path.join(baseDir, 'baseline.plan.ts');
	const existingPlan = loadExistingPlan(planPath);

	// Check if these versions already exist in the plan
	const alreadyInPlan = existingPlan.some((entry) => versionsEqual(entry.versions, newVersions));

	if (alreadyInPlan)
	{
		console.log('Plan is up to date — computed versions already in baseline.plan.ts');

		return;
	}

	// Show what's being added
	const lastEntry = existingPlan[existingPlan.length - 1];
	if (lastEntry)
	{
		console.log('Changes from last plan entry:');
		for (const browser of CORE_BROWSERS)
		{
			const prev = lastEntry.versions[browser] ?? 0;
			const next = newVersions[browser] ?? 0;
			if (prev !== next)
			{
				console.log(`  ${browser}: ${prev} → ${next}`);
			}
		}

		console.log('');
	}

	// Add new entry
	const newEntry: PlanEntry = {
		date: 'DD.MM.YYYY',
		versions: newVersions,
	};

	const updatedPlan = [...existingPlan, newEntry];
	const content = generatePlanFile(updatedPlan);
	fs.writeFileSync(planPath, content);

	console.log('Updated baseline.plan.ts');
	console.log(`  Added: { ${Object.entries(newVersions).map(([b, v]) => `${b}: ${v}`).join(', ')} }`);
	console.log('  Date: DD.MM.YYYY — set the planned transition date');
}

main();
