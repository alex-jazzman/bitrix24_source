import { Type } from 'main.core';

const regexp = /^data:((?:\w+\/(?:(?!;).)+)?)((?:;[\W\w]*?[^;])*),(.+)$/;

export const isDataUri = (str: string): boolean => {
	return Type.isString(str) ? str.match(regexp) !== null : false;
};
