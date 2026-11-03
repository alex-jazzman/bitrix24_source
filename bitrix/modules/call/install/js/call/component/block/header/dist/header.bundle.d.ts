/* eslint-disable */
declare namespace BX.Call.Component.Block {
	const CallHeader: BX.Vue3.DefineComponent<{}, {
		uiStore: BX.Call.Store.UiStoreInstance;
	}, {}, {
		isGridMode(): boolean;
		isFullscreen(): boolean;
	}, {}, BX.Vue3.ComponentOptionsMixin, BX.Vue3.ComponentOptionsMixin, {}, string, BX.Vue3.PublicProps, Readonly<{}> & Readonly<{}>, {}, {}, {
		CallLogo: BX.Vue3.DefineComponent<BX.Vue3.ExtractPropTypes<{
			language: {
				type: StringConstructor;
				default: string;
				validator: (value: string) => boolean;
			};
			color: {
				type: StringConstructor;
				default: null;
				validator: (value: string | null) => boolean;
			};
		}>, {}, {}, {
			additionalClasses(): string[];
		}, {}, BX.Vue3.ComponentOptionsMixin, BX.Vue3.ComponentOptionsMixin, {}, string, BX.Vue3.PublicProps, Readonly<BX.Vue3.ExtractPropTypes<{
			language: {
				type: StringConstructor;
				default: string;
				validator: (value: string) => boolean;
			};
			color: {
				type: StringConstructor;
				default: null;
				validator: (value: string | null) => boolean;
			};
		}>> & Readonly<{}>, {
			language: string;
			color: string;
		}, {}, {}, {}, string, BX.Vue3.ComponentProvideOptions, true, {}, any>;
		CallHeaderSecurityIndicator: BX.Vue3.DefineComponent<{}, {}, {}, {}, {}, BX.Vue3.ComponentOptionsMixin, BX.Vue3.ComponentOptionsMixin, {}, string, BX.Vue3.PublicProps, Readonly<{}> & Readonly<{}>, {}, {}, {
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
					default: "right" | "left" | "top" | "bottom";
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
					default: "right" | "left" | "top" | "bottom";
					validator: (value: string) => boolean;
				};
			}>> & Readonly<{}>, {
				value: string;
				disabled: boolean;
				testId: string;
				tooltipClass: string;
				position: string;
			}, {}, {}, {}, string, BX.Vue3.ComponentProvideOptions, true, {}, any>;
		}, {}, string, BX.Vue3.ComponentProvideOptions, true, {}, any>;
		CallRecordingIndicator: BX.Vue3.DefineComponent<BX.Vue3.ExtractPropTypes<{
			time: {
				type: NumberConstructor;
				default: number;
			};
		}>, {}, {}, {
			formattedTime(): string;
		}, {}, BX.Vue3.ComponentOptionsMixin, BX.Vue3.ComponentOptionsMixin, {}, string, BX.Vue3.PublicProps, Readonly<BX.Vue3.ExtractPropTypes<{
			time: {
				type: NumberConstructor;
				default: number;
			};
		}>> & Readonly<{}>, {
			time: number;
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
		CallHeaderControlButton: BX.Vue3.DefineComponent<{}, {}, {}, {}, {
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
				label: string;
				color: string;
				animated: boolean;
				disabled: boolean;
				testId: string;
				circle: boolean;
				width: number;
				testState: string;
				testMeta: string;
				labelPosition: string;
				cornerDisabled: boolean;
				readonly: boolean;
				cornerReadonly: boolean;
				square: boolean;
				hug: boolean;
				corner: boolean;
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
		}, {}, string, BX.Vue3.ComponentProvideOptions, true, {}, any>;
		CallHeaderFullscreenButton: BX.Vue3.DefineComponent<BX.Vue3.ExtractPropTypes<{
			isFullscreen: {
				type: BooleanConstructor;
				default: boolean;
			};
		}>, {}, {}, {}, {
			handleClick(): void;
		}, BX.Vue3.ComponentOptionsMixin, BX.Vue3.ComponentOptionsMixin, never[], never, BX.Vue3.PublicProps, Readonly<BX.Vue3.ExtractPropTypes<{
			isFullscreen: {
				type: BooleanConstructor;
				default: boolean;
			};
		}>> & Readonly<{}>, {
			isFullscreen: boolean;
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
				label: string;
				color: string;
				animated: boolean;
				disabled: boolean;
				testId: string;
				circle: boolean;
				width: number;
				testState: string;
				testMeta: string;
				labelPosition: string;
				cornerDisabled: boolean;
				readonly: boolean;
				cornerReadonly: boolean;
				square: boolean;
				hug: boolean;
				corner: boolean;
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
		}, {}, string, BX.Vue3.ComponentProvideOptions, true, {}, any>;
		CallHeaderParticipantButton: BX.Vue3.DefineComponent<BX.Vue3.ExtractPropTypes<{
			isConference: {
				type: BooleanConstructor;
				default: boolean;
			};
			count: {
				type: NumberConstructor;
				default: number;
			};
		}>, {}, {}, {}, {
			handleClick(): void;
		}, BX.Vue3.ComponentOptionsMixin, BX.Vue3.ComponentOptionsMixin, never[], never, BX.Vue3.PublicProps, Readonly<BX.Vue3.ExtractPropTypes<{
			isConference: {
				type: BooleanConstructor;
				default: boolean;
			};
			count: {
				type: NumberConstructor;
				default: number;
			};
		}>> & Readonly<{}>, {
			isConference: boolean;
			count: number;
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
				label: string;
				color: string;
				animated: boolean;
				disabled: boolean;
				testId: string;
				circle: boolean;
				width: number;
				testState: string;
				testMeta: string;
				labelPosition: string;
				cornerDisabled: boolean;
				readonly: boolean;
				cornerReadonly: boolean;
				square: boolean;
				hug: boolean;
				corner: boolean;
				border: boolean;
				variant: string;
				collapsed: boolean;
			}, {}, {}, {}, string, BX.Vue3.ComponentProvideOptions, true, {}, any>;
			CallButtonSplit: BX.Vue3.DefineComponent<BX.Vue3.ExtractPropTypes<{
				testId: {
					type: StringConstructor;
					default: null;
				};
			}>, {}, {}, {}, {}, BX.Vue3.ComponentOptionsMixin, BX.Vue3.ComponentOptionsMixin, {}, string, BX.Vue3.PublicProps, Readonly<BX.Vue3.ExtractPropTypes<{
				testId: {
					type: StringConstructor;
					default: null;
				};
			}>> & Readonly<{}>, {
				testId: string;
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
		CallHeaderRateButton: BX.Vue3.DefineComponent<{}, {}, {}, {}, {
			handleClick(): void;
		}, BX.Vue3.ComponentOptionsMixin, BX.Vue3.ComponentOptionsMixin, {}, string, BX.Vue3.PublicProps, Readonly<{}> & Readonly<{}>, {}, {}, {
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
				color: string;
				animated: boolean;
				disabled: boolean;
				testId: string;
				circle: boolean;
				width: number;
				testState: string;
				testMeta: string;
				labelPosition: string;
				cornerDisabled: boolean;
				readonly: boolean;
				cornerReadonly: boolean;
				square: boolean;
				hug: boolean;
				corner: boolean;
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
		}, {}, string, BX.Vue3.ComponentProvideOptions, true, {}, any>;
		CallHeaderViewModeButton: BX.Vue3.DefineComponent<BX.Vue3.ExtractPropTypes<{
			mode: {
				type: StringConstructor;
				default: string;
			};
		}>, {}, {}, {}, {
			handleClick(): void;
		}, BX.Vue3.ComponentOptionsMixin, BX.Vue3.ComponentOptionsMixin, {}, string, BX.Vue3.PublicProps, Readonly<BX.Vue3.ExtractPropTypes<{
			mode: {
				type: StringConstructor;
				default: string;
			};
		}>> & Readonly<{}>, {
			mode: string;
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
				label: string;
				color: string;
				animated: boolean;
				disabled: boolean;
				testId: string;
				circle: boolean;
				width: number;
				testState: string;
				testMeta: string;
				labelPosition: string;
				cornerDisabled: boolean;
				readonly: boolean;
				cornerReadonly: boolean;
				square: boolean;
				hug: boolean;
				corner: boolean;
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
		}, {}, string, BX.Vue3.ComponentProvideOptions, true, {}, any>;
	}, {}, string, BX.Vue3.ComponentProvideOptions, true, {}, any>;

	const CallHeaderSecurityIndicator: BX.Vue3.DefineComponent<{}, {}, {}, {}, {}, BX.Vue3.ComponentOptionsMixin, BX.Vue3.ComponentOptionsMixin, {}, string, BX.Vue3.PublicProps, Readonly<{}> & Readonly<{}>, {}, {}, {
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
				default: "right" | "left" | "top" | "bottom";
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
				default: "right" | "left" | "top" | "bottom";
				validator: (value: string) => boolean;
			};
		}>> & Readonly<{}>, {
			value: string;
			disabled: boolean;
			testId: string;
			tooltipClass: string;
			position: string;
		}, {}, {}, {}, string, BX.Vue3.ComponentProvideOptions, true, {}, any>;
	}, {}, string, BX.Vue3.ComponentProvideOptions, true, {}, any>;
}
