import { ajax } from 'main.core';

export async function postAccessPublicRights({ objectId = null, uniqueCode = null }, body)
{
	if (!objectId && !uniqueCode)
	{
		throw new Error('postAccessPublicRights: objectId or uniqueCode is required');
	}

	const response = uniqueCode
		? await ajax.runAction('disk.accessrights.setUnifiedPublicLinkRights', {
			getParameters: { uniqueCode },
			json: body,
		})
		: await ajax.runAction('disk.accessrights.setPublicLinkRights', {
			getParameters: { fileId: objectId },
			json: body,
		});

	return response.data;
}
