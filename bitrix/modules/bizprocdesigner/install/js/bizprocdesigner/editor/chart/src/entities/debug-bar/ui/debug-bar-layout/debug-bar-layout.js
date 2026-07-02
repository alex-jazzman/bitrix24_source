import './style.css';

import { BIcon, Outline } from 'ui.icon-set.api.vue';
import { Loc } from 'main.core';
import { DEBUG_BAR_LABELS } from '../../constants';

export const DebugBarLayout = {
	name: 'debug-bar-layout',
	components: { BIcon },
	props: {
		isLoading: {
			type: Boolean,
			default: false,
		},
		isMaximized: {
			type: Boolean,
			default: false,
		},
	},
	emits: ['close', 'maximize', 'clear'],
	setup(): {iconSet: Outline, Loc: Loc, labels: typeof DEBUG_BAR_LABELS}
	{
		return {
			iconSet: Outline,
			Loc,
			labels: DEBUG_BAR_LABELS,
		};
	},
	computed: {
		maximizeTitle(): string
		{
			return this.Loc.getMessage(
				this.isMaximized ? this.labels.LAYOUT_MINIMIZE_TITLE : this.labels.LAYOUT_MAXIMIZE_TITLE,
			);
		},
		clearTitle(): string
		{
			return this.Loc.getMessage(this.labels.LAYOUT_CLEAR_TITLE);
		},
		closeTitle(): string
		{
			return this.Loc.getMessage(this.labels.LAYOUT_CLOSE_TITLE);
		},
	},
	template: `
		<div class="debug-bar-panel" :class="{ 'debug-bar-panel--maximized': isMaximized }">
			<div class="debug-bar-header">
				<div class="debug-bar-header-left">
					<div class="debug-bar-title-wrapper">
						<h3 class="debug-bar-title">{{ Loc.getMessage(labels.TITLE) }}</h3>
					</div>
				</div>
				<div class="debug-bar-header-actions">
					<button
						class="debug-bar-action"
						:title="maximizeTitle"
						@click="$emit('maximize')"
					>
						<BIcon :name="isMaximized ? iconSet.MINIMIZE : iconSet.MAXIMIZE" :size="20" color="#A8ADB4"/>
					</button>
					<button class="debug-bar-action" :title="clearTitle" @click="$emit('clear')">
						<BIcon :name="iconSet.TRASHCAN" :size="20" color="#A8ADB4"/>
					</button>
					<button class="debug-bar-action" :title="closeTitle" @click="$emit('close')">
						<BIcon :name="iconSet.CROSS_L" :size="20" color="#A8ADB4"/>
					</button>
				</div>
			</div>

			<Transition name="loading-fade" mode="out-in">
				<div v-if="isLoading" class="debug-bar-loading-indicator" key="loading">
					<div class="debug-bar-loading-progress"></div>
				</div>
			</Transition>

			<div class="debug-bar-content">
				<slot/>
			</div>
		</div>
	`,
};
