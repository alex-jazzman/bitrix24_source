export type Resource = {
	id: number,
	name: string,
	description: ?string,
	typeName: string,
	slotRanges: SlotRange[];
	avatarUrl: ?string,
}

export type Sku = {
	id: number;
	currencyId: string;
	currencyFormat: string;
	name: string;
	price: number;
	permissions: {
		read: boolean;
	};
}

export type ResourceWithSkus = Resource & { skus: Sku[]; }

export type SlotRange = {
	id: number,
	from: number,
	to: number,
	timezone: string,
	weekDays: number[],
	slotSize: number,
}

export type ResourceSlot = {
	fromTs: number,
	toTs: number,
	label: string,
}

export type ResourceOccupancy = {
	fromTs: number;
	toTs: number;
}

export type OccupancyItem = {
	fromTs: number,
	toTs: number,
	resourcesIds: ?number[],
};

export type ResourceSkuRelation = {
	id: number;
	skus: number[];
};
