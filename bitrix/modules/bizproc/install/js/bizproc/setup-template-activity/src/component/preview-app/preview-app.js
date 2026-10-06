import {
	Button as UiButton,
	AirButtonStyle,
	ButtonSize,
} from 'ui.vue3.components.button';
import { PreviewLayout } from '../preview-layout/preview-layout';
import { PreviewHeader } from '../preview-header/preview-header';
import { PreviewBlock } from '../preview-block/preview-block';
import { Type } from 'main.core';
import { FormElement, isPickerOpenKey, PICKER_ROW_SELECTOR } from 'bizproc.setup-template';
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
	methods: {
		/**
		 * The preview is a picture of the form, not the form itself, but the `disabled` prop below is
		 * not declared by the field chain and only lands on the row element. A date or time field
		 * carries a real picker, so activating its row would open the picker and change the shown
		 * value. Only such a row is caught: everything the other fields do stays in the preview
		 * anyway (`formData` is a computed without a setter), and swallowing their events would take
		 * the space bar out of a text field and the toggling out of a radio.
		 */
		isPickerRow(event: Event): boolean
		{
			return Type.isElementNode(event.target) && Type.isDomNode(event.target.closest(PICKER_ROW_SELECTOR));
		},
		suppressActivation(event: Event): void
		{
			if (!this.isPickerRow(event))
			{
				return;
			}

			event.preventDefault();
			event.stopPropagation();
		},
		suppressKeyActivation(event: KeyboardEvent): void
		{
			if (isPickerOpenKey(event))
			{
				this.suppressActivation(event);
			}
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
							@click.capture="suppressActivation"
							@keydown.capture="suppressKeyActivation"
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
