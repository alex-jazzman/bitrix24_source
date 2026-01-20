import { mapDtoToModel, mapModelToDto } from './mappers';

export { resultService } from './result-service';
export type { ResultDto } from './types';
export type { ResultId } from './types';

export const ResultMappers = {
	mapModelToDto,
	mapDtoToModel,
};
