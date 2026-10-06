import { Hint } from 'ui.hint';

export const CollapsibleCard = {
	props: {
		id: {
			type: String,
			required: true,
		},
		title: {
			type: String,
			required: true,
		},
		hint: {
			type: String,
			default: '',
		},
		iconClass: {
			type: String,
			default: '--o-database',
		},
		disabled: {
			type: Boolean,
			default: false,
		},
	},
	mounted()
	{
		this.initHint();
	},
	updated()
	{
		this.initHint();
	},
	methods:
	{
		initHint()
		{
			if (this.hint && !this.disabled && this.$el)
			{
				Hint.init(this.$el);
			}
		},
	},
	// language=Vue
	template: `
		<section
			class="biconnector-dataset-import-v2-card"
			:class="{ 'biconnector-dataset-import-v2-card--disabled': disabled }"
			:data-card-id="id"
		>
			<header class="biconnector-dataset-import-v2-card__header">
				<span class="biconnector-dataset-import-v2-card__icon ui-icon-set" :class="iconClass"></span>
				<span class="biconnector-dataset-import-v2-card__title ui-typography-text-md">{{ title }}</span>
				<span
					v-if="hint && !disabled"
					class="biconnector-dataset-import-v2-card__title-hint"
					:data-hint="hint"
					data-hint-outline
				></span>
				<span v-if="!disabled" class="biconnector-dataset-import-v2-card__header-extra">
					<slot name="header-extra" />
				</span>
			</header>
			<div v-if="!disabled" class="biconnector-dataset-import-v2-card__body">
				<slot />
			</div>
		</section>
	`,
};
