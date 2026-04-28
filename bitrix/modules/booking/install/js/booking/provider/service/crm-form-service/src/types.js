import type { ResourceSkuRelationsDto } from 'booking.provider.service.resources-service';

export type ResourceDto = {
	id: number,
	name: string,
	typeName: string,
	slotRanges: ResourceDtoSlotRange[],
}

type ResourceDtoSlotRange = {
	id: number,
	from: number,
	to: number,
	slotSize: number,
	timezone: string,
	weekDays: string[],
}

export type ResourceSkuRelationsData = {
	catalogPermissions: {
		read: boolean;
	};
	resources: ResourceSkuRelationsDto[];
}
