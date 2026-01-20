import type { PlacementModel } from 'tasks.v2.model.placements';
import type { PlacementDto } from './types';

export function mapDtoToModel(placementDto: PlacementDto): PlacementModel
{
	return {
		id: placementDto.id,
		appId: placementDto.appId,
		title: placementDto.title,
		description: placementDto.description,
		type: placementDto.type,
	};
}
