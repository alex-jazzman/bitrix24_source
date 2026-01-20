import type { UserModel } from 'tasks.v2.model.users';
import type { FileDto } from 'tasks.v2.provider.service.file-service';

export type ResultsModelState = {
	collection: { [resultId: string]: ResultModel },
};

export type ResultModel = {
	id: number,
	taskId: number,
	text: string,
	author: UserModel,
	createdAtTs: number,
	updatedAtTs: number,
	status: 'open' | 'closed',
	fileIds: number[],
	previewId: ?number,
	rights: {
		edit: boolean,
		remove: boolean,
	},
	files: FileDto[],
};
