import { type ResourceDto } from './types';

export function mapDtoToModel(resourceDto: ResourceDto): ResourceDto
{
	return { ...resourceDto };
}
