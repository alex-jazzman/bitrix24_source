import { Text } from 'main.core';
import { UserMappers } from 'tasks.v2.provider.service.user-service';
import type { ResultModel } from 'tasks.v2.model.results';
import type { ResultDto } from './types';

export function mapDtoToModel(resultDto: ResultDto): ResultModel
{
	return {
		id: resultDto.id,
		taskId: resultDto.taskId,
		text: Text.decode(resultDto.text),
		author: resultDto.author ? UserMappers.mapDtoToModel(resultDto.author) : null,
		createdAtTs: resultDto.createdAtTs * 1000,
		updatedAtTs: resultDto.updatedAtTs * 1000,
		status: resultDto.status,
		fileIds: resultDto.fileIds,
		previewId: resultDto.previewId,
		rights: resultDto.rights,
		files: resultDto.files,
	};
}

export function mapModelToDto(result: ResultModel): ResultDto
{
	return {
		id: result.id,
		taskId: result.taskId,
		text: result.text,
		author: result.author.id,
		status: result.status,
		fileIds: result.fileIds,
		previewId: result.previewId,
	};
}
