import { ajax as Ajax, Runtime, type AjaxResponse, type JsonObject } from 'main.core';

import { UploaderError } from '../uploader-error';
import { getControllerOptionsJSON } from './utils/get-controller-options-json';

import { type UploaderFile } from '../uploader-file';
import { type Server } from './server';
import { type RemoveController } from './remove-controller';

type QueueTask = {
	controller: RemoveController;
	file: UploaderFile;
};

type Queue = {
	tasks: QueueTask[];
	remove: Function;
	xhr: XMLHttpRequest | null;
};

const queues: WeakMap<Server, Queue> = new WeakMap();

export function removeMultiple(controller: RemoveController, file: UploaderFile)
{
	const server = controller.getServer();
	let queue = queues.get(server);
	if (!queue)
	{
		queue = {
			tasks: [],
			remove: Runtime.debounce(removeInternal, 1000, server),
			xhr: null,
		};

		queues.set(server, queue);
	}

	queue.tasks.push({ controller, file });
	queue.remove();
}

function removeInternal(this: Server)
{
	// eslint-disable-next-line unicorn/no-this-assignment
	const server: Server = this;
	const queue = queues.get(server);
	if (!queue)
	{
		return;
	}

	const { tasks } = queue;
	queues.delete(server);

	const fileIds: Array<number | string> = [];
	tasks.forEach((task: QueueTask) => {
		const file: UploaderFile = task.file;
		const serverFileId = file.getServerFileId();
		if (serverFileId !== null)
		{
			fileIds.push(serverFileId);
		}
	});

	if (fileIds.length === 0)
	{
		return;
	}

	Ajax.runAction('ui.fileuploader.remove', {
		data: {
			fileIds,
		},
		getParameters: {
			controller: server.getController(),
			controllerOptions: getControllerOptionsJSON(server),
		},
		onrequeststart: (xhr: XMLHttpRequest) => {
			queue.xhr = xhr;
		},
	})
		.then((response: AjaxResponse<JsonObject>) => {
			if (response.data?.files)
			{
				const fileResults: { [key: string | number]: any } = {};
				(response.data.files as Array<any>).forEach((fileResult: any) => {
					fileResults[fileResult.id] = fileResult;
				});

				tasks.forEach((task: QueueTask) => {
					const { controller, file } = task;
					const serverFileId = file.getServerFileId();
					const fileResult = (serverFileId === null ? null : fileResults[serverFileId]) || null;

					if (fileResult && fileResult.success)
					{
						controller.emit('onRemove', { fileId: fileResult.id });
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
				tasks.forEach((task: QueueTask) => {
					const { controller } = task;
					controller.emit('onError', { error: error.clone() });
				});
			}
		})
		.catch((response: AjaxResponse<JsonObject>) => {
			const error: UploaderError = UploaderError.createFromAjaxErrors(response.errors);
			tasks.forEach((task: QueueTask) => {
				const { controller } = task;
				controller.emit('onError', { error: error.clone() });
			});
		});
}
