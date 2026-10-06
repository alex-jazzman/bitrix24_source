import { Text } from 'ui.system.typography.vue';
export const Description = {
	components: {
		Text,
	},
	props: {
		desc: {
			type: String,
		},
	},
	data(): Object
	{
		return {
			isDescriptionExpanded: false,
			showMoreButton: false,
		};
	},
	methods: {
		toggleDesc(): void
		{
			if (!this.showMoreButton)
			{
				return;
			}

			this.isDescriptionExpanded = !this.isDescriptionExpanded;
			this.showMoreButton = false;
		},
	},
	mounted()
	{
		const descNode = document.querySelector('.market-mobile-detail__description');
		this.showMoreButton = descNode.scrollHeight > descNode.clientHeight;
	},
	template: `
		<div class="market-mobile-detail__description-wrapper">
			<Text
				tag="span"
				size="md"
				v-html="desc"
				:class="[
						'market-mobile-detail__description',
						{ 'market-mobile-detail__description--expanded': isDescriptionExpanded },
					]"
			/>
			<Text
				v-if="showMoreButton"
				tag="span"
				size="sm"
				@click="toggleDesc()"
				class="market-mobile-detail__more"
			>
				{{ $Bitrix.Loc.getMessage('MARKET_MOBILE_DETAIL_MORE') }}
			</Text>
		</div>
	`,
};
