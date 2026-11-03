import { BIcon, Outline } from 'ui.icon-set.api.vue';

import './description.css';

// @vue/component
export const MiniFormButton = {
	name: 'TaskDescriptionMiniFormButton',
	components: {
		BIcon,
	},
	props: {
		filesCount: {
			type: Number,
			required: true,
		},
	},
	setup(): void
	{
		return {
			Outline,
		};
	},
	computed: {
		ariaLabel(): string
		{
			const base = this.loc('TASKS_V2_DESCRIPTION_ARIA_LABEL');
			if (this.filesCount)
			{
				return `${base}, ${this.loc('TASKS_V2_DESCRIPTION_FILES_COUNT', { '#COUNT#': String(this.filesCount) })}`;
			}

			return base;
		},
	},
	template: `
		<button
			type="button"
			class="tasks-card-change-description-mini-btn print-ignore"
			:aria-label="ariaLabel"
		>
			<div class="tasks-full-card-field-container --small-vertical-padding">
				<div class="tasks-card-change-description" :class="{ '--no-hover': filesCount }">
					<template v-if="filesCount">
						<BIcon
							:name="Outline.ATTACH"
							:size="20"
							class="tasks-card-description-field-icon-link"
							aria-hidden="true"
						/>
						<div class="tasks-card-change-description-mini-text-files">
							{{ loc('TASKS_V2_DESCRIPTION_FILES_COUNT', { '#COUNT#': String(filesCount) }) }}
						</div>
					</template>
					<template v-else>
						<div class="tasks-card-change-description-mini-text">
							{{ loc('TASKS_V2_CHANGE_DESCRIPTION') }}
						</div>
						<BIcon
							:name="Outline.CREATE_CHAT"
							:size="20"
							hoverable
							class="tasks-card-description-field-icon"
							aria-hidden="true"
						/>
					</template>
				</div>
			</div>
		</button>
	`,
};
