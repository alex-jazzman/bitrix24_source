/* eslint-disable */
declare namespace BX.Call.Widget {
	const CompactActiveCall: BX.Vue3.DefineComponent<BX.Vue3.ExtractPropTypes<{
		item: {
			type: BX.Vue3.PropType<BX.Messenger.v2.Model.ImModelCallItem>;
			required: true;
		};
	}>, {}, {}, {
		AvatarSize: () => Readonly<{
			XXS: "XXS";
			XS: "XS";
			S: "S";
			M: "M";
			L: "L";
			XL: "XL";
			XXL: "XXL";
			XXXL: "XXXL";
		}>;
		activeCall(): BX.Messenger.v2.Model.ImModelCallItem;
		hasJoined(): boolean;
		statusPhrase(): string;
		chatName(): string;
		accessibleName(): string;
	}, {
		onClick(): void;
		loc(phraseCode: string): string;
	}, BX.Vue3.ComponentOptionsMixin, BX.Vue3.ComponentOptionsMixin, "click"[], "click", BX.Vue3.PublicProps, Readonly<BX.Vue3.ExtractPropTypes<{
		item: {
			type: BX.Vue3.PropType<BX.Messenger.v2.Model.ImModelCallItem>;
			required: true;
		};
	}>> & Readonly<{
		onClick?: ((...args: any[]) => any) | undefined;
	}>, {}, {}, {
		ChatAvatar: {
			name: string;
			props: {
				avatarDialogId: {
					type: (NumberConstructor | StringConstructor)[];
					default: string;
				};
				contextDialogId: {
					type: (StringConstructor | null)[];
					default: null;
				};
				size: {
					type: StringConstructor;
					default: "M";
				};
				withAvatarLetters: {
					type: BooleanConstructor;
					default: boolean;
				};
				withSpecialTypes: {
					type: BooleanConstructor;
					default: boolean;
				};
				withSpecialTypeIcon: {
					type: BooleanConstructor;
					default: boolean;
				};
				withTooltip: {
					type: BooleanConstructor;
					default: boolean;
				};
				customType: {
					type: StringConstructor;
					default: string;
				};
			};
			computed: {
				isUser(): boolean;
				user(): import("im.v2.model").ImModelUser;
				customAvatarUrl(): string;
				avatarDialog(): import("im.v2.model").ImModelChat;
				isCollabChat(): boolean;
				isCollaber(): boolean;
				isGuest(): boolean;
				isExtranetChat(): boolean;
				isExtranet(): boolean;
				isAiAssistantMarta(): boolean;
				isAiAssistantBitrixGptInChat(): boolean;
				isSelfChat(): boolean;
				copilotRoleAvatarUrl(): string;
				avatarComponentConfig(): {
					condition: () => boolean;
					component: import("ui.vue3").BitrixVueComponentProps;
				}[];
				isAirDesignEnabled(): boolean;
				defaultAvatarComponent(): import("ui.vue3").BitrixVueComponentProps;
				avatarComponent(): import("ui.vue3").BitrixVueComponentProps;
			};
			created(): void;
			template: string;
		};
	}, {}, string, BX.Vue3.ComponentProvideOptions, true, {}, any>;
}
