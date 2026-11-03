/**
 * @module disk/storage/personal
 */
jn.define('disk/storage/personal', (require, exports, module) => {
	const PERSONAL_STORAGE_ENDPOINT = 'disk.api.storage.getPersonalStorage';

	/**
	 * @return {Promise<number|null>}
	 */
	async function fetchPersonalStorageId()
	{
		try
		{
			const response = await BX.ajax.runAction(PERSONAL_STORAGE_ENDPOINT, { data: {} });

			if (response.errors.length > 0)
			{
				console.error(response.errors);

				return null;
			}

			const storageId = Number(response.data?.storage?.id);

			return Number.isInteger(storageId) && storageId > 0 ? storageId : null;
		}
		catch (error)
		{
			console.error(error);

			return null;
		}
	}

	module.exports = { fetchPersonalStorageId };
});
