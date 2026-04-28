import { DayIndexDict } from '../const/const';
import type { Resource, ResourceSkuRelation } from '../types';

export function mapDtoToResource(resourcesDto: ResourceDto[]): Resource[]
{
	return resourcesDto.map((dto) => {
		return {
			...dto,
			slotRanges: dto.slotRanges.map((slotRange) => {
				return {
					...slotRange,
					weekDays: slotRange.weekDays.map((weekDay) => DayIndexDict[weekDay]),
				};
			}),
		};
	});
}

export function mapResourcesToFormData(resources: ResourceSkuRelation[]): FormData
{
	const fd = new FormData();

	resources.forEach((resource, index) => {
		fd.append(`resources[${index}][id]`, resource.id);

		for (const sku of resource.skus)
		{
			fd.append(`resources[${index}][skus][]`, sku);
		}
	});

	return fd;
}

type ResourceDto = {
	id: number,
	name: string,
	description: string,
	typeName: string,
	slotRanges: {
		id: number,
		from: number,
		to: number,
		timezone: string,
		weekDays: string[],
		slotSize: number,
	}[];
}
