/* eslint-disable */
type CenterButton = {
	key: string;
	component: object;
	threshold: number;
	props?: Record<string, unknown>;
	on?: Record<string, (...args: unknown[]) => void>;
};

interface Hotkey {
	readonly action: string;
	readonly option: string;
	readonly control: string;
}

declare namespace BX.Call.Component.Block {
	const CallFooter: BX.Vue3.DefineComponent<{}, {
		uiStore: BX.Call.Store.UiStoreInstance;
	}, {
		isMoreOpen: boolean;
	}, {
		centerButtons(): CenterButton[];
		collapsedButtons(): Set<string>;
		isMoreVisible(): boolean;
	}, {
		isInCenter(key: string): boolean;
		toggleMore(): void;
		onRecordClick(): void;
		onDocumentClick(): void;
		onHangupControlClick(): void;
		onMicCornerClick(): void;
		onCameraCornerClick(): void;
	}, BX.Vue3.ComponentOptionsMixin, BX.Vue3.ComponentOptionsMixin, {}, string, BX.Vue3.PublicProps, Readonly<{}> & Readonly<{}>, {}, {}, {
		CallMicrophoneButton: BX.Vue3.DefineComponent<BX.Vue3.ExtractPropTypes<{
			testId: {
				type: StringConstructor;
				default: null;
				required: true;
			};
			isPopupOpen: {
				type: BooleanConstructor;
				default: boolean;
			};
			micLevel: {
				type: NumberConstructor;
				default: number;
			};
			isPip: {
				type: BooleanConstructor;
				default: boolean;
			};
			isDesktop: {
				type: BooleanConstructor;
				default: boolean;
			};
		}>, {
			mediaStore: import("call.store").MediaStoreInstance;
			uiStore: BX.Call.Store.UiStoreInstance;
		}, {}, {
			isActive(): boolean;
			disabled(): boolean;
			hotkey(): Hotkey;
			tooltip(): string;
			testState(): string;
			testMeta(): string | null;
		}, {
			handleClick(): void;
			handleCornerClick(event: MouseEvent): void;
		}, BX.Vue3.ComponentOptionsMixin, BX.Vue3.ComponentOptionsMixin, "corner-click"[], "corner-click", BX.Vue3.PublicProps, Readonly<BX.Vue3.ExtractPropTypes<{
			testId: {
				type: StringConstructor;
				default: null;
				required: true;
			};
			isPopupOpen: {
				type: BooleanConstructor;
				default: boolean;
			};
			micLevel: {
				type: NumberConstructor;
				default: number;
			};
			isPip: {
				type: BooleanConstructor;
				default: boolean;
			};
			isDesktop: {
				type: BooleanConstructor;
				default: boolean;
			};
		}>> & Readonly<{
			"onCorner-click"?: ((...args: any[]) => any) | undefined;
		}>, {
			testId: string;
			isDesktop: boolean;
			isPopupOpen: boolean;
			micLevel: number;
			isPip: boolean;
		}, {}, {
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
				testId: string;
				testState: string;
				testMeta: string;
				label: string;
				labelPosition: string;
				disabled: boolean;
				cornerDisabled: boolean;
				readonly: boolean;
				cornerReadonly: boolean;
				square: boolean;
				hug: boolean;
				width: number;
				corner: boolean;
				circle: boolean;
				animated: boolean;
				border: boolean;
				color: string;
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
			CallIconLevel: BX.Vue3.DefineComponent<BX.Vue3.ExtractPropTypes<{
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
				animated: {
					type: BooleanConstructor;
					default: boolean;
				};
				fillColor: {
					type: StringConstructor;
					default: string;
					validator: (value: string) => boolean;
				};
				level: {
					type: NumberConstructor;
					default: number;
				};
			}>, {}, {}, {
				clampedLevel(): number;
				fillStyle(): Record<string, string>;
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
				animated: {
					type: BooleanConstructor;
					default: boolean;
				};
				fillColor: {
					type: StringConstructor;
					default: string;
					validator: (value: string) => boolean;
				};
				level: {
					type: NumberConstructor;
					default: number;
				};
			}>> & Readonly<{}>, {
				size: number;
				animated: boolean;
				color: string;
				fillColor: string;
				level: number;
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
			CallTooltip: BX.Vue3.DefineComponent<BX.Vue3.ExtractPropTypes<{
				value: {
					type: StringConstructor;
					default: string;
				};
				disabled: {
					type: BooleanConstructor;
					default: boolean;
				};
				testId: {
					type: StringConstructor;
					default: string;
				};
				tooltipClass: {
					type: StringConstructor;
					default: string;
				};
				position: {
					type: StringConstructor;
					default: "bottom" | "top" | "right" | "left";
					validator: (value: string) => boolean;
				};
			}>, {}, {}, {
				tooltipClasses(): string[];
				isTooltipVisible(): boolean;
			}, {}, BX.Vue3.ComponentOptionsMixin, BX.Vue3.ComponentOptionsMixin, {}, string, BX.Vue3.PublicProps, Readonly<BX.Vue3.ExtractPropTypes<{
				value: {
					type: StringConstructor;
					default: string;
				};
				disabled: {
					type: BooleanConstructor;
					default: boolean;
				};
				testId: {
					type: StringConstructor;
					default: string;
				};
				tooltipClass: {
					type: StringConstructor;
					default: string;
				};
				position: {
					type: StringConstructor;
					default: "bottom" | "top" | "right" | "left";
					validator: (value: string) => boolean;
				};
			}>> & Readonly<{}>, {
				value: string;
				testId: string;
				disabled: boolean;
				tooltipClass: string;
				position: string;
			}, {}, {}, {}, string, BX.Vue3.ComponentProvideOptions, true, {}, any>;
		}, {}, string, BX.Vue3.ComponentProvideOptions, true, {}, any>;
		CallCameraButton: BX.Vue3.DefineComponent<BX.Vue3.ExtractPropTypes<{
			testId: {
				type: StringConstructor;
				default: null;
				required: true;
			};
			isPopupOpen: {
				type: BooleanConstructor;
				default: boolean;
			};
			isPip: {
				type: BooleanConstructor;
				default: boolean;
			};
			isDesktop: {
				type: BooleanConstructor;
				default: boolean;
			};
		}>, {
			mediaStore: import("call.store").MediaStoreInstance;
			uiStore: BX.Call.Store.UiStoreInstance;
		}, {}, {
			isActive(): boolean;
			disabled(): boolean;
			hotkey(): Hotkey;
			tooltip(): string;
			testState(): string;
			testMeta(): string | null;
		}, {
			handleClick(): void;
			handleCornerClick(event: MouseEvent): void;
		}, BX.Vue3.ComponentOptionsMixin, BX.Vue3.ComponentOptionsMixin, "corner-click"[], "corner-click", BX.Vue3.PublicProps, Readonly<BX.Vue3.ExtractPropTypes<{
			testId: {
				type: StringConstructor;
				default: null;
				required: true;
			};
			isPopupOpen: {
				type: BooleanConstructor;
				default: boolean;
			};
			isPip: {
				type: BooleanConstructor;
				default: boolean;
			};
			isDesktop: {
				type: BooleanConstructor;
				default: boolean;
			};
		}>> & Readonly<{
			"onCorner-click"?: ((...args: any[]) => any) | undefined;
		}>, {
			testId: string;
			isDesktop: boolean;
			isPopupOpen: boolean;
			isPip: boolean;
		}, {}, {
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
				testId: string;
				testState: string;
				testMeta: string;
				label: string;
				labelPosition: string;
				disabled: boolean;
				cornerDisabled: boolean;
				readonly: boolean;
				cornerReadonly: boolean;
				square: boolean;
				hug: boolean;
				width: number;
				corner: boolean;
				circle: boolean;
				animated: boolean;
				border: boolean;
				color: string;
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
			CallTooltip: BX.Vue3.DefineComponent<BX.Vue3.ExtractPropTypes<{
				value: {
					type: StringConstructor;
					default: string;
				};
				disabled: {
					type: BooleanConstructor;
					default: boolean;
				};
				testId: {
					type: StringConstructor;
					default: string;
				};
				tooltipClass: {
					type: StringConstructor;
					default: string;
				};
				position: {
					type: StringConstructor;
					default: "bottom" | "top" | "right" | "left";
					validator: (value: string) => boolean;
				};
			}>, {}, {}, {
				tooltipClasses(): string[];
				isTooltipVisible(): boolean;
			}, {}, BX.Vue3.ComponentOptionsMixin, BX.Vue3.ComponentOptionsMixin, {}, string, BX.Vue3.PublicProps, Readonly<BX.Vue3.ExtractPropTypes<{
				value: {
					type: StringConstructor;
					default: string;
				};
				disabled: {
					type: BooleanConstructor;
					default: boolean;
				};
				testId: {
					type: StringConstructor;
					default: string;
				};
				tooltipClass: {
					type: StringConstructor;
					default: string;
				};
				position: {
					type: StringConstructor;
					default: "bottom" | "top" | "right" | "left";
					validator: (value: string) => boolean;
				};
			}>> & Readonly<{}>, {
				value: string;
				testId: string;
				disabled: boolean;
				tooltipClass: string;
				position: string;
			}, {}, {}, {}, string, BX.Vue3.ComponentProvideOptions, true, {}, any>;
		}, {}, string, BX.Vue3.ComponentProvideOptions, true, {}, any>;
		CallFooterChatButton: BX.Vue3.DefineComponent<BX.Vue3.ExtractPropTypes<{
			messagesCount: {
				type: NumberConstructor;
				default: number;
			};
			isDesktop: {
				type: BooleanConstructor;
				default: boolean;
			};
		}>, {
			uiStore: BX.Call.Store.UiStoreInstance;
		}, {}, {
			disabled(): boolean;
			hotkey(): Hotkey;
			tooltip(): string;
			badge(): string;
		}, {
			handleClick(): void;
		}, BX.Vue3.ComponentOptionsMixin, BX.Vue3.ComponentOptionsMixin, never[], never, BX.Vue3.PublicProps, Readonly<BX.Vue3.ExtractPropTypes<{
			messagesCount: {
				type: NumberConstructor;
				default: number;
			};
			isDesktop: {
				type: BooleanConstructor;
				default: boolean;
			};
		}>> & Readonly<{}>, {
			isDesktop: boolean;
			messagesCount: number;
		}, {}, {
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
				testId: string;
				testState: string;
				testMeta: string;
				label: string;
				labelPosition: string;
				disabled: boolean;
				cornerDisabled: boolean;
				readonly: boolean;
				cornerReadonly: boolean;
				square: boolean;
				hug: boolean;
				width: number;
				corner: boolean;
				circle: boolean;
				animated: boolean;
				border: boolean;
				color: string;
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
			CallTooltip: BX.Vue3.DefineComponent<BX.Vue3.ExtractPropTypes<{
				value: {
					type: StringConstructor;
					default: string;
				};
				disabled: {
					type: BooleanConstructor;
					default: boolean;
				};
				testId: {
					type: StringConstructor;
					default: string;
				};
				tooltipClass: {
					type: StringConstructor;
					default: string;
				};
				position: {
					type: StringConstructor;
					default: "bottom" | "top" | "right" | "left";
					validator: (value: string) => boolean;
				};
			}>, {}, {}, {
				tooltipClasses(): string[];
				isTooltipVisible(): boolean;
			}, {}, BX.Vue3.ComponentOptionsMixin, BX.Vue3.ComponentOptionsMixin, {}, string, BX.Vue3.PublicProps, Readonly<BX.Vue3.ExtractPropTypes<{
				value: {
					type: StringConstructor;
					default: string;
				};
				disabled: {
					type: BooleanConstructor;
					default: boolean;
				};
				testId: {
					type: StringConstructor;
					default: string;
				};
				tooltipClass: {
					type: StringConstructor;
					default: string;
				};
				position: {
					type: StringConstructor;
					default: "bottom" | "top" | "right" | "left";
					validator: (value: string) => boolean;
				};
			}>> & Readonly<{}>, {
				value: string;
				testId: string;
				disabled: boolean;
				tooltipClass: string;
				position: string;
			}, {}, {}, {}, string, BX.Vue3.ComponentProvideOptions, true, {}, any>;
			CallBadge: BX.Vue3.DefineComponent<BX.Vue3.ExtractPropTypes<{
				testId: {
					type: StringConstructor;
					default: null;
					required: true;
				};
				label: {
					type: (NumberConstructor | StringConstructor)[];
					default: null;
				};
				size: {
					type: StringConstructor;
					default: string;
					validator: (value: string) => boolean;
				};
				color: {
					type: StringConstructor[];
					default: string;
					validator: (value: string) => boolean;
				};
			}>, {}, {}, {
				additionalClasses(): string[];
			}, {}, BX.Vue3.ComponentOptionsMixin, BX.Vue3.ComponentOptionsMixin, {}, string, BX.Vue3.PublicProps, Readonly<BX.Vue3.ExtractPropTypes<{
				testId: {
					type: StringConstructor;
					default: null;
					required: true;
				};
				label: {
					type: (NumberConstructor | StringConstructor)[];
					default: null;
				};
				size: {
					type: StringConstructor;
					default: string;
					validator: (value: string) => boolean;
				};
				color: {
					type: StringConstructor[];
					default: string;
					validator: (value: string) => boolean;
				};
			}>> & Readonly<{}>, {
				size: string;
				testId: string;
				label: string | number;
				color: string;
			}, {}, {}, {}, string, BX.Vue3.ComponentProvideOptions, true, {}, any>;
		}, {}, string, BX.Vue3.ComponentProvideOptions, true, {}, any>;
		CallFooterMoreButton: BX.Vue3.DefineComponent<BX.Vue3.ExtractPropTypes<{
			disabled: {
				type: BooleanConstructor;
				default: boolean;
			};
			isOpen: {
				type: BooleanConstructor;
				default: boolean;
			};
		}>, {}, {}, {
			testState(): string;
		}, {
			handleClick(event: MouseEvent): void;
		}, BX.Vue3.ComponentOptionsMixin, BX.Vue3.ComponentOptionsMixin, "click"[], "click", BX.Vue3.PublicProps, Readonly<BX.Vue3.ExtractPropTypes<{
			disabled: {
				type: BooleanConstructor;
				default: boolean;
			};
			isOpen: {
				type: BooleanConstructor;
				default: boolean;
			};
		}>> & Readonly<{
			onClick?: ((...args: any[]) => any) | undefined;
		}>, {
			disabled: boolean;
			isOpen: boolean;
		}, {}, {
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
				testId: string;
				testState: string;
				testMeta: string;
				label: string;
				labelPosition: string;
				disabled: boolean;
				cornerDisabled: boolean;
				readonly: boolean;
				cornerReadonly: boolean;
				square: boolean;
				hug: boolean;
				width: number;
				corner: boolean;
				circle: boolean;
				animated: boolean;
				border: boolean;
				color: string;
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
		}, {}, string, BX.Vue3.ComponentProvideOptions, true, {}, any>;
		CallFooterHangupButton: BX.Vue3.DefineComponent<{}, {
			uiStore: BX.Call.Store.UiStoreInstance;
		}, {}, {}, {
			handleClick(): void;
		}, BX.Vue3.ComponentOptionsMixin, BX.Vue3.ComponentOptionsMixin, never[], never, BX.Vue3.PublicProps, Readonly<{}> & Readonly<{}>, {}, {}, {
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
				testId: string;
				testState: string;
				testMeta: string;
				label: string;
				labelPosition: string;
				disabled: boolean;
				cornerDisabled: boolean;
				readonly: boolean;
				cornerReadonly: boolean;
				square: boolean;
				hug: boolean;
				width: number;
				corner: boolean;
				circle: boolean;
				animated: boolean;
				border: boolean;
				color: string;
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
		}, {}, string, BX.Vue3.ComponentProvideOptions, true, {}, any>;
		CallFooterHangupControlButton: BX.Vue3.DefineComponent<{}, {}, {}, {}, {
			handleClick(event: MouseEvent): void;
		}, BX.Vue3.ComponentOptionsMixin, BX.Vue3.ComponentOptionsMixin, "click"[], "click", BX.Vue3.PublicProps, Readonly<{}> & Readonly<{
			onClick?: ((...args: any[]) => any) | undefined;
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
				testId: string;
				testState: string;
				testMeta: string;
				label: string;
				labelPosition: string;
				disabled: boolean;
				cornerDisabled: boolean;
				readonly: boolean;
				cornerReadonly: boolean;
				square: boolean;
				hug: boolean;
				width: number;
				corner: boolean;
				circle: boolean;
				animated: boolean;
				border: boolean;
				color: string;
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
		}, {}, string, BX.Vue3.ComponentProvideOptions, true, {}, any>;
		CallFooterMorePopup: BX.Vue3.DefineComponent<{}, {}, {}, {}, {}, BX.Vue3.ComponentOptionsMixin, BX.Vue3.ComponentOptionsMixin, {}, string, BX.Vue3.PublicProps, Readonly<{}> & Readonly<{}>, {}, {}, {}, {}, string, BX.Vue3.ComponentProvideOptions, true, {}, any>;
	}, {}, string, BX.Vue3.ComponentProvideOptions, true, {}, any>;

	const CallFooterChatButton: BX.Vue3.DefineComponent<BX.Vue3.ExtractPropTypes<{
		messagesCount: {
			type: NumberConstructor;
			default: number;
		};
		isDesktop: {
			type: BooleanConstructor;
			default: boolean;
		};
	}>, {
		uiStore: BX.Call.Store.UiStoreInstance;
	}, {}, {
		disabled(): boolean;
		hotkey(): BX.Call.Helper.Hotkey;
		tooltip(): string;
		badge(): string;
	}, {
		handleClick(): void;
	}, BX.Vue3.ComponentOptionsMixin, BX.Vue3.ComponentOptionsMixin, never[], never, BX.Vue3.PublicProps, Readonly<BX.Vue3.ExtractPropTypes<{
		messagesCount: {
			type: NumberConstructor;
			default: number;
		};
		isDesktop: {
			type: BooleanConstructor;
			default: boolean;
		};
	}>> & Readonly<{}>, {
		isDesktop: boolean;
		messagesCount: number;
	}, {}, {
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
			testId: string;
			testState: string;
			testMeta: string;
			label: string;
			labelPosition: string;
			disabled: boolean;
			cornerDisabled: boolean;
			readonly: boolean;
			cornerReadonly: boolean;
			square: boolean;
			hug: boolean;
			width: number;
			corner: boolean;
			circle: boolean;
			animated: boolean;
			border: boolean;
			color: string;
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
		CallTooltip: BX.Vue3.DefineComponent<BX.Vue3.ExtractPropTypes<{
			value: {
				type: StringConstructor;
				default: string;
			};
			disabled: {
				type: BooleanConstructor;
				default: boolean;
			};
			testId: {
				type: StringConstructor;
				default: string;
			};
			tooltipClass: {
				type: StringConstructor;
				default: string;
			};
			position: {
				type: StringConstructor;
				default: "bottom" | "top" | "right" | "left";
				validator: (value: string) => boolean;
			};
		}>, {}, {}, {
			tooltipClasses(): string[];
			isTooltipVisible(): boolean;
		}, {}, BX.Vue3.ComponentOptionsMixin, BX.Vue3.ComponentOptionsMixin, {}, string, BX.Vue3.PublicProps, Readonly<BX.Vue3.ExtractPropTypes<{
			value: {
				type: StringConstructor;
				default: string;
			};
			disabled: {
				type: BooleanConstructor;
				default: boolean;
			};
			testId: {
				type: StringConstructor;
				default: string;
			};
			tooltipClass: {
				type: StringConstructor;
				default: string;
			};
			position: {
				type: StringConstructor;
				default: "bottom" | "top" | "right" | "left";
				validator: (value: string) => boolean;
			};
		}>> & Readonly<{}>, {
			value: string;
			testId: string;
			disabled: boolean;
			tooltipClass: string;
			position: string;
		}, {}, {}, {}, string, BX.Vue3.ComponentProvideOptions, true, {}, any>;
		CallBadge: BX.Vue3.DefineComponent<BX.Vue3.ExtractPropTypes<{
			testId: {
				type: StringConstructor;
				default: null;
				required: true;
			};
			label: {
				type: (NumberConstructor | StringConstructor)[];
				default: null;
			};
			size: {
				type: StringConstructor;
				default: string;
				validator: (value: string) => boolean;
			};
			color: {
				type: StringConstructor[];
				default: string;
				validator: (value: string) => boolean;
			};
		}>, {}, {}, {
			additionalClasses(): string[];
		}, {}, BX.Vue3.ComponentOptionsMixin, BX.Vue3.ComponentOptionsMixin, {}, string, BX.Vue3.PublicProps, Readonly<BX.Vue3.ExtractPropTypes<{
			testId: {
				type: StringConstructor;
				default: null;
				required: true;
			};
			label: {
				type: (NumberConstructor | StringConstructor)[];
				default: null;
			};
			size: {
				type: StringConstructor;
				default: string;
				validator: (value: string) => boolean;
			};
			color: {
				type: StringConstructor[];
				default: string;
				validator: (value: string) => boolean;
			};
		}>> & Readonly<{}>, {
			size: string;
			testId: string;
			label: string | number;
			color: string;
		}, {}, {}, {}, string, BX.Vue3.ComponentProvideOptions, true, {}, any>;
	}, {}, string, BX.Vue3.ComponentProvideOptions, true, {}, any>;

	const CallFooterRaiseHandButton: BX.Vue3.DefineComponent<BX.Vue3.ExtractPropTypes<{
		isDesktop: {
			type: BooleanConstructor;
			default: boolean;
		};
	}>, {
		usersStore: BX.Call.Store.UsersStoreInstance;
		uiStore: BX.Call.Store.UiStoreInstance;
	}, {}, {
		isActive(): boolean;
		disabled(): boolean;
		hotkey(): BX.Call.Helper.Hotkey;
		tooltip(): string;
		testState(): string;
	}, {
		handleClick(): void;
	}, BX.Vue3.ComponentOptionsMixin, BX.Vue3.ComponentOptionsMixin, never[], never, BX.Vue3.PublicProps, Readonly<BX.Vue3.ExtractPropTypes<{
		isDesktop: {
			type: BooleanConstructor;
			default: boolean;
		};
	}>> & Readonly<{}>, {
		isDesktop: boolean;
	}, {}, {
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
			testId: string;
			testState: string;
			testMeta: string;
			label: string;
			labelPosition: string;
			disabled: boolean;
			cornerDisabled: boolean;
			readonly: boolean;
			cornerReadonly: boolean;
			square: boolean;
			hug: boolean;
			width: number;
			corner: boolean;
			circle: boolean;
			animated: boolean;
			border: boolean;
			color: string;
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
		CallTooltip: BX.Vue3.DefineComponent<BX.Vue3.ExtractPropTypes<{
			value: {
				type: StringConstructor;
				default: string;
			};
			disabled: {
				type: BooleanConstructor;
				default: boolean;
			};
			testId: {
				type: StringConstructor;
				default: string;
			};
			tooltipClass: {
				type: StringConstructor;
				default: string;
			};
			position: {
				type: StringConstructor;
				default: "bottom" | "top" | "right" | "left";
				validator: (value: string) => boolean;
			};
		}>, {}, {}, {
			tooltipClasses(): string[];
			isTooltipVisible(): boolean;
		}, {}, BX.Vue3.ComponentOptionsMixin, BX.Vue3.ComponentOptionsMixin, {}, string, BX.Vue3.PublicProps, Readonly<BX.Vue3.ExtractPropTypes<{
			value: {
				type: StringConstructor;
				default: string;
			};
			disabled: {
				type: BooleanConstructor;
				default: boolean;
			};
			testId: {
				type: StringConstructor;
				default: string;
			};
			tooltipClass: {
				type: StringConstructor;
				default: string;
			};
			position: {
				type: StringConstructor;
				default: "bottom" | "top" | "right" | "left";
				validator: (value: string) => boolean;
			};
		}>> & Readonly<{}>, {
			value: string;
			testId: string;
			disabled: boolean;
			tooltipClass: string;
			position: string;
		}, {}, {}, {}, string, BX.Vue3.ComponentProvideOptions, true, {}, any>;
	}, {}, string, BX.Vue3.ComponentProvideOptions, true, {}, any>;

	const CallFooterRecordButton: BX.Vue3.DefineComponent<BX.Vue3.ExtractPropTypes<{
		isDesktop: {
			type: BooleanConstructor;
			default: boolean;
		};
	}>, {
		recordingStore: BX.Call.Store.RecordingStoreInstance;
		uiStore: BX.Call.Store.UiStoreInstance;
	}, {}, {
		isActive(): boolean;
		disabled(): boolean;
		hotkey(): BX.Call.Helper.Hotkey;
		tooltip(): string;
		testState(): string;
	}, {
		handleClick(event: MouseEvent): void;
	}, BX.Vue3.ComponentOptionsMixin, BX.Vue3.ComponentOptionsMixin, "click"[], "click", BX.Vue3.PublicProps, Readonly<BX.Vue3.ExtractPropTypes<{
		isDesktop: {
			type: BooleanConstructor;
			default: boolean;
		};
	}>> & Readonly<{
		onClick?: ((...args: any[]) => any) | undefined;
	}>, {
		isDesktop: boolean;
	}, {}, {
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
			testId: string;
			testState: string;
			testMeta: string;
			label: string;
			labelPosition: string;
			disabled: boolean;
			cornerDisabled: boolean;
			readonly: boolean;
			cornerReadonly: boolean;
			square: boolean;
			hug: boolean;
			width: number;
			corner: boolean;
			circle: boolean;
			animated: boolean;
			border: boolean;
			color: string;
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
		CallTooltip: BX.Vue3.DefineComponent<BX.Vue3.ExtractPropTypes<{
			value: {
				type: StringConstructor;
				default: string;
			};
			disabled: {
				type: BooleanConstructor;
				default: boolean;
			};
			testId: {
				type: StringConstructor;
				default: string;
			};
			tooltipClass: {
				type: StringConstructor;
				default: string;
			};
			position: {
				type: StringConstructor;
				default: "bottom" | "top" | "right" | "left";
				validator: (value: string) => boolean;
			};
		}>, {}, {}, {
			tooltipClasses(): string[];
			isTooltipVisible(): boolean;
		}, {}, BX.Vue3.ComponentOptionsMixin, BX.Vue3.ComponentOptionsMixin, {}, string, BX.Vue3.PublicProps, Readonly<BX.Vue3.ExtractPropTypes<{
			value: {
				type: StringConstructor;
				default: string;
			};
			disabled: {
				type: BooleanConstructor;
				default: boolean;
			};
			testId: {
				type: StringConstructor;
				default: string;
			};
			tooltipClass: {
				type: StringConstructor;
				default: string;
			};
			position: {
				type: StringConstructor;
				default: "bottom" | "top" | "right" | "left";
				validator: (value: string) => boolean;
			};
		}>> & Readonly<{}>, {
			value: string;
			testId: string;
			disabled: boolean;
			tooltipClass: string;
			position: string;
		}, {}, {}, {}, string, BX.Vue3.ComponentProvideOptions, true, {}, any>;
	}, {}, string, BX.Vue3.ComponentProvideOptions, true, {}, any>;

	const CallFooterDocumentButton: BX.Vue3.DefineComponent<{}, {
		uiStore: BX.Call.Store.UiStoreInstance;
	}, {}, {
		disabled(): boolean;
	}, {
		handleClick(event: MouseEvent): void;
	}, BX.Vue3.ComponentOptionsMixin, BX.Vue3.ComponentOptionsMixin, "click"[], "click", BX.Vue3.PublicProps, Readonly<{}> & Readonly<{
		onClick?: ((...args: any[]) => any) | undefined;
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
			testId: string;
			testState: string;
			testMeta: string;
			label: string;
			labelPosition: string;
			disabled: boolean;
			cornerDisabled: boolean;
			readonly: boolean;
			cornerReadonly: boolean;
			square: boolean;
			hug: boolean;
			width: number;
			corner: boolean;
			circle: boolean;
			animated: boolean;
			border: boolean;
			color: string;
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
	}, {}, string, BX.Vue3.ComponentProvideOptions, true, {}, any>;

	const CallFooterFollowUpButton: BX.Vue3.DefineComponent<BX.Vue3.ExtractPropTypes<{
		isSoon: {
			type: BooleanConstructor;
			default: boolean;
		};
	}>, {
		uiStore: BX.Call.Store.UiStoreInstance;
	}, {}, {
		isActive(): boolean;
		disabled(): boolean;
		tooltip(): string;
		testState(): string | null;
		testMeta(): string | null;
	}, {
		handleClick(): void;
	}, BX.Vue3.ComponentOptionsMixin, BX.Vue3.ComponentOptionsMixin, never[], never, BX.Vue3.PublicProps, Readonly<BX.Vue3.ExtractPropTypes<{
		isSoon: {
			type: BooleanConstructor;
			default: boolean;
		};
	}>> & Readonly<{}>, {
		isSoon: boolean;
	}, {}, {
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
			testId: string;
			testState: string;
			testMeta: string;
			label: string;
			labelPosition: string;
			disabled: boolean;
			cornerDisabled: boolean;
			readonly: boolean;
			cornerReadonly: boolean;
			square: boolean;
			hug: boolean;
			width: number;
			corner: boolean;
			circle: boolean;
			animated: boolean;
			border: boolean;
			color: string;
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
		CallTooltip: BX.Vue3.DefineComponent<BX.Vue3.ExtractPropTypes<{
			value: {
				type: StringConstructor;
				default: string;
			};
			disabled: {
				type: BooleanConstructor;
				default: boolean;
			};
			testId: {
				type: StringConstructor;
				default: string;
			};
			tooltipClass: {
				type: StringConstructor;
				default: string;
			};
			position: {
				type: StringConstructor;
				default: "bottom" | "top" | "right" | "left";
				validator: (value: string) => boolean;
			};
		}>, {}, {}, {
			tooltipClasses(): string[];
			isTooltipVisible(): boolean;
		}, {}, BX.Vue3.ComponentOptionsMixin, BX.Vue3.ComponentOptionsMixin, {}, string, BX.Vue3.PublicProps, Readonly<BX.Vue3.ExtractPropTypes<{
			value: {
				type: StringConstructor;
				default: string;
			};
			disabled: {
				type: BooleanConstructor;
				default: boolean;
			};
			testId: {
				type: StringConstructor;
				default: string;
			};
			tooltipClass: {
				type: StringConstructor;
				default: string;
			};
			position: {
				type: StringConstructor;
				default: "bottom" | "top" | "right" | "left";
				validator: (value: string) => boolean;
			};
		}>> & Readonly<{}>, {
			value: string;
			testId: string;
			disabled: boolean;
			tooltipClass: string;
			position: string;
		}, {}, {}, {}, string, BX.Vue3.ComponentProvideOptions, true, {}, any>;
		CallBadge: BX.Vue3.DefineComponent<BX.Vue3.ExtractPropTypes<{
			testId: {
				type: StringConstructor;
				default: null;
				required: true;
			};
			label: {
				type: (NumberConstructor | StringConstructor)[];
				default: null;
			};
			size: {
				type: StringConstructor;
				default: string;
				validator: (value: string) => boolean;
			};
			color: {
				type: StringConstructor[];
				default: string;
				validator: (value: string) => boolean;
			};
		}>, {}, {}, {
			additionalClasses(): string[];
		}, {}, BX.Vue3.ComponentOptionsMixin, BX.Vue3.ComponentOptionsMixin, {}, string, BX.Vue3.PublicProps, Readonly<BX.Vue3.ExtractPropTypes<{
			testId: {
				type: StringConstructor;
				default: null;
				required: true;
			};
			label: {
				type: (NumberConstructor | StringConstructor)[];
				default: null;
			};
			size: {
				type: StringConstructor;
				default: string;
				validator: (value: string) => boolean;
			};
			color: {
				type: StringConstructor[];
				default: string;
				validator: (value: string) => boolean;
			};
		}>> & Readonly<{}>, {
			size: string;
			testId: string;
			label: string | number;
			color: string;
		}, {}, {}, {}, string, BX.Vue3.ComponentProvideOptions, true, {}, any>;
	}, {}, string, BX.Vue3.ComponentProvideOptions, true, {}, any>;

	const CallFooterMoreButton: BX.Vue3.DefineComponent<BX.Vue3.ExtractPropTypes<{
		disabled: {
			type: BooleanConstructor;
			default: boolean;
		};
		isOpen: {
			type: BooleanConstructor;
			default: boolean;
		};
	}>, {}, {}, {
		testState(): string;
	}, {
		handleClick(event: MouseEvent): void;
	}, BX.Vue3.ComponentOptionsMixin, BX.Vue3.ComponentOptionsMixin, "click"[], "click", BX.Vue3.PublicProps, Readonly<BX.Vue3.ExtractPropTypes<{
		disabled: {
			type: BooleanConstructor;
			default: boolean;
		};
		isOpen: {
			type: BooleanConstructor;
			default: boolean;
		};
	}>> & Readonly<{
		onClick?: ((...args: any[]) => any) | undefined;
	}>, {
		disabled: boolean;
		isOpen: boolean;
	}, {}, {
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
			testId: string;
			testState: string;
			testMeta: string;
			label: string;
			labelPosition: string;
			disabled: boolean;
			cornerDisabled: boolean;
			readonly: boolean;
			cornerReadonly: boolean;
			square: boolean;
			hug: boolean;
			width: number;
			corner: boolean;
			circle: boolean;
			animated: boolean;
			border: boolean;
			color: string;
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
	}, {}, string, BX.Vue3.ComponentProvideOptions, true, {}, any>;

	const CallFooterHangupButton: BX.Vue3.DefineComponent<{}, {
		uiStore: BX.Call.Store.UiStoreInstance;
	}, {}, {}, {
		handleClick(): void;
	}, BX.Vue3.ComponentOptionsMixin, BX.Vue3.ComponentOptionsMixin, never[], never, BX.Vue3.PublicProps, Readonly<{}> & Readonly<{}>, {}, {}, {
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
			testId: string;
			testState: string;
			testMeta: string;
			label: string;
			labelPosition: string;
			disabled: boolean;
			cornerDisabled: boolean;
			readonly: boolean;
			cornerReadonly: boolean;
			square: boolean;
			hug: boolean;
			width: number;
			corner: boolean;
			circle: boolean;
			animated: boolean;
			border: boolean;
			color: string;
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
	}, {}, string, BX.Vue3.ComponentProvideOptions, true, {}, any>;

	const CallFooterHangupControlButton: BX.Vue3.DefineComponent<{}, {}, {}, {}, {
		handleClick(event: MouseEvent): void;
	}, BX.Vue3.ComponentOptionsMixin, BX.Vue3.ComponentOptionsMixin, "click"[], "click", BX.Vue3.PublicProps, Readonly<{}> & Readonly<{
		onClick?: ((...args: any[]) => any) | undefined;
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
			testId: string;
			testState: string;
			testMeta: string;
			label: string;
			labelPosition: string;
			disabled: boolean;
			cornerDisabled: boolean;
			readonly: boolean;
			cornerReadonly: boolean;
			square: boolean;
			hug: boolean;
			width: number;
			corner: boolean;
			circle: boolean;
			animated: boolean;
			border: boolean;
			color: string;
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
	}, {}, string, BX.Vue3.ComponentProvideOptions, true, {}, any>;
}
