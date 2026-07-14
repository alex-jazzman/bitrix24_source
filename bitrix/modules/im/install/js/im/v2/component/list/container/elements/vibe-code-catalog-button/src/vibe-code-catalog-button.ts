import { Extension } from 'main.core';
import { BIcon, Outline as OutlineIcons } from 'ui.icon-set.api.vue';
import { defineComponent } from 'ui.vue3';

import { Layout, type LayoutType } from 'im.v2.const';

import './vibe-code-catalog-button.css';

type State = {
	isActive: boolean;
	counter: number;
};

const ICON_NAME = OutlineIcons.VIBECODE_CATALOG;
const COUNTER_DISPLAY_LIMIT = 99;
const AVAILABLE_LAYOUTS = new Set([Layout.chat, Layout.notification]);

// @vue/component
export const VibeCodeCatalogButton = defineComponent({
	name: 'VibeCodeCatalogButton',
	components: { BIcon } as { BIcon: typeof BIcon },
	data(): State
	{
		return {
			isActive: false,
			counter: 0,
		};
	},
	computed: {
		ICON_NAME: () => ICON_NAME,
		layoutName(): LayoutType
		{
			return this.$store.getters['application/getLayout'].name;
		},
		shouldShow(): boolean
		{
			if (!this.isAvailable)
			{
				return false;
			}

			return AVAILABLE_LAYOUTS.has(this.layoutName);
		},
		isAvailable(): boolean
		{
			const settings = Extension.getSettings('im.v2.component.list.container.elements.vibe-code-catalog-button');

			return settings.get('isAvailable', false);
		},
		shouldShowCounter(): boolean
		{
			if (this.isActive)
			{
				return false;
			}

			return this.counter > 0;
		},
		isCounterValueOverflowed(): boolean
		{
			return this.counter > COUNTER_DISPLAY_LIMIT;
		},
		formattedCounterValue(): string
		{
			if (this.isCounterValueOverflowed)
			{
				return `${COUNTER_DISPLAY_LIMIT}+`;
			}

			return this.counter.toString();
		},
	},
	methods: {
		onClick(event: PointerEvent)
		{
			this.isActive = !this.isActive;
		},
		loc(phraseCode: string): string
		{
			return this.$Bitrix.Loc.getMessage(phraseCode);
		},
	},
	template: `
		<button
			v-if="shouldShow"
			type="button"
			class="bx-im-list-container-vibe-code-catalog-button__container"
			:class="{'--active': isActive }"
			:aria-label="loc('IM_ELEMENTS_VIBE_CODE_CATALOG_ARIA_TITLE')"
			:aria-pressed="isActive"
			@click="onClick"
		>
			<BIcon
				class="bx-im-list-container-vibe-code-catalog-button__icon"
				:name="ICON_NAME"
				:aria-hidden="true"
			/>
			<span 
				v-if="shouldShowCounter"
				class="bx-im-list-container-vibe-code-catalog-button__counter"
				:class="{'--overflowed': isCounterValueOverflowed}"
				:aria-hidden="true"
			>
				{{ formattedCounterValue }}
			</span>
		</button>
	`,
});
