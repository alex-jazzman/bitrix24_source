import { Button as UiButton, AirButtonStyle, ButtonSize } from 'ui.vue3.components.button';
import { hint } from 'ui.vue3.directives.hint';
import { HeadlineMd, TextLg } from 'ui.system.typography.vue';
import type { HintParams } from 'ui.vue3.directives.hint';

import { tooltip } from 'tasks.v2.component.elements.hint';

import './placeholder.css';

// @vue/component
export const Placeholder = {
	components: {
		UiButton,
		HeadlineMd,
		TextLg,
	},
	directives: { hint },
	props: {
		imgSrc: {
			type: String,
			default: '',
		},
		head: {
			type: String,
			default: '',
		},
		description: {
			type: String,
			default: '',
		},
		action: {
			type: Object,
			default: null,
		},
	},
	setup(): Object
	{
		return {
			ButtonSize,
			AirButtonStyle,
		};
	},
	data(): Object
	{
		return {};
	},
	computed: {
		tooltip(): ?Function
		{
			if (!this.action?.hint)
			{
				return null;
			}

			return (): HintParams => tooltip({
				text: this.action.hint,
				popupOptions: {
					bindElement: this.$refs.actionContainer,
					offsetLeft: this.$refs.actionContainer.offsetWidth / 2,
					maxWidth: 300,
				},
			});
		},
	},
	methods: {},
	template: `
		<div class="tasks-full-card-placeholder">
			<div class="tasks-full-card-placeholder__content">
				<div v-if="imgSrc" class="tasks-full-card-placeholder__img-container">
					<img :src="imgSrc" alt="noAccess" class="tasks-full-card-placeholder__img"/>
				</div>
				<HeadlineMd v-if="head" class="tasks-full-card-placeholder__head">{{ head }}</HeadlineMd>
				<TextLg v-if="description" class="tasks-full-card-placeholder__descr">{{ description }}</TextLg>
				<div v-if="action" v-hint="tooltip" class="tasks-full-card-placeholder__action-container" ref="actionContainer">
					<UiButton
						class="tasks-full-card-placeholder__action"
						:text="action.text"
						:size="ButtonSize.MEDIUM"
						:style="AirButtonStyle.FILLED"
						:disabled="action.disabled"
						:loading="action.isLoading"
						@click="action.click"
					/>
				</div>
			</div>
		</div>
	`,
};
