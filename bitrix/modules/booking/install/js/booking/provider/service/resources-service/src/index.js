import { mapModelToDto, mapDtoToModel, mapResourceSkuRelationsDtoToModel } from './mappers';

export { resourceService } from './resources-service';
export const ResourceMappers = {
	mapModelToDto,
	mapDtoToModel,
	mapResourceSkuRelationsDtoToModel,
};

export type { ResourceDto, ResourceSkuRelationsDto } from './types';
