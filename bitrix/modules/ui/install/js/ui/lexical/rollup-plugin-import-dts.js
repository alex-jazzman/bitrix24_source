const path = require('path');
const fs = require('fs');
const { readFile, writeFile, mkdir } = require('node:fs/promises');

function importDts()
{
	return {
		name: 'import-dts',
		async buildStart()
		{
			const lexicalDir = __dirname;
			const lexicalPackageJson = require(path.join(lexicalDir, 'package.json'));
			const bundles = Object.keys(lexicalPackageJson.dependencies)
				.filter((dependence) => {
					return dependence.startsWith('@lexical/') || dependence === 'lexical';
				})
				.map((dependence) => {
					const id = dependence === 'lexical' ? 'core' : dependence.replace('@lexical/', '');

					return [id, dependence];
				})
			;

			const importRegex = /(?<=from )'@?lexical(?:\/(?<id>[_a-z-]+))?'/gm;
			const remapImports = (data) => {
				return data.replaceAll(importRegex, (match, p1) => {
					return `'ui.lexical.${p1 || 'core'}'`;
				});
			};

			const copyDtsFile = async (sourceFilePath, targetFilePath) => {
				const data = await readFile(sourceFilePath, 'utf8');
				await mkdir(path.dirname(targetFilePath), { recursive: true });
				await writeFile(targetFilePath, remapImports(data), 'utf8');
			};

			const collectDtsFiles = (dir) => {
				const results = [];
				for (const entry of fs.readdirSync(dir, { withFileTypes: true }))
				{
					const fullPath = path.join(dir, entry.name);
					if (entry.isDirectory())
					{
						results.push(...collectDtsFiles(fullPath));
					}
					else if (entry.name.endsWith('.d.ts'))
					{
						results.push(fullPath);
					}
				}

				return results;
			};

			for (const [id, nodeModule] of bundles)
			{
				const nodeModulePath = path.join(lexicalDir, 'node_modules', nodeModule);
				const extensionPath = path.join(lexicalDir, id, 'src');
				if (fs.existsSync(nodeModulePath) && fs.existsSync(extensionPath))
				{
					const dtsFiles = collectDtsFiles(nodeModulePath);
					for (const sourceFilePath of dtsFiles)
					{
						const relativePath = path.relative(nodeModulePath, sourceFilePath);
						const targetFilePath = path.join(extensionPath, relativePath);
						void copyDtsFile(sourceFilePath, targetFilePath);
					}
				}
			}
		},
	};
}

module.exports = importDts;