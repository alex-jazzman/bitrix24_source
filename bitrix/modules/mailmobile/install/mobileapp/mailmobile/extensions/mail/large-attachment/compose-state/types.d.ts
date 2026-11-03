export type LargeAttachmentPlanParams = {
	files: unknown[],
	maxSize: number,
	convertedSets: Array<{ token: string, fileIds: number[] }>,
};

export type LargeAttachmentPlan = {
	// the objects of the form the plan covers
	objectIds: number[],
	// the source objects the server is asked to convert, matched to objectIds pair by pair
	fileIds: number[],
	// one to one: the object of the form standing behind every source the plan names
	objectIdBySourceId: Record<number, number>,
	replacementToken: string | null,
	replacementTokens: string[],
};

export type ServiceLink = {
	url: string,
	title?: string,
};
