import { Dom, Text, Type } from 'main.core';
import { Counter, CounterStyle } from 'ui.cnt';
import { BIcon } from 'ui.icon-set.api.vue';
import { IconBackgroundColor } from '../enums/icon-background-color';
import { ICON_TO_BICON_MAP } from './icon-bicon-map';

export const Icon = {
	components: {
		BIcon,
	},
	props: {
		code: {
			type: String,
			required: false,
			default: 'none',
		},
		counterType: {
			type: String,
			required: false,
			default: '',
		},
		backgroundColorToken: {
			type: String,
			required: false,
			default: IconBackgroundColor.PRIMARY,
		},
		backgroundUri: String,
		backgroundColor: {
			type: String,
			required: false,
			default: null,
		},
	},
	inject: ['isLogMessage'],
	computed: {
		className(): Object
		{
			return {
				'crm-timeline__card_icon': true,
				[`--bg-${this.backgroundColorToken}`]: Boolean(this.backgroundColorToken),
				[`--code-${this.code}`]: Boolean(this.code) && !this.backgroundUri,
				'--custom-bg': Boolean(this.backgroundUri),
				'--muted': this.isLogMessage,
			};
		},

		counterNodeContainer(): HTMLDivElement
		{
			return this.$refs.counter;
		},

		styles(): Object
		{
			if (!this.backgroundUri)
			{
				return {};
			}

			return {
				backgroundImage: `url('${encodeURI(Text.encode(this.backgroundUri))}')`,
			};
		},

		useBIcon(): boolean
		{
			return ICON_TO_BICON_MAP.hasOwnProperty(this.code) && !this.backgroundUri;
		},

		bIconName(): string
		{
			return ICON_TO_BICON_MAP[this.code] || '';
		},

		bIconColor(): string
		{
			if (this.isLogMessage)
			{
				return 'var(--ui-color-base-40)';
			}

			return 'var(--ui-color-background-primary)';
		},

		iconStyle(): Object
		{
			if (Type.isStringFilled(this.backgroundColor))
			{
				return {
					'--crm-timeline-card-icon-background': Text.encode(this.backgroundColor),
				};
			}

			return {};
		},
	},

	methods: {
		renderCounter() {
			if (!this.counterType)
			{
				return;
			}

			const styleMap = {
				danger: CounterStyle.FILLED_ALERT,
				success: CounterStyle.FILLED_SUCCESS,
			};
			const style = styleMap[this.counterType];
			if (!style)
			{
				return;
			}

			Dom.clean(this.counterNodeContainer);
			const counter = new Counter({
				value: 1,
				useAirDesign: true,
				border: true,
				style,
			});
			counter.renderTo(this.counterNodeContainer);
		},
	},
	mounted() {
		this.renderCounter();
	},
	watch: {
		counterType(newCounterType): void // update if counter state changed
		{
			void this.$nextTick(() => {
				this.renderCounter();
			});
		},
	},
	template: `
		<div :class="className" :style="iconStyle">
			<BIcon
				v-if="useBIcon"
				:name="bIconName"
				:size="24"
				:color="bIconColor"
			/>
			<i v-else :style="styles"></i>
			<div ref="counter" v-show="!!counterType" class="crm-timeline__card_icon_counter"></div>
		</div>
	`
};
