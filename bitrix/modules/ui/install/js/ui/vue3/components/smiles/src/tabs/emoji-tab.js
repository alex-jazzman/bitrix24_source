import { Extension } from 'main.core';
import { emoji } from '../emoji';
import { isWindows } from '../utils';

// @vue/component
export const EmojiTab = {
	name: 'EmojiTab',
	emits: ['selectSmile'],
	data(): Object
	{
		return {
			emoji: [],
		};
	},
	created()
	{
		this.emoji = emoji;
	},
	computed: {
		region(): string {
			return Extension.getSettings('ui.vue3.components.smiles').get('region') ?? '';
		},
	},
	methods:
	{
		selectSmile(text)
		{
			this.$emit('selectSmile', { text });
		},
		isShowCategory(category): boolean
		{
			if (isWindows())
			{
				return category.showForWindows;
			}

			return true;
		},
		scrollToCategory(categoryCode)
		{
			const allCategories = this.$refs.category;
			const container = this.$refs['emoji-container'];

			if (container && allCategories)
			{
				const targetCategory = allCategories.find(el =>
					el.dataset.categoryCode === categoryCode
				);

				if (targetCategory)
				{
					container.scrollTo({
						top: targetCategory.offsetTop - 64,
						behavior: 'smooth'
					});
				}
			}
		},
		isShowEmoji(emoji): boolean
		{
			return !(emoji.restrictedRegions && emoji.restrictedRegions.includes(this.region));
		}
	},
	template: `
		<div class="bx-ui-smiles-category-filter">
			<template v-for="category in emoji">
				<div
					v-if="isShowCategory(category)"
					class="bx-ui-smiles-category-filter-img"
					:class="'bx-ui-smiles-category-filter-img-' + category.code.toLowerCase()"
					:title="$Bitrix.Loc.getMessage('UI_VUE_SMILES_EMOJI_CATEGORY_' + category.code)"
					@click="scrollToCategory(category.code)"
				/>
			</template>
		</div>
		<div class="bx-ui-smiles-emoji-wrap" ref="emoji-container">
			<div v-for="category in emoji">
				<template v-if="isShowCategory(category)">
					<div class="bx-ui-smiles-category" ref="category" :data-category-code="category.code">
						{{ $Bitrix.Loc.getMessage('UI_VUE_SMILES_EMOJI_CATEGORY_' + category.code) }}
					</div>
					<div class="bx-ui-smiles-emoji-grid">
						<template v-for="element in category.emoji">
							<div  v-if="isShowEmoji(element)" class="bx-ui-smiles-smile" style="font-size: 22px;">
								<div class="bx-ui-smiles-smile-icon" @click="selectSmile(element.symbol)">
									{{ element.symbol }}
								</div>
							</div>
						</template>
					</div>
				</template>
			</div>
		</div>
	`,
};
