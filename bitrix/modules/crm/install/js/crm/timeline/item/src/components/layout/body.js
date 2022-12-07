import { Logo } from './body/logo';
import { LogoCalendar } from './body/logo-calendar';
import { Type } from 'main.core';

export const Body = {
	components: {
		Logo,
		LogoCalendar,
	},
	props: {
		logo: Object,
		blocks: Object,
	},
	mounted() {
		const blocks = this.$refs.blocks;
		if (!blocks || !this.visibleBlocks)
		{
			return;
		}
		this.visibleBlocks.forEach((block, index) => {
			if (Type.isDomNode(blocks[index].$el))
			{
				blocks[index].$el.setAttribute('data-id', block.id);
			}
			else
			{
				throw new Error('Vue component "' + block.rendererName + '" was not found');
			}
		});
	},
	computed: {
		visibleBlocks(): Array
		{
			return Object.keys(this.blocks)
				.map((id) => ({id, ...this.blocks[id]}))
				.filter((item) => (item.scope !== 'mobile'))
				.sort((a, b) => {
					let aSort = a.sort === undefined ? 0 : a.sort
					let bSort = b.sort === undefined ? 0 : b.sort

					if (aSort < bSort) {
						return -1;
					}
					if (aSort > bSort) {
						return  1;
					}

					return 0
				})
			;
		},
	},
	methods: {
		getContentBlockById(blockId: string): ?Object
		{
			const blocks = this.$refs.blocks;

			return this.visibleBlocks.reduce((found, block, index) => {
				if (found)
				{
					return found;
				}
				if (block.id === blockId)
				{
					return blocks[index];
				}

				return null;
			}, null);
		},
		getLogo(): ?Object
		{
			return this.$refs.logo;
		}
	},
	template: `
		<div class="crm-timeline__card-body">
			<div v-if="logo" class="crm-timeline__card-logo_container">
				<LogoCalendar v-if="logo.icon === 'calendar'" v-bind="logo"></LogoCalendar>
				<Logo v-else v-bind="logo" ref="logo"></Logo>
			</div>
			<div class="crm-timeline__card-container">
				<div
					v-for="block in visibleBlocks"
					:key="block.id"
					class="crm-timeline__card-container_block"
				>
					<component
						:is="block.rendererName"
						v-bind="block.properties"
						ref="blocks"
					/>
				</div>
			</div>
		</div>
	`
};
