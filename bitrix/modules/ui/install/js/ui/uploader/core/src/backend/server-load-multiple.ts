import { ajax as Ajax, Runtime, type AjaxResponse, type JsonObject } from 'main.core';

import { UploaderError } from '../uploader-error';
import { getControllerOptionsJSON } from './utils/get-controller-options-json';

import { type UploaderFile } from '../uploader-file';
import { type Server } from './server';
import { type ServerLoadController } from './server-load-controller';

type QueueTask = {
	controller: ServerLoadController;
	file: UploaderFile;
};

type Queue = {
	tasks: QueueTask[];
	load: Function;
	xhr: XMLHttpRequest | null;
	aborted: boolean;
};

const pendingQueues: WeakMap<Server, Queue> = new WeakMap();
const loadingFiles: WeakMap<UploaderFile, Queue> = new WeakMap();

export function loadMultiple(controller: ServerLoadController, file: UploaderFile): void
{
	const server: Server = controller.getServer();
	const timeout = controller.getOption('timeout', 100);

	let queue: Queue | undefined = pendingQueues.get(server);
	if (!queue)
	{
		queue = {
			tasks: [],
			load: Runtime.debounce(loadInternal, timeout, server),
			xhr: null,
			aborted: false,
		};

		pendingQueues.set(server, queue);
	}

	queue.tasks.push({ controller, file });
	queue.load();
}

export function abort(controller: ServerLoadController, file: UploaderFile): void
{
	const server: Server = controller.getServer();
	const queue: Queue | undefined = pendingQueues.get(server);
	if (queue)
	{
		queue.tasks = queue.tasks.filter((task: QueueTask): boolean => {
			return task.file !== file;
		});

		if (queue.tasks.length === 0)
		{
			pendingQueues.delete(server);
		}
	}
	else
	{
		const loadingQueue: Queue | undefined = loadingFiles.get(file);
		if (loadingQueue)
		{
			loadingQueue.tasks = loadingQueue.tasks.filter((task: QueueTask): boolean => {
				return task.file !== file;
			});

			loadingFiles.delete(file);

			if (loadingQueue.tasks.length === 0)
			{
				loadingQueue.aborted = true;
				loadingQueue.xhr!.abort();
			}
		}
	}
}

function loadInternal(this: Server): void
{
	// eslint-disable-next-line unicorn/no-this-assignment
	const server: Server = this;
	const queue: Queue | undefined = pendingQueues.get(server);
	if (!queue)
	{
		return;
	}

	pendingQueues.delete(server);

	if (queue.tasks.length === 0)
	{
		return;
	}

	const fileIds: Array<number | string | null> = [];
	queue.tasks.forEach((task: QueueTask): void => {
		const file: UploaderFile = task.file;
		fileIds.push(file.getServerFileId());
		loadingFiles.set(file, queue);
	});

	Ajax.runAction('ui.fileuploader.load', {
		data: {
			fileIds,
		},
		getParameters: {
			controller: server.getController(),
			controllerOptions: getControllerOptionsJSON(server),
		},
		onrequeststart: (xhr: XMLHttpRequest): void => {
			queue.xhr = xhr;
		},
		onprogress: (event: ProgressEvent): void => {
			if (event.lengthComputable)
			{
				const progress: number = event.total > 0 ? Math.floor((event.loaded / event.total) * 100) : 100;

				queue.tasks.forEach((task: QueueTask): void => {
					const { controller } = task;
					controller.emit('onProgress', { progress });
				});
			}
		},
	})
		.then((response: AjaxResponse<JsonObject>) => {
			if (response.data?.files)
			{
				const fileResults: { [key: string]: any } = {};
				(response.data.files as any[]).forEach((fileResult: any): void => {
					fileResults[fileResult.id] = fileResult;
				});

				queue.tasks.forEach((task: QueueTask): void => {
					const { controller, file } = task;
					const fileResult = fileResults[file.getServerFileId() as string] || null;

					loadingFiles.delete(file);

					if (fileResult && fileResult.success)
					{
						controller.emit('onProgress', { progress: 100 });
						controller.emit('onLoad', { fileInfo: fileResult.data.file });
					}
					else
					{
						const error: UploaderError = UploaderError.createFromAjaxErrors(fileResult?.errors);
						controller.emit('onError', { error });
					}
				});
			}
			else
			{
				const error: UploaderError = new UploaderError('SERVER_ERROR');
				queue.tasks.forEach((task: QueueTask): void => {
					const { controller, file } = task;

					loadingFiles.delete(file);
					controller.emit('onError', { error: error.clone() });
				});
			}
		})
		.catch((response: AjaxResponse<JsonObject>) => {
			const error: UploaderError | null | undefined = queue.aborted
				? null
				: UploaderError.createFromAjaxErrors(response.errors);
			queue.tasks.forEach((task: QueueTask): void => {
				const { controller, file } = task;

				loadingFiles.delete(file);

				if (!queue.aborted)
				{
					controller.emit('onError', { error: error!.clone() });
				}
			});
		});
}
