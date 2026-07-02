import './style.css';

import { Loc } from 'main.core';
import { formatTimestamp } from '../../utils';
import { DEBUG_BAR_LABELS } from '../../constants';

export const DebugSession = {
	name: 'debug-session',
	props: {
		session: {
			type: Object,
			required: true,
		},
		isExpanded: {
			type: Boolean,
			default: false,
		},
	},
	emits: ['toggle'],
	setup()
	{
		return {
			formatTimestamp,
			Loc,
			labels: DEBUG_BAR_LABELS,
		};
	},
	computed: {
		toggleTitle(): string
		{
			return this.Loc.getMessage(
				this.isExpanded ? this.labels.SESSION_COLLAPSE_TITLE : this.labels.SESSION_EXPAND_TITLE,
			);
		},
		sessionStatus(): string
		{
			if (this.session.end_time)
			{
				return this.Loc.getMessage(
					this.labels.SESSION_FINISHED,
					{ TIME: this.formatTimestamp(this.session.end_time) },
				);
			}

			return this.Loc.getMessage(this.labels.SESSION_ACTIVE);
		},
	},
	template: `
		<div
			:class="{
				'debug-bar-session': true,
				'debug-bar-session--expanded': isExpanded,
			}"
		>
			<div class="debug-bar-session-header">
				<button
					class="debug-bar-session-toggle"
					@click="$emit('toggle')"
					:title="toggleTitle"
				>
					<span class="debug-bar-session-toggle-icon">{{ isExpanded ? '▼' : '▶' }}</span>
				</button>
				<span class="debug-bar-session-time">
					[{{ formatTimestamp(session.start_time, true) }}]
				</span>
				<span class="debug-bar-session-message">
					{{ sessionStatus }}
				</span>
			</div>

			<div v-if="isExpanded" class="debug-bar-traces">
				<slot name="traces"/>
			</div>
		</div>
	`,
};
