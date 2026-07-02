import type { ViewerModel } from 'tasks.v2.model.viewers';
import type { ViewerDto } from './types';

export function mapDtoToModel(viewerDto: ViewerDto): ViewerModel
{
	return {
		id: viewerDto.id,
		name: viewerDto.name,
		image: viewerDto.image?.src,
		type: viewerDto.type,
	};
}

export function mapModelToDto(viewer: ViewerModel): ViewerDto
{
	return {
		id: viewer.id,
		name: viewer.name,
		image: { src: viewer.image },
		type: viewer.type,
	};
}
