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

	/**
	 * @param {InAppUrl} inAppUrl
	 */
	module.exports = (inAppUrl) => {
		inAppUrl.register(
			'/bitrix/tools/disk/focus.php',
			(params, { queryParams }) => {
				const id = queryParams?.objectId || queryParams?.folderId;
				if (id)
				{
					void openObject(id);
				}
			},
		).name('disk:entity');

		inAppUrl
			.addRoute(`/company/personal/user/${env.userId}/disk/path/`)
			.handler((routeParams, { url }) => {
				const path = getDecodedEntityPath(url);
				void fetchTargetFolder(path, EntityType.USER, env.userId).then((targetFolder) => {
					void openObject(targetFolder.id);
				});
			})
			.name('disk:personal');

		inAppUrl.register('/workgroups/group/:groupId/disk/path/', ({ groupId }, { url }) => {
			const path = getDecodedEntityPath(url);
			void fetchTargetFolder(path, EntityType.GROUP, groupId).then((targetFolder) => {
				void openObject(targetFolder.id);
			});
		}).name('disk:group');

		inAppUrl.register('/docs/path/', (params, { url }) => {
			const path = getDecodedEntityPath(url);
			void fetchTargetFolder(path, EntityType.COMMON, 'shared_files_s1').then((targetFolder) => {
				void openObject(targetFolder.id);
			});
		}).name('disk:common');

		inAppUrl
			.addRoute('/disk/boards/:boardId/open')
			.handler(({ boardId }, { context = {}, url }) => {
				void boardOpener({
					id: boardId,
					isAttached: url.includes('openAttached'),
					...context,
				}).catch(console.error);
			})
			.name('disk:boardOpen');

		inAppUrl
			.addRoute('/disk/file/:uniqueCode(?=\\?|$|/)')
			.addRoute('/board/:uniqueCode(?=\\?|$|/)')
			.addRoute('/sheet/:uniqueCode(?=\\?|$|/)')
			.addRoute('/pres/:uniqueCode(?=\\?|$|/)')
			.addRoute('/doc/:uniqueCode(?=\\?|$|/)')
			.handler(({ uniqueCode }, { context = {}, url, queryParams }) => {
				void unifiedOpener({ uniqueCode, url, queryParams, ...context }).catch(console.error);
			})
			.name('disk:universalFileOpen');
	};
});
