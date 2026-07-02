import { Loc } from 'main.core';
import { DebugSession } from '../../../entities/debug-bar/ui/debug-session/debug-session';
import { DebugSessionTraces } from './debug-session-traces';
import { DEBUG_BAR_LABELS } from '../../../entities/debug-bar/constants';

// @vue/component
export const DebugSessionsList = {
	name: 'debug-sessions-list',
	components: {
		DebugSession,
		DebugSessionTraces,
	},
	props: {
		sessions: {
			type: Array,
			default: () => [],
		},
		selectedSessionId: {
			type: Number,
			default: null,
		},
		traces: {
			type: Array,
			default: () => [],
		},
		isLoadingTraces: {
			type: Boolean,
			default: false,
		},
		hasMoreTraces: {
			type: Boolean,
			default: false,
		},
		isLoadingMoreTraces: {
			type: Boolean,
			default: false,
		},
	},
	emits: ['select-session', 'load-more-traces'],
	setup()
	{
		return {
			Loc,
			labels: DEBUG_BAR_LABELS,
		};
	},
	template: `
		<div v-if="sessions.length === 0" class="debug-bar-empty">
			{{ Loc.getMessage(labels.SESSIONS_EMPTY) }}
		</div>

		<div v-else class="debug-bar-sessions">
			<DebugSession
				v-for="session in sessions"
				:key="session.id"
				:session="session"
				:is-expanded="selectedSessionId === session.id"
				@toggle="$emit('select-session', session.id)"
			>
				<template #traces>
					<DebugSessionTraces
						:traces="traces"
						:is-loading="isLoadingTraces"
						:has-more-traces="hasMoreTraces"
						:is-loading-more="isLoadingMoreTraces"
						@load-more="$emit('load-more-traces')"
					/>
				</template>
			</DebugSession>
		</div>
	`,
};
