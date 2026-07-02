/* eslint-disable */
declare namespace BX.UI.IconSet {
	const BIcon: {
		props: {
			name: {
				type: StringConstructor;
				required: boolean;
				validator(value: string): boolean;
			};
			color: {
				type: StringConstructor;
				required: boolean;
				default: null;
			};
			size: {
				type: NumberConstructor;
				required: boolean;
				default: null;
			};
			hoverable: {
				type: BooleanConstructor;
				default: boolean;
			};
			hoverableAlt: {
				type: BooleanConstructor;
				default: boolean;
			};
			responsive: {
				type: BooleanConstructor;
				default: boolean;
			};
		};
		computed: {
			className(): string[];
			hoverableClassnameModifier(): string;
			responsiveClassnameModifier(): string;
			inlineSize(): string;
			inlineColor(): string;
			inlineStyle(): string;
		};
		template: string;
	};
}
