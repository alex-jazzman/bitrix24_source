import type { UserDto } from 'tasks.v2.provider.service.user-service';
import type { FileDto } from 'tasks.v2.provider.service.file-service';

export type ResultId = number | string;

export type ResultDto = {
	id: number,
	taskId: number,
	text: string,
	author: UserDto,
	createdAtTs: number,
	updatedAtTs: number,
	status: string,
	fileIds: number[],
	previewId: ?number,
	rights: {
		edit: boolean,
		remove: boolean,
	},
	files: FileDto[],
	messageId: ?number,
};
