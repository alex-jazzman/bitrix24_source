/* eslint-disable */
type CallIncomingData = {
	localMicrophoneState: boolean;
	localCameraState: boolean;
	announcementPhraseCode: string;
	announcementTimerId: ReturnType<typeof setTimeout> | null;
};

declare namespace BX.Call.Component.View {
	const CallIncoming: BX.Vue3.DefineComponent<{}, {
		callIncomingStore: BX.Call.Store.CallIncomingStoreInstance;
		instanceUid: number;
	}, CallIncomingData, {
		isDesktop(): boolean;
		isRegularCall(): boolean;
		cameraDisabled(): boolean;
		answerPhraseCode(): string;
		declinePhraseCode(): string;
		cameraUnavailableId(): string;
		callerName(): string;
		callerAvatar(): string;
		callerType(): string;
		callerColor(): string | null;
	}, {
		handleAnswerClick(): void;
		handleDeclineClick(): void;
		handleMicrophoneToggle(): void;
		handleCameraToggle(): void;
		announceCameraLoss(): void;
		stopAnnouncementTimer(): void;
	}, BX.Vue3.ComponentOptionsMixin, BX.Vue3.ComponentOptionsMixin, "button-click"[], "button-click", BX.Vue3.PublicProps, Readonly<{}> & Readonly<{
		"onButton-click"?: ((...args: any[]) => any) | undefined;
	}>, {}, {}, {
		CallButton: BX.Vue3.DefineComponent<BX.Vue3.ExtractPropTypes<{
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
			labelPosition: {
				type: StringConstructor;
				default: string;
				validator: (value: string) => boolean;
			};
			disabled: {
				type: BooleanConstructor;
				default: boolean;
			};
			cornerDisabled: {
				type: BooleanConstructor;
				default: boolean;
			};
			readonly: {
				type: BooleanConstructor;
				default: boolean;
			};
			cornerReadonly: {
				type: BooleanConstructor;
				default: boolean;
			};
			square: {
				type: BooleanConstructor;
				default: boolean;
			};
			hug: {
				type: BooleanConstructor;
				default: boolean;
			};
			size: {
				type: NumberConstructor;
				default: number;
				validator: (value: number) => boolean;
			};
			width: {
				type: NumberConstructor;
				default: null;
			};
			corner: {
				type: BooleanConstructor;
				default: boolean;
			};
			circle: {
				type: BooleanConstructor;
				default: boolean;
			};
			animated: {
				type: BooleanConstructor;
				default: boolean;
			};
			border: {
				type: BooleanConstructor;
				default: boolean;
			};
			color: {
				type: StringConstructor;
				default: string;
				validator: (value: string) => boolean;
			};
			variant: {
				type: StringConstructor;
				default: string;
				validator: (value: string) => boolean;
			};
			collapsed: {
				type: BooleanConstructor;
				default: boolean;
			};
		}>, {}, {}, {
			rootClasses(): string[];
			hasBottomLabel(): boolean;
			hasInlineLabel(): boolean;
			hasVisibleLabel(): boolean;
			rootAttrs(): Record<string, unknown>;
			dropsExternalAriaLabel(): boolean;
			buttonAttrs(): Record<string, unknown>;
			isUnavailable(): boolean;
			bodyClasses(): string[];
			cornerClasses(): string[];
			additionalStyles(): Record<string, string | null>;
			bodyTestState(): string | null;
			cornerTestState(): string | null;
		}, {
			onClick(event: MouseEvent): void;
			onCornerClick(event: MouseEvent): void;
		}, BX.Vue3.ComponentOptionsMixin, BX.Vue3.ComponentOptionsMixin, ("click" | "corner-click")[], "click" | "corner-click", BX.Vue3.PublicProps, Readonly<BX.Vue3.ExtractPropTypes<{
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
			labelPosition: {
				type: StringConstructor;
				default: string;
				validator: (value: string) => boolean;
			};
			disabled: {
				type: BooleanConstructor;
				default: boolean;
			};
			cornerDisabled: {
				type: BooleanConstructor;
				default: boolean;
			};
			readonly: {
				type: BooleanConstructor;
				default: boolean;
			};
			cornerReadonly: {
				type: BooleanConstructor;
				default: boolean;
			};
			square: {
				type: BooleanConstructor;
				default: boolean;
			};
			hug: {
				type: BooleanConstructor;
				default: boolean;
			};
			size: {
				type: NumberConstructor;
				default: number;
				validator: (value: number) => boolean;
			};
			width: {
				type: NumberConstructor;
				default: null;
			};
			corner: {
				type: BooleanConstructor;
				default: boolean;
			};
			circle: {
				type: BooleanConstructor;
				default: boolean;
			};
			animated: {
				type: BooleanConstructor;
				default: boolean;
			};
			border: {
				type: BooleanConstructor;
				default: boolean;
			};
			color: {
				type: StringConstructor;
				default: string;
				validator: (value: string) => boolean;
			};
			variant: {
				type: StringConstructor;
				default: string;
				validator: (value: string) => boolean;
			};
			collapsed: {
				type: BooleanConstructor;
				default: boolean;
			};
		}>> & Readonly<{
			onClick?: ((...args: any[]) => any) | undefined;
			"onCorner-click"?: ((...args: any[]) => any) | undefined;
		}>, {
			size: number;
			label: string;
			testId: string;
			testState: string;
			testMeta: string;
			corner: boolean;
			color: string;
			labelPosition: string;
			disabled: boolean;
			cornerDisabled: boolean;
			readonly: boolean;
			cornerReadonly: boolean;
			square: boolean;
			hug: boolean;
			width: number;
			circle: boolean;
			animated: boolean;
			border: boolean;
			variant: string;
			collapsed: boolean;
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
			testId: string;
			testState: string;
			testMeta: string;
			image: string;
			corner: boolean;
			caller: boolean;
			speaker: boolean;
			color: string;
		}, {}, {}, {}, string, BX.Vue3.ComponentProvideOptions, true, {}, any>;
	}, {}, string, BX.Vue3.ComponentProvideOptions, true, {}, any>;
}
