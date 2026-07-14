import { ajax } from 'main.core';

export async function getAccessRights({ objectId = null, uniqueCode = null })
{
	if (!objectId && !uniqueCode)
	{
		throw new Error('getAccessRights: objectId or uniqueCode is required');
	}

	const response = uniqueCode
		? await ajax.runAction('disk.accessrights.getUnified', {
			data: { uniqueCode },
		})
		: await ajax.runAction('disk.api.accessrights.get', {
			data: { objectId },
		});

	return response.data;
}
