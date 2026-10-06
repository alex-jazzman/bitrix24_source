/**
 * @module disk/in-app-url/routes
 */
jn.define('disk/in-app-url/routes', (require, exports, module) => {
	const {
		fetchTargetFolder,
		getDecodedEntityPath,
		openObject,
	} = require('disk/in-app-url/routes/src/utils');
	const { boardOpener } = require('disk/opener/board');
	const { unifiedOpener } = require('disk/opener/unified-link/opener');

	const EntityType = {
		COMMON: 'common',
		USER: 'user',
		GROUP: 'group',
	};

	const BOARD_ID_PATTERN = /^\d+$/;
	const COMMON_STORAGE_ID = 'shared_files_s1';

	const openFolderByPath = async (url, entityType, entityId) => {
		// fetchTargetFolder reports its own failure and resolves with null
		const targetFolder = await fetchTargetFolder(getDecodedEntityPath(url), entityType, entityId);

		return targetFolder ? openObject(targetFolder.id) : null;
	};

	/**
	 * @param {InAppUrl} inAppUrl
	 */
	module.exports = (inAppUrl) => {
		inAppUrl
			.addRoute('/bitrix/tools/disk/focus.php')
			.handler((params, { queryParams }) => {
				const id = queryParams?.objectId || queryParams?.folderId;
				if (!id)
				{
					// the router turns the rejection into a user-facing failure
					throw new Error('disk/in-app-url: focus.php link carries no object id');
				}

				return openObject(id);
			})
			.name('disk:entity');

		// one handler for every storage: the storage a path belongs to is declared by its route
		inAppUrl
			.addRoute(`/company/personal/user/${env.userId}/disk/path/`, {
				entityType: EntityType.USER,
				entityId: String(env.userId),
			})
			.addRoute('/workgroups/group/:groupId/disk/path/', { entityType: EntityType.GROUP })
			.addRoute('/docs/path/', { entityType: EntityType.COMMON, entityId: COMMON_STORAGE_ID })
			.handler(
				({ entityType, entityId, groupId }, { url }) => openFolderByPath(url, entityType, entityId ?? groupId),
			)
			.name('disk:path');

		inAppUrl
			.addRoute('/disk/boards/:boardId/open')
			.handler(({ boardId }, { context = {}, url }) => {
				// the web route accepts a file id only, and a board opened by anything else shows an empty page
				if (!BOARD_ID_PATTERN.test(boardId))
				{
					throw new Error(`disk/in-app-url: board id ${boardId} is not a file id`);
				}

				return boardOpener({
					id: boardId,
					isAttached: url.includes('openAttached'),
					...context,
				});
			})
			.name('disk:boardOpen');

		inAppUrl
			.addRoute('/disk/file/:uniqueCode(?=\\?|$|/)')
			.addRoute('/board/:uniqueCode(?=\\?|$|/)')
			.addRoute('/sheet/:uniqueCode(?=\\?|$|/)')
			.addRoute('/pres/:uniqueCode(?=\\?|$|/)')
			.addRoute('/doc/:uniqueCode(?=\\?|$|/)')
			.addRoute('/picture/:uniqueCode(?=\\?|$|/)')
			.addRoute('/media/:uniqueCode(?=\\?|$|/)')
			.addRoute('/file/:uniqueCode(?=\\?|$|/)')
			.addRoute('/audio/:uniqueCode(?=\\?|$|/)')
			// the opener resolves once it has reported a refusal itself, so what it rejects with
			// is left to the router to report
			.handler(({ uniqueCode }, { context = {}, url, queryParams }) => unifiedOpener({
				uniqueCode,
				url,
				queryParams,
				...context,
			}))
			.name('disk:universalFileOpen');
	};
});
