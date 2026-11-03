/* eslint-disable */
type EntityLinkAppearanceItem = (typeof BX.Messenger.v2.Component.Elements.EntityLinkAppearance)[keyof typeof BX.Messenger.v2.Component.Elements.EntityLinkAppearance];

type LinkedDialog = {
	entityLink?: {
		url?: string | null;
	} | null;
};

declare namespace BX.Messenger.v2.Component.Elements {
	const EntityLink: BX.Vue3.DefineComponent<BX.Vue3.ExtractPropTypes<{
		dialogId: {
			type: StringConstructor;
			required: true;
		};
		appearance: {
			type: BX.Vue3.PropType<EntityLinkAppearanceItem>;
			default: "link";
		};
		withEntityName: {
			type: BooleanConstructor;
			default: boolean;
		};
		compactMode: {
			type: BooleanConstructor;
			default: boolean;
		};
		withUnreadBadge: {
			type: BooleanConstructor;
			default: boolean;
		};
		isChatMuted: {
			type: BooleanConstructor;
			default: boolean;
		};
	}>, {}, {}, {
		dialog(): BX.Messenger.v2.Model.ImModelChat;
		entityUrl(): string;
		text(): string;
	}, {}, BX.Vue3.ComponentOptionsMixin, BX.Vue3.ComponentOptionsMixin, {}, string, BX.Vue3.PublicProps, Readonly<BX.Vue3.ExtractPropTypes<{
		dialogId: {
			type: StringConstructor;
			required: true;
		};
		appearance: {
			type: BX.Vue3.PropType<EntityLinkAppearanceItem>;
			default: "link";
		};
		withEntityName: {
			type: BooleanConstructor;
			default: boolean;
		};
		compactMode: {
			type: BooleanConstructor;
			default: boolean;
		};
		withUnreadBadge: {
			type: BooleanConstructor;
			default: boolean;
		};
		isChatMuted: {
			type: BooleanConstructor;
			default: boolean;
		};
	}>> & Readonly<{}>, {
		appearance: EntityLinkAppearanceItem;
		compactMode: boolean;
		withUnreadBadge: boolean;
		isChatMuted: boolean;
		withEntityName: boolean;
	}, {}, {
		EntityButton: BX.Vue3.DefineComponent<BX.Vue3.ExtractPropTypes<{
			text: {
				type: StringConstructor;
				required: true;
			};
			url: {
				type: StringConstructor;
				default: string;
			};
			appearance: {
				type: BX.Vue3.PropType<EntityLinkAppearanceItem>;
				default: "link";
				validator: (value: string) => boolean;
			};
			compactMode: {
				type: BooleanConstructor;
				default: boolean;
			};
			withUnreadBadge: {
				type: BooleanConstructor;
				default: boolean;
			};
			isChatMuted: {
				type: BooleanConstructor;
				default: boolean;
			};
		}>, {}, {}, {
			chevronIcon(): string;
			isLinkAppearance(): boolean;
			containerClasses(): Record<string, boolean>;
		}, {
			onClick(event: MouseEvent): void;
		}, BX.Vue3.ComponentOptionsMixin, BX.Vue3.ComponentOptionsMixin, "click"[], "click", BX.Vue3.PublicProps, Readonly<BX.Vue3.ExtractPropTypes<{
			text: {
				type: StringConstructor;
				required: true;
			};
			url: {
				type: StringConstructor;
				default: string;
			};
			appearance: {
				type: BX.Vue3.PropType<EntityLinkAppearanceItem>;
				default: "link";
				validator: (value: string) => boolean;
			};
			compactMode: {
				type: BooleanConstructor;
				default: boolean;
			};
			withUnreadBadge: {
				type: BooleanConstructor;
				default: boolean;
			};
			isChatMuted: {
				type: BooleanConstructor;
				default: boolean;
			};
		}>> & Readonly<{
			onClick?: ((...args: any[]) => any) | undefined;
		}>, {
			url: string;
			appearance: EntityLinkAppearanceItem;
			compactMode: boolean;
			withUnreadBadge: boolean;
			isChatMuted: boolean;
		}, {}, {
			BIcon: {
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
		}, {}, string, BX.Vue3.ComponentProvideOptions, true, {}, any>;
	}, {}, string, BX.Vue3.ComponentProvideOptions, true, {}, any>;

	const EntityLinkAppearance: Readonly<{
		link: "link";
		button: "button";
	}>;

	const EntityButton: BX.Vue3.DefineComponent<BX.Vue3.ExtractPropTypes<{
		text: {
			type: StringConstructor;
			required: true;
		};
		url: {
			type: StringConstructor;
			default: string;
		};
		appearance: {
			type: BX.Vue3.PropType<EntityLinkAppearanceItem>;
			default: "link";
			validator: (value: string) => boolean;
		};
		compactMode: {
			type: BooleanConstructor;
			default: boolean;
		};
		withUnreadBadge: {
			type: BooleanConstructor;
			default: boolean;
		};
		isChatMuted: {
			type: BooleanConstructor;
			default: boolean;
		};
	}>, {}, {}, {
		chevronIcon(): string;
		isLinkAppearance(): boolean;
		containerClasses(): Record<string, boolean>;
	}, {
		onClick(event: MouseEvent): void;
	}, BX.Vue3.ComponentOptionsMixin, BX.Vue3.ComponentOptionsMixin, "click"[], "click", BX.Vue3.PublicProps, Readonly<BX.Vue3.ExtractPropTypes<{
		text: {
			type: StringConstructor;
			required: true;
		};
		url: {
			type: StringConstructor;
			default: string;
		};
		appearance: {
			type: BX.Vue3.PropType<EntityLinkAppearanceItem>;
			default: "link";
			validator: (value: string) => boolean;
		};
		compactMode: {
			type: BooleanConstructor;
			default: boolean;
		};
		withUnreadBadge: {
			type: BooleanConstructor;
			default: boolean;
		};
		isChatMuted: {
			type: BooleanConstructor;
			default: boolean;
		};
	}>> & Readonly<{
		onClick?: ((...args: any[]) => any) | undefined;
	}>, {
		url: string;
		appearance: EntityLinkAppearanceItem;
		compactMode: boolean;
		withUnreadBadge: boolean;
		isChatMuted: boolean;
	}, {}, {
		BIcon: typeof BX.UI.IconSet.BIcon;
	}, {}, string, BX.Vue3.ComponentProvideOptions, true, {}, any>;

	const PhraseByLinkType: Record<string, string>;

	const hasEntityLink: (dialog: LinkedDialog | null | undefined) => boolean;
}
