/**
 * PLAN-01: the server builds the sequence of the reasoning show once and the client only resolves
 * where the plan is now. Offsets are seconds from `startedAt`, the first one is zero.
 */
declare type CopilotSimpleReasoningPlan = {
	startedAt: number,
	steps: Array<CopilotSimpleReasoningStep>,
}

declare type CopilotSimpleReasoningStep = {
	code: string,
	offset: number,
}

declare type CopilotSimpleStatusPlayback = {
	plan: CopilotSimpleReasoningPlan,
	/** index of the position currently on screen */
	cursor: number,
	/** the show has passed the last position at least once and walks the plan again */
	looped: boolean,
	timerId: number | null,
}
