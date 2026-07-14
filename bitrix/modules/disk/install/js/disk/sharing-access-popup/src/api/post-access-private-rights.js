import { ajax } from 'main.core';

export async function postAccessPrivateRights(objectId, payload)
{
	if (!objectId)
	{
		throw new Error('getAccessRights: fileId is required');
	}

	const response = await ajax.runAction('disk.accessRights.set', {
		data: {
			objectId,
			...payload,
		},
	});

	return response.data;
}
