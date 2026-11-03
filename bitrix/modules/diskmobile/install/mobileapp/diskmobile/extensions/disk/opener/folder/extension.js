/**
 * @module disk/opener/folder
 */
jn.define('disk/opener/folder', (require, exports, module) => {
	const { fetchObjectWithRights } = require('disk/rights');

	/**
	 * @param {FolderScreenContext|null} context
	 * @param {UnifiedLinkDiskObject} folder
	 * @param {string|null} [uniqueCode]
	 * @return {FolderScreenContext|null}
	 */
	function withUnifiedLinkContext(context, folder, uniqueCode)
	{
		if (!uniqueCode)
		{
			return context;
		}

		return {
			...context,
			uniqueCode,
			rights: folder.rights ?? null,
		};
	}

	/**
	 * @param {number} folderId
	 * @param {FolderScreenContext|null} [context]
	 * @param [parentWidget]
	 * @param {number|null} [scrollToItemId]
	 * @param {OpenFolderOptions} [options]
	 * @return {Promise<void>}
	 */
	async function openFolder(folderId, context = null, parentWidget = PageManager, scrollToItemId = null, options = {})
	{
		const folder = options.folder ?? await fetchObjectWithRights(folderId);

		PageManager.openComponent(
			'JSStackComponent',
			{
				componentCode: 'disk.disk.folder',
				// eslint-disable-next-line no-undef
				scriptPath: availableComponents['disk:disk.folder'].publicUrl,
				canOpenInDefault: true,
				rootWidget: {
					name: 'layout',
					settings: {
						titleParams: {
							text: folder.name,
						},
						objectName: 'layout',
						swipeToClose: true,
					},
				},
				params: {
					folderId,
					context: withUnifiedLinkContext(context, folder, options.uniqueCode),
					scrollToItemId,
				},
			},
		);
	}

	module.exports = { openFolder };
});
