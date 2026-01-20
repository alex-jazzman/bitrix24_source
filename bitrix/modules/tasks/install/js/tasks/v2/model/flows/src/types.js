export type FlowsModelState = {
	collection: { [flowId: string]: FlowModel },
};

export type FlowModel = {
	id: number,
	name: string,
	groupId: number,
	templateId: number,
};
