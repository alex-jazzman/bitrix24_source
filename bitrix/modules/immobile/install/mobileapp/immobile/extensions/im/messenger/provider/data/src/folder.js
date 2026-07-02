/**
 * @module im/messenger/provider/data/folder
 */
jn.define('im/messenger/provider/data/folder', (require, exports, module) => {
	const { BaseDataProvider } = require('im/messenger/provider/data/base');
	const { DataProviderResult } = require('im/messenger/provider/data/result');
	const { normalize } = require('im/messenger/model/folder');

	/**
	 * @class FolderDataProvider
	 *
	 * Explicit store + SQLite control instead of implicit VuexModelWriter.
	 * Caller decides when and where to write.
	 */
	class FolderDataProvider extends BaseDataProvider
	{
		/**
		 * @param {number} id
		 * @return {Promise<DataProviderResult<FolderModelState>>}
		 */
		async get(id)
		{
			const folder = this.store.getters['folderModel/getById'](id);
			if (folder)
			{
				return new DataProviderResult(folder, BaseDataProvider.source.model);
			}

			const dbFolder = await this.#getFromDatabase(id);
			if (dbFolder)
			{
				return new DataProviderResult(dbFolder, BaseDataProvider.source.database);
			}

			return new DataProviderResult();
		}

		/**
		 * Local optimistic add — store + SQLite.
		 * @param {object} folder Raw DTO or already-flat shape; normalized internally.
		 * @return {Promise<void>}
		 */
		async add(folder)
		{
			const normalized = normalize(folder);
			await this.store.dispatch('folderModel/add', { folder: normalized });
			await this.repository.folder.save([normalized]);
		}

		/**
		 * Pull-driven add — store + SQLite. Same persistence, distinct actionName
		 * so listeners can tell remote creation from local.
		 * @param {object} folder Raw pull payload; normalized internally.
		 * @return {Promise<void>}
		 */
		async addFromPull(folder)
		{
			const normalized = normalize(folder);
			await this.store.dispatch('folderModel/addFromPull', { folder: normalized });
			await this.repository.folder.save([normalized]);
		}

		/**
		 * @param {number} id
		 * @param {Partial<FolderModelState>} fields
		 * @return {Promise<void>}
		 */
		async update(id, fields)
		{
			await this.store.dispatch('folderModel/update', { id, fields });
			await this.repository.folder.save([{ id, ...fields }]);
		}

		/**
		 * @param {number} id
		 * @return {Promise<void>}
		 */
		async delete(id)
		{
			await this.store.dispatch('folderModel/delete', { id });
			await this.repository.folder.deleteById(id);
		}

		/**
		 * Bulk set: replace tabs from a fresh REST snapshot. SQLite is rewritten
		 * authoritatively so folders deleted server-side don't linger locally.
		 * @param {Array<object>} folderList Raw DTOs or already-flat; each is normalized internally.
		 * @return {Promise<void>}
		 */
		async setList(folderList)
		{
			const normalized = Array.isArray(folderList) ? folderList.map((f) => normalize(f)) : [];
			await this.store.dispatch('folderModel/set', { folderList: normalized });
			await this.repository.folder.replaceAll(normalized);
		}

		/**
		 * Hydrates folder model from backend startup params without rewriting
		 * SQLite. The startup snapshot mirrors tabs already rendered natively;
		 * the authoritative REST folderList still persists the database later.
		 *
		 * @param {Array<FolderModelState>} folderList
		 * @return {Promise<void>}
		 */
		async restoreStartupSnapshotToStore(folderList)
		{
			await this.store.dispatch('folderModel/set', { folderList });
		}

		/**
		 * Restore the model from local DB on startup. SQLite is already
		 * authoritative — no write back here.
		 * @param {Array<FolderModelState>} folderList
		 * @return {Promise<void>}
		 */
		async restoreToStore(folderList)
		{
			await this.store.dispatch('folderModel/setFromLocalDatabase', { folderList });
		}

		/**
		 * Database lookup by id. FolderRepository exposes only `getAll()` —
		 * the dataset is bounded (<= a few dozen folders), so we filter in JS
		 * instead of growing the repository surface for one fallback path.
		 *
		 * @param {number} id
		 * @return {Promise<FolderModelState | null>}
		 */
		async #getFromDatabase(id)
		{
			const folders = await this.repository.folder.getAll();

			return folders.find((folder) => folder.id === id) || null;
		}
	}

	module.exports = { FolderDataProvider };
});
