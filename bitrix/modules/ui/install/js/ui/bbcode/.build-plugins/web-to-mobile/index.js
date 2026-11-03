const fs = require('fs');
const path = require('path');
const fetchDependencies = require('./fetch-dependencies');
const makeDepsPhpContent = require('./make-deps-php-content');
const getExtensionsPath = require('./get-extensions-path');

const chunksDirectory = path.join('build', 'chunks');

/**
 * Names the template file a replacement pattern was read from, relative to the extension. The
 * configs of the family read their wrapper templates from build/chunks next to the bundle and hand
 * the plugin the text rather than the path, so the file is looked up by its content.
 *
 * @return {string|null}
 */
function findPatternFile(extensionDirectory, pattern) {
	const chunksPath = path.join(extensionDirectory, chunksDirectory);
	if (!fs.existsSync(chunksPath))
	{
		return null;
	}

	const fileName = fs.readdirSync(chunksPath).find((name) => {
		return fs.readFileSync(path.join(chunksPath, name), 'utf8') === pattern;
	});

	return fileName ? path.join(chunksDirectory, fileName) : null;
}

/**
 * A string pattern is the wrapper the mobile artifact is made of, so a pattern the bundle does not
 * contain means the builder stopped emitting what the template expects. Replacing then silently
 * does nothing and the mobile extension ends up carrying the web wrapper, which registers nothing
 * in the application -- hence a build failure that names the template to refresh.
 */
function assertPatternFound(bundleContent, bundlePath, pattern) {
	if (typeof pattern !== 'string' || bundleContent.includes(pattern))
	{
		return;
	}

	const absoluteBundlePath = path.resolve(bundlePath);
	const extensionDirectory = path.dirname(path.dirname(absoluteBundlePath));
	const patternFile = findPatternFile(extensionDirectory, pattern);
	const patternSource = patternFile === null
		? `a replacement template starting with "${pattern.split('\n')[0]}"`
		: `the replacement template ${patternFile}`;

	throw new Error(
		`web-to-mobile: ${patternSource} of the extension in ${extensionDirectory} is not in its`
		+ ` built bundle ${path.relative(extensionDirectory, absoluteBundlePath)}.`
		+ ' The wrapper the builder emits has changed, so the mobile artifact would have kept the'
		+ ' web one. Refresh the template from the current bundle.',
	);
}

/**
 * @param {{
 * 		targetExtension: string,
 * 		replacements: Array<Array<pattern, replacement>>,
 * 		banner?: string,
 * }} options
 */
module.exports = function webToMobilePlugin(options) {
	const extensionDirectoryPath = path.join(
		getExtensionsPath(),
		...options.targetExtension.split('/'),
	);

	const extensionJsPath = path.join(
		extensionDirectoryPath,
		'extension.js',
	);

	return {
		name: 'web-to-mobile-plugin',
		/**
		 * The templates are checked here rather than where they are used, because this hook runs
		 * before the bundle is written: a template that no longer matches stops the build instead of
		 * leaving a written bundle on disk beside a mirror that was never refreshed. What is checked
		 * is the chunk the hook is handed and not the file, which at this point still holds the
		 * previous build.
		 */
		generateBundle(outputOptions, bundle) {
			if (!Array.isArray(options.replacements))
			{
				return;
			}

			const entryChunk = Object.values(bundle).find((output) => {
				return output.type === 'chunk' && output.isEntry;
			});

			if (!entryChunk)
			{
				return;
			}

			const bundlePath = typeof outputOptions.file === 'string'
				? outputOptions.file
				: path.join(outputOptions.dir || '', entryChunk.fileName);

			options.replacements.forEach(([pattern]) => {
				assertPatternFound(entryChunk.code, bundlePath, pattern);
			});
		},
		// the mirror is made by reading the bundle back from disk, so it stays after the write
		writeBundle(outputOptions) {
			if (!fs.existsSync(extensionJsPath))
			{
				fs.mkdirSync(extensionDirectoryPath, { recursive: true });
			}

			let bundleContent = fs.readFileSync(outputOptions.file, 'utf8');
			if (Array.isArray(options.replacements))
			{
				options.replacements.forEach(([pattern, replacement]) => {
					// checked again on what was actually written: the substitution is made on this
					// content, not on the chunk generateBundle saw
					assertPatternFound(bundleContent, outputOptions.file, pattern);
					bundleContent = bundleContent.replace(pattern, replacement);
				});
			}

			const dependencies = fetchDependencies(bundleContent);
			if (dependencies.length > 0)
			{
				const depsPhpContent = makeDepsPhpContent(dependencies);
				const depsPhpPath = path.join(extensionDirectoryPath, 'deps.php');
				fs.writeFileSync(depsPhpPath, depsPhpContent, 'utf8');
			}

			if (typeof options.banner === 'string')
			{
				bundleContent = `${options.banner}\n${bundleContent}`;
			}

			fs.writeFileSync(extensionJsPath, bundleContent, 'utf8');
		}
	}
}
