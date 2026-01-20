export const tagsFormat = (value: string): string => {
	return JSON.parse(value).replace(',', ', ');
};
