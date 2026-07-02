const placeholderExtensions = Object.freeze(['docx']);
const mixedExtensions = Object.freeze(['jpeg', 'jpg', 'png', 'pdf', 'doc', 'docx', 'rtf', 'odt']);

export function getAllowedReplaceExtensions(isPlaceholderDocument: boolean): string[]
{
	return isPlaceholderDocument ? [...placeholderExtensions] : [...mixedExtensions];
}