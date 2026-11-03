import { TextMd } from 'ui.system.typography.vue';
import { BIcon, Outline } from 'ui.icon-set.api.vue';
import 'ui.icon-set.outline';

// @vue/component
export const ToggleButton = {
	components: {
		BIcon,
		TextMd,
	},
	props: {
		opened: {
			type: Boolean,
			default: false,
		},
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
	computed: {
		label(): string
		{
			return this.opened
				? this.loc('TASKS_V2_ENTITY_TEXT_COLLAPSE')
				: this.loc('TASKS_V2_ENTITY_TEXT_EXPAND');
		},
		showFiles(): boolean
		{
			return !this.opened && this.showFilesIndicator && this.filesCount > 0;
		},
	},
	template: `
		<button
			type="button"
			class="tasks-card-entity-collapsible-collapse-button"
			:aria-expanded="opened"
		>
			<span
				v-if="showFiles"
				class="tasks-card-entity-collapsible-collapse-button-files"
			>
				<BIcon
					:name="Outline.ATTACH"
					:size="20"
					class="tasks-card-entity-collapsible-collapse-button-icon"
					aria-hidden="true"
				/>
				<TextMd className="tasks-card-entity-collapsible-collapse-button-text">
					{{ filesCount }}
				</TextMd>
			</span>
			<TextMd className="tasks-card-entity-collapsible-collapse-button-text">
				{{ label }}
			</TextMd>
		</button>
	`,
};
