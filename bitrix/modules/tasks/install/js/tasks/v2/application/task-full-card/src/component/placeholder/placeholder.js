import { Button as UiButton, AirButtonStyle, ButtonSize } from 'ui.vue3.components.button';

import './placeholder.css';

// @vue/component
export const Placeholder = {
	components: {
		UiButton,
	},
	props: {
		imgSrc: {
			type: String,
			default: '',
		},
		head: {
			type: String,
			default: '',
		},
		descr: {
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
	computed: {},
	methods: {},
	template: `
		<div class="tasks-full-card-placeholder">
			<div class="tasks-full-card-placeholder__content">
				<div v-if="imgSrc" class="tasks-full-card-placeholder__img-container">
					<img :src="imgSrc" alt="noAccess" class="tasks-full-card-placeholder__img"/>
				</div>
				<h3 v-if="head" class="tasks-full-card-placeholder__head">{{ head }}</h3>
				<p v-if="descr" class="tasks-full-card-placeholder__descr">{{ descr }}</p>
				<div class="tasks-full-card-placeholder__action-container">
					<UiButton
						v-if="action"
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
