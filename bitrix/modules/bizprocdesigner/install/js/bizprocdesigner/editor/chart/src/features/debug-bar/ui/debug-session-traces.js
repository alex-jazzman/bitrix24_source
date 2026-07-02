import { Loc } from 'main.core';
import { computed } from 'ui.vue3';
import { DEBUG_BAR_LABELS } from '../../../entities/debug-bar/constants';
import { DebugTrace } from '../../../entities/debug-bar/ui/debug-trace/debug-trace';

// @vue/component
export const DebugSessionTraces = {
	name: 'debug-session-traces',
	components: {
		DebugTrace,
	},
	props: {
		traces: {
			type: Array,
			default: () => [],
		},
		isLoading: {
			type: Boolean,
			default: false,
		},
		hasMoreTraces: {
			type: Boolean,
			default: false,
		},
		isLoadingMore: {
			type: Boolean,
			default: false,
		},
	},
	emits: ['load-more'],
	setup(props)
	{
		const isEmpty = computed(() => !props.isLoading && props.traces.length === 0);

		return {
			isEmpty,
			Loc,
			labels: DEBUG_BAR_LABELS,
		};
	},
	template: `
		<div v-if="isLoading" class="debug-bar-traces-loading">
			{{ Loc.getMessage(labels.TRACES_LOADING) }}
		</div>

		<div v-else-if="isEmpty" class="debug-bar-traces-empty">
			{{ Loc.getMessage(labels.TRACES_EMPTY) }}
		</div>

		<div v-else class="debug-bar-traces-list">
			<DebugTrace
				v-for="(trace, index) in traces"
				:key="trace.id"
				:trace="trace"
				:index="index"
			/>

			<div v-if="hasMoreTraces" class="debug-bar-traces-load-more">
				<button
					class="debug-bar-traces-load-more-btn"
					:disabled="isLoadingMore"
					@click="$emit('load-more')"
				>
					{{ isLoadingMore ? Loc.getMessage(labels.TRACES_LOADING) : Loc.getMessage(labels.LOAD_MORE_TRACES) }}
				</button>
			</div>
		</div>
	`,
};
