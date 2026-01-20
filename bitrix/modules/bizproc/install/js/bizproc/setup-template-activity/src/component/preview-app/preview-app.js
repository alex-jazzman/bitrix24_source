import {
	Button as UiButton,
	AirButtonStyle,
	ButtonSize,
} from 'ui.vue3.components.button';
import { PreviewLayout } from '../preview-layout/preview-layout';
import { PreviewHeader } from '../preview-header/preview-header';
import { PreviewBlock } from '../preview-block/preview-block';
import { FormElement } from 'bizproc.setup-template';
import { ITEM_TYPES } from '../../constants';
// eslint-disable-next-line no-unused-vars
import type { Block } from '../../types';

// @vue/component
export const PreviewApp = {
	name: 'PreviewApp',
	components: {
		UiButton,
		PreviewLayout,
		PreviewHeader,
		PreviewBlock,
		FormElement,
	},
	props: {
		/** @type Array<Block> */
		blocks: {
			type: Array,
			default: () => ([]),
		},
	},
	setup(): { [string]: string }
	{
		return {
			AirButtonStyle,
			ButtonSize,
		};
	},
	computed: {
		formData(): { [string]: any }
		{
			return this.blocks
				.reduce((acc: { [string]: any }, block) => {
					const items = block.items
						.reduce((accItems, item) => {
							if (item.itemType === ITEM_TYPES.CONSTANT)
							{
								accItems[item.id] = item.default ?? '';

								return accItems;
							}

							return accItems;
						}, {});

					return { ...acc, ...items };
				}, {});
		},
	},
	template: `
		<PreviewLayout>
			<template #header>
				<PreviewHeader/>
			</template>

			<template #default>
				<PreviewBlock
					v-for="block in blocks"
					:key="block.id"
					:isEmpty="block.items.length === 0"
				>
					<template #default>
						<FormElement
							v-for="item in block.items"
							:key="item.id"
							:item="item"
							:formData="formData"
							:disabled="true"
							:errors="{}"
						/>
					</template>
				</PreviewBlock>
			</template>

			<template #footer>
				<UiButton
					:text="$Bitrix.Loc.getMessage('BIZPROC_SETUP_TEMPLATE_ACTIVITY_JS_PREVIEW_RUN_BTN')"
					:disabled="true"
					:size="ButtonSize.LARGE"
				/>
				<UiButton
					:text="$Bitrix.Loc.getMessage('BIZPROC_SETUP_TEMPLATE_ACTIVITY_JS_PREVIEW_CANCEL_BTN')"
					:disabled="true"
					:style="AirButtonStyle.PLAIN"
					:size="ButtonSize.LARGE"
				/>
			</template>
		</PreviewLayout>
	`,
};
