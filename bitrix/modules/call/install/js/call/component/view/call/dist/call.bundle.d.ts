/* eslint-disable */
interface LastGridConfig {
	userCount: number;
	availableWidth: number;
	availableHeight: number;
	cols: number;
	rows: number;
}

interface LayoutItem {
	x: number;
	y: number;
	width: number;
	height: number;
	userId?: number;
	isSpeaker?: boolean;
	plus?: boolean;
}

interface GridConfig {
	cols: number;
	rows: number;
	cardWidth: number;
	cardHeight: number;
	totalWidth: number;
	totalHeight: number;
}

interface QueueItem {
	userId: number;
	userName: string;
	opacity: number;
}

interface Hotkey {
	readonly action: string;
	readonly option: string;
	readonly control: string;
}

declare namespace BX.Call.Component.View {
	const CallLayout: BX.Vue3.DefineComponent<{}, {
		uiStore: BX.Call.Store.UiStoreInstance;
	}, {}, {
		uiState(): BX.Call.Store.UiState;
		isLoading(): boolean;
		isError(): boolean;
		isCopilotActive(): boolean;
	}, {}, BX.Vue3.ComponentOptionsMixin, BX.Vue3.ComponentOptionsMixin, {}, string, BX.Vue3.PublicProps, Readonly<{}> & Readonly<{}>, {}, {}, {
		CallMainLayout: BX.Vue3.DefineComponent<{}, {
			uiStore: BX.Call.Store.UiStoreInstance;
		}, {
			resizeObserver: ResizeObserver | null;
			resizeRafId: number | null;
			pendingEntry: ResizeObserverEntry | null;
			lastDimensions: {
				layoutWidth: number;
				layoutHeight: number;
				layoutContentHeight: number;
			} | null;
		}, {
			isCopilotActive(): boolean;
		}, {
			flushResize(): void;
		}, BX.Vue3.ComponentOptionsMixin, BX.Vue3.ComponentOptionsMixin, {}, string, BX.Vue3.PublicProps, Readonly<{}> & Readonly<{}>, {}, {}, {
			CallHeader: BX.Vue3.DefineComponent<{}, {
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
							default: "top" | "right" | "bottom" | "left";
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
							default: "top" | "right" | "bottom" | "left";
							validator: (value: string) => boolean;
						};
					}>> & Readonly<{}>, {
						value: string;
						position: string;
						disabled: boolean;
						testId: string;
						tooltipClass: string;
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
						circle: boolean;
						width: number;
						color: string;
						animated: boolean;
						disabled: boolean;
						testId: string;
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
						circle: boolean;
						width: number;
						color: string;
						animated: boolean;
						disabled: boolean;
						testId: string;
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
						circle: boolean;
						width: number;
						color: string;
						animated: boolean;
						disabled: boolean;
						testId: string;
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
						circle: boolean;
						width: number;
						color: string;
						animated: boolean;
						disabled: boolean;
						testId: string;
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
						circle: boolean;
						width: number;
						color: string;
						animated: boolean;
						disabled: boolean;
						testId: string;
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
			CallContent: BX.Vue3.DefineComponent<{}, {
				usersStore: import("call.store").UsersStoreInstance;
				uiStore: BX.Call.Store.UiStoreInstance;
			}, {
				page: number;
				sidebarScrollTop: number;
				lastGridConfig: LastGridConfig | null;
			}, {
				layoutWidth(): number;
				layoutHeight(): number;
				availableWidth(): number;
				availableHeight(): number;
				containerStyle(): Record<string, string>;
				speakerId(): number | null;
				isSpeakerMode(): boolean;
				userIds(): number[];
				sidebarOtherUsers(): number[];
				sidebarTotalHeight(): number;
				sidebarCanScroll(): boolean;
				sidebarMaxScroll(): number;
				sidebarVisibleRange(): {
					start: number;
					end: number;
				};
				sidebarVisibleUsers(): number[];
				showSidebarPlus(): boolean;
				maxGridUsers(): number;
				totalGridPages(): number;
				isLastGridPage(): boolean;
				canGoPrev(): boolean;
				canGoNext(): boolean;
				prevIcon(): string;
				nextIcon(): string;
				layoutItems(): LayoutItem[];
			}, {
				getGridLayout(): LayoutItem[];
				findOptimalGrid(userCount: number): GridConfig;
				tryGrid(cols: number, rows: number): GridConfig | null;
				scoreGrid(grid: GridConfig, cols: number, rows: number): number;
				createMinimumGrid(userCount: number): GridConfig;
				positionUsersInGrid(userIds: number[], grid: GridConfig): LayoutItem[];
				layoutSingleUser(userId: number): LayoutItem[];
				getSpeakerLayout(): LayoutItem[];
				handleUserSelect(userId: number): void;
				handlePrev(): void;
				handleNext(): void;
				handleSidebarWheel(event: WheelEvent): void;
				getItemKey(item: LayoutItem): string | number;
				getCardStyle(item: LayoutItem): Record<string, string>;
			}, BX.Vue3.ComponentOptionsMixin, BX.Vue3.ComponentOptionsMixin, {}, string, BX.Vue3.PublicProps, Readonly<{}> & Readonly<{}>, {}, {}, {
				CallUserCard: BX.Vue3.DefineComponent<BX.Vue3.ExtractPropTypes<{
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
					usersStore: import("call.store").UsersStoreInstance;
				}, {}, {
					user(): import("call.store").User | null;
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
					pip: boolean;
					pinned: boolean;
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
						color: string;
						testId: string;
						testState: string;
						testMeta: string;
						corner: boolean;
						speaker: boolean;
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
				CallUserCardPlus: BX.Vue3.DefineComponent<{}, {}, {}, {}, {}, BX.Vue3.ComponentOptionsMixin, BX.Vue3.ComponentOptionsMixin, {}, string, BX.Vue3.PublicProps, Readonly<{}> & Readonly<{}>, {}, {}, {
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
				CallContentHands: BX.Vue3.DefineComponent<{}, {
					usersStore: import("call.store").UsersStoreInstance;
				}, {}, {
					queueItems(): QueueItem[];
				}, {
					handleRemove(userId: number): void;
					userText(userName: string): string;
				}, BX.Vue3.ComponentOptionsMixin, BX.Vue3.ComponentOptionsMixin, {}, string, BX.Vue3.PublicProps, Readonly<{}> & Readonly<{}>, {}, {}, {
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
						color: string;
						testId: string;
						testState: string;
						testMeta: string;
						corner: boolean;
						speaker: boolean;
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
			CallFooter: BX.Vue3.DefineComponent<{}, {
				uiStore: BX.Call.Store.UiStoreInstance;
			}, {
				isMoreOpen: boolean;
			}, {
				centerButtons(): {
					key: string;
					component: object;
					threshold: number;
					props?: Record<string, unknown>;
					on?: Record<string, (...args: unknown[]) => void>;
				}[];
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
					isDesktop: boolean;
					testId: string;
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
						label: string;
						circle: boolean;
						width: number;
						color: string;
						animated: boolean;
						disabled: boolean;
						testId: string;
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
						color: string;
						animated: boolean;
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
							default: "top" | "right" | "bottom" | "left";
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
							default: "top" | "right" | "bottom" | "left";
							validator: (value: string) => boolean;
						};
					}>> & Readonly<{}>, {
						value: string;
						position: string;
						disabled: boolean;
						testId: string;
						tooltipClass: string;
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
					isDesktop: boolean;
					testId: string;
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
						label: string;
						circle: boolean;
						width: number;
						color: string;
						animated: boolean;
						disabled: boolean;
						testId: string;
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
							default: "top" | "right" | "bottom" | "left";
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
							default: "top" | "right" | "bottom" | "left";
							validator: (value: string) => boolean;
						};
					}>> & Readonly<{}>, {
						value: string;
						position: string;
						disabled: boolean;
						testId: string;
						tooltipClass: string;
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
						label: string;
						circle: boolean;
						width: number;
						color: string;
						animated: boolean;
						disabled: boolean;
						testId: string;
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
							default: "top" | "right" | "bottom" | "left";
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
							default: "top" | "right" | "bottom" | "left";
							validator: (value: string) => boolean;
						};
					}>> & Readonly<{}>, {
						value: string;
						position: string;
						disabled: boolean;
						testId: string;
						tooltipClass: string;
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
						label: string | number;
						color: string;
						testId: string;
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
						label: string;
						circle: boolean;
						width: number;
						color: string;
						animated: boolean;
						disabled: boolean;
						testId: string;
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
						label: string;
						circle: boolean;
						width: number;
						color: string;
						animated: boolean;
						disabled: boolean;
						testId: string;
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
						label: string;
						circle: boolean;
						width: number;
						color: string;
						animated: boolean;
						disabled: boolean;
						testId: string;
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
				CallFooterMorePopup: BX.Vue3.DefineComponent<{}, {}, {}, {}, {}, BX.Vue3.ComponentOptionsMixin, BX.Vue3.ComponentOptionsMixin, {}, string, BX.Vue3.PublicProps, Readonly<{}> & Readonly<{}>, {}, {}, {}, {}, string, BX.Vue3.ComponentProvideOptions, true, {}, any>;
			}, {}, string, BX.Vue3.ComponentProvideOptions, true, {}, any>;
		}, {}, string, BX.Vue3.ComponentProvideOptions, true, {}, any>;
		CallLoaderLayout: BX.Vue3.DefineComponent<{}, {
			uiStore: BX.Call.Store.UiStoreInstance;
		}, {}, {
			uiState(): BX.Call.Store.UiState;
			statusText(): string;
			testState(): string;
		}, {}, BX.Vue3.ComponentOptionsMixin, BX.Vue3.ComponentOptionsMixin, {}, string, BX.Vue3.PublicProps, Readonly<{}> & Readonly<{}>, {}, {}, {}, {}, string, BX.Vue3.ComponentProvideOptions, true, {}, any>;
		CallErrorLayout: BX.Vue3.DefineComponent<{}, {}, {}, {
			title(): string;
			message(): string;
		}, {}, BX.Vue3.ComponentOptionsMixin, BX.Vue3.ComponentOptionsMixin, {}, string, BX.Vue3.PublicProps, Readonly<{}> & Readonly<{}>, {}, {}, {
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

	const CallMainLayout: BX.Vue3.DefineComponent<{}, {
		uiStore: BX.Call.Store.UiStoreInstance;
	}, {
		resizeObserver: ResizeObserver | null;
		resizeRafId: number | null;
		pendingEntry: ResizeObserverEntry | null;
		lastDimensions: {
			layoutWidth: number;
			layoutHeight: number;
			layoutContentHeight: number;
		} | null;
	}, {
		isCopilotActive(): boolean;
	}, {
		flushResize(): void;
	}, BX.Vue3.ComponentOptionsMixin, BX.Vue3.ComponentOptionsMixin, {}, string, BX.Vue3.PublicProps, Readonly<{}> & Readonly<{}>, {}, {}, {
		CallHeader: BX.Vue3.DefineComponent<{}, {
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
						default: "top" | "right" | "bottom" | "left";
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
						default: "top" | "right" | "bottom" | "left";
						validator: (value: string) => boolean;
					};
				}>> & Readonly<{}>, {
					value: string;
					position: string;
					disabled: boolean;
					testId: string;
					tooltipClass: string;
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
					circle: boolean;
					width: number;
					color: string;
					animated: boolean;
					disabled: boolean;
					testId: string;
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
					circle: boolean;
					width: number;
					color: string;
					animated: boolean;
					disabled: boolean;
					testId: string;
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
					circle: boolean;
					width: number;
					color: string;
					animated: boolean;
					disabled: boolean;
					testId: string;
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
					circle: boolean;
					width: number;
					color: string;
					animated: boolean;
					disabled: boolean;
					testId: string;
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
					circle: boolean;
					width: number;
					color: string;
					animated: boolean;
					disabled: boolean;
					testId: string;
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
		CallContent: BX.Vue3.DefineComponent<{}, {
			usersStore: import("call.store").UsersStoreInstance;
			uiStore: BX.Call.Store.UiStoreInstance;
		}, {
			page: number;
			sidebarScrollTop: number;
			lastGridConfig: LastGridConfig | null;
		}, {
			layoutWidth(): number;
			layoutHeight(): number;
			availableWidth(): number;
			availableHeight(): number;
			containerStyle(): Record<string, string>;
			speakerId(): number | null;
			isSpeakerMode(): boolean;
			userIds(): number[];
			sidebarOtherUsers(): number[];
			sidebarTotalHeight(): number;
			sidebarCanScroll(): boolean;
			sidebarMaxScroll(): number;
			sidebarVisibleRange(): {
				start: number;
				end: number;
			};
			sidebarVisibleUsers(): number[];
			showSidebarPlus(): boolean;
			maxGridUsers(): number;
			totalGridPages(): number;
			isLastGridPage(): boolean;
			canGoPrev(): boolean;
			canGoNext(): boolean;
			prevIcon(): string;
			nextIcon(): string;
			layoutItems(): LayoutItem[];
		}, {
			getGridLayout(): LayoutItem[];
			findOptimalGrid(userCount: number): GridConfig;
			tryGrid(cols: number, rows: number): GridConfig | null;
			scoreGrid(grid: GridConfig, cols: number, rows: number): number;
			createMinimumGrid(userCount: number): GridConfig;
			positionUsersInGrid(userIds: number[], grid: GridConfig): LayoutItem[];
			layoutSingleUser(userId: number): LayoutItem[];
			getSpeakerLayout(): LayoutItem[];
			handleUserSelect(userId: number): void;
			handlePrev(): void;
			handleNext(): void;
			handleSidebarWheel(event: WheelEvent): void;
			getItemKey(item: LayoutItem): string | number;
			getCardStyle(item: LayoutItem): Record<string, string>;
		}, BX.Vue3.ComponentOptionsMixin, BX.Vue3.ComponentOptionsMixin, {}, string, BX.Vue3.PublicProps, Readonly<{}> & Readonly<{}>, {}, {}, {
			CallUserCard: BX.Vue3.DefineComponent<BX.Vue3.ExtractPropTypes<{
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
				usersStore: import("call.store").UsersStoreInstance;
			}, {}, {
				user(): import("call.store").User | null;
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
				pip: boolean;
				pinned: boolean;
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
					color: string;
					testId: string;
					testState: string;
					testMeta: string;
					corner: boolean;
					speaker: boolean;
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
			CallUserCardPlus: BX.Vue3.DefineComponent<{}, {}, {}, {}, {}, BX.Vue3.ComponentOptionsMixin, BX.Vue3.ComponentOptionsMixin, {}, string, BX.Vue3.PublicProps, Readonly<{}> & Readonly<{}>, {}, {}, {
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
			CallContentHands: BX.Vue3.DefineComponent<{}, {
				usersStore: import("call.store").UsersStoreInstance;
			}, {}, {
				queueItems(): QueueItem[];
			}, {
				handleRemove(userId: number): void;
				userText(userName: string): string;
			}, BX.Vue3.ComponentOptionsMixin, BX.Vue3.ComponentOptionsMixin, {}, string, BX.Vue3.PublicProps, Readonly<{}> & Readonly<{}>, {}, {}, {
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
					color: string;
					testId: string;
					testState: string;
					testMeta: string;
					corner: boolean;
					speaker: boolean;
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
		CallFooter: BX.Vue3.DefineComponent<{}, {
			uiStore: BX.Call.Store.UiStoreInstance;
		}, {
			isMoreOpen: boolean;
		}, {
			centerButtons(): {
				key: string;
				component: object;
				threshold: number;
				props?: Record<string, unknown>;
				on?: Record<string, (...args: unknown[]) => void>;
			}[];
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
				isDesktop: boolean;
				testId: string;
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
					label: string;
					circle: boolean;
					width: number;
					color: string;
					animated: boolean;
					disabled: boolean;
					testId: string;
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
					color: string;
					animated: boolean;
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
						default: "top" | "right" | "bottom" | "left";
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
						default: "top" | "right" | "bottom" | "left";
						validator: (value: string) => boolean;
					};
				}>> & Readonly<{}>, {
					value: string;
					position: string;
					disabled: boolean;
					testId: string;
					tooltipClass: string;
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
				isDesktop: boolean;
				testId: string;
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
					label: string;
					circle: boolean;
					width: number;
					color: string;
					animated: boolean;
					disabled: boolean;
					testId: string;
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
						default: "top" | "right" | "bottom" | "left";
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
						default: "top" | "right" | "bottom" | "left";
						validator: (value: string) => boolean;
					};
				}>> & Readonly<{}>, {
					value: string;
					position: string;
					disabled: boolean;
					testId: string;
					tooltipClass: string;
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
					label: string;
					circle: boolean;
					width: number;
					color: string;
					animated: boolean;
					disabled: boolean;
					testId: string;
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
						default: "top" | "right" | "bottom" | "left";
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
						default: "top" | "right" | "bottom" | "left";
						validator: (value: string) => boolean;
					};
				}>> & Readonly<{}>, {
					value: string;
					position: string;
					disabled: boolean;
					testId: string;
					tooltipClass: string;
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
					label: string | number;
					color: string;
					testId: string;
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
					label: string;
					circle: boolean;
					width: number;
					color: string;
					animated: boolean;
					disabled: boolean;
					testId: string;
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
					label: string;
					circle: boolean;
					width: number;
					color: string;
					animated: boolean;
					disabled: boolean;
					testId: string;
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
					label: string;
					circle: boolean;
					width: number;
					color: string;
					animated: boolean;
					disabled: boolean;
					testId: string;
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
			CallFooterMorePopup: BX.Vue3.DefineComponent<{}, {}, {}, {}, {}, BX.Vue3.ComponentOptionsMixin, BX.Vue3.ComponentOptionsMixin, {}, string, BX.Vue3.PublicProps, Readonly<{}> & Readonly<{}>, {}, {}, {}, {}, string, BX.Vue3.ComponentProvideOptions, true, {}, any>;
		}, {}, string, BX.Vue3.ComponentProvideOptions, true, {}, any>;
	}, {}, string, BX.Vue3.ComponentProvideOptions, true, {}, any>;

	const CallLoaderLayout: BX.Vue3.DefineComponent<{}, {
		uiStore: BX.Call.Store.UiStoreInstance;
	}, {}, {
		uiState(): BX.Call.Store.UiState;
		statusText(): string;
		testState(): string;
	}, {}, BX.Vue3.ComponentOptionsMixin, BX.Vue3.ComponentOptionsMixin, {}, string, BX.Vue3.PublicProps, Readonly<{}> & Readonly<{}>, {}, {}, {}, {}, string, BX.Vue3.ComponentProvideOptions, true, {}, any>;

	const CallErrorLayout: BX.Vue3.DefineComponent<{}, {}, {}, {
		title(): string;
		message(): string;
	}, {}, BX.Vue3.ComponentOptionsMixin, BX.Vue3.ComponentOptionsMixin, {}, string, BX.Vue3.PublicProps, Readonly<{}> & Readonly<{}>, {}, {}, {
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
