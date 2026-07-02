import path from 'node:path';
import fs from 'node:fs';

const VIRTUAL_ID = 'virtual:browser-versions';
const RESOLVED_ID = `\0${VIRTUAL_ID}`;

interface Baseline
{
	date: string;
	versions: Record<string, number>;
}

function loadBaseline(): Baseline
{
	const planPath = path.resolve(
		// eslint-disable-next-line @bitrix24/bitrix24-rules/no-typeof
		typeof __dirname === 'undefined'
			? path.dirname(new URL(import.meta.url).pathname)
			: __dirname,
		'..',
		'baseline.plan.ts',
	);

	const content = fs.readFileSync(planPath, 'utf-8');

	const dateMatch = content.match(/export const date\s*=\s*'([^']+)'/);
	const date = dateMatch ? dateMatch[1] : '';

	const versions: Record<string, number> = {};
	const versionRegex = /(\w+):\s*(\d+(?:\.\d+)?)/g;
	const versionsBlock = content.match(/export const versions[^{]*{([^}]+)}/);
	if (versionsBlock)
	{
		let match = null;
		while ((match = versionRegex.exec(versionsBlock[1])) !== null)
		{
			versions[match[1]] = parseInt(match[2], 10);
		}
	}

	return { date, versions };
}

// eslint-disable-next-line import/no-default-export
export default function browserVersionsPlugin()
{
	return {
		name: 'browser-versions',

		resolveId(source: string)
		{
			if (source === VIRTUAL_ID)
			{
				return RESOLVED_ID;
			}

			return null;
		},

		load(id: string)
		{
			if (id === RESOLVED_ID)
			{
				const baseline = loadBaseline();

				return `export const currentBaseline = ${JSON.stringify(baseline)};`;
			}

			return null;
		},
	};
}
