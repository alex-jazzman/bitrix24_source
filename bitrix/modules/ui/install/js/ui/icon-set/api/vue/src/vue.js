import { Set, Outline } from 'ui.icon-set.api.core';

// @vue/component
const BIcon = {
	props: {
		name: {
			type: String,
			required: true,
			validator(value): boolean {
				return Object.values(Set).includes(value) || Object.values(Outline).includes(value);
			},
		},
		color: {
			type: String,
			required: false,
			default: null,
		},
		size: {
			type: Number,
			required: false,
			default: null,
		},
		hoverable: {
			type: Boolean,
			default: false,
		},
		hoverableAlt: {
			type: Boolean,
			default: false,
		},
	},

	computed: {
		className(): string[] {
			return [
				'ui-icon-set',
				`--${this.name}`,
				this.hoverableClassnameModifier,
			];
		},
		hoverableClassnameModifier(): string
		{
			if (this.hoverable)
			{
				return '--hoverable-default';
			}

			if (this.hoverableAlt)
			{
				return '--hoverable-alt';
			}

			return '';
		},
		inlineSize(): string {
			return this.size ? `--ui-icon-set__icon-size: ${this.size}px;` : '';
		},
		inlineColor(): string {
			return this.color ? `--ui-icon-set__icon-color: ${this.color};` : '';
		},

		inlineStyle(): void {
			return this.inlineSize + this.inlineColor;
		},
	},

	template: `
		<div
			:class="className"
			:style="inlineStyle"
		></div>
	`,
};

export * from 'ui.icon-set.api.core';
export {
	BIcon,
};
