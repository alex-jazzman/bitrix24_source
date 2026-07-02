import { mapDtoToModel, mapModelToDto } from './mappers';
import { ViewersService } from './viewers-service';

export type { ViewerDto } from './types';

export const viewersService = new ViewersService();
export const ViewerMappers = {
	mapDtoToModel,
	mapModelToDto,
};
