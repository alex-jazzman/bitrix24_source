export const CopilotRole = {
	universalCode: 'copilot_assistant',
};

export const CopilotGenerationStatus = {
	generating: 'generating',
	stopped: 'stopped',
	completed: 'completed',
	error: 'error',
};

export const CopilotMcpSelectionStatus = {
	restoring: 'restoring',
	ready: 'ready',
	error: 'error',
	unavailable: 'unavailable',
};

export const AiAssistantSearchBlockName = 'aiAssistantSearch';

// The server sends COPILOT_SIMPLE_REASONING_PLAN; the message model converts params keys to
// camelCase before the field whitelist sees them, so this is both the incoming key and the field.
export const CopilotSimpleReasoningPlanField = 'copilotSimpleReasoningPlan';

// Seconds from startedAt past which a plan is no longer played. Normative and shared with the server
// (ReasoningPlanPosition::STALE_PLAN_LIMIT): the model refuses offsets beyond it, the show stops on it.
export const CopilotSimpleReasoningStalePlanLimit = 900;

export type CopilotSimpleReasoningStep = {
	code: string,
	offset: number,
};

// Offsets are cumulative seconds from startedAt, rolled by the server once per turn. The first
// position has offset zero, so the show starts as soon as the placeholder arrives.
export type CopilotSimpleReasoningPlan = {
	startedAt: number,
	steps: CopilotSimpleReasoningStep[],
};
