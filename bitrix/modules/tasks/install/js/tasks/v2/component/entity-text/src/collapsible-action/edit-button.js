import { TextMd } from 'ui.system.typography.vue';
import { BIcon, Outline } from 'ui.icon-set.api.vue';
import 'ui.icon-set.outline';

// @vue/component
export const EditButton = {
	components: {
		BIcon,
		TextMd,
	},
	setup(): { Outline: Object }
	{
		return {
			Outline,
		};
	},
	template: `
		<div class="tasks-card-entity-collapsible-edit-button">
			<BIcon
				class="tasks-card-entity-collapsible-edit-button-icon"
				:name="Outline.EDIT_L"
				:size="20"
			/>
			<TextMd className="tasks-card-entity-collapsible-edit-button-text">
				{{ loc('TASKS_V2_ENTITY_TEXT_EDIT') }}
			</TextMd>
		</div>
	`,
};
