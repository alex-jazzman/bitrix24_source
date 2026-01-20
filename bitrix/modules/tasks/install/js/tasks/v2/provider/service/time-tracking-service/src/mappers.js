import type { ElapsedTimeModel } from 'tasks.v2.model.elapsed-times';
import type { ElapsedTimeDto } from './types';

export function mapModelToDto(elapsedTime: ElapsedTimeModel): ElapsedTimeDto
{
	return {
		id: elapsedTime.id,
		taskId: elapsedTime.taskId,
		userId: elapsedTime.userId,
		seconds: elapsedTime.seconds,
		source: elapsedTime.source,
		text: elapsedTime.text,
		createdAtTs: elapsedTime.createdAtTs,
		startTs: elapsedTime.startTs,
		stopTs: elapsedTime.stopTs,
		rights: elapsedTime.rights,
	};
}

export function mapDtoToModel(elapsedTimeDto: ElapsedTimeDto): ElapsedTimeModel
{
	return {
		id: elapsedTimeDto.id,
		taskId: elapsedTimeDto.taskId,
		userId: elapsedTimeDto.userId,
		seconds: elapsedTimeDto.seconds,
		source: elapsedTimeDto.source,
		text: elapsedTimeDto.text,
		createdAtTs: elapsedTimeDto.createdAtTs,
		startTs: elapsedTimeDto.startTs,
		stopTs: elapsedTimeDto.stopTs,
		rights: elapsedTimeDto.rights,
	};
}
