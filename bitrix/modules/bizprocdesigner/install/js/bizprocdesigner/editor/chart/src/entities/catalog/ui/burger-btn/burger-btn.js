import { BIcon, Outline } from 'ui.icon-set.api.vue';
import './burger-btn.css';

export type BurgerBtnSetup = {
	iconSet: { [string]: string };
};

const BURGER_BTN_CLASS_NAMES = {
	base: 'editor-chart-burger-btn',
	openend: '--opened',
};

// @vue/component
export const BurgerBtn = {
	name: 'BurgerBtn',
	components: {
		BIcon,
	},
	props: {
		opened: {
			type: Boolean,
			default: false,
		},
	},
	setup(): BurgerBtnSetup
	{
		return {
			iconSet: Outline,
		};
	},
	computed: {
		burgerBtnClassNames(): { [string]: boolean }
		{
			return {
				[BURGER_BTN_CLASS_NAMES.base]: true,
				[BURGER_BTN_CLASS_NAMES.opened]: this.opened,
			};
		},
	},
	template: `
		<button
			:class="burgerBtnClassNames"
			:data-test-id="$testId('catalogBurger')"
		>
			<BIcon
				:name="iconSet.ALIGN_JUSTIFY"
				:size="24"
				class="editor-chart-burger-btn__icon"
			/>
		</button>
	`,
};
