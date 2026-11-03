const fs = require('fs');
const path = require('path');

const extensionsRelativePath = path.join('mobile', 'install', 'mobileapp', 'mobile', 'extensions', 'bitrix');

/**
 * Walks up from this file until it finds the mobile extensions tree the mirrored artifacts belong
 * in. The repository root cannot be derived from the path text: a git worktree lives outside the
 * checkout it belongs to, and its own path may contain the name of the checkout directory more
 * than once, which used to send every mirrored artifact into a different checkout. Recognising the
 * root by the directory the plugin has to write into keeps the answer correct wherever the tree
 * sits, and makes a changed layout fail loudly instead of writing somewhere unintended.
 */
module.exports = function getExtensionsPath() {
	let directory = __dirname;
	let parentDirectory = path.dirname(directory);

	while (directory !== parentDirectory)
	{
		const extensionsPath = path.join(directory, extensionsRelativePath);
		if (fs.existsSync(extensionsPath))
		{
			return extensionsPath;
		}

		directory = parentDirectory;
		parentDirectory = path.dirname(directory);
	}

	throw new Error(`web-to-mobile: no "${extensionsRelativePath}" directory above ${__dirname}`);
};
