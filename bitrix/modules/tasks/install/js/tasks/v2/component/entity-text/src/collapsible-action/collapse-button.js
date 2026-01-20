import { TextMd } from 'ui.system.typography.vue';

// @vue/component
export const CollapseButton = {
	components: {
		TextMd,
	},
	template: `
		<div class="tasks-card-entity-collapsible-collapse-button">
			<TextMd className="tasks-card-entity-collapsible-collapse-button-text">
				{{ loc('TASKS_V2_ENTITY_TEXT_COLLAPSE') }}
			</TextMd>
		</div>
	`,
};
