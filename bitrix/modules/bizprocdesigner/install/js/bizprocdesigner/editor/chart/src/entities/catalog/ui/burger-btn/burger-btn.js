import { computed } from 'ui.vue3';
import { BIcon, Outline } from 'ui.icon-set.api.vue';
import { useLoc } from '../../../../shared/composables';
import './burger-btn.css';

export type BurgerBtnSetup = {
	iconSet: { [string]: string };
	ariaLabel: string;
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
	setup(props): BurgerBtnSetup
	{
		const { getMessage } = useLoc();
		const ariaLabel = computed((): string => {
			return getMessage(
				props.opened
					? 'BIZPROCDESIGNER_EDITOR_CATALOG_CLOSE'
					: 'BIZPROCDESIGNER_EDITOR_CATALOG_OPEN',
			);
		});

		return {
			iconSet: Outline,
			ariaLabel,
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
			type="button"
			:class="burgerBtnClassNames"
			:aria-label="ariaLabel"
			:aria-expanded="opened"
			:data-test-id="$testId('catalogBurger')"
		>
			<BIcon
				:name="iconSet.ALIGN_JUSTIFY"
				:size="24"
				aria-hidden="true"
				class="editor-chart-burger-btn__icon"
			/>
		</button>
	`,
};
