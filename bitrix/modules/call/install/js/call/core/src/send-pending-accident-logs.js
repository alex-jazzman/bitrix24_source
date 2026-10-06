import { Type } from 'main.core';
import { AccidentLogStorageKeys } from 'call.lib.settings-manager';

const { dbName, storeName } = AccidentLogStorageKeys;

const countLogs = () => new Promise((resolve) => {
	const request = indexedDB.open(dbName);

	request.onsuccess = () => {
		const db = request.result;
		if (!db.objectStoreNames.contains(storeName))
		{
			db.close();
			resolve(0);

			return;
		}

		const countRequest = db.transaction(storeName, 'readonly').objectStore(storeName).count();
		countRequest.onsuccess = () => {
			resolve(countRequest.result);
			db.close();
		};

		countRequest.onerror = () => {
			resolve(0);
			db.close();
		};
	};

	request.onerror = () => resolve(0);
});

const hasPendingLogs = async () => {
	if (!Type.isObject(window.indexedDB))
	{
		return false;
	}

	if (Type.isFunction(indexedDB.databases))
	{
		const databases = await indexedDB.databases();
		if (!databases.some((database) => database.name === dbName))
		{
			return false;
		}
	}

	return (await countLogs()) > 0;
};

export const sendPendingAccidentLogs = () => {
	const run = async () => {
		try
		{
			if (await hasPendingLogs())
			{
				await BX.Runtime.loadExtension('call.lib.accident-logger');
			}
		}
		catch
		{
			//
		}
	};

	if (Type.isFunction(window.requestIdleCallback))
	{
		requestIdleCallback(run, { timeout: 5000 });
	}
	else
	{
		setTimeout(run, 2000);
	}
};
