import type {
	DEBUG_TRACE_TYPES,
} from '../constants';

export type DebugSessionSchema = {
	id: number,
	template_id: number,
	workflow_id: string | null,
	module_id: string | null,
	start_time: number,
	end_time: number | null,
	hasErrors: boolean,
	metadata: Object | null,
};

export type DebugTraceSchema = {
	id: number,
	debugSessionId: number,
	type: $Values<typeof DEBUG_TRACE_TYPES>,
	message: string,
	key: string | null,
	timestamp: number,
	data: Object | null,
	context: Object | null,
	createdAt: string | null,
};
