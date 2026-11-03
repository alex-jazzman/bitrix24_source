/**
 * @module im/messenger/provider/pull/sidebar
 */
jn.define('im/messenger/provider/pull/sidebar', (require, exports, module) => {
	const { BasePullHandler } = require('im/messenger/provider/pull/base/pull-handler');
	const { LoggerManager } = require('im/messenger/lib/logger');
	const { Feature } = require('im/messenger/lib/feature');
	const { resolveCollectionTargets } = require('im/messenger/provider/pull/sidebar/src/collection-target');
	const {
		forgetPendingFile,
		rememberPendingFile,
	} = require('im/messenger/provider/pull/sidebar/src/pending-file');
	const logger = LoggerManager.getInstance().getLogger('pull-handler--sidebar');

	/**
	 * @class SidebarPullHandler
	 */
	class SidebarPullHandler extends BasePullHandler
	{
		// region links
		/**
		 * @param {SidebarLink} params.link
		 */
		handleUrlAdd(params, extra, command)
		{
			if (
				!this.isSidebarInited(params.link.chatId)
				|| !this.isLinksMigrated()
				|| this.interceptEvent(extra)
			)
			{
				return;
			}

			logger.info(`${this.constructor.name}.handleUrlAdd`, params);
			void this.store.dispatch('sidebarModel/sidebarLinksModel/set', {
				chatId: params.link.chatId,
				links: [params.link],
			});
		}

		/**
		 * @param {number} params.chatId
		 * @param {number} params.linkId
		 */
		handleUrlDelete(params, extra, command)
		{
			if (
				!this.isSidebarInited(params.chatId)
				|| !this.isLinksMigrated()
				|| this.interceptEvent(extra)
			)
			{
				return;
			}

			logger.info(`${this.constructor.name}.handleUrlDelete`, params);
			void this.store.dispatch('sidebarModel/sidebarLinksModel/delete', {
				chatId: params.chatId,
				id: params.linkId,
			});
		}
		// endregion

		// region files
		/**
		 * @param {SidebarFile} params.link
		 */
		handleFileAdd(params, extra, command)
		{
			const { chatId, subType } = params.link;
			if (
				!this.isSidebarInited(chatId)
				|| !this.isFilesMigrated()
				|| this.interceptEvent(extra)
			)
			{
				return;
			}

			logger.info(`${this.constructor.name}.handleFileAdd`, params);

			const collectionKeys = this.collectionKeys(chatId);
			const targets = resolveCollectionTargets(collectionKeys, subType);

			if (targets.length === 0)
			{
				// No collection AT ALL means the first page of the sidebar is still in flight: the
				// sidebar is marked initialized before the batch answers, so the guard above is already
				// open. The record waits for that page instead of being dropped.
				// A chat that HAS collections but none holding this subtype is a different case: that
				// tab has not loaded and will ask the server itself, and a record placed there would
				// show up in a listing the server never sent.
				if (collectionKeys.length === 0)
				{
					rememberPendingFile(chatId, params.link);
					logger.info(`${this.constructor.name}.handleFileAdd: no collection yet, the record waits`);
				}

				return;
			}

			targets.forEach((subTypeKey) => {
				void this.store.dispatch('sidebarModel/sidebarFilesModel/set', {
					chatId,
					files: [params.link],
					subType: subTypeKey,
				});
			});
		}

		/**
		 * @param {number} params.link.chatId
		 * @param {number} params.link.linkId
		 */
		handleFileDelete(params, extra, command)
		{
			const { chatId, linkId, fileId } = params;
			if (
				!this.isFilesMigrated()
				|| !this.isSidebarInited(chatId)
				|| this.interceptEvent(extra)
			)
			{
				return;
			}

			logger.info(`${this.constructor.name}.handleFileDelete`, params);

			// a deletion that arrived before the flush must not be undone by it
			forgetPendingFile(chatId, linkId);

			void this.store.dispatch('sidebarModel/sidebarFilesModel/delete', {
				chatId,
				id: linkId,
				fileId,
			});
		}
		// endregion

		/**
		 * @desc Keys the chat keeps its file collections under: a tab stores a collection by the whole
		 * subtype set it requested ('audio&video_note'), not by the subtype of a single record.
		 * @param {number} chatId
		 * @return {string[]}
		 */
		collectionKeys(chatId)
		{
			return this.store.getters['sidebarModel/sidebarFilesModel/getCollectionKeys'](chatId);
		}

		/**
		 * @desc is the sidebar initialized
		 * param {number} chatId
		 * @return {boolean}
		 */
		isSidebarInited(chatId)
		{
			return this.store.getters['sidebarModel/isInited'](chatId);
		}

		/**
		 * @desc Has the files migration been completed?
		 * @return {boolean}
		 */
		isFilesMigrated()
		{
			return Feature.isSidebarFilesEnabled;
		}

		/**
		 * @desc Has the links migration been completed?
		 * @return {boolean}
		 */
		isLinksMigrated()
		{
			return Feature.isSidebarLinksEnabled;
		}
	}

	module.exports = {
		SidebarPullHandler,
	};
});
