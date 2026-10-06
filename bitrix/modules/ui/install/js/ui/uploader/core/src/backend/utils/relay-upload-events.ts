import { type AbstractUploadController } from '../abstract-upload-controller';

/**
 * Re-emits the upload lifecycle events of a delegated controller on the
 * delegating one, so outer subscribers don't notice the swap. Used when a
 * controller hands the actual transfer over to another implementation
 * (e.g. a single-chunk file delegated to the classic UploadController, or a
 * presigned upload falling back to parallel when the bucket can't presign).
 */
export function relayUploadEvents(source: AbstractUploadController, target: AbstractUploadController): void
{
	source.subscribe('onProgress', (event) => target.emit('onProgress', event.getData()));
	source.subscribeOnce('onUpload', (event) => target.emit('onUpload', event.getData()));
	source.subscribeOnce('onError', (event) => target.emit('onError', event.getData()));
}
