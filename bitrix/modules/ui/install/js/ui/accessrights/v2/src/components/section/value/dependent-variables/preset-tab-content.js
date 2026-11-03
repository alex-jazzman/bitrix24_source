import { BIcon, Outline } from 'ui.icon-set.api.vue';
import { Checkbox } from 'ui.system.checkbox.vue';
import { CheckboxSize } from 'ui.system.checkbox';
import { hint } from 'ui.vue3.directives.hint';
import type { UserGroup } from '../../../../store/model/user-groups-model';
import { createHintOptions } from '../../../../utils';
import '../../../../css/value/dependent-variables/preset-tab-content.css';

export const PresetTabContent = {
	name: 'DependentVariablesPresetTabContent',
	components: { BIcon, Checkbox },
	directives: { hint },
	inject: ['section', 'right'],
	props: {
		preset: {
			type: Object,
			required: true,
		},
		userGroup: {
			type: Object,
			default: null,
		},
	},
	computed: {
		description(): ?string {
			return this.preset.description ?? null;
		},
		groupHeadItems(): Array<{ id: string, title: string, hint: ?string }> {
			if (!this.preset.showGroupHeadItems || !this.right.group || !this.userGroup)
			{
				return [];
			}

			const parentRight = this.$store.getters['accessRights/getAccessRightItemById'](
				this.section.sectionCode,
				this.right.group,
			);
			if (!parentRight)
			{
				return [];
			}

			const parentValue = this.$store.getters['userGroups/getAccessRightValue'](
				this.userGroup,
				this.section.sectionCode,
				this.right.group,
			);
			const parentValues: Set<string> = parentValue.values;
			const result = [];

			for (const [variableId, parentVariable] of parentRight.variables)
			{
				if (parentValues.has(variableId))
				{
					result.push({
						id: variableId,
						title: parentVariable.title,
						hint: parentVariable.hint ?? null,
					});
				}
			}

			return result;
		},
		hintIcon(): string {
			return Outline.QUESTION_M;
		},
		checkboxSize(): Object {
			return CheckboxSize;
		},
	},
	methods: {
		getHintOptions(text: string): Object {
			return createHintOptions(text);
		},
	},
	template: `
		<div class="ui-access-rights-v2-dv-preset-content">
			<!--
				Security invariant: 'description' is HTML already escaped on the backend and may contain only
				controlled markup (<b>). User-supplied names are escaped in PHP via htmlspecialcharsbx.
				Never pass raw user text here. Re-escaping would break the intentional <b>, so v-html stays.
			-->
			<p v-if="description" class="ui-access-rights-v2-dv-preset-content-description" v-html="description"></p>
			<div v-if="groupHeadItems.length > 0" class="ui-access-rights-v2-dv-popup--line-container">
				<div
					v-for="item in groupHeadItems"
					:key="item.id"
					class="ui-access-rights-v2-dv-popup--line --disabled"
				>
					<div class="ui-access-rights-v2-dv-popup--line-title">
						<span class="ui-access-rights-v2-text-ellipsis" :title="item.title">{{ item.title }}</span>
						<BIcon
							v-if="item.hint"
							:name="hintIcon"
							:size="20"
							:color="'var(--ui-color-palette-gray-40)'"
							v-hint="getHintOptions(item.hint)"
						/>
					</div>
					<div class="ui-access-rights-v2-dv-popup--line-checkbox">
						<Checkbox
							:model-value="true"
							:disabled="true"
							:size="checkboxSize.Md"
						/>
					</div>
				</div>
			</div>
		</div>
	`,
};
