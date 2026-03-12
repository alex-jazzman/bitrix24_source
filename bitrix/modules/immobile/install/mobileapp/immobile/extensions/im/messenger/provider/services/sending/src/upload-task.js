/**
 * @module im/messenger/provider/services/sending/upload-task
 */
jn.define('im/messenger/provider/services/sending/upload-task', (require, exports, module) => {
	const { getUploadFileChunkSize } = require('im/messenger/lib/helper');

	/**
	 * @class UploadTask
	 */
	class UploadTask
	{
		constructor({
			taskId,
			resize,
			type,
			mimeType,
			chunk,
			folderId,
			params,
			name,
			url,
		})
		{
			const chunkSize = getUploadFileChunkSize();

			this.taskId = taskId;
			this.controller = 'disk.uf.integration.diskUploaderController';
			this.controllerOptions = {
				folderId,
			};
			this.resize = resize;
			this.type = type;
			this.mimeType = mimeType;
			this.chunk = chunkSize;
			this.params = params;
			this.name = name;
			this.url = url;
		}
	}

	module.exports = {
		UploadTask,
	};
});
