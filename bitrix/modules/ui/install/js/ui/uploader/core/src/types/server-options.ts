import { type AbstractUploadController } from '../backend/abstract-upload-controller';
import { type AbstractLoadController } from '../backend/abstract-load-controller';
import { type AbstractRemoveController } from '../backend/abstract-remove-controller';

export type ServerOptions = {
	controller?: string;
	controllerOptions?: { [key: string]: any };
	chunkSize?: number;
	forceChunkSize?: boolean;
	chunkRetryDelays?: number[] | false | null;
	parallelChunkUpload?: boolean;
	maxParallelChunks?: number;
	presignedChunkUpload?: boolean;
	presignedThreshold?: number;
	presignedRegisterInterval?: number;
	uploadControllerClass?: (new (...args: any[]) => AbstractUploadController) | string;
	uploadControllerOptions?: { [key: string]: any };
	loadControllerClass?: (new (...args: any[]) => AbstractLoadController) | string;
	loadControllerOptions?: { [key: string]: any };
	removeControllerClass?: (new (...args: any[]) => AbstractRemoveController) | string;
	removeControllerOptions?: { [key: string]: any };
};
