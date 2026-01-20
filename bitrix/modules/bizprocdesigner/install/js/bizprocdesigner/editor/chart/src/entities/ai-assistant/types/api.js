type DraftSettings = {
	templateId: number,
	moduleId?: string,
	entity?: string,
	documentType?: string,
	documentTypeSigned?: string
};

type Draft = {
	id: number,
	documentTypeSigned: string,
	entity: string,
	moduleId: string,
	documentType: string,
};

type PostPayload = DraftSettings;
type PostResponse = Draft;

export type { PostPayload, PostResponse, Draft };
