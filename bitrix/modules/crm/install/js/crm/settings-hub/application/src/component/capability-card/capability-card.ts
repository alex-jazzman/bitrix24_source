import { defineComponent, type PropType } from 'ui.vue3';
import { BIcon } from 'ui.icon-set.api.vue';
import 'ui.icon-set.outline';

import { resolveSectionIcon } from '../../lib/section-icon';
import { type Capability } from '../../model/types';

type InteractiveListeners = Readonly<{
	click: () => void,
	keydown: (event: KeyboardEvent) => void,
}> | Record<string, never>;

export const CrmSettingsHubCapabilityCard = defineComponent({
	name: 'CrmSettingsHubCapabilityCard',
	components: { BIcon },
	props: {
		capability: {
			type: Object as PropType<Capability>,
			required: true,
		},
		interactive: {
			type: Boolean,
			required: true,
		},
	},
	emits: ['select'],
	computed: {
		safeIcon(): string
		{
			return resolveSectionIcon(this.capability.icon);
		},
		interactiveAttributes(): Record<string, string | number>
		{
			return this.interactive ? { role: 'button', tabindex: 0 } : {};
		},
		interactiveListeners(): InteractiveListeners
		{
			return this.interactive
				? { click: this.handleSelect, keydown: this.handleKeydown }
				: {};
		},
	},
	methods: {
		handleSelect(): void
		{
			this.$emit('select', this.capability);
		},
		handleKeydown(event: KeyboardEvent): void
		{
			if (!['Enter', ' '].includes(event.key))
			{
				return;
			}

			event.preventDefault();
			this.handleSelect();
		},
	},
	template: `
		<div
			class="crm-settings-hub-application__cap-card"
			:class="{ '--clickable': interactive }"
			:data-testid="'crm-settings-hub-application-capability-' + capability.id"
			v-bind="interactiveAttributes"
			v-on="interactiveListeners"
		>
			<div class="crm-settings-hub-application__cap-card-head">
				<span class="crm-settings-hub-application__cap-icon"><BIcon :name="safeIcon"/></span>
			</div>
			<span class="crm-settings-hub-application__cap-title">{{ capability.title }}</span>
			<span class="crm-settings-hub-application__cap-task">{{ capability.task }}</span>
		</div>
	`,
});
