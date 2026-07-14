import { BInput, InputSize, InputDesign } from 'ui.system.input.vue';
import { BMenu } from 'ui.system.menu.vue';

// @vue/component
export const AccessSelect = {
	name: 'AccessSelect',
	components: { BInput, BMenu },
	props: {
		items: { type: Array, required: true },
		selectedId: { type: String, required: true },
		variant: { type: String, required: true }, // 'public' | 'private'
	},
	emits: ['select'],
	data()
	{
		return { isMenuShown: false };
	},
	computed: {
		InputDesign: () => InputDesign,
		InputSize: () => InputSize,
		rootClass()
		{
			return `access-${this.variant}-block__select`;
		},
		selectedItem()
		{
			return this.items.find((item) => item.id === this.selectedId) ?? this.items[0];
		},
	},
	methods: {
		getMenuOptions()
		{
			return {
				bindElement: this.$refs.accessInput,
				closeOnItemClick: false,
				targetContainer: document.body,
				items: this.items.map((item) => ({
					title: item.title,
					isSelected: item.id === this.selectedId,
					onClick: () => {
						this.$emit('select', item.id);
						this.isMenuShown = false;
					},
				})),
			};
		},
		openMenu()
		{
			if (!this.$refs.accessInput)
			{
				return;
			}
			this.isMenuShown = true;
		},
	},
	template: `
		<div :class="rootClass" ref="accessInput">
			<BInput
				:modelValue="selectedItem.title"
				dropdown
				clickable
				:active="isMenuShown"
				:size="InputSize.Md"
				:design="InputDesign.Primary"
				@click="openMenu"
			/>
			<BMenu
				v-if="isMenuShown"
				:options="getMenuOptions()"
				@close="isMenuShown = false"
			/>
		</div>
	`,
};
