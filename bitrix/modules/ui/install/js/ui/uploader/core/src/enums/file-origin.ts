/**
 * @namespace BX.UI.Uploader
 */
export const FileOrigin = {
	CLIENT: 'client',
	SERVER: 'server',
};

export type FileOrigin = (typeof FileOrigin)[keyof typeof FileOrigin];
