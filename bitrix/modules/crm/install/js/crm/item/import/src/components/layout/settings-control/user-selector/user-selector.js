import { BaseEvent } from 'main.core.events';
import { BitrixVueComponentProps } from 'ui.vue3';
import { TagSelector } from 'ui.entity-selector';

import { RequiredMark } from '../../required-mark/required-mark';

import './user-selector.css';

export const UserSelector: BitrixVueComponentProps = {
	name: 'UserSelector',

	components: {
		RequiredMark,
	},

	props: {
		fieldName: {
			type: String,
			required: true,
		},
		model: {
			type: Object,
			required: true,
		},
		fieldCaption: {
			type: String,
			required: true,
		},
		required: {
			type: Boolean,
			default: () => false,
		},
	},

	mounted(): void
	{
		this.getTagSelector().renderTo(this.$refs.userSelectorContainer);
	},

	methods: {
		getTagSelector(): TagSelector
		{
			if (this.tagSelector)
			{
				return this.tagSelector;
			}

			this.tagSelector = new TagSelector({
				multiple: false,
				dialogOptions: {
					entities: [
						{
							id: 'user',
							options: {
								inviteEmployeeLink: false,
							},
						},
						{
							id: 'department',
						},
					],
					enableSearch: true,
					multiple: false,
					dropdownMode: true,
					height: 300,
					preselectedItems: [
						['user', this.model.get(this.fieldName)],
					],
					events: {
						'Item:onBeforeSelect': (event: BaseEvent) => {
							this.model.set(this.fieldName, event.getData().item.getId());
						},
						'Item:onBeforeDeselect': (event: BaseEvent) => {
							if (event.getData().item.getId() === this.model.get(this.fieldName))
							{
								event.preventDefault();
							}
						},
					},
				},
				events: {
					onTagAdd: (event: BaseEvent) => {
						event.getData().tag.setDeselectable(false);
					},
				},
			});

			return this.tagSelector;
		},
	},

	template: `
		<div class="crm-item-import__field --user-selector ui-form-row">
			<div class="ui-form-label">
				<div class="ui-ctl-label-text">
					{{ fieldCaption }}
					<RequiredMark v-if="required" />
				</div>
			</div>
			<div class="ui-ctl ui-ctl-w100">
				<div class="ui-ctl-element" ref="userSelectorContainer" />
			</div>
		</div>
	`,
};
