export const getFilenameWithoutExtension = (name: string): string => {
	return name.slice(0, Math.max(0, name.lastIndexOf('.'))) || name;
};
