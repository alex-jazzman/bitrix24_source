export type StagesModelState = {
	collection: { [stageId: string]: StageModel },
};

export type StageModel = {
	id: number,
	title: string,
	color: string,
	systemType: string,
	sort: number,
};
