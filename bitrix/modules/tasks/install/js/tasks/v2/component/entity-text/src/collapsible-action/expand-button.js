import { TextMd } from 'ui.system.typography.vue';
import { BIcon, Outline } from 'ui.icon-set.api.vue';
import 'ui.icon-set.outline';

// @vue/component
export const ExpandButton = {
	components: {
		BIcon,
		TextMd,
	},
	props: {
		showFilesIndicator: {
			type: Boolean,
			default: false,
		},
		filesCount: {
			type: Number,
			default: 0,
		},
	},
	setup(): { Outline: Object }
	{
		return {
			Outline,
		};
	},
	template: `
		<div class="tasks-card-entity-collapsible-collapse-button">
			<span
				v-if="showFilesIndicator && filesCount"
				class="tasks-card-entity-collapsible-collapse-button-files"
			>
				<BIcon
					:name="Outline.ATTACH"
					:size="20"
					class="tasks-card-entity-collapsible-collapse-button-icon"
				/>
				<TextMd className="tasks-card-entity-collapsible-collapse-button-text">
					{{ filesCount }}
				</TextMd>
			</span>
			<TextMd className="tasks-card-entity-collapsible-collapse-button-text">
				{{ loc('TASKS_V2_ENTITY_TEXT_EXPAND') }}
			</TextMd>
		</div>
	`,
};
