/**
 * @module disk/in-app-url/routes
 */
jn.define('disk/in-app-url/routes', (require, exports, module) => {
	const {
		fetchTargetFolder,
		fetchTargetFile,
		openFileById,
		openFilePreview,
		getDecodedEntityPath,
		openObject,
	} = require('disk/in-app-url/routes/src/utils');
	const { boardOpener } = require('disk/opener/board');
	const { FileType } = require('disk/enum');
	const { unifiedOpener, unifiedFolderOpener } = require('disk/opener/unified-link/opener');
	const { openPortalPage } = require('in-app-url/portal-page');
	const { escapeRegExp } = require('utils/string');
	const { URL } = require('utils/url');

	const EntityType = {
		COMMON: 'common',
		USER: 'user',
		GROUP: 'group',
	};

	const BOARD_ID_PATTERN = /^\d+$/;
	const COMMON_STORAGE_ID = 'shared_files_s1';

	// the code format of the web route (intranet/install/routes/intranet.php); a hash may follow the code
	const UNIQUE_CODE_PATTERN = /^[\dA-Za-z]{20}(?:#|$)/;

	// unified links of a portal are handed out wrapped into this public host
	const PUBLIC_LINK_URL_PREFIX = 'https://bitrix24public.com/';

	const UNIFIED_FILE_PATHS = [
		'/disk/file/',
		'/board/',
		'/sheet/',
		'/pres/',
		'/doc/',
		'/picture/',
		'/media/',
		'/file/',
		'/audio/',
		'/html/',
	];

	const UNIFIED_FOLDER_PATHS = ['/folder/'];

	// a unified link of an editable file carries this suffix of its own (UrlGenerator::EDIT_SUFFIX)
	const EDIT_SUFFIX_PATTERN = '(?:/edit)?';

	const UNIFIED_FILE_PATTERNS = UNIFIED_FILE_PATHS.map((path) => `${path}:uniqueCode(?=\\?|$|/)`);

	const UNIFIED_FOLDER_PATTERNS = UNIFIED_FOLDER_PATHS.map((path) => `${path}:uniqueCode(?=\\?|$|/$)`);

	/**
	 * @param {InAppUrl} inAppUrl
	 * @param {string[]} patterns
	 * @return {Route}
	 */
	const addRoutes = (inAppUrl, [firstPattern, ...restPatterns]) => restPatterns.reduce(
		(route, pattern) => route.addRoute(pattern),
		inAppUrl.addRoute(firstPattern),
	);

	/**
	 * Public wrapper of the current portal only: a wrapper of any other portal stays an external link.
	 * @return {string} empty when the portal host is unknown
	 */
	const getPublicLinkPrefix = () => {
		const currentPortalHost = URL(currentDomain)?.hostname;

		return currentPortalHost ? `${PUBLIC_LINK_URL_PREFIX}${currentPortalHost}` : '';
	};

	// the opener resolves once it has reported a refusal itself, so what it rejects with
	// is left to the router to report
	const openUnifiedFile = ({ uniqueCode }, { context = {}, url, queryParams }) => unifiedOpener({
		uniqueCode,
		url,
		queryParams,
		...context,
	});

	// the route pattern takes any path segment, so a path of a storage without a route of its own
	// would send its folder name to the server as a code: such a link of the portal is a portal page.
	// A wrapped link lives on a foreign host and never falls back to the webview.
	const openPortalUnifiedFile = (params, options) => {
		if (!UNIQUE_CODE_PATTERN.test(params.uniqueCode))
		{
			return openPortalPage(options.url, options.context);
		}

		return openUnifiedFile(params, options);
	};

	const openFolderByPath = async (url, entityType, entityId) => {
		// fetchTargetFolder reports its own failure and resolves with null
		const targetFolder = await fetchTargetFolder(getDecodedEntityPath(url), entityType, entityId);

		return targetFolder ? openObject(targetFolder.id) : null;
	};

	const openUnifiedFolder = async ({ uniqueCode, url, queryParams, context }) => {
		return unifiedFolderOpener({ uniqueCode, url, queryParams, ...context });
	};

	const handleUnifiedFolder = ({ uniqueCode }, { context = {}, url, queryParams }) => {
		void openUnifiedFolder({ uniqueCode, url, queryParams, context }).catch(console.error);
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

		// a classic file detail path holds "/file/" and "/disk/file/" as well, so it is declared before
		// the unified links: otherwise its folder name is sent to the server as the code of a unified link
		inAppUrl
			.addRoute('/docs/file/', { entityType: EntityType.COMMON })
			// an on-premise portal keeps the common storage under a path of its own: /docs/shared/file/
			.addRoute('/docs/:storagePath/file/', { entityType: EntityType.COMMON })
			.addRoute('/company/personal/user/:userId/disk/file/', { entityType: EntityType.USER })
			.addRoute('/workgroups/group/:groupId/disk/file/', { entityType: EntityType.GROUP })
			.handler(async ({ entityType, userId, groupId, storagePath }, { url, context = {} }) => {
				const file = await fetchTargetFile(url, { entityType, entityId: userId ?? groupId, storagePath });
				if (!file)
				{
					return null;
				}

				if (file.typeFile === FileType.FLIPCHART)
				{
					return boardOpener({ ...context, id: file.id, title: file.name });
				}

				return file.canDownload
					? openFileById(file.id, context.parentWidget)
					: openFilePreview(file, context)
				;
			})
			.name('disk:fileDetail');

		addRoutes(inAppUrl, UNIFIED_FILE_PATTERNS)
			.handler(openPortalUnifiedFile)
			.name('disk:universalFileOpen');

		addRoutes(inAppUrl, UNIFIED_FOLDER_PATTERNS)
			.handler(handleUnifiedFolder)
			.name('disk:universalFolderOpen');

		const publicLinkPrefix = getPublicLinkPrefix();
		if (publicLinkPrefix)
		{
			// a wrapped link is a unified link and nothing more. The handler receives the address as
			// it arrived and an unresolved link falls back to the portal page, so a tail allowed
			// after the code would put an arbitrary path of the public host into the app webview.
			const escapedPrefix = escapeRegExp(publicLinkPrefix);
			const asPublicLink = (paths, tail = '') => paths.map(
				(path) => `^${escapedPrefix}${path}:uniqueCode${tail}/?(?=[?#]|$)`,
			);

			// wrapped patterns live on routes of their own: a route also holding a relative pattern
			// would match any portal's wrapper by that pattern alone
			addRoutes(inAppUrl, asPublicLink(UNIFIED_FILE_PATHS, EDIT_SUFFIX_PATTERN))
				.handler(openUnifiedFile)
				.allowExternalUrl()
				.name('disk:universalFileOpen');

			addRoutes(inAppUrl, asPublicLink(UNIFIED_FOLDER_PATHS))
				.handler(handleUnifiedFolder)
				.allowExternalUrl()
				.name('disk:universalFolderOpen');
		}
	};
});
