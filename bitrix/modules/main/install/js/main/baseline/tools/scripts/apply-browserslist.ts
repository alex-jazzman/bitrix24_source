/**
 * Applies the current baseline from baseline.plan.ts to .browserslistrc.
 *
 * Finds the latest plan entry whose date has already passed
 * and writes the corresponding browser versions to .browserslistrc
 * in the project root.
 *
 * Usage: npm run apply
 */
import path from 'node:path';
import fs from 'node:fs';
import { plan } from '../../baseline.plan';

const BROWSER_LABELS: Record<string, string> = {
	chrome: 'Chrome',
	edge: 'Edge',
	firefox: 'Firefox',
	safari: 'Safari',
};

function parseDate(dateStr: string): Date | null
{
	const match = dateStr.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
	if (!match)
	{
		return null;
	}

	return new Date(parseInt(match[3], 10), parseInt(match[2], 10) - 1, parseInt(match[1], 10));
}

function findProjectRoot(): string
{
	let dir = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');

	while (dir !== path.dirname(dir))
	{
		if (fs.existsSync(path.join(dir, '.browserslistrc')))
		{
			return dir;
		}

		dir = path.dirname(dir);
	}

	throw new Error('.browserslistrc not found in any parent directory');
}

function main(): void
{
	const now = new Date();

	// Find the latest entry whose date has passed
	let currentEntry = plan[0];
	let nextEntry = null;

	for (let i = 0; i < plan.length; i++)
	{
		const date = parseDate(plan[i].date);
		if (date && date <= now)
		{
			currentEntry = plan[i];
			nextEntry = plan[i + 1] ?? null;
		}
	}

	if (!currentEntry)
	{
		console.log('No active baseline entry found in plan');

		return;
	}

	console.log(`Current baseline (${currentEntry.date}):`);
	for (const [browser, version] of Object.entries(currentEntry.versions))
	{
		const label = BROWSER_LABELS[browser] ?? browser;
		console.log(`  ${label} >= ${version}`);
	}

	if (nextEntry)
	{
		const nextDate = parseDate(nextEntry.date);
		const isPlaceholder = !nextDate;
		console.log('');
		console.log(`Next baseline (${nextEntry.date})${isPlaceholder ? ' — date not set' : ''}:`);
		for (const [browser, version] of Object.entries(nextEntry.versions))
		{
			const label = BROWSER_LABELS[browser] ?? browser;
			console.log(`  ${label} >= ${version}`);
		}
	}

	// Generate .browserslistrc content
	const lines: string[] = [];
	for (const [browser, version] of Object.entries(currentEntry.versions))
	{
		const label = BROWSER_LABELS[browser] ?? browser;
		lines.push(`${label} >= ${version}`);
	}

	lines.push('not dead');
	lines.push('');

	const projectRoot = findProjectRoot();
	const browserslistPath = path.join(projectRoot, '.browserslistrc');
	const existingContent = fs.readFileSync(browserslistPath, 'utf-8').trim();
	const newContent = lines.join('\n');

	if (existingContent === newContent.trim())
	{
		console.log('\n.browserslistrc is already up to date');

		return;
	}

	fs.writeFileSync(browserslistPath, newContent);
	console.log(`\nUpdated ${browserslistPath}`);
}

main();
