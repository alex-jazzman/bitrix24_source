/* eslint-disable */
declare namespace BX.Call.Component.Block {
	const CallUserCard: BX.Vue3.DefineComponent<BX.Vue3.ExtractPropTypes<{
		userId: {
			type: NumberConstructor;
			required: true;
		};
		active: {
			type: BooleanConstructor;
			default: boolean;
		};
		pinned: {
			type: BooleanConstructor;
			default: boolean;
		};
		pip: {
			type: BooleanConstructor;
			default: boolean;
		};
	}>, {
		usersStore: BX.Call.Store.UsersStoreInstance;
	}, {}, {
		user(): BX.Call.Store.User | null;
		isSelf(): boolean;
		displayName(): string;
		avatar(): string | null;
		isMuted(): boolean;
		isCameraOn(): boolean;
		isReconnecting(): boolean;
		isVideoStopped(): boolean;
		isSpeaking(): boolean;
		handRequest(): boolean;
		dataLoss(): number;
		stream(): MediaStream | null;
		mirrored(): boolean;
		isSpeakingActive(): boolean;
		hasVideo(): boolean;
		status(): string | null;
		cardClasses(): Record<string, boolean>;
	}, {
		handleSelect(): void;
	}, BX.Vue3.ComponentOptionsMixin, BX.Vue3.ComponentOptionsMixin, "select"[], "select", BX.Vue3.PublicProps, Readonly<BX.Vue3.ExtractPropTypes<{
		userId: {
			type: NumberConstructor;
			required: true;
		};
		active: {
			type: BooleanConstructor;
			default: boolean;
		};
		pinned: {
			type: BooleanConstructor;
			default: boolean;
		};
		pip: {
			type: BooleanConstructor;
			default: boolean;
		};
	}>> & Readonly<{
		onSelect?: ((...args: any[]) => any) | undefined;
	}>, {
		active: boolean;
		pinned: boolean;
		pip: boolean;
	}, {}, {
		CallAvatar: BX.Vue3.DefineComponent<BX.Vue3.ExtractPropTypes<{
			testId: {
				type: StringConstructor;
				default: null;
				required: true;
			};
			testState: {
				type: StringConstructor;
				default: null;
			};
			testMeta: {
				type: StringConstructor;
				default: null;
			};
			label: {
				type: StringConstructor;
				default: null;
			};
			image: {
				type: StringConstructor;
				default: null;
			};
			size: {
				type: (NumberConstructor | null)[];
				default: null;
			};
			corner: {
				type: BooleanConstructor;
				default: boolean;
			};
			caller: {
				type: BooleanConstructor;
				default: boolean;
			};
			speaker: {
				type: BooleanConstructor;
				default: boolean;
			};
			color: {
				type: StringConstructor;
				default: null;
			};
		}>, {}, {
			imageError: boolean;
		}, {
			hashColor(): string;
			abbreviation(): string;
			pulseElements(): number;
			encodedImage(): string | null;
			additionalClasses(): string[];
			cssVariables(): Record<string, string>;
			computedTestState(): string | null;
		}, {
			handleImageError(): void;
		}, BX.Vue3.ComponentOptionsMixin, BX.Vue3.ComponentOptionsMixin, {}, string, BX.Vue3.PublicProps, Readonly<BX.Vue3.ExtractPropTypes<{
			testId: {
				type: StringConstructor;
				default: null;
				required: true;
			};
			testState: {
				type: StringConstructor;
				default: null;
			};
			testMeta: {
				type: StringConstructor;
				default: null;
			};
			label: {
				type: StringConstructor;
				default: null;
			};
			image: {
				type: StringConstructor;
				default: null;
			};
			size: {
				type: (NumberConstructor | null)[];
				default: null;
			};
			corner: {
				type: BooleanConstructor;
				default: boolean;
			};
			caller: {
				type: BooleanConstructor;
				default: boolean;
			};
			speaker: {
				type: BooleanConstructor;
				default: boolean;
			};
			color: {
				type: StringConstructor;
				default: null;
			};
		}>> & Readonly<{}>, {
			size: number | null;
			label: string;
			image: string;
			caller: boolean;
			testId: string;
			testState: string;
			testMeta: string;
			corner: boolean;
			speaker: boolean;
			color: string;
		}, {}, {}, {}, string, BX.Vue3.ComponentProvideOptions, true, {}, any>;
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
		CallSignal: BX.Vue3.DefineComponent<BX.Vue3.ExtractPropTypes<{
			dataLoss: {
				type: NumberConstructor;
				default: number;
			};
		}>, {}, {}, {
			quality(): "excellent" | "good" | "poor" | "bad";
			additionalClasses(): string[];
		}, {}, BX.Vue3.ComponentOptionsMixin, BX.Vue3.ComponentOptionsMixin, {}, string, BX.Vue3.PublicProps, Readonly<BX.Vue3.ExtractPropTypes<{
			dataLoss: {
				type: NumberConstructor;
				default: number;
			};
		}>> & Readonly<{}>, {
			dataLoss: number;
		}, {}, {}, {}, string, BX.Vue3.ComponentProvideOptions, true, {}, any>;
		CallVideo: BX.Vue3.DefineComponent<BX.Vue3.ExtractPropTypes<{
			testId: {
				type: StringConstructor;
				default: null;
			};
			srcObject: {
				type: ObjectConstructor;
				default: null;
			};
			mirrored: {
				type: BooleanConstructor;
				default: boolean;
			};
			muted: {
				type: BooleanConstructor;
				default: boolean;
			};
			objectFit: {
				type: StringConstructor;
				default: string;
				validator: (value: string) => boolean;
			};
		}>, {}, {}, {
			additionalClasses(): string[];
		}, {}, BX.Vue3.ComponentOptionsMixin, BX.Vue3.ComponentOptionsMixin, {}, string, BX.Vue3.PublicProps, Readonly<BX.Vue3.ExtractPropTypes<{
			testId: {
				type: StringConstructor;
				default: null;
			};
			srcObject: {
				type: ObjectConstructor;
				default: null;
			};
			mirrored: {
				type: BooleanConstructor;
				default: boolean;
			};
			muted: {
				type: BooleanConstructor;
				default: boolean;
			};
			objectFit: {
				type: StringConstructor;
				default: string;
				validator: (value: string) => boolean;
			};
		}>> & Readonly<{}>, {
			testId: string;
			srcObject: Record<string, any>;
			mirrored: boolean;
			muted: boolean;
			objectFit: string;
		}, {}, {}, {}, string, BX.Vue3.ComponentProvideOptions, true, {}, any>;
	}, {}, string, BX.Vue3.ComponentProvideOptions, true, {}, any>;

	const CallUserCardPlus: BX.Vue3.DefineComponent<{}, {}, {}, {}, {}, BX.Vue3.ComponentOptionsMixin, BX.Vue3.ComponentOptionsMixin, {}, string, BX.Vue3.PublicProps, Readonly<{}> & Readonly<{}>, {}, {}, {
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
