export const convertStringToBuffer = (str: string): number[] => {
	const result: number[] = [];
	for (let i = 0; i < str.length; i++)
	{
		result.push((str.codePointAt(i) ?? 0) & 0xFF);
	}

	return result;
};
