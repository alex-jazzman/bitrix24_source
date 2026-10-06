import { type FileStatus } from '../enums/file-status';
import { type FileOrigin } from '../enums/file-origin';
import { type UploaderError } from '../uploader-error';

export type UploaderFileInfo = {
	id: string;
	serverFileId: number | string | null;
	serverId?: number | string | null;
	status: FileStatus;
	name: string;
	size: number;
	sizeFormatted: string;
	type: string;
	extension: string;
	origin: FileOrigin;
	isImage: boolean;
	isVideo: boolean;
	animated?: boolean;
	failed: boolean;
	width: number | null;
	height: number | null;
	progress: number;

	error?: UploaderError | null;
	errors?: UploaderError[];

	previewUrl: string | null;
	previewWidth: number | null;
	previewHeight: number | null;
	clientPreviewUrl: string | null;
	clientPreviewWidth: number | null;
	clientPreviewHeight: number | null;
	serverPreviewUrl: string | null;
	serverPreviewWidth: number | null;
	serverPreviewHeight: number | null;
	downloadUrl: string | null;
	customData: Record<string, any>;
	viewerAttrs: Record<string, string> | null;
};
