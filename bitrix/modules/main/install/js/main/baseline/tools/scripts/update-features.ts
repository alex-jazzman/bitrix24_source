/**
 * Generates baseline config files grouped by category from web-features.
 *
 * Output structure:
 *   baseline.config.ts          — re-exports all category configs
 *   baseline/<category>.ts      — features grouped by category
 *
 * Each feature has a JSDoc comment with title, description, and spec link.
 * Set enabled to false to exclude a feature from minimum version calculation.
 *
 * Usage: npm run update
 *
 * When web-features updates, run again:
 * - New features are added as enabled: false
 * - Removed features are dropped
 * - Existing enabled/disabled state is preserved
 */
import path from 'node:path';
import fs from 'node:fs';

const CORE_BROWSERS = ['chrome', 'edge', 'firefox', 'safari'] as const;

// Map web-features groups to our category files
const GROUP_MAP: Record<string, string> = {
	// CSS
	css: 'css',
	selectors: 'css',
	'media-queries': 'css',
	'color-types': 'css',
	background: 'css',
	'borders-outlines': 'css',
	'clipping-shapes-masking': 'css',
	'explicit-defaults': 'css',
	fonts: 'css',
	'font-features': 'css',
	'font-synthesis': 'css',
	layout: 'css',
	positioning: 'css',
	flexbox: 'css',
	grid: 'css',
	'container-queries': 'css',
	containment: 'css',
	'multi-column': 'css',
	animation: 'css',
	transitions: 'css',
	transforms: 'css',
	gradients: 'css',
	'blend-mode': 'css',
	text: 'css',
	'text-wrap': 'css',
	'white-space': 'css',
	units: 'css',
	'image-scaling': 'css',
	print: 'css',
	scrolling: 'css',
	cssom: 'css',
	'environment-variables': 'css',
	counters: 'css',
	lists: 'css',

	// JavaScript
	javascript: 'js',
	arrays: 'js',
	'primitive-types': 'js',
	string: 'js',
	collections: 'js',
	maps: 'js',
	sets: 'js',
	iterators: 'js',
	promises: 'js',
	'typed-arrays': 'js',
	json: 'js',
	regexps: 'js',
	intl: 'js',
	'js-modules': 'js',

	// Web API
	dom: 'web-api',
	workers: 'web-api',
	messaging: 'web-api',
	clipboard: 'web-api',
	performance: 'web-api',
	streams: 'web-api',
	storage: 'web-api',
	indexeddb: 'web-api',
	'file-system': 'web-api',
	'custom-elements': 'web-api',
	'web-components': 'web-api',
	sensors: 'web-api',
	geolocation: 'web-api',
	'parsing-and-serialization': 'web-api',
	selection: 'web-api',
	'resource-hints': 'web-api',
	'view-transitions': 'web-api',
	'scroll-markers': 'web-api',
	'reading-order': 'web-api',
	'progressive-web-app': 'web-api',
	cookies: 'web-api',

	// HTML
	html: 'html',
	'html-elements': 'html',
	'landmark-elements': 'html',
	forms: 'html',
	images: 'html',

	// Media
	'media-elements': 'media',
	canvas: 'media',
	webgl: 'media',
	'webgl-extensions': 'media',
	'web-audio': 'media',
	svg: 'media',
	speech: 'media',

	// Security
	security: 'security',
	'credential-management': 'security',
	webauthn: 'security',

	// WebAssembly
	webassembly: 'wasm',

	// Network & Realtime
	webrtc: 'network',

	// Other
	xml: 'other',
	gamepad: 'other',
	payments: 'other',
	webdriver: 'other',
	'text-fragments': 'other',
	'compute-pressure': 'other',
	ruby: 'other',
	worklets: 'other',
};

const GROUP_TITLES: Record<string, string> = {
	css: 'CSS',
	js: 'JavaScript',
	'web-api': 'Web API',
	html: 'HTML',
	security: 'Security',
	media: 'Media & Graphics',
	wasm: 'WebAssembly',
	network: 'Network & Realtime',
	other: 'Other',
};

