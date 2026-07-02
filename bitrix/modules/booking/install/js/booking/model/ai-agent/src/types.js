export type AiAgentData = {
	templateId: number | null;
	action: string | null;
	error: string | null;
}

export type AiAgentState = {
	aiAgent: AiAgentData | null;
}
