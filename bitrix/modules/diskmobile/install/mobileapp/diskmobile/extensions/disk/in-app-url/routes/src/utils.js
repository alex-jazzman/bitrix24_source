/**
 * @module disk/in-app-url/routes/src/utils
 */
jn.define('disk/in-app-url/routes/src/utils', (require, exports, module) => {
	const { showToast } = require('toast');
	const { URL, withCurrentDomain } = require('utils/url');
	const { Loc } = require('loc');
	const { RunActionExecutor } = require('rest');
	const { WidgetOpener } = require('widget-opener');
	const { openFolder } = require('disk/opener/folder');
	const { fetchObjectWithRights } = require('disk/rights');
	const store = require('statemanager/redux/store');
	const { filesUpsertedFromServer } = require('disk/statemanager/redux/slices/files');
	const { selectById } = require('disk/statemanager/redux/slices/files/selector');
	const { dispatch } = store;
	const {
		openNativeViewer,
		openNativeViewerByFileId,
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

			return;
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
				showToast({
					message: Loc.getMessage('M_DISK_IN_APP_URL_FOLDER_NOT_FOUND'),
				});

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

	async function fetchTargetFile(url, { entityType, entityId = '', storagePath = '' })
	{
		try
		{
			const parsedUrl = URL(url);
			if (!parsedUrl || (parsedUrl.hostname && parsedUrl.hostname !== URL(currentDomain)?.hostname))
			{
				throw new Error('File URL belongs to another portal');
			}

			const commonBasePath = storagePath ? `/docs/${storagePath}` : '/docs';
			const fileBasePath = entityType === 'common'
				? `${commonBasePath}/file/`
				: `/${entityType === 'user' ? 'company/personal/user' : 'workgroups/group'}/${entityId}/disk/file/`
			;
			if (!parsedUrl.pathname.startsWith(fileBasePath))
			{
				throw new Error('File URL does not match its storage');
			}

			const response = await new RunActionExecutor('diskmobile.Common.resolveFileId', {
				entityType,
				entityId,
				fileBasePath: entityType === 'common' ? fileBasePath : '',
				path: parsedUrl.pathname.slice(fileBasePath.length),
			}).call();
			const file = response.data?.diskObject;
			if (response.errors?.length > 0 || !file?.id || typeof file.canDownload !== 'boolean')
			{
				throw new Error('File is not available');
			}

			return file;
		}
		catch
		{
			showToast({ message: Loc.getMessage('M_DISK_IN_APP_URL_FILE_NOT_FOUND') });

			return null;
		}
	}

	function openFilePreview(file, context = {})
	{
		const { parentWidget, canOpenInDefault } = context;
		const settings = {
			modal: true,
			url: `/mobile/disk/file-view.php?fileId=${encodeURIComponent(file.id)}`,
			titleParams: { text: file.name },
		};

		return new WidgetOpener()
			.setWidgetName('web')
			.setWidgetSettings(settings)
			.setParentWidget(parentWidget || PageManager)
			.setCanOpenInDefault(Boolean(canOpenInDefault))
			.open();
	}

	function getDecodedEntityPath(url)
	{
		return decodeURI(URL(url).pathname).split('/path')[1];
	}

	function openFile(file)
	{
		openNativeViewer({
			fileType: getNativeViewerMediaType(getMimeType(getExtension(file.name), file.name)),
			url: withCurrentDomain(file.links.download),
			name: file.name,
		});
	}

	module.exports = {
		openFile,
		openFilePreview,
		openFileById: openNativeViewerByFileId,
		openObject,
		fetchTargetFolder,
		fetchTargetFile,
		getDecodedEntityPath,
	};
});
