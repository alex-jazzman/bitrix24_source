export const convertBufferToString = (buffer: ArrayBuffer): string => {
	return String.fromCodePoint(...new Uint8Array(buffer));
};