const GROUP_ORDER = ['css', 'js', 'web-api', 'html', 'security', 'media', 'wasm', 'network', 'other'];

interface FeatureData
{
	enabled: boolean;
	title: string;
	description: string;
	spec: string;
	widelyAvailableDate: string;
	minVersions: Record<string, number>;
}

function getGroup(featureGroups: string[]): string
{
	for (const g of featureGroups)
	{
		if (GROUP_MAP[g])
		{
			return GROUP_MAP[g];
		}
	}

	return 'other';
}

function formatDate(isoDate: string): string
{
	const match = isoDate.match(/^(\d{4})-(\d{2})-(\d{2})$/);
	if (!match)
	{
		return isoDate;
	}

	return `${match[3]}.${match[2]}.${match[1]}`;
}

function cleanDescription(raw: string): string
{
	return raw
		.replace(/<code>/g, '`')
		.replace(/<\/code>/g, '`')
		.replace(/<[^>]+>/g, '')
		.replace(/&#x3C;/g, '<')
		.replace(/&#x3E;/g, '>')
		.replace(/&lt;/g, '<')
		.replace(/&gt;/g, '>')
		.replace(/&amp;/g, '&')
		.replace(/&quot;/g, '"')
		.replace(/&#39;/g, "'")
		.replace(/\r/g, '')
		.replace(/\n/g, ' ')
		.replace(/\t/g, ' ')
		.replace(/\s{2,}/g, ' ')
		.trim();
}

function wrapText(text: string, prefix: string, maxWidth: number): string[]
{
	const words = text.split(' ');
	const lines: string[] = [];
	let line = prefix;

	for (const word of words)
	{
		if (line.length + word.length + 1 > maxWidth && line !== prefix)
		{
			lines.push(line);
			line = `${prefix} ${word}`;
		}
		else
		{
			line += ` ${word}`;
		}
	}

	lines.push(line);

	return lines;
}

function isInPreviousBaseline(
	support: Record<string, string>,
	previousMins: Record<string, number>,
): boolean
{
	for (const browser of CORE_BROWSERS)
	{
		const minRequired = parseInt(support[browser] || '999', 10);
		const prevMin = previousMins[browser];
		if (!prevMin || minRequired > prevMin)
		{
			return false;
		}
	}

	return true;
}

function loadPreviousBaselineMins(): Record<string, number>
{
	const filePath = path.resolve(
		path.dirname(new URL(import.meta.url).pathname),
		'..', 'data', 'previous-browserslist',
	);

	if (!fs.existsSync(filePath))
	{
		return {};
	}

	const content = fs.readFileSync(filePath, 'utf-8');
	const nameMap: Record<string, string> = {
		chrome: 'chrome', edge: 'edge', firefox: 'firefox', safari: 'safari',
	};

	const mins: Record<string, number> = {};
	for (const line of content.split('\n'))
	{
		const match = line.match(/^(\w+)\s*>=\s*(\d+)/i);
		if (!match)
		{
			continue;
		}

		const browser = nameMap[match[1].toLowerCase()];
		if (browser)
		{
			const ver = parseInt(match[2], 10);
			if (!mins[browser] || ver < mins[browser])
			{
				mins[browser] = ver;
			}
		}
	}

	return mins;
}

function loadExistingState(baseDir: string): Map<string, boolean>
{
	const state = new Map<string, boolean>();
	const baselineDir = path.join(baseDir, 'baseline');

	if (!fs.existsSync(baselineDir))
	{
		return state;
	}

	const regex = /^\t'([^']+)':\s*\{[\s\S]*?\n\t\tenabled:\s*(true|false)/gm;

	for (const file of fs.readdirSync(baselineDir))
	{
		if (!file.endsWith('.ts'))
		{
			continue;
		}

		const content = fs.readFileSync(path.join(baselineDir, file), 'utf-8');
		let match;
		while ((match = regex.exec(content)) !== null)
		{
			state.set(match[1], match[2] === 'true');
		}

		regex.lastIndex = 0;
	}

	return state;
}

function generateCategoryFile(
	group: string,
	features: Array<{ id: string; data: FeatureData }>,
): string
{
	// Group by year
	const byYear = new Map<string, typeof features>();
	for (const feature of features)
	{
		const year = feature.data.widelyAvailableDate.slice(6) || 'unknown';
		if (!byYear.has(year))
		{
			byYear.set(year, []);
		}

		byYear.get(year)!.push(feature);
	}

	const sortedYears = [...byYear.keys()].sort((a, b) => b.localeCompare(a));

	const lines: string[] = [
		'/**',
		` * Baseline ${GROUP_TITLES[group]} features.`,
		' *',
		` * Total: ${features.length}`,
		` * Years: ${sortedYears.join(', ')}`,
		' */',
		'',
		"import { type BaselineFeature } from '../baseline.config';",
		'',
		'/* eslint-disable quote-props */',
		'export const features: Record<string, BaselineFeature> = {',
	];

	for (const year of sortedYears)
	{
		const yearFeatures = byYear.get(year)!;
		lines.push('');
		lines.push(`\t// ── ${year} (${yearFeatures.length} features) ──`);

		for (const { id, data } of yearFeatures)
		{
			const desc = cleanDescription(data.description);

			lines.push('');
			lines.push(`\t/**`);
			lines.push(`\t * ${data.title}`);
			if (desc)
			{
				lines.push(`\t *`);
				lines.push(...wrapText(desc, '\t *', 95));
			}

			lines.push(`\t *`);
			lines.push(`\t * @see https://webstatus.dev/features/${id}`);

			lines.push(`\t */`);
			lines.push(`\t'${id}': {`);
			lines.push(`\t\tenabled: ${data.enabled},`);
			lines.push(`\t\twidelyAvailableDate: '${data.widelyAvailableDate}',`);

			lines.push(`\t\tminVersions: {`);
			for (const [b, v] of Object.entries(data.minVersions))
			{
				lines.push(`\t\t\t${b}: ${v},`);
			}

			lines.push(`\t\t},`);

			lines.push(`\t},`);
		}
	}

	lines.push('};');
	lines.push('');

	return lines.join('\n');
}

function generateMainConfig(
	groupCounts: Record<string, number>,
	totalCount: number,
): string
{
	const lines: string[] = [
		'/**',
		' * Baseline feature configuration.',
		' *',
		' * Features added in new "baseline widely available" vs previous baseline.',
		' * Only features NOT supported in the previous baseline are listed here.',
		' * Set enabled to false to exclude a feature from minimum version calculation.',
		' * This can lower the required browser versions if the feature is a bottleneck.',
		' *',
		` * Total features: ${totalCount}`,
	];

	for (const group of GROUP_ORDER)
	{
		if (groupCounts[group])
		{
			lines.push(` * - ${GROUP_TITLES[group]}: ${groupCounts[group]}`);
		}
	}

	lines.push(' *');
	lines.push(` * Source: web-features (https://github.com/web-platform-dx/web-features)`);
	lines.push(' * Update: npm run update');
	lines.push(' * Compute: npm run compute');
	lines.push(' */');
	lines.push('');
	lines.push('export interface BaselineFeature');
	lines.push('{');
	lines.push('\tenabled: boolean;');
	lines.push('\twidelyAvailableDate: string;');
	lines.push('\tminVersions: Record<string, number>;');
	lines.push('}');
	lines.push('');

	for (const group of GROUP_ORDER)
	{
		if (groupCounts[group])
		{
			const varName = group.replace(/-(\w)/g, (_, c) => c.toUpperCase());
			lines.push(`import { features as ${varName} } from './baseline/${group}';`);
		}
	}

	lines.push('');
	lines.push('export const features: Record<string, BaselineFeature> = {');

	for (const group of GROUP_ORDER)
	{
		if (groupCounts[group])
		{
			const varName = group.replace(/-(\w)/g, (_, c) => c.toUpperCase());
			lines.push(`\t...${varName},`);
		}
	}

	lines.push('};');
	lines.push('');

	return lines.join('\n');
}

async function main(): Promise<void>
{
	const { features: webFeatures } = await import('web-features');
	const previousMins = loadPreviousBaselineMins();

	const baseDir = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
	const existingState = loadExistingState(baseDir);

	let totalBaseline = 0;
	let skippedByPrevious = 0;
	const allFeatures: Array<{ id: string; data: FeatureData }> = [];

	for (const [id, feature] of Object.entries(webFeatures))
	{
		if (!feature.status || feature.status.baseline !== 'high')
		{
			continue;
		}

		const support = feature.status.support;
		if (!support)
		{
			continue;
		}

		totalBaseline++;

		// Skip features already in previous baseline
		if (Object.keys(previousMins).length > 0 && isInPreviousBaseline(support, previousMins))
		{
			skippedByPrevious++;
			continue;
		}

		// Collect minVersions
		const minVersions: Record<string, number> = {};
		for (const browser of CORE_BROWSERS)
		{
			const ver = support[browser];
			if (ver)
			{
				minVersions[browser] = parseInt(ver, 10);
			}
		}

		const enabled = existingState.has(id) ? existingState.get(id)! : true;

		allFeatures.push({
			id,
			data: {
				enabled,
				title: feature.name || id,
				description: feature.description_html || feature.description || '',
				spec: (feature.spec || [])[0] || '',
				widelyAvailableDate: formatDate(feature.status.baseline_high_date || ''),
				minVersions,
			},
		});
	}

	// Sort by impact (highest core browser version first)
	allFeatures.sort((a, b) => {
		const coreMax = (data: FeatureData): number => {
			return Math.max(...CORE_BROWSERS.map((br) => data.minVersions[br] ?? 0));
		};

		return coreMax(b.data) - coreMax(a.data);
	});

	// Group by category
	const byGroup: Record<string, typeof allFeatures> = {};
	for (const feature of allFeatures)
	{
		const wf = (await import('web-features')).features[feature.id];
		const group = getGroup(wf?.group || []);
		if (!byGroup[group])
		{
			byGroup[group] = [];
		}

		byGroup[group].push(feature);
	}

	// Write category files
	const baselineDir = path.join(baseDir, 'baseline');
	if (!fs.existsSync(baselineDir))
	{
		fs.mkdirSync(baselineDir, { recursive: true });
	}

	// Remove old files
	for (const file of fs.readdirSync(baselineDir))
	{
		if (file.endsWith('.ts'))
		{
			fs.unlinkSync(path.join(baselineDir, file));
		}
	}

	const groupCounts: Record<string, number> = {};
	for (const group of GROUP_ORDER)
	{
		const groupFeatures = byGroup[group];
		if (!groupFeatures || groupFeatures.length === 0)
		{
			continue;
		}

		groupCounts[group] = groupFeatures.length;
		const content = generateCategoryFile(group, groupFeatures);
		fs.writeFileSync(path.join(baselineDir, `${group}.ts`), content);
	}

	// Write main config
	const mainContent = generateMainConfig(groupCounts, allFeatures.length);
	fs.writeFileSync(path.join(baseDir, 'baseline.config.ts'), mainContent);

	// Report
	console.log(`Baseline features: ${totalBaseline} total`);
	console.log(`  Previous baseline: ${skippedByPrevious} (skipped)`);
	console.log(`  New in this baseline: ${allFeatures.length} (written)`);
	console.log(`  Check: ${skippedByPrevious} + ${allFeatures.length} = ${totalBaseline}`);
	console.log('');

	for (const group of GROUP_ORDER)
	{
		if (groupCounts[group])
		{
			console.log(`  baseline/${group}.ts: ${groupCounts[group]} ${GROUP_TITLES[group]}`);
		}
	}

	const preserved = allFeatures.filter((f) => existingState.has(f.id)).length;
	if (preserved > 0)
	{
		console.log(`  Preserved enabled/disabled state for ${preserved} features`);
	}

	const newCount = allFeatures.length - preserved;
	if (newCount > 0)
	{
		console.log(`  ${newCount} new features added (enabled by default)`);
	}
}

main();
