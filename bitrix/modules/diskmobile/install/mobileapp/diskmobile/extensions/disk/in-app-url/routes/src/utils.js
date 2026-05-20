/**
 * @module disk/in-app-url/routes/src/utils
 */
jn.define('disk/in-app-url/routes/src/utils', (require, exports, module) => {
	const { showToast } = require('toast');
	const { URL } = require('utils/url');
	const { Loc } = require('loc');
	const { openFolder } = require('disk/opener/folder');
	const { fetchObjectWithRights } = require('disk/rights');
	const store = require('statemanager/redux/store');
	const { filesUpsertedFromServer } = require('disk/statemanager/redux/slices/files');
	const { selectById } = require('disk/statemanager/redux/slices/files/selector');
	const { dispatch } = store;
	const {
		openNativeViewer,
		getNativeViewerMediaType,
		getExtension,
		getMimeType,
	} = require('utils/file');

	async function openObject(diskObjectId)
	{
		const diskObject = await fetchObjectWithRights(diskObjectId);

		if (!diskObject)
		{
			showToast({
				message: Loc.getMessage('M_DISK_IN_APP_URL_FILE_NOT_FOUND'),
			});
		}

		if (diskObject.isFolder)
		{
			void openFolder(diskObject.id);

			return;
		}

		openFile(diskObject);
	}

	async function fetchTargetFolder(path, entityType, entityId)
	{
		try
		{
			const response = await BX.ajax.runAction('diskmobile.Common.getFolderByPath', {
				data: {
					path,
					entityType,
					entityId,
				},
			});

			if (response.errors.length > 0)
			{
				console.error(response.errors);

				return null;
			}

			const diskObject = response.data.diskObject;
			dispatch(filesUpsertedFromServer([diskObject]));

			return selectById(store.getState(), diskObject.id);
		}
		catch (e)
		{
			showToast({
				message: Loc.getMessage('M_DISK_IN_APP_URL_FOLDER_NOT_FOUND'),
			});
			console.error(e);
		}

		return null;
	}

	function getDecodedEntityPath(url)
	{
		return decodeURI(URL(url).pathname).split('/path')[1];
	}

	function openFile(file)
	{
		openNativeViewer({
			fileType: getNativeViewerMediaType(getMimeType(getExtension(file.name), file.name)),
			url: file.links.download,
			name: file.name,
		});
	}

	module.exports = {
		openFile,
		openObject,
		fetchTargetFolder,
		getDecodedEntityPath,
	};
});
