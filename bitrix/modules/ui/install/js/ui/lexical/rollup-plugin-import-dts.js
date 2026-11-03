const path = require('path');
const fs = require('fs');
const { readFile, writeFile, mkdir, rm } = require('node:fs/promises');

// Типовые зависимости, на которые ссылаются апстримные .d.ts, но которые
// не являются экстеншенами ui.lexical.*: копируются одним файлом внутрь
// экстеншена-хозяина и ремапятся на относительный путь.
const VENDOR_TYPES = {
	'@preact/signals-core': {
		host: 'extension',
		source: 'node_modules/@preact/signals-core/dist/signals-core.d.ts',
		target: 'vendor-types/signals-core.d.ts',
	},
};

// Заглушки апстрима, которые не нужно вендорить.
const EXCLUDED_FILES = new Set(['typescript-too-old.d.ts']);

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

			const remapSpecifier = (specifier, targetFileDir, extensionSrcPath) => {
				if (specifier === 'lexical')
				{
					return 'ui.lexical.core';
				}

				const lexicalMatch = specifier.match(/^@lexical\/(?<id>[_a-z-]+)$/);
				if (lexicalMatch)
				{
					return `ui.lexical.${lexicalMatch.groups.id}`;
				}

				const vendor = VENDOR_TYPES[specifier];
				if (vendor)
				{
					const vendorPath = path.join(extensionSrcPath, vendor.target.replace(/\.d\.ts$/, ''));
					const relativePath = path.relative(targetFileDir, vendorPath);

					return relativePath.startsWith('.') ? relativePath : `./${relativePath}`;
				}

				return null;
			};

			// Покрывает `from 'x'`, `from "x"` и inline `import('x')` / `import("x")`.
			const importRegex = /(\bfrom\s+|\bimport\()(['"])(?<specifier>[^'"]+)\2/gm;
			const remapImports = (data, targetFileDir, extensionSrcPath) => {
				return data.replaceAll(importRegex, (match, prefix, quote, specifier) => {
					const remapped = remapSpecifier(specifier, targetFileDir, extensionSrcPath);

					return remapped === null ? match : `${prefix}${quote}${remapped}${quote}`;
				});
			};

			const copyDtsFile = async (sourceFilePath, targetFilePath, extensionSrcPath) => {
				const data = await readFile(sourceFilePath, 'utf8');
				await mkdir(path.dirname(targetFilePath), { recursive: true });
				await writeFile(
					targetFilePath,
					remapImports(data, path.dirname(targetFilePath), extensionSrcPath),
					'utf8',
				);
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
					else if (entry.name.endsWith('.d.ts') && !EXCLUDED_FILES.has(entry.name))
					{
						results.push(fullPath);
					}
				}

				return results;
			};

			// Апстрим складывает типы в dist/ (0.18+); фолбэк на корень пакета.
			const getTypesRoot = (nodeModulePath) => {
				const distPath = path.join(nodeModulePath, 'dist');
				if (fs.existsSync(path.join(distPath, 'index.d.ts')))
				{
					return distPath;
				}

				return nodeModulePath;
			};

			for (const [id, nodeModule] of bundles)
			{
				const nodeModulePath = path.join(lexicalDir, 'node_modules', nodeModule);
				const extensionSrcPath = path.join(lexicalDir, id, 'src');
				if (!fs.existsSync(nodeModulePath) || !fs.existsSync(extensionSrcPath))
				{
					continue;
				}

				// Устаревшие копии из прошлых версий не должны отравлять типы.
				await Promise.all(
					collectDtsFiles(extensionSrcPath).map((stalePath) => rm(stalePath)),
				);

				const typesRoot = getTypesRoot(nodeModulePath);
				await Promise.all(
					collectDtsFiles(typesRoot).map((sourceFilePath) => {
						const relativePath = path.relative(typesRoot, sourceFilePath);
						const targetFilePath = path.join(extensionSrcPath, relativePath);

						return copyDtsFile(sourceFilePath, targetFilePath, extensionSrcPath);
					}),
				);
			}

			await Promise.all(
				Object.values(VENDOR_TYPES).map((vendor) => {
					const sourceFilePath = path.join(lexicalDir, vendor.source);
					const extensionSrcPath = path.join(lexicalDir, vendor.host, 'src');
					const targetFilePath = path.join(extensionSrcPath, vendor.target);
					if (!fs.existsSync(sourceFilePath) || !fs.existsSync(extensionSrcPath))
					{
						return Promise.resolve();
					}

					return copyDtsFile(sourceFilePath, targetFilePath, extensionSrcPath);
				}),
			);
		},
	};
}

module.exports = importDts;
