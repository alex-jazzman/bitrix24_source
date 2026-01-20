import { PlacementType } from 'tasks.v2.const';

export type PlacementsModelState = {
	collection: { [placementId: number]: PlacementModel },
};

export type PlacementModel = {
	id: number;
	appId: number;
	title: string;
	description: string;
	type: $Values<typeof PlacementType>;
};
