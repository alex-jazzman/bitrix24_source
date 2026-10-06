const path = require('path');
const { readFile, writeFile, mkdir } = require('node:fs/promises');

// Modeled on ui.lexical/rollup-plugin-import-dts.js, simplified for a single package.
// On buildStart copies the official d.ts files from node_modules into src/vendor-types/,
// remapping @floating-ui npm-name imports to relative paths between the copied files.
// See README.md for the full scheme.
function importDts()
{
	return {
		name: 'import-dts',
		async buildStart()
		{
			const rootDir = __dirname;
			const targetDir = path.join(rootDir, 'src', 'vendor-types');

			// @floating-ui package/subpath -> file name in src/vendor-types/.
			const specs = [
				{ id: '@floating-ui/dom', out: 'dom.d.ts' },
				{ id: '@floating-ui/core', out: 'core.d.ts' },
				{ id: '@floating-ui/utils', out: 'utils.d.ts' },
				{ id: '@floating-ui/utils/dom', out: 'utils-dom.d.ts' },
			];

			// Longest path first, otherwise '@floating-ui/utils' would eat
			// the prefix of '@floating-ui/utils/dom'.
			const remapImports = (data) => data
				.replaceAll('@floating-ui/utils/dom', './utils-dom')
				.replaceAll('@floating-ui/core', './core')
				.replaceAll('@floating-ui/utils', './utils');

			// Source .d.ts comes from the package.json: the types condition (.d.ts, not .d.mts).
			const resolveDtsSource = (id) => {
				const parts = id.split('/');
				const pkgName = parts.slice(0, 2).join('/');
				const subKey = parts.length > 2 ? `./${parts.slice(2).join('/')}` : '.';
				const pkgDir = path.join(rootDir, 'node_modules', pkgName);
				const pkg = require(path.join(pkgDir, 'package.json'));
				const entry = pkg.exports && pkg.exports[subKey];
				const rel = (entry && (entry.types || (entry.import && entry.import.types)))
					|| (subKey === '.' ? (pkg.types || pkg.typings) : null);
				if (!rel)
				{
					throw new Error(`import-dts: no d.ts found for ${id}`);
				}

				return path.join(pkgDir, rel);
			};

			await mkdir(targetDir, { recursive: true });
			for (const { id, out } of specs)
			{
				const data = await readFile(resolveDtsSource(id), 'utf8');
				await writeFile(path.join(targetDir, out), remapImports(data), 'utf8');
			}
		},
	};
}

module.exports = importDts;
