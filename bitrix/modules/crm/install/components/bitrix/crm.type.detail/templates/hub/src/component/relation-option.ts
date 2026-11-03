import { defineComponent } from 'ui.vue3';
import { Vue as CheckboxVue } from 'ui.system.checkbox';
import { Chip, ChipSize } from 'ui.system.chip.vue';
import { hint } from 'ui.vue3.directives.hint';

import { resolveOptionChipDesign } from '../lib/resolve-option-chip/resolve-option-chip';

// Take the Vue component from the parent ui.system.checkbox extension, not from ui.system.checkbox.vue
// directly (same reason as in relations-section: the parent creates the namespace the .vue variant
// attaches to).
const Checkbox = CheckboxVue.Checkbox;

// Name verified against ui/install/js/ui/icon-set/api/core/src/sets/outline.ts; kept as a plain
// string, the way the layout constants of this template do it.
const CHECK_ICON = 'check-m';

// One sub-option of a relation row, in the two shapes the hub has for it:
//
//   - a checkbox with a label — what the accepted version renders;
//   - a chip that carries its own state — what the ASF version renders, switched by a tap.
//
// Both report the same `update` event, so the layout above does not branch: it passes `asChip` and
// stops caring. The checkbox branch is the previous markup unchanged, down to the class names, so the
// accepted version renders exactly what it rendered before.
export const CrmTypeHubRelationOption = defineComponent({
	name: 'CrmTypeHubRelationOption',
	components: { Checkbox, Chip },
	directives: { hint },
	props: {
		optionId: {
			type: String,
			required: true,
		},
		// Already localized: option titles come either from a phrase resolved above or from the server.
		title: {
			type: String,
			default: '',
		},
		checked: {
			type: Boolean,
			default: false,
		},
		// Also already localized, same as `title`. Empty means no hint — the checkbox branch never
		// shows one, and the layout passes '' for an option kind that has no phrase yet.
		hint: {
			type: String,
			default: '',
		},
		asChip: {
			type: Boolean,
			default: false,
		},
	},
	emits: ['update'],
	setup(): Object
	{
		return { ChipSize, CHECK_ICON };
	},
	computed: {
		// Selected state is carried by the design, and by the check mark next to the text — colour
		// alone would be the only clue otherwise.
		chipDesign(): string
		{
			return resolveOptionChipDesign(this.checked);
		},
		// null unbinds the directive's listeners entirely, so an option without a hint stays a plain
		// chip instead of opening an empty popup. offsetTop matches the CRM idiom (timeline tag).
		hintOptions(): Object | null
		{
			return this.hint === '' ? null : { text: this.hint, popupOptions: { offsetTop: 5 } };
		},
	},
	methods: {
		handleToggle(): void
		{
			this.$emit('update', !this.checked);
		},
	},
	template: `
		<button
			v-if="asChip"
			v-hint="hintOptions"
			type="button"
			class="crm-type-hub-relation-option__chip"
			:aria-pressed="String(checked)"
			:data-testid="'crm-type-detail-hub-relation-option-' + optionId"
			@click="handleToggle"
		>
			<Chip
				:text="title"
				:size="ChipSize.Md"
				:design="chipDesign"
				:icon="checked ? CHECK_ICON : null"
			/>
		</button>
		<div v-else class="crm-type-hub-relation-option__item">
			<Checkbox
				:id="optionId"
				:model-value="checked"
				@update:model-value="$emit('update', $event)"
			/>
			<label :for="optionId">{{ title }}</label>
		</div>
	`,
});
