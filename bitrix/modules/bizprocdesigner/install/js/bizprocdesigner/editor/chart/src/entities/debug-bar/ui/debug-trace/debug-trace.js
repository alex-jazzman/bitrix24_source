import './style.css';

import { computed, ref } from 'ui.vue3';
import { formatTimestamp, formatTraceIndex } from '../../utils';

export const DebugTrace = {
	name: 'debug-trace',
	props: {
		trace: {
			type: Object,
			required: true,
		},
		index: {
			type: Number,
			default: 0,
		},
	},
	setup(props)
	{
		const isDataExpanded = ref(false);
		const isContextExpanded = ref(false);

		const hasData = computed(() => {
			return props.trace.data && Object.keys(props.trace.data).length > 0;
		});

		const hasContext = computed(() => {
			return props.trace.context && Object.keys(props.trace.context).length > 0;
		});

		function formatJson(obj: Object): string
		{
			try
			{
				return JSON.stringify(obj, null, 2);
			}
			catch
			{
				return String(obj);
			}
		}

		function toggleData(): void
		{
			isDataExpanded.value = !isDataExpanded.value;
		}

		function toggleContext(): void
		{
			isContextExpanded.value = !isContextExpanded.value;
		}

		return {
			formatTimestamp,
			formatJson,
			formatTraceIndex,
			isDataExpanded,
			isContextExpanded,
			hasData,
			hasContext,
			toggleData,
			toggleContext,
		};
	},
	template: `
		<div class="debug-bar-trace">
			<div class="debug-bar-trace-index">{{ formatTraceIndex(index) }}</div>
			<div class="debug-bar-trace-wrapper">
				<div class="debug-bar-trace-header">
					<span class="debug-bar-trace-time">[{{ formatTimestamp(trace.timestamp) }}]</span>
					<span class="debug-bar-trace-type">
						[{{ trace.type }}]
					</span>
					<span v-if="trace.key" class="debug-bar-trace-key">{{ trace.key }}</span>
					<span v-if="trace.message" class="debug-bar-trace-message">{{ trace.message }}</span>
				</div>

				<!-- CONTEXT Section -->
				<div v-if="hasContext" class="debug-bar-trace-section">
					<a
						class="debug-bar-trace-toggle"
						:class="{ 'debug-bar-trace-toggle--expanded': isContextExpanded }"
						@click="toggleContext"
					>
						<span class="debug-bar-trace-toggle-icon">{{ isContextExpanded ? '▼' : '▶' }}</span>
						<span class="debug-bar-trace-toggle-label">CONTEXT:</span>
					</a>
					<div v-if="isContextExpanded" class="debug-bar-trace-json">
						<pre>{{ formatJson(trace.context) }}</pre>
					</div>
				</div>

				<!-- DATA Section -->
				<div v-if="hasData" class="debug-bar-trace-section">
					<button
						class="debug-bar-trace-toggle"
						:class="{ 'debug-bar-trace-toggle--expanded': isDataExpanded }"
						@click="toggleData"
					>
						<span class="debug-bar-trace-toggle-icon">{{ isDataExpanded ? '▼' : '▶' }}</span>
						<span class="debug-bar-trace-toggle-label">DATA:</span>
					</button>
					<div v-if="isDataExpanded" class="debug-bar-trace-json">
						<pre>{{ formatJson(trace.data) }}</pre>
					</div>
				</div>
			</div>
		</div>
	`,
};
