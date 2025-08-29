export const processCheckListFileIds = (fileIds) => {
	if (!Array.isArray(fileIds))
	{
		return [];
	}

	return fileIds.reduce((result, item) => {
		if (typeof item === 'object' && item !== null && 'id' in item && 'fileId' in item)
		{
			result.push({
				id: item.id,
				fileId: item.fileId
			});
		}
		else if (typeof item === 'string' && item.startsWith('n'))
		{
			result.push({
				id: item,
				fileId: item
			});
		}

		return result;
	}, []);
};
