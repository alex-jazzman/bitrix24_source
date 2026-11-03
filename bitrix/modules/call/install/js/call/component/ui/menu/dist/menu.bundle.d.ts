/* eslint-disable */
interface CallMenuItemData {
	label: string;
	icon?: string;
	items?: CallMenuItemData[];
	[key: string]: unknown;
}

declare namespace BX.Call.Component.Ui {
	const CallMenu: BX.Vue3.DefineComponent<BX.Vue3.ExtractPropTypes<{
		items: {
			type: ArrayConstructor;
			default: null;
		};
		reverse: {
			type: BooleanConstructor;
			default: boolean;
		};
	}>, {}, {}, {
		additionalClasses(): string[];
	}, {
		handleItemClick(payload: {
			item: CallMenuItemData;
			event: MouseEvent;
		}): void;
	}, BX.Vue3.ComponentOptionsMixin, BX.Vue3.ComponentOptionsMixin, "item:click"[], "item:click", BX.Vue3.PublicProps, Readonly<BX.Vue3.ExtractPropTypes<{
		items: {
			type: ArrayConstructor;
			default: null;
		};
		reverse: {
			type: BooleanConstructor;
			default: boolean;
		};
	}>> & Readonly<{
		"onItem:click"?: ((...args: any[]) => any) | undefined;
	}>, {
		reverse: boolean;
		items: unknown[];
	}, {}, {
		CallMenuItem: BX.Vue3.DefineComponent<BX.Vue3.ExtractPropTypes<{
			item: {
				type: ObjectConstructor;
				default: null;
			};
			templates: {
				type: ObjectConstructor;
				default: null;
			};
			reverse: {
				type: BooleanConstructor;
				default: boolean;
			};
		}>, {}, {}, {
			additionalClasses(): string[];
		}, {
			handleClick(event: MouseEvent): void;
		}, BX.Vue3.ComponentOptionsMixin, BX.Vue3.ComponentOptionsMixin, "click"[], "click", BX.Vue3.PublicProps, Readonly<BX.Vue3.ExtractPropTypes<{
			item: {
				type: ObjectConstructor;
				default: null;
			};
			templates: {
				type: ObjectConstructor;
				default: null;
			};
			reverse: {
				type: BooleanConstructor;
				default: boolean;
			};
		}>> & Readonly<{
			onClick?: ((...args: any[]) => any) | undefined;
		}>, {
			reverse: boolean;
			item: Record<string, any>;
			templates: Record<string, any>;
		}, {}, {
			CallIcon: BX.Vue3.DefineComponent<BX.Vue3.ExtractPropTypes<{
				icon: {
					type: StringConstructor;
					required: true;
					validator: (value: string) => boolean;
				};
				color: {
					type: StringConstructor;
					default: string;
					validator: (value: string) => boolean;
				};
				size: {
					type: NumberConstructor;
					default: number;
					validator: (value: number) => boolean;
				};
			}>, {}, {}, {
				additionalClasses(): string[];
				additionalStyles(): Record<string, string>;
			}, {}, BX.Vue3.ComponentOptionsMixin, BX.Vue3.ComponentOptionsMixin, {}, string, BX.Vue3.PublicProps, Readonly<BX.Vue3.ExtractPropTypes<{
				icon: {
					type: StringConstructor;
					required: true;
					validator: (value: string) => boolean;
				};
				color: {
					type: StringConstructor;
					default: string;
					validator: (value: string) => boolean;
				};
				size: {
					type: NumberConstructor;
					default: number;
					validator: (value: number) => boolean;
				};
			}>> & Readonly<{}>, {
				size: number;
				color: string;
			}, {}, {}, {}, string, BX.Vue3.ComponentProvideOptions, true, {}, any>;
		}, {}, string, BX.Vue3.ComponentProvideOptions, true, {}, any>;
	}, {}, string, BX.Vue3.ComponentProvideOptions, true, {}, any>;

	const CallMenuItem: BX.Vue3.DefineComponent<BX.Vue3.ExtractPropTypes<{
		item: {
			type: ObjectConstructor;
			default: null;
		};
		templates: {
			type: ObjectConstructor;
			default: null;
		};
		reverse: {
			type: BooleanConstructor;
			default: boolean;
		};
	}>, {}, {}, {
		additionalClasses(): string[];
	}, {
		handleClick(event: MouseEvent): void;
	}, BX.Vue3.ComponentOptionsMixin, BX.Vue3.ComponentOptionsMixin, "click"[], "click", BX.Vue3.PublicProps, Readonly<BX.Vue3.ExtractPropTypes<{
		item: {
			type: ObjectConstructor;
			default: null;
		};
		templates: {
			type: ObjectConstructor;
			default: null;
		};
		reverse: {
			type: BooleanConstructor;
			default: boolean;
		};
	}>> & Readonly<{
		onClick?: ((...args: any[]) => any) | undefined;
	}>, {
		reverse: boolean;
		item: Record<string, any>;
		templates: Record<string, any>;
	}, {}, {
		CallIcon: BX.Vue3.DefineComponent<BX.Vue3.ExtractPropTypes<{
			icon: {
				type: StringConstructor;
				required: true;
				validator: (value: string) => boolean;
			};
			color: {
				type: StringConstructor;
				default: string;
				validator: (value: string) => boolean;
			};
			size: {
				type: NumberConstructor;
				default: number;
				validator: (value: number) => boolean;
			};
		}>, {}, {}, {
			additionalClasses(): string[];
			additionalStyles(): Record<string, string>;
		}, {}, BX.Vue3.ComponentOptionsMixin, BX.Vue3.ComponentOptionsMixin, {}, string, BX.Vue3.PublicProps, Readonly<BX.Vue3.ExtractPropTypes<{
			icon: {
				type: StringConstructor;
				required: true;
				validator: (value: string) => boolean;
			};
			color: {
				type: StringConstructor;
				default: string;
				validator: (value: string) => boolean;
			};
			size: {
				type: NumberConstructor;
				default: number;
				validator: (value: number) => boolean;
			};
		}>> & Readonly<{}>, {
			size: number;
			color: string;
		}, {}, {}, {}, string, BX.Vue3.ComponentProvideOptions, true, {}, any>;
	}, {}, string, BX.Vue3.ComponentProvideOptions, true, {}, any>;
}
