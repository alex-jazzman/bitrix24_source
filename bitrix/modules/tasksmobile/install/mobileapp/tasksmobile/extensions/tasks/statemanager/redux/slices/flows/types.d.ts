export type FlowAiAdviceDTO = {
	minTasksCountForAdvice: number,
	efficiencyThreshold: number,
	advices: [][],
	limitExceeded: boolean,
	rateLimitExceeded: boolean,
}
