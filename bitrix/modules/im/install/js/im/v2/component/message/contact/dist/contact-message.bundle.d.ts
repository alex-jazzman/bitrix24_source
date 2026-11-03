/* eslint-disable */
type JsonObject = Record<string, JsonValue>;

type JsonValue = string | number | boolean | {
	[x: string]: JsonValue;
} | Array<JsonValue>;

type ActionEvent = unknown;

type CustomCommandEvent = unknown;

type ReactionPickerOptions = {
	target: ReactionPickerTarget;
	priorityReaction?: string | undefined;
	reactions?: string[] | undefined;
	contextAction?: {
		title: string;
		onClick: (reaction: string) => void;
	} | undefined;
};

type ReactionPickerTarget = HTMLElement | {
	top: number;
	left: number;
};

type MainReactionOnboardingGeometry = {
	popoverRect: DOMRect;
	selectorRect: DOMRect;
};

type PopupOptions = {
	id?: string;
	bindElement?: PopupTarget;
	bindOptions?: PopupTargetOptions;
	offsetTop?: number;
	offsetLeft?: number;
	content?: string | Element | Node;
	closeByEsc?: boolean;
	blockBackgroundEsc?: boolean;
	buttons?: PopupButton[];
	className?: string;
	width?: number;
	height?: number;
	minWidth?: number;
	minHeight?: number;
	maxWidth?: number;
	maxHeight?: number;
	resizable?: boolean;
	padding?: number;
	contentPadding?: number;
	borderRadius?: string;
	contentBorderRadius?: string;
	background?: string;
	cacheable?: boolean;
	contentBackground?: string;
	animation?: PopupAnimationOptions;
	closeIcon?: boolean | Record<string, string | number>;
	closeIconSize?: (typeof BX.Messenger.v2.Component.Message.CloseIconSize)[keyof typeof BX.Messenger.v2.Component.Message.CloseIconSize];
	autoHide?: boolean;
	autoHideHandler?: (event: MouseEvent) => boolean;
	zIndexOptions?: BX.ZIndexComponentOptions;
	toFrontOnShow?: boolean;
	events?: {
		[eventName: string]: (event: BX.Event.BaseEvent) => void;
	};
	titleBar?: PopupTitleBar;
	angle?: boolean | {
		offset: number;
		position?: 'top' | 'bottom' | 'left' | 'right';
	};
	overlay?: boolean | PopupOverlay;
	contentColor?: string;
	draggable?: boolean | PopupDraggable;
	darkMode?: boolean;
	fixed?: boolean;
	designSystemContext?: string;
	compatibleMode?: boolean;
	bindOnResize?: boolean;
	targetContainer?: HTMLElement;
	disableScroll?: boolean;
	isScrollBlock?: boolean;
	focusTrap?: boolean | BX.UI.Accessibility.FocusTrapOptions;
	ariaLabel?: string;
	ariaLabelledBy?: string;
	ariaDescribedBy?: string;
	role?: string;
	noAllPaddings?: boolean;
	contentNoPaddings?: boolean;
};

type PopupTarget = Element | {
	left: number;
	top: number;
} | null | MouseEvent;

type PopupTargetOptions = {
	forceBindPosition?: boolean;
	forceLeft?: boolean;
	forceTop?: boolean;
	position?: 'top' | 'bottom';
};

type PopupButton = BX.Messenger.v2.Component.Message.Button | BX.UI.Button;

type PopupLegacyOptions = PopupOptions & Record<string, unknown>;

type PopupAngleOptions = {
	offset?: number;
	position?: 'top' | 'bottom' | 'left' | 'right' | 'hide';
};

type PopupTitleBar = string | Node | {
	content: string | Node;
};

type PopupDraggable = {
	restrict?: boolean;
	element?: HTMLElement;
};

type PopupOverlay = {
	backgroundColor?: string;
	opacity?: number;
	blur?: string;
};

type PopupAnimationOptions = string | boolean | {
	showClassName?: string;
	closeClassName?: string;
	closeAnimationType: string | null | undefined;
};

type ButtonOptions = {
	id?: string;
	text?: string;
	className?: string;
	events?: ButtonEvents;
};

type ButtonEvents = {
	[event: string]: (event: Event) => void;
};

type EmojiOptions = {
	name: ReactionName;
	size: number;
	animation?: EmojiAnimateOptions | undefined;
};

type EmojiAnimateOptions = {
	animate: boolean;
	infinite: boolean | null;
};

type ReactionItem = {
	id: number;
	messageId: number;
	userId: number;
	reaction: string;
	dateReaction: string;
};

type ImModelMessage<K> = unknown<K>;

type BaseButtonOptions = unknown;

type ButtonCounterOptions = unknown;

type ButtonCounterOptions = {
	color: string | null;
	style: CounterStyle | null;
	value: number | null;
	maxValue: number | null;
	useSymbolPercent?: boolean | undefined;
};

type ButtonOptions = unknown;

type SystemMenuOptions = unknown;

type ContactMessageContext = {
	item: BX.Messenger.v2.Model.ImModelMessage;
	displayedAvatarUrl: string;
	contactParams: ContactParams;
	contactName: string;
	contactPhone: string;
	contactCardLine: string;
	caption: string;
	formattedCaption: string;
	avatarTitle: string;
	avatarUrl: string;
	loc: (phraseCode: string) => string;
	$store: {
		getters: {
			'files/get': (fileId: number, withDefault?: boolean) => BX.Messenger.v2.Model.ImModelFile;
			'messages/isForward': (messageId: number | string) => boolean;
		};
	};
	$Bitrix: {
		Loc: {
			getMessage: (phraseCode: string, replacements: {
				[key: string]: string;
			}) => string;
		};
	};
};

type ContactParams = {
	firstName?: string;
	lastName?: string;
	phones?: string[];
};

declare namespace BX.Messenger.v2.Component.Message {
	const ContactMessage: {
		name: string;
		components: {
			BaseMessage: {
				name: string;
				components: {
					ContextMenu: BX.Vue3.DefineComponent<BX.Vue3.ExtractPropTypes<{
						dialogId: {
							type: StringConstructor;
							required: true;
						};
						message: {
							type: BX.Vue3.PropType<BX.Messenger.v2.Model.ImModelMessage>;
							required: true;
						};
						showContextMenu: {
							type: BooleanConstructor;
							default: boolean;
						};
					}>, {}, {}, {
						menuTitle(): string;
						messageItem(): BX.Messenger.v2.Model.ImModelMessage;
						canShowContextMenu(): boolean;
						isBulkActionsMode(): boolean;
					}, {
						onMenuClick(event: PointerEvent): void;
						getEmitter(): import("../../../../../../../../../main/install/js/main/core/events/src/events").EventEmitter;
					}, BX.Vue3.ComponentOptionsMixin, BX.Vue3.ComponentOptionsMixin, {}, string, BX.Vue3.PublicProps, Readonly<BX.Vue3.ExtractPropTypes<{
						dialogId: {
							type: StringConstructor;
							required: true;
						};
						message: {
							type: BX.Vue3.PropType<BX.Messenger.v2.Model.ImModelMessage>;
							required: true;
						};
						showContextMenu: {
							type: BooleanConstructor;
							default: boolean;
						};
					}>> & Readonly<{}>, {
						showContextMenu: boolean;
					}, {}, {}, {}, string, BX.Vue3.ComponentProvideOptions, true, {}, any>;
					RetryButton: BX.Vue3.DefineComponent<BX.Vue3.ExtractPropTypes<{
						message: {
							type: BX.Vue3.PropType<BX.Messenger.v2.Model.ImModelMessage>;
							required: true;
						};
						dialogId: {
							type: StringConstructor;
							required: true;
						};
					}>, {
						contextMenu: BX.Messenger.v2.Component.Message.RetryContextMenu | null;
					}, {}, {
						messageItem(): BX.Messenger.v2.Model.ImModelMessage;
						menuTitle(): string;
					}, {
						onClick(event: MouseEvent): void;
					}, BX.Vue3.ComponentOptionsMixin, BX.Vue3.ComponentOptionsMixin, {}, string, BX.Vue3.PublicProps, Readonly<BX.Vue3.ExtractPropTypes<{
						message: {
							type: BX.Vue3.PropType<BX.Messenger.v2.Model.ImModelMessage>;
							required: true;
						};
						dialogId: {
							type: StringConstructor;
							required: true;
						};
					}>> & Readonly<{}>, {}, {}, {}, {}, string, BX.Vue3.ComponentProvideOptions, true, {}, any>;
					MessageKeyboard: BX.Vue3.DefineComponent<BX.Vue3.ExtractPropTypes<{
						item: {
							type: BX.Vue3.PropType<BX.Messenger.v2.Model.ImModelMessage>;
							required: true;
						};
						dialogId: {
							type: StringConstructor;
							required: true;
						};
					}>, {}, {}, {
						message(): BX.Messenger.v2.Model.ImModelMessage;
						dialog(): import("im.v2.model").ImModelChat;
						user(): import("im.v2.model").ImModelUser;
					}, {}, BX.Vue3.ComponentOptionsMixin, BX.Vue3.ComponentOptionsMixin, "click"[], "click", BX.Vue3.PublicProps, Readonly<BX.Vue3.ExtractPropTypes<{
						item: {
							type: BX.Vue3.PropType<BX.Messenger.v2.Model.ImModelMessage>;
							required: true;
						};
						dialogId: {
							type: StringConstructor;
							required: true;
						};
					}>> & Readonly<{
						onClick?: ((...args: any[]) => any) | undefined;
					}>, {}, {}, {
						Keyboard: {
							props: {
								buttons: {
									type: ArrayConstructor;
									required: boolean;
								};
								dialogId: {
									type: StringConstructor;
									required: boolean;
								};
								messageId: {
									type: (NumberConstructor | StringConstructor)[];
									required: boolean;
								};
							};
							components: {
								KeyboardButton: {
									name: string;
									props: {
										config: {
											type: ObjectConstructor;
											required: boolean;
										};
										keyboardBlocked: {
											type: BooleanConstructor;
											required: boolean;
										};
									};
									emits: string[];
									data(): JsonObject;
									computed: {
										button(): import("im.v2.const").KeyboardButtonConfig;
										commonAttributes(): {
											class: string[];
											style: {
												width?: string;
												backgroundColor?: string;
											};
										};
										buttonClasses(): string[];
										buttonStyles(): {
											width?: string;
											backgroundColor?: string;
										};
										preparedLink(): string;
									};
									methods: {
										onClick(event: PointerEvent): void;
										handleAction(): void;
										handleCustomCommand(): void;
									};
									template: string;
								};
								KeyboardSeparator: {
									name: string;
									data(): JsonObject;
									template: string;
								};
							};
							data(): JsonObject;
							emits: string[];
							watch: {
								buttons(): void;
							};
							computed: {
								ButtonType: () => {
									button: string;
									newLine: string;
								};
								preparedButtons(): import("im.v2.const").KeyboardButtonConfig[];
							};
							methods: {
								onButtonActionClick(event: import("../../../elements/keyboard/src/types/events").ActionEvent): void;
								onButtonCustomCommandClick(event: import("../../../elements/keyboard/src/types/events").CustomCommandEvent): void;
								getActionManager(): BX.Messenger.v2.Component.Message.ActionManager;
								getBotService(): BX.Messenger.v2.Component.Message.BotService;
								getEmitter(): import("../../../../../../../../../main/install/js/main/core/events/src/events").EventEmitter;
							};
							template: string;
						};
					}, {}, string, BX.Vue3.ComponentProvideOptions, true, {}, any>;
					ReactionSelector: BX.Vue3.DefineComponent<BX.Vue3.ExtractPropTypes<{
						messageId: {
							type: (NumberConstructor | StringConstructor)[];
							required: true;
						};
					}>, {
						picker: BX.Messenger.v2.Component.Message.ReactionPicker | null;
						showTimeout: number;
						hideTimeout: number;
					}, {
						mainReactionOnboardingGeometry: MainReactionOnboardingGeometry | null;
					}, {
						message(): BX.Messenger.v2.Model.ImModelMessage;
						dialog(): import("im.v2.model").ImModelChat;
						currentReaction(): string;
						isChatWithBot(): boolean;
						areBotReactionsEnabled(): boolean;
						hasError(): boolean;
						isRealMessage(): boolean;
						canSetReactions(): boolean;
						canSetReactionsByRole(): boolean;
					}, {
						loc(phraseCode: string): string;
						startShowTimer(): void;
						clearShowTimer(): void;
						showSelector(): void;
						setMainReaction(reaction: string): Promise<void>;
						subscribeToSelectorEvents(): void;
						onSelectorSelect(selectEvent: import("../../../../../../../../../main/install/js/main/core/events/src/events").BaseEvent): void;
						onSelectorExpand(): void;
						onSelectorHide(): void;
						startHideTimer(): void;
						clearHideTimer(): void;
						onIconClick(): void;
						getEmitter(): import("../../../../../../../../../main/install/js/main/core/events/src/events").EventEmitter;
					}, BX.Vue3.ComponentOptionsMixin, BX.Vue3.ComponentOptionsMixin, {}, string, BX.Vue3.PublicProps, Readonly<BX.Vue3.ExtractPropTypes<{
						messageId: {
							type: (NumberConstructor | StringConstructor)[];
							required: true;
						};
					}>> & Readonly<{}>, {}, {}, {
						MainReactionOnboarding: BX.Vue3.DefineComponent<BX.Vue3.ExtractPropTypes<{
							geometry: {
								type: BX.Vue3.PropType<MainReactionOnboardingGeometry | null>;
								default: null;
							};
							messageId: {
								type: (NumberConstructor | StringConstructor)[];
								required: true;
							};
						}>, {}, {
							isClosed: boolean;
							isDisplayConfirmed: boolean;
						}, {
							closeIcon(): string;
							isVisible(): boolean;
							popupId(): string;
							position(): "top" | "bottom";
							width(): number;
							config(): PopupOptions;
						}, {
							confirmDisplay(): Promise<void>;
							close(): void;
							complete(): void;
							loc(phraseCode: string): string;
						}, BX.Vue3.ComponentOptionsMixin, BX.Vue3.ComponentOptionsMixin, ("mouseEnter" | "mouseLeave")[], "mouseEnter" | "mouseLeave", BX.Vue3.PublicProps, Readonly<BX.Vue3.ExtractPropTypes<{
							geometry: {
								type: BX.Vue3.PropType<MainReactionOnboardingGeometry | null>;
								default: null;
							};
							messageId: {
								type: (NumberConstructor | StringConstructor)[];
								required: true;
							};
						}>> & Readonly<{
							onMouseEnter?: ((...args: any[]) => any) | undefined;
							onMouseLeave?: ((...args: any[]) => any) | undefined;
						}>, {
							geometry: MainReactionOnboardingGeometry | null;
						}, {}, {
							MessengerPopup: typeof import("../../../elements/popup/src/popup").MessengerPopup;
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
						Reaction: {
							emits: string[];
							props: {
								name: {
									required: boolean;
									type: StringConstructor;
									validator: (value: string) => boolean;
								};
								size: {
									type: NumberConstructor;
									required: boolean;
									default: number;
								};
								animate: {
									type: BooleanConstructor;
									required: boolean;
									default: boolean;
								};
								infiniteAnimate: {
									type: BooleanConstructor;
									required: boolean;
									default: boolean;
								};
							};
							data(): {
								reaction: BX.Messenger.v2.Component.Message.Reaction | null;
							};
							watch: {
								animate(newValue: any): void;
								infiniteAnimate(newValue: any): void;
								size(newSize: any): void;
							};
							mounted(): void;
							unmounted(): void;
							methods: {
								playAnimation(): void;
								pauseAnimation(): void;
							};
							template: string;
						};
					}, {}, string, BX.Vue3.ComponentProvideOptions, true, {}, any>;
				};
				props: {
					item: {
						type: ObjectConstructor;
						required: boolean;
					};
					dialogId: {
						type: StringConstructor;
						required: boolean;
					};
					withBackground: {
						type: BooleanConstructor;
						default: boolean;
					};
					withContextMenu: {
						type: BooleanConstructor;
						default: boolean;
					};
					withReactions: {
						type: BooleanConstructor;
						default: boolean;
					};
					withRetryButton: {
						type: BooleanConstructor;
						default: boolean;
					};
					afterMessageWidthLimit: {
						type: BooleanConstructor;
						default: boolean;
					};
					withError: {
						type: BooleanConstructor;
						default: boolean;
					};
				};
				computed: {
					dialog(): import("im.v2.model").ImModelChat;
					message(): BX.Messenger.v2.Model.ImModelMessage;
					isSystemMessage(): boolean;
					isSelfMessage(): boolean;
					isOpponentMessage(): boolean;
					isChannelPost(): boolean;
					isBulkActionsMode(): boolean;
					isMessageSelected(): boolean;
					showMessageAngle(): boolean;
					containerClasses(): {
						[className: string]: boolean;
					};
					shouldForceBackground(): boolean;
					bodyClasses(): {
						[className: string]: boolean;
					};
					isTransparentBackground(): boolean;
					showRetryButton(): boolean;
					showContextMenu(): boolean;
					canOpenContextMenu(): boolean;
					hasError(): boolean;
					hasSendError(): boolean;
				};
				methods: {
					onContainerClick(event: PointerEvent): void;
					openContextMenu(event: PointerEvent & {
						target: HTMLElement;
					}): void;
					onMessageMouseUp(message: BX.Messenger.v2.Model.ImModelMessage, event: MouseEvent): Promise<void>;
					hasSelectedText(): boolean;
					getEmitter(): import("../../../../../../../../../main/install/js/main/core/events/src/events").EventEmitter;
				};
				template: string;
			};
			BaseUiAvatar: {
				props: {
					type: {
						type: StringConstructor;
						required: boolean;
						validator(value: any): boolean;
					};
					avatarClass: {
						type: FunctionConstructor;
						default: null;
					};
					size: {
						type: StringConstructor;
						default: "M";
					};
					url: {
						type: StringConstructor;
						default: string;
					};
					title: {
						type: StringConstructor;
						default: string;
					};
					backgroundColor: {
						type: StringConstructor;
						default: string;
					};
					withDefaultUserpic: {
						type: BooleanConstructor;
						default: boolean;
					};
				};
				emits: string[];
				data(): Object;
				computed: {
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
					isAirDesignEnabled(): boolean;
					calculatedSize(): number;
				};
				watch: {
					type(): void;
					avatarClass(): void;
					title(): void;
					url(): void;
					backgroundColor(): void;
				};
				created(): void;
				mounted(): void;
				beforeUnmount(): void;
				methods: {
					initAvatarClass(): void;
					renderAvatar(): void;
					setAvatarImage(): void;
					handleAvatarImageLoad(): void;
					handleAvatarImageError(): void;
					setImageDisplayState(isDisplayed: boolean): void;
					unbindAvatarImageEvents(): void;
					setBackgroundColor(): void;
					updateAvatarType(): void;
				};
				template: string;
			};
			DefaultMessageContent: BX.Vue3.DefineComponent<BX.Vue3.ExtractPropTypes<{
				item: {
					type: BX.Vue3.PropType<BX.Messenger.v2.Model.ImModelMessage>;
					required: true;
				};
				dialogId: {
					type: StringConstructor;
					required: true;
				};
				withMessageStatus: {
					type: BooleanConstructor;
					default: boolean;
				};
				withText: {
					type: BooleanConstructor;
					default: boolean;
				};
				withAttach: {
					type: BooleanConstructor;
					default: boolean;
				};
				withReply: {
					type: BooleanConstructor;
					default: boolean;
				};
				withBuilder: {
					type: BooleanConstructor;
					default: boolean;
				};
				withReactions: {
					type: BooleanConstructor;
					default: boolean;
				};
			}>, {}, {}, {
				message(): BX.Messenger.v2.Model.ImModelMessage;
				isReply(): boolean;
				formattedText(): string;
				canSetReactions(): boolean;
				isForward(): boolean;
				hasBuilderBlocks(): boolean;
			}, {}, BX.Vue3.ComponentOptionsMixin, BX.Vue3.ComponentOptionsMixin, {}, string, BX.Vue3.PublicProps, Readonly<BX.Vue3.ExtractPropTypes<{
				item: {
					type: BX.Vue3.PropType<BX.Messenger.v2.Model.ImModelMessage>;
					required: true;
				};
				dialogId: {
					type: StringConstructor;
					required: true;
				};
				withMessageStatus: {
					type: BooleanConstructor;
					default: boolean;
				};
				withText: {
					type: BooleanConstructor;
					default: boolean;
				};
				withAttach: {
					type: BooleanConstructor;
					default: boolean;
				};
				withReply: {
					type: BooleanConstructor;
					default: boolean;
				};
				withBuilder: {
					type: BooleanConstructor;
					default: boolean;
				};
				withReactions: {
					type: BooleanConstructor;
					default: boolean;
				};
			}>> & Readonly<{}>, {
				withMessageStatus: boolean;
				withText: boolean;
				withAttach: boolean;
				withReply: boolean;
				withBuilder: boolean;
				withReactions: boolean;
			}, {}, {
				MessageStatus: BX.Vue3.DefineComponent<BX.Vue3.ExtractPropTypes<{
					item: {
						type: BX.Vue3.PropType<BX.Messenger.v2.Model.ImModelMessage>;
						required: true;
					};
					isOverlay: {
						type: BooleanConstructor;
						default: boolean;
					};
				}>, {}, {}, {
					message(): BX.Messenger.v2.Model.ImModelMessage;
					formattedDate(): string;
					isSelfMessage(): boolean;
					isNotDelivered(): boolean;
					messageStatus(): $Values<typeof import("im.v2.const").OwnMessageStatus>;
				}, {
					loc(phraseCode: string): string;
				}, BX.Vue3.ComponentOptionsMixin, BX.Vue3.ComponentOptionsMixin, {}, string, BX.Vue3.PublicProps, Readonly<BX.Vue3.ExtractPropTypes<{
					item: {
						type: BX.Vue3.PropType<BX.Messenger.v2.Model.ImModelMessage>;
						required: true;
					};
					isOverlay: {
						type: BooleanConstructor;
						default: boolean;
					};
				}>> & Readonly<{}>, {
					isOverlay: boolean;
				}, {}, {}, {}, string, BX.Vue3.ComponentProvideOptions, true, {}, any>;
				MessageAttach: BX.Vue3.DefineComponent<BX.Vue3.ExtractPropTypes<{
					item: {
						type: BX.Vue3.PropType<BX.Messenger.v2.Model.ImModelMessage>;
						required: true;
					};
					dialogId: {
						type: StringConstructor;
						required: true;
					};
				}>, {}, {}, {
					dialog(): import("im.v2.model").ImModelChat;
					user(): import("im.v2.model").ImModelUser;
					dialogColor(): string;
				}, {}, BX.Vue3.ComponentOptionsMixin, BX.Vue3.ComponentOptionsMixin, {}, string, BX.Vue3.PublicProps, Readonly<BX.Vue3.ExtractPropTypes<{
					item: {
						type: BX.Vue3.PropType<BX.Messenger.v2.Model.ImModelMessage>;
						required: true;
					};
					dialogId: {
						type: StringConstructor;
						required: true;
					};
				}>> & Readonly<{}>, {}, {}, {
					Attach: {
						name: string;
						components: {
							AttachDelimiter: {
								name: string;
								props: {
									config: {
										type: ObjectConstructor;
										default: () => void;
									};
								};
								computed: {
									internalConfig(): import("im.v2.const").AttachDelimiterConfig;
									styles(): Object;
								};
								template: string;
							};
							AttachFile: {
								name: string;
								components: {
									AttachFileItem: {
										name: string;
										props: {
											config: {
												type: ObjectConstructor;
												default: () => void;
											};
										};
										computed: {
											internalConfig(): import("im.v2.const").AttachFileItemConfig;
											fileName(): string | null;
											fileSize(): number | null;
											link(): string;
											fileShortName(): string;
											formattedFileSize(): string;
											iconClasses(): string[];
											fileIcon(): string;
										};
										methods: {
											openLink(): void;
										};
										template: string;
									};
								};
								props: {
									config: {
										type: ObjectConstructor;
										default: () => void;
									};
								};
								computed: {
									internalConfig(): import("im.v2.const").AttachFileConfig;
								};
								template: string;
							};
							AttachGrid: {
								name: string;
								components: {
									AttachGridItem: {
										name: string;
										props: {
											config: {
												type: ObjectConstructor;
												default: () => void;
											};
										};
										computed: {
											DisplayType: () => {
												block: string;
												line: string;
												row: string;
											};
											internalConfig(): import("im.v2.const").AttachGridItemConfig;
											display(): $Values<{
												block: string;
												line: string;
												row: string;
											}>;
											width(): string;
											value(): string;
											colorToken(): string;
											name(): string;
											link(): string;
										};
										template: string;
									};
								};
								props: {
									config: {
										type: ObjectConstructor;
										default: () => void;
									};
								};
								computed: {
									internalConfig(): import("im.v2.const").AttachGridConfig;
								};
								template: string;
							};
							AttachHtml: {
								props: {
									config: {
										type: ObjectConstructor;
										default: () => void;
									};
								};
								computed: {
									internalConfig(): import("im.v2.const").AttachHtmlConfig;
									html(): string;
								};
								template: string;
							};
							AttachImage: {
								name: string;
								components: {
									AttachImageItem: {
										name: string;
										directives: {
											lazyload: {
												beforeMount(element: any, bindings: any): void;
												updated(element: any): void;
												unmounted(element: any): void;
											};
										};
										props: {
											config: {
												type: ObjectConstructor;
												default: () => void;
											};
										};
										computed: {
											internalConfig(): import("im.v2.const").AttachImageItemConfig;
											width(): number;
											height(): number;
											link(): string;
											name(): string;
											preview(): string;
											source(): string;
											imageSize(): JsonObject;
											hasWidth(): boolean;
										};
										methods: {
											open(): void;
											lazyLoadCallback(event: {
												element: HTMLElement;
												state: string;
											}): void;
										};
										template: string;
									};
								};
								props: {
									config: {
										type: ObjectConstructor;
										default: () => void;
									};
								};
								computed: {
									internalConfig(): import("im.v2.const").AttachImageConfig;
								};
								template: string;
							};
							AttachLink: {
								name: string;
								components: {
									AttachLinkItem: {
										name: string;
										components: {
											AttachImage: {
												name: string;
												components: {
													AttachImageItem: {
														name: string;
														directives: {
															lazyload: {
																beforeMount(element: any, bindings: any): void;
																updated(element: any): void;
																unmounted(element: any): void;
															};
														};
														props: {
															config: {
																type: ObjectConstructor;
																default: () => void;
															};
														};
														computed: {
															internalConfig(): import("im.v2.const").AttachImageItemConfig;
															width(): number;
															height(): number;
															link(): string;
															name(): string;
															preview(): string;
															source(): string;
															imageSize(): JsonObject;
															hasWidth(): boolean;
														};
														methods: {
															open(): void;
															lazyLoadCallback(event: {
																element: HTMLElement;
																state: string;
															}): void;
														};
														template: string;
													};
												};
												props: {
													config: {
														type: ObjectConstructor;
														default: () => void;
													};
												};
												computed: {
													internalConfig(): import("im.v2.const").AttachImageConfig;
												};
												template: string;
											};
										};
										props: {
											config: {
												type: ObjectConstructor;
												default: () => void;
											};
										};
										computed: {
											internalConfig(): import("im.v2.const").AttachLinkItemConfig;
											link(): string;
											name(): string;
											description(): string;
											html(): string;
											preview(): string;
											imageConfig(): import("im.v2.const").AttachImageConfig;
										};
										template: string;
									};
								};
								props: {
									config: {
										type: ObjectConstructor;
										default: () => void;
									};
								};
								computed: {
									internalConfig(): import("im.v2.const").AttachLinkConfig;
								};
								template: string;
							};
							AttachMessage: {
								name: string;
								props: {
									config: {
										type: ObjectConstructor;
										default: () => void;
									};
								};
								computed: {
									internalConfig(): import("im.v2.const").AttachMessageConfig;
									message(): string;
								};
								template: string;
							};
							AttachRich: {
								components: {
									AttachRichItem: {
										name: string;
										components: {
											AttachImage: {
												name: string;
												components: {
													AttachImageItem: {
														name: string;
														directives: {
															lazyload: {
																beforeMount(element: any, bindings: any): void;
																updated(element: any): void;
																unmounted(element: any): void;
															};
														};
														props: {
															config: {
																type: ObjectConstructor;
																default: () => void;
															};
														};
														computed: {
															internalConfig(): import("im.v2.const").AttachImageItemConfig;
															width(): number;
															height(): number;
															link(): string;
															name(): string;
															preview(): string;
															source(): string;
															imageSize(): JsonObject;
															hasWidth(): boolean;
														};
														methods: {
															open(): void;
															lazyLoadCallback(event: {
																element: HTMLElement;
																state: string;
															}): void;
														};
														template: string;
													};
												};
												props: {
													config: {
														type: ObjectConstructor;
														default: () => void;
													};
												};
												computed: {
													internalConfig(): import("im.v2.const").AttachImageConfig;
												};
												template: string;
											};
										};
										inject: string[];
										props: {
											config: {
												type: ObjectConstructor;
												default: () => void;
											};
											attachId: {
												type: StringConstructor;
												required: boolean;
											};
										};
										computed: {
											internalConfig(): import("im.v2.const").AttachRichItemConfig;
											link(): string;
											name(): string;
											description(): string;
											html(): string;
											preview(): string;
											previewSize(): {
												width: number;
												height: number;
											};
											imageConfig(): import("im.v2.const").AttachImageConfig;
											canShowDeleteIcon(): boolean;
											deleteRichLinkTitle(): string;
											imageStyles(): {
												width: string;
												height: string;
											} | {
												width?: undefined;
												height?: undefined;
											};
										};
										methods: {
											openLink(): void;
											deleteRichLink(): void;
										};
										template: string;
									};
								};
								props: {
									config: {
										type: ObjectConstructor;
										default: () => void;
									};
									attachId: {
										type: StringConstructor;
										required: boolean;
									};
								};
								computed: {
									internalConfig(): import("im.v2.const").AttachRichConfig;
								};
								template: string;
							};
							AttachUser: {
								name: string;
								components: {
									AttachUserItem: {
										name: string;
										directives: {
											lazyload: {
												beforeMount(element: any, bindings: any): void;
												updated(element: any): void;
												unmounted(element: any): void;
											};
										};
										props: {
											config: {
												type: ObjectConstructor;
												default: () => void;
											};
										};
										computed: {
											internalConfig(): import("im.v2.const").AttachUserItemConfig;
											name(): string;
											avatar(): string;
											avatarType(): string;
											link(): string;
											avatarTypeClass(): string[] | string;
										};
										template: string;
									};
								};
								props: {
									config: {
										type: ObjectConstructor;
										default: () => void;
									};
								};
								computed: {
									internalConfig(): import("im.v2.const").AttachUserConfig;
								};
								template: string;
							};
						};
						props: {
							config: {
								type: ObjectConstructor;
								default: () => void;
							};
						};
						computed: {
							internalConfig(): import("im.v2.const").AttachConfig;
							blocks(): import("im.v2.const").AttachConfigBlock[];
							colorToken(): string;
						};
						methods: {
							getComponentForBlock(block: import("im.v2.const").AttachConfigBlock): import("ui.vue3").BitrixVueComponentProps | "";
						};
						template: string;
					};
				}, {}, string, BX.Vue3.ComponentProvideOptions, true, {}, any>;
				ReactionList: BX.Vue3.DefineComponent<BX.Vue3.ExtractPropTypes<{
					messageId: {
						type: (NumberConstructor | StringConstructor)[];
						required: true;
					};
				}>, {
					reactionService: BX.Messenger.v2.Component.Message.ReactionService | null;
				}, {
					reactionsToAnimate: Set<string>;
				}, {
					message(): BX.Messenger.v2.Model.ImModelMessage;
					dialog(): import("im.v2.model").ImModelChat;
					reactionsData(): import("im.v2.model").ImModelReactions;
					reactionCounters(): {
						[key: string]: number;
					};
					ownReactions(): Set<string>;
					reactionListToShow(): string[];
					needToShowReactionsContainer(): boolean;
					isChannel(): boolean;
					showAvatars(): boolean;
				}, {
					onReactionClick(reaction: string): void;
					onPickerReactionSelected(event: import("../../../../../../../../../main/install/js/main/core/events/src/events").BaseEvent<{
						messageId: number;
						reaction: string;
					}>): Promise<void>;
					getReactionUsers(reaction: string): number[];
					getReactionService(): BX.Messenger.v2.Component.Message.ReactionService;
					getEmitter(): import("../../../../../../../../../main/install/js/main/core/events/src/events").EventEmitter;
				}, BX.Vue3.ComponentOptionsMixin, BX.Vue3.ComponentOptionsMixin, {}, string, BX.Vue3.PublicProps, Readonly<BX.Vue3.ExtractPropTypes<{
					messageId: {
						type: (NumberConstructor | StringConstructor)[];
						required: true;
					};
				}>> & Readonly<{}>, {}, {}, {
					ReactionItem: BX.Vue3.DefineComponent<BX.Vue3.ExtractPropTypes<{
						messageId: {
							type: (NumberConstructor | StringConstructor)[];
							required: true;
						};
						type: {
							type: StringConstructor;
							required: true;
						};
						counter: {
							type: NumberConstructor;
							required: true;
						};
						users: {
							type: BX.Vue3.PropType<number[]>;
							required: true;
						};
						selected: {
							type: BooleanConstructor;
							required: true;
						};
						animate: {
							type: BooleanConstructor;
							required: true;
						};
						showAvatars: {
							type: BooleanConstructor;
							required: false;
							default: boolean;
						};
					}>, {
						showUsersTimeout: number;
					}, {
						showAdditionalUsers: boolean;
					}, {
						REACTION_SIZE: () => 16;
						needToShowUsers(): boolean;
						preparedUsers(): number[];
					}, {
						startShowUsersTimer(): void;
						clearShowUsersTimer(): void;
						onClick(): void;
					}, BX.Vue3.ComponentOptionsMixin, BX.Vue3.ComponentOptionsMixin, ("click" | "animationFinish")[], "click" | "animationFinish", BX.Vue3.PublicProps, Readonly<BX.Vue3.ExtractPropTypes<{
						messageId: {
							type: (NumberConstructor | StringConstructor)[];
							required: true;
						};
						type: {
							type: StringConstructor;
							required: true;
						};
						counter: {
							type: NumberConstructor;
							required: true;
						};
						users: {
							type: BX.Vue3.PropType<number[]>;
							required: true;
						};
						selected: {
							type: BooleanConstructor;
							required: true;
						};
						animate: {
							type: BooleanConstructor;
							required: true;
						};
						showAvatars: {
							type: BooleanConstructor;
							required: false;
							default: boolean;
						};
					}>> & Readonly<{
						onClick?: ((...args: any[]) => any) | undefined;
						onAnimationFinish?: ((...args: any[]) => any) | undefined;
					}>, {
						showAvatars: boolean;
					}, {}, {
						ReactionUser: BX.Messenger.v2.Component.Message.ReactionUser;
						AdditionalUsers: BX.Messenger.v2.Component.Message.AdditionalUsers;
						Reaction: typeof import("../../../../../../../../../ui/install/js/ui/reaction/item/src/vue").Reaction;
					}, {}, string, BX.Vue3.ComponentProvideOptions, true, {}, any>;
				}, {}, string, BX.Vue3.ComponentProvideOptions, true, {}, any>;
				Reply: BX.Vue3.DefineComponent<BX.Vue3.ExtractPropTypes<{
					dialogId: {
						type: StringConstructor;
						required: true;
					};
					replyId: {
						type: NumberConstructor;
						required: true;
					};
					isForward: {
						type: BooleanConstructor;
						default: boolean;
					};
				}>, {}, {
					isExpanded: boolean;
					isExpandable: boolean;
				}, {
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
					dialog(): import("im.v2.model").ImModelChat;
					replyMessage(): BX.Messenger.v2.Model.ImModelMessage | null | undefined;
					replyMessageChat(): import("im.v2.model").ImModelChat | null | undefined;
					replyAuthor(): import("im.v2.model").ImModelUser | null | undefined;
					replyTitle(): string;
					messageFiles(): BX.Messenger.v2.Model.ImModelFile[];
					messageFile(): BX.Messenger.v2.Model.ImModelFile | null | undefined;
					contactAvatarTitle(): string;
					contactAvatarUrl(): string;
					isImage(): boolean;
					isVideo(): boolean;
					isVideoNote(): boolean;
					isFile(): boolean;
					isAudio(): boolean;
					isSticker(): boolean;
					stickerImageUri(): string | null;
					galleryCount(): number;
					galleryThumbnails(): BX.Messenger.v2.Model.ImModelFile[];
					galleryRemainingCount(): number;
					galleryStackModifier(): string;
					isGallery(): boolean;
					showGalleryStack(): boolean;
					mediaCountText(): string;
					showIcon(): boolean;
					truncatedFileName(): string;
					iconClass(): string;
					fileSize(): string;
					isMessageDeleted(): boolean;
					replyText(): string;
					isQuoteFromTheSameChat(): boolean;
					replyContext(): string;
					canShowReply(): boolean;
					isActiveQuote(): boolean;
					quoteClasses(): Record<string, boolean>;
					toggleLabel(): string;
					isUnavailable(): boolean;
					hasOriginal(): boolean;
					isDeleted(): boolean;
					showMediaPreview(): boolean;
					useCompactContactLayout(): boolean;
					isContactMessage(): boolean;
					showVideoNoteTypeLabel(): boolean;
					previewText(): string;
				}, {
					toggleExpanded(): void;
					updateToggleAvailability(): Promise<void>;
					hasSelectedText(): boolean;
					hasPreview(file: BX.Messenger.v2.Model.ImModelFile): boolean;
					onQuoteClick(event: MouseEvent): void;
					onNavigateToOriginal(): void;
					onQuoteKeydown(event: KeyboardEvent): void;
					loc(phraseCode: string): string;
				}, BX.Vue3.ComponentOptionsMixin, BX.Vue3.ComponentOptionsMixin, {}, string, BX.Vue3.PublicProps, Readonly<BX.Vue3.ExtractPropTypes<{
					dialogId: {
						type: StringConstructor;
						required: true;
					};
					replyId: {
						type: NumberConstructor;
						required: true;
					};
					isForward: {
						type: BooleanConstructor;
						default: boolean;
					};
				}>> & Readonly<{}>, {
					isForward: boolean;
				}, {}, {
					BaseUiAvatar: {
						props: {
							type: {
								type: StringConstructor;
								required: boolean;
								validator(value: any): boolean;
							};
							avatarClass: {
								type: FunctionConstructor;
								default: null;
							};
							size: {
								type: StringConstructor;
								default: "M";
							};
							url: {
								type: StringConstructor;
								default: string;
							};
							title: {
								type: StringConstructor;
								default: string;
							};
							backgroundColor: {
								type: StringConstructor;
								default: string;
							};
							withDefaultUserpic: {
								type: BooleanConstructor;
								default: boolean;
							};
						};
						emits: string[];
						data(): Object;
						computed: {
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
							isAirDesignEnabled(): boolean;
							calculatedSize(): number;
						};
						watch: {
							type(): void;
							avatarClass(): void;
							title(): void;
							url(): void;
							backgroundColor(): void;
						};
						created(): void;
						mounted(): void;
						beforeUnmount(): void;
						methods: {
							initAvatarClass(): void;
							renderAvatar(): void;
							setAvatarImage(): void;
							handleAvatarImageLoad(): void;
							handleAvatarImageError(): void;
							setImageDisplayState(isDisplayed: boolean): void;
							unbindAvatarImageEvents(): void;
							setBackgroundColor(): void;
							updateAvatarType(): void;
						};
						template: string;
					};
				}, {}, string, BX.Vue3.ComponentProvideOptions, true, {}, any>;
				TextContent: BX.Vue3.DefineComponent<BX.Vue3.ExtractPropTypes<{
					text: {
						type: StringConstructor;
						required: true;
					};
				}>, {}, {}, {}, {}, BX.Vue3.ComponentOptionsMixin, BX.Vue3.ComponentOptionsMixin, {}, string, BX.Vue3.PublicProps, Readonly<BX.Vue3.ExtractPropTypes<{
					text: {
						type: StringConstructor;
						required: true;
					};
				}>> & Readonly<{}>, {}, {}, {}, {}, string, BX.Vue3.ComponentProvideOptions, true, {}, any>;
				BuilderContent: BX.Vue3.DefineComponent<BX.Vue3.ExtractPropTypes<{
					item: {
						type: BX.Vue3.PropType<BX.Messenger.v2.Model.ImModelMessage>;
						required: true;
					};
					dialogId: {
						type: StringConstructor;
						required: true;
					};
				}>, {}, {}, {
					message(): BX.Messenger.v2.Model.ImModelMessage;
					messageBlocks(): Array<{
						id: string;
						type: string;
						text: string;
					}>;
					hasBlocks(): boolean;
					maxWidthStyles(): {
						maxWidth?: string;
					};
				}, {
					getComponentNameByType(type: string): BX.Vue3.Component | string;
				}, BX.Vue3.ComponentOptionsMixin, BX.Vue3.ComponentOptionsMixin, {}, string, BX.Vue3.PublicProps, Readonly<BX.Vue3.ExtractPropTypes<{
					item: {
						type: BX.Vue3.PropType<BX.Messenger.v2.Model.ImModelMessage>;
						required: true;
					};
					dialogId: {
						type: StringConstructor;
						required: true;
					};
				}>> & Readonly<{}>, {}, {}, {
					SourceListButton: typeof import("im.v2.component.message.elements").SourceListButton;
					CardBlock: BX.Messenger.v2.Component.Message.CardBlock;
				}, {}, string, BX.Vue3.ComponentProvideOptions, true, {}, any>;
			}, {}, string, BX.Vue3.ComponentProvideOptions, true, {}, any>;
			MessageFooter: BX.Vue3.DefineComponent<BX.Vue3.ExtractPropTypes<{
				item: {
					type: BX.Vue3.PropType<BX.Messenger.v2.Model.ImModelMessage>;
					required: true;
				};
				dialogId: {
					type: StringConstructor;
					required: true;
				};
			}>, {}, JsonObject, {
				dialog(): import("im.v2.model").ImModelChat;
				message(): BX.Messenger.v2.Model.ImModelMessage;
				isChannelPost(): boolean;
				isSystemMessage(): boolean;
				showCommentsPanel(): boolean;
			}, {}, BX.Vue3.ComponentOptionsMixin, BX.Vue3.ComponentOptionsMixin, {}, string, BX.Vue3.PublicProps, Readonly<BX.Vue3.ExtractPropTypes<{
				item: {
					type: BX.Vue3.PropType<BX.Messenger.v2.Model.ImModelMessage>;
					required: true;
				};
				dialogId: {
					type: StringConstructor;
					required: true;
				};
			}>> & Readonly<{}>, {}, {}, {
				CommentsPanel: BX.Vue3.DefineComponent<BX.Vue3.ExtractPropTypes<{
					item: {
						type: BX.Vue3.PropType<BX.Messenger.v2.Model.ImModelMessage>;
						required: true;
					};
					dialogId: {
						type: StringConstructor;
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
					dialog(): import("im.v2.model").ImModelChat;
					message(): BX.Messenger.v2.Model.ImModelMessage;
					commentInfo(): import("im.v2.model").ImModelCommentInfo;
					commentsChatId(): number;
					commentsCount(): number;
					commentsCountText(): string;
					noComments(): boolean;
					lastUsers(): import("im.v2.model").ImModelUser[];
					unreadCount(): string;
					isSubscribed(): boolean;
					showSubscribeIcon(): boolean;
					subscribeIconTitle(): string;
					isRealMessage(): boolean;
				}, {
					onCommentsClick(): void;
					onSubscribeIconClick(): void;
					getEmitter(): import("../../../../../../../../../main/install/js/main/core/events/src/events").EventEmitter;
					loc(phraseCode: string): string;
				}, BX.Vue3.ComponentOptionsMixin, BX.Vue3.ComponentOptionsMixin, {}, string, BX.Vue3.PublicProps, Readonly<BX.Vue3.ExtractPropTypes<{
					item: {
						type: BX.Vue3.PropType<BX.Messenger.v2.Model.ImModelMessage>;
						required: true;
					};
					dialogId: {
						type: StringConstructor;
						required: true;
					};
				}>> & Readonly<{}>, {}, {}, {
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
					FadeAnimation: {
						name: string;
						props: {
							duration: {
								type: NumberConstructor;
								default: number;
							};
						};
						emits: string[];
						computed: {
							formattedDuration(): string;
						};
						methods: {
							setDuration(element: HTMLElement): void;
							clearDuration(element: HTMLElement): void;
							onAfterEnter(element: HTMLElement): void;
						};
						template: string;
					};
				}, {}, string, BX.Vue3.ComponentProvideOptions, true, {}, any>;
			}, {}, string, BX.Vue3.ComponentProvideOptions, true, {}, any>;
			MessageHeader: BX.Vue3.DefineComponent<BX.Vue3.ExtractPropTypes<{
				item: {
					type: BX.Vue3.PropType<BX.Messenger.v2.Model.ImModelMessage>;
					required: true;
				};
				withTitle: {
					type: BooleanConstructor;
					default: boolean;
				};
				isOverlay: {
					type: BooleanConstructor;
					default: boolean;
				};
			}>, {}, {}, {
				OutlineIcons(): BX.Messenger.v2.Component.Message.Outline;
				Color: () => Readonly<{
					base: "#17a3ea";
					transparent: "transparent";
					white: "#fff";
					gray40: "#bdc1c6";
					gray90: "#525c69";
					collab70: "#00a94e";
					collab60: "#19cc45";
					collab50: "#6be860";
					collab10: "#f2fee2";
					orange50: "#ffa900";
					orangeExtra: "#e88c02";
					accentBlue: "#00ace3";
					accentExtraAqua: "#37C5D8";
					accentMainPrimaryAlt: "#1f86ff";
					accentSoftBorderBlue: "#88c8f8";
					accentMainSuccess: "#1bce7b";
					accentMainSuccessAlt: "#00a659";
					base4: "#a8adb4";
					blue60: "#11a9d9";
				}>;
				FORWARD_ICON_SIZE: () => 20;
				message(): BX.Messenger.v2.Model.ImModelMessage;
				forwardAuthorId(): number;
				forwardContextId(): string;
				isForwarded(): boolean;
				isChannelForward(): boolean;
				isDiscussionForward(): boolean;
				isCommentsForwardParent(): boolean;
				forwardParentName(): string | null;
				forwardAuthorName(): string;
				forwardChatName(): string;
				isSystemMessage(): boolean;
				isSystemAuthor(): boolean;
				shouldShowAuthorTitle(): boolean;
				forwardAuthorTitle(): string;
				forwardDiscussionNoNamePhraseCode(): string;
				forwardDiscussionTitle(): string;
				forwardChannelTitle(): string;
				iconColor(): string;
			}, {
				onForwardClick(): void;
				getEmitter(): import("../../../../../../../../../main/install/js/main/core/events/src/events").EventEmitter;
				loc(phraseCode: string): string;
			}, BX.Vue3.ComponentOptionsMixin, BX.Vue3.ComponentOptionsMixin, {}, string, BX.Vue3.PublicProps, Readonly<BX.Vue3.ExtractPropTypes<{
				item: {
					type: BX.Vue3.PropType<BX.Messenger.v2.Model.ImModelMessage>;
					required: true;
				};
				withTitle: {
					type: BooleanConstructor;
					default: boolean;
				};
				isOverlay: {
					type: BooleanConstructor;
					default: boolean;
				};
			}>> & Readonly<{}>, {
				isOverlay: boolean;
				withTitle: boolean;
			}, {}, {
				AuthorTitle: typeof import("im.v2.component.message.elements").AuthorTitle;
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
			Reply: BX.Vue3.DefineComponent<BX.Vue3.ExtractPropTypes<{
				dialogId: {
					type: StringConstructor;
					required: true;
				};
				replyId: {
					type: NumberConstructor;
					required: true;
				};
				isForward: {
					type: BooleanConstructor;
					default: boolean;
				};
			}>, {}, {
				isExpanded: boolean;
				isExpandable: boolean;
			}, {
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
				dialog(): import("im.v2.model").ImModelChat;
				replyMessage(): BX.Messenger.v2.Model.ImModelMessage | null | undefined;
				replyMessageChat(): import("im.v2.model").ImModelChat | null | undefined;
				replyAuthor(): import("im.v2.model").ImModelUser | null | undefined;
				replyTitle(): string;
				messageFiles(): BX.Messenger.v2.Model.ImModelFile[];
				messageFile(): BX.Messenger.v2.Model.ImModelFile | null | undefined;
				contactAvatarTitle(): string;
				contactAvatarUrl(): string;
				isImage(): boolean;
				isVideo(): boolean;
				isVideoNote(): boolean;
				isFile(): boolean;
				isAudio(): boolean;
				isSticker(): boolean;
				stickerImageUri(): string | null;
				galleryCount(): number;
				galleryThumbnails(): BX.Messenger.v2.Model.ImModelFile[];
				galleryRemainingCount(): number;
				galleryStackModifier(): string;
				isGallery(): boolean;
				showGalleryStack(): boolean;
				mediaCountText(): string;
				showIcon(): boolean;
				truncatedFileName(): string;
				iconClass(): string;
				fileSize(): string;
				isMessageDeleted(): boolean;
				replyText(): string;
				isQuoteFromTheSameChat(): boolean;
				replyContext(): string;
				canShowReply(): boolean;
				isActiveQuote(): boolean;
				quoteClasses(): Record<string, boolean>;
				toggleLabel(): string;
				isUnavailable(): boolean;
				hasOriginal(): boolean;
				isDeleted(): boolean;
				showMediaPreview(): boolean;
				useCompactContactLayout(): boolean;
				isContactMessage(): boolean;
				showVideoNoteTypeLabel(): boolean;
				previewText(): string;
			}, {
				toggleExpanded(): void;
				updateToggleAvailability(): Promise<void>;
				hasSelectedText(): boolean;
				hasPreview(file: BX.Messenger.v2.Model.ImModelFile): boolean;
				onQuoteClick(event: MouseEvent): void;
				onNavigateToOriginal(): void;
				onQuoteKeydown(event: KeyboardEvent): void;
				loc(phraseCode: string): string;
			}, BX.Vue3.ComponentOptionsMixin, BX.Vue3.ComponentOptionsMixin, {}, string, BX.Vue3.PublicProps, Readonly<BX.Vue3.ExtractPropTypes<{
				dialogId: {
					type: StringConstructor;
					required: true;
				};
				replyId: {
					type: NumberConstructor;
					required: true;
				};
				isForward: {
					type: BooleanConstructor;
					default: boolean;
				};
			}>> & Readonly<{}>, {
				isForward: boolean;
			}, {}, {
				BaseUiAvatar: {
					props: {
						type: {
							type: StringConstructor;
							required: boolean;
							validator(value: any): boolean;
						};
						avatarClass: {
							type: FunctionConstructor;
							default: null;
						};
						size: {
							type: StringConstructor;
							default: "M";
						};
						url: {
							type: StringConstructor;
							default: string;
						};
						title: {
							type: StringConstructor;
							default: string;
						};
						backgroundColor: {
							type: StringConstructor;
							default: string;
						};
						withDefaultUserpic: {
							type: BooleanConstructor;
							default: boolean;
						};
					};
					emits: string[];
					data(): Object;
					computed: {
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
						isAirDesignEnabled(): boolean;
						calculatedSize(): number;
					};
					watch: {
						type(): void;
						avatarClass(): void;
						title(): void;
						url(): void;
						backgroundColor(): void;
					};
					created(): void;
					mounted(): void;
					beforeUnmount(): void;
					methods: {
						initAvatarClass(): void;
						renderAvatar(): void;
						setAvatarImage(): void;
						handleAvatarImageLoad(): void;
						handleAvatarImageError(): void;
						setImageDisplayState(isDisplayed: boolean): void;
						unbindAvatarImageEvents(): void;
						setBackgroundColor(): void;
						updateAvatarType(): void;
					};
					template: string;
				};
			}, {}, string, BX.Vue3.ComponentProvideOptions, true, {}, any>;
			TextContent: BX.Vue3.DefineComponent<BX.Vue3.ExtractPropTypes<{
				text: {
					type: StringConstructor;
					required: true;
				};
			}>, {}, {}, {}, {}, BX.Vue3.ComponentOptionsMixin, BX.Vue3.ComponentOptionsMixin, {}, string, BX.Vue3.PublicProps, Readonly<BX.Vue3.ExtractPropTypes<{
				text: {
					type: StringConstructor;
					required: true;
				};
			}>> & Readonly<{}>, {}, {}, {}, {}, string, BX.Vue3.ComponentProvideOptions, true, {}, any>;
		};
		directives: {
			lazyload: {
				beforeMount(element: any, bindings: any): void;
				updated(element: any): void;
				unmounted(element: any): void;
			};
		};
		props: {
			item: {
				type: ObjectConstructor;
				required: boolean;
			};
			dialogId: {
				type: StringConstructor;
				required: boolean;
			};
			withTitle: {
				type: BooleanConstructor;
				default: boolean;
			};
		};
		data(): Object;
		computed: {
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
			contactParams(this: ContactMessageContext): ContactParams;
			contactName(this: ContactMessageContext): string;
			contactPhone(this: ContactMessageContext): string;
			contactCardLine(this: ContactMessageContext): string;
			caption(this: ContactMessageContext): string;
			formattedCaption(this: ContactMessageContext): string;
			isReply(this: ContactMessageContext): boolean;
			isForward(this: ContactMessageContext): boolean;
			avatarTitle(this: ContactMessageContext): string;
			avatarUrl(this: ContactMessageContext): string;
			cardAriaLabel(this: ContactMessageContext): string;
			nameAccessibilityLabel(this: ContactMessageContext): string;
			phoneAccessibilityLabel(this: ContactMessageContext): string;
		};
		methods: {
			handleAvatarLazyLoad(this: ContactMessageContext, event: {
				element: HTMLImageElement;
				state: "success" | "error";
			}): void;
			loc(this: ContactMessageContext, phraseCode: string): string;
		};
		template: string;
	};

	class EventEmitter {
		[key: symbol]: any;
		static GLOBAL_TARGET: {
			GLOBAL_TARGET: string;
		};
		static DEFAULT_MAX_LISTENERS: number;
		/** @private */
		static sequenceValue: number;
		constructor(...args: any[]);
		/**
		 * Makes a target observable
		 * @param {object} target
		 * @param {string} namespace
		 */
		static makeObservable(target: any, namespace: string): void;
		setEventNamespace(namespace: any): void;
		getEventNamespace(): string | null;
		/**
		 * Subscribes listener on specified global event
		 * @param {object} target
		 * @param {string} eventName
		 * @param {Function<BaseEvent>} listener
		 * @param {object} options
		 */
		static subscribe(target: any, eventName: any, listener?: any, options?: any): void;
		/**
		 * Subscribes a listener on a specified event
		 * @param {string} eventName
		 * @param {Function<BaseEvent>} listener
		 * @return {this}
		 */
		subscribe(eventName: string, listener: (event: BaseEvent) => void): this;
		/**
		 *
		 * @param {object} options
		 * @param {object} [aliases]
		 * @param {boolean} [compatMode=false]
		 */
		subscribeFromOptions(options: {
			[eventName: string]: Function;
		} | Array<{
			[eventName: string]: Function;
		}>, aliases?: {
			[alias: string]: {
				eventName: string;
				namespace: string;
			};
		}, compatMode?: boolean): void;
		/**
		 * Subscribes a listener that is called at
		 * most once for a specified event.
		 * @param {object} target
		 * @param {string} eventName
		 * @param {Function<BaseEvent>} listener
		 */
		static subscribeOnce(target: any, eventName: any, listener?: any): void;
		/**
		 * Subscribes a listener that is called at most once for a specified event.
		 * @param {string} eventName
		 * @param {Function<BaseEvent>} listener
		 * @return {this}
		 */
		subscribeOnce(eventName: string, listener: (event: BaseEvent) => void): this;
		/**
		 * Unsubscribes an event listener
		 * @param {object} target
		 * @param {string} eventName
		 * @param {Function<BaseEvent>} listener
		 * @param options
		 */
		static unsubscribe(target: any, eventName: any, listener?: any, options?: any): void;
		/**
		 * Unsubscribes an event listener
		 * @param {string} eventName
		 * @param {Function<BaseEvent>} listener
		 * @return {this}
		 */
		unsubscribe(eventName: string, listener: (event: BaseEvent) => void): this;
		/**
		 * Unsubscribes all event listeners
		 * @param {object} target
		 * @param {string} eventName
		 * @param options
		 */
		static unsubscribeAll(target: any, eventName?: any, options?: any): void;
		/**
		 * Unsubscribes all event listeners
		 * @param {string} [eventName]
		 */
		unsubscribeAll(eventName?: string): void;
		/**
		 *
		 * @param {object} target
		 * @param {string} eventName
		 * @param {BaseEvent | any} event
		 * @param {object} options
		 * @returns {Array}
		 */
		static emit(target: any, eventName?: any, event?: any, options?: any): Array<any>;
		/**
		 * Emits specified event with specified event object
		 * @param {string} eventName
		 * @param {BaseEvent | any} event
		 * @return {this}
		 */
		emit(eventName: string, event?: BaseEvent | {
			[key: string]: any;
		}): this;
		/**
		 * Emits global event and returns a promise that is resolved when
		 * all promise returned from event handlers are resolved,
		 * or rejected when at least one of the returned promise is rejected.
		 * Importantly. You can return any value from synchronous handlers, not just promise
		 * @param {object} target
		 * @param {string} eventName
		 * @param {BaseEvent | any} event
		 * @return {Promise<Array>}
		 */
		static emitAsync(target: any, eventName?: any, event?: any): Promise<Array<any>>;
		/**
		 * Emits event and returns a promise that is resolved when
		 * all promise returned from event handlers are resolved,
		 * or rejected when at least one of the returned promise is rejected.
		 * Importantly. You can return any value from synchronous handlers, not just promise
		 * @param {string} eventName
		 * @param {BaseEvent|any} event
		 * @return {Promise<Array>}
		 */
		emitAsync(eventName: string, event?: BaseEvent | {
			[key: string]: any;
		}): Promise<Array<any>>;
		/**
		 * @private
		 * @param {object} target
		 * @param {string} eventName
		 * @param {BaseEvent|any} event
		 * @returns {BaseEvent}
		 */
		static prepareEvent(target: any, eventName: string, event?: BaseEvent | {
			[key: string]: any;
		}): BaseEvent;
		/**
		 * @private
		 * @returns {number}
		 */
		static getNextSequenceValue(): number;
		/**
		 * Sets max global events listeners count
		 * Event.EventEmitter.setMaxListeners(10) - sets the default value for all events (global target)
		 * Event.EventEmitter.setMaxListeners("onClose", 10) - sets the value for onClose event (global target)
		 * Event.EventEmitter.setMaxListeners(obj, 10) - sets the default value for all events (obj target)
		 * Event.EventEmitter.setMaxListeners(obj, "onClose", 10); - sets the value for onClose event (obj target)
		 * @return {void}
		 * @param args
		 */
		static setMaxListeners(...args: any[]): void;
		/**
		 * Sets max events listeners count
		 * this.setMaxListeners(10) - sets the default value for all events
		 * this.setMaxListeners("onClose", 10) sets the value for onClose event
		 * @return {this}
		 * @param args
		 */
		setMaxListeners(...args: any[]): this;
		/**
		 * Returns max event listeners count
		 * @param {object} target
		 * @param {string} [eventName]
		 * @returns {number}
		 */
		static getMaxListeners(target: any, eventName?: string): number;
		/**
		 * Returns max event listeners count
		 * @param {string} [eventName]
		 * @returns {number}
		 */
		getMaxListeners(eventName?: string): number;
		/**
		 * Adds or subtracts max listeners count
		 * Event.EventEmitter.addMaxListeners() - adds one max listener for all events of global target
		 * Event.EventEmitter.addMaxListeners(3) - adds three max listeners for all events of global target
		 * Event.EventEmitter.addMaxListeners(-1) - subtracts one max listener for all events of global target
		 * Event.EventEmitter.addMaxListeners('onClose') - adds one max listener for onClose event of global target
		 * Event.EventEmitter.addMaxListeners('onClose', 2) - adds two max listeners for onClose event of global target
		 * Event.EventEmitter.addMaxListeners('onClose', -1) - subtracts one max listener for onClose event of global target
		 *
		 * Event.EventEmitter.addMaxListeners(obj) - adds one max listener for all events of 'obj' target
		 * Event.EventEmitter.addMaxListeners(obj, 3) - adds three max listeners for all events of 'obj' target
		 * Event.EventEmitter.addMaxListeners(obj, -1) - subtracts one max listener for all events of 'obj' target
		 * Event.EventEmitter.addMaxListeners(obj, 'onClose') - adds one max listener for onClose event of 'obj' target
		 * Event.EventEmitter.addMaxListeners(obj, 'onClose', 2) - adds two max listeners for onClose event of 'obj' target
		 * Event.EventEmitter.addMaxListeners(obj, 'onClose', -1) - subtracts one max listener
		 *   for onClose event of 'obj' target
		 * @param args
		 * @returns {number}
		 */
		static addMaxListeners(...args: any[]): number;
		/**
		 * Increases max listeners count
		 *
		 * Event.EventEmitter.incrementMaxListeners() - adds one max listener for all events of global target
		 * Event.EventEmitter.incrementMaxListeners(3) - adds three max listeners for all events of global target
		 * Event.EventEmitter.incrementMaxListeners('onClose') - adds one max listener for onClose event of global target
		 * Event.EventEmitter.incrementMaxListeners('onClose', 2) - adds two max listeners for onClose event of global target
		 *
		 * Event.EventEmitter.incrementMaxListeners(obj) - adds one max listener for all events of 'obj' target
		 * Event.EventEmitter.incrementMaxListeners(obj, 3) - adds three max listeners for all events of 'obj' target
		 * Event.EventEmitter.incrementMaxListeners(obj, 'onClose') - adds one max listener for onClose event of 'obj' target
		 * Event.EventEmitter.incrementMaxListeners(obj, 'onClose', 2) - adds two max listeners
		 *   for onClose event of 'obj' target
		 */
		static incrementMaxListeners(...args: any[]): number;
		/**
		 * Increases max listeners count
		 * this.incrementMaxListeners() - adds one max listener for all events
		 * this.incrementMaxListeners(3) - adds three max listeners for all events
		 * this.incrementMaxListeners('onClose') - adds one max listener for onClose event
		 * this.incrementMaxListeners('onClose', 2) - adds two max listeners for onClose event
		 */
		incrementMaxListeners(...args: any[]): number;
		/**
		 * Decreases max listeners count
		 *
		 * Event.EventEmitter.decrementMaxListeners() - subtracts one max listener for all events of global target
		 * Event.EventEmitter.decrementMaxListeners(3) - subtracts three max listeners for all events of global target
		 * Event.EventEmitter.decrementMaxListeners('onClose') - subtracts one max listener for onClose event of global target
		 * Event.EventEmitter.decrementMaxListeners('onClose', 2) - subtracts two max listeners
		 *   for onClose event of global target
		 *
		 * Event.EventEmitter.decrementMaxListeners(obj) - subtracts one max listener
		 *   for all events of 'obj' target
		 * Event.EventEmitter.decrementMaxListeners(obj, 3) - subtracts three max listeners
		 *   for all events of 'obj' target
		 * Event.EventEmitter.decrementMaxListeners(obj, 'onClose') - subtracts one max listener
		 *   for onClose event of 'obj' target
		 * Event.EventEmitter.decrementMaxListeners(obj, 'onClose', 2) - subtracts two max listeners
		 *   for onClose event of 'obj' target
		 */
		static decrementMaxListeners(...args: any[]): number;
		/**
		 * Increases max listeners count
		 * this.decrementMaxListeners() - subtracts one max listener for all events
		 * this.decrementMaxListeners(3) - subtracts three max listeners for all events
		 * this.decrementMaxListeners('onClose') - subtracts one max listener for onClose event
		 * this.decrementMaxListeners('onClose', 2) - subtracts two max listeners for onClose event
		 */
		decrementMaxListeners(...args: any[]): number;
		/**
		 * @private
		 * @param {Array} args
		 * @returns Array
		 */
		static destructMaxListenersArgs(...args: any[]): any[];
		/**
		 * Gets listeners list for a specified event
		 * @param {object} target
		 * @param {string} eventName
		 */
		static getListeners(target: any, eventName?: any): Map<any, any>;
		/**
		 * Gets listeners list for specified event
		 * @param {string} eventName
		 */
		getListeners(eventName: string): Map<any, any>;
		/**
		 * Returns a full event name with namespace
		 * @param {string} eventName
		 * @returns {string}
		 */
		getFullEventName(eventName: string): string;
		/**
		 * Registers aliases (old event names for BX.onCustomEvent)
		 * @param aliases
		 */
		static registerAliases(aliases: any): void;
		/**
		 * @private
		 * @param aliases
		 */
		static normalizeAliases(aliases: any): Record<string, any>;
		/**
		 * @private
		 */
		static mergeEventAliases(aliases: Record<string, any>): void;
		/**
		 * Returns true if the target is an instance of Event.EventEmitter
		 * @param {object} target
		 * @returns {boolean}
		 */
		static isEventEmitter(target: any): boolean;
		/**
		 * @private
		 * @param {string} eventName
		 * @returns {string}
		 */
		static normalizeEventName(eventName: string): string;
		/**
		 * @private
		 */
		static normalizeListener(listener: any): Function;
		/**
		 * @private
		 * @param eventName
		 * @param target
		 * @param useGlobalNaming
		 * @returns {string}
		 */
		static resolveEventName(eventName: string, target: any, useGlobalNaming?: boolean): string;
		/**
		 * @private
		 * @param {string} namespace
		 * @param {string} eventName
		 * @returns {string}
		 */
		static makeFullEventName(namespace: string | null, eventName: string): string;
	}

	/**
	 * Implements base event object interface
	 */
	class BaseEvent<DataType = any> {
		type: string;
		data: DataType | null;
		target: any;
		compatData: Array<any> | null;
		defaultPrevented: boolean;
		immediatePropagationStopped: boolean;
		errors: Array<BaseError>;
		constructor(options?: {
			data?: any;
			compatData?: Array<any>;
		});
		static create(options: any): BaseEvent;
		/**
		 * Returns the name of the event
		 * @returns {string}
		 */
		getType(): string;
		/**
		 *
		 * @param {string} type
		 */
		setType(type: string): this;
		/**
		 * Returns an event data
		 */
		getData(): DataType | null;
		/**
		 * Sets an event data
		 * @param data
		 */
		setData(data: any): this;
		/**
		 * Returns arguments for BX.addCustomEvent handlers (deprecated).
		 * @returns {array | null}
		 */
		getCompatData(): Array<any> | null;
		/**
		 * Sets arguments for BX.addCustomEvent handlers (deprecated)
		 * @param data
		 */
		setCompatData(data: any): this;
		/**
		 * Sets a event target
		 * @param target
		 */
		setTarget(target: any): this;
		/**
		 * Returns a event target
		 */
		getTarget(): any;
		/**
		 * Returns an array of event errors
		 * @returns {[]}
		 */
		getErrors(): Array<BaseError>;
		/**
		 * Adds an error of the event.
		 * Event listeners can prevent emitter's default action and set the reason of this behavior.
		 * @param error
		 */
		setError(error: BaseError): void;
		/**
		 * Prevents default action
		 */
		preventDefault(): void;
		/**
		 * Checks that is default action prevented
		 * @return {boolean}
		 */
		isDefaultPrevented(): boolean;
		/**
		 * Stops event immediate propagation
		 */
		stopImmediatePropagation(): void;
		/**
		 * Checks that is immediate propagation stopped
		 * @return {boolean}
		 */
		isImmediatePropagationStopped(): boolean;
	}

	/**
	 * @memberOf BX
	 */
	class BaseError {
		[isError]: boolean;
		message: string;
		code: string | null;
		customData: unknown;
		constructor(message?: string, code?: string, customData?: unknown);
		/**
		 * Returns a brief description of the error
		 * @returns {string}
		 */
		getMessage(): string;
		/**
		 * Sets a message of the error
		 * @param {string} message
		 * @returns {this}
		 */
		setMessage(message?: string): this;
		/**
		 * Returns a code of the error
		 * @returns {?string}
		 */
		getCode(): string | null;
		/**
		 * Sets a code of the error
		 * @param {string} code
		 * @returns {this}
		 */
		setCode(code?: string | null): this;
		/**
		 * Returns custom data of the error
		 * @returns {null|*}
		 */
		getCustomData(): unknown;
		/**
		 * Sets custom data of the error
		 * @returns {this}
		 */
		setCustomData(customData: unknown): this;
		toString(): string;
		/**
		 * Returns true if the object is an instance of BaseError
		 * @param error
		 * @returns {boolean}
		 */
		static isError(error: unknown): error is BaseError;
	}

	const isError: unique symbol;

	class RetryContextMenu extends BX.Messenger.v2.Lib.BaseMenu {
		context: BX.Messenger.v2.Model.ImModelMessage & {
			dialogId: string;
		};
		constructor();
		getMenuItems(): BX.UI.System.MenuItemOptions[] | null[];
		getRetryItem(): BX.UI.System.MenuItemOptions | null;
		getDeleteItem(): BX.UI.System.MenuItemOptions | null | undefined;
	}

	class ActionManager {
		constructor(payload: {
			dialogId: string;
			context: BX.Messenger.v2.Const.ApplicationContext;
		});
		handleAction(event: ActionEvent): void;
	}

	class BotService {
		constructor(params: {
			messageId: string | number;
			dialogId: string;
		});
		sendCommand(event: CustomCommandEvent): void;
	}

	class ReactionPicker extends BX.Event.EventEmitter {
		static "__#private@#rowSize": number;
		static "__#private@#minHeight": number;
		static "__#private@#offsetBetweenTargetElement": number;
		/**
		 * `aria-expanded` is only honoured on an element whose role supports it, and an element no
		 * keyboard can reach is not a control to report a state of. The public contract takes any
		 * element - an owner may hang the picker on a plain div - and on one of those the states are
		 * left unwritten rather than written where nothing reads them.
		 */
		static "__#private@#menuStateTargetSelector": string;
		constructor(options: ReactionPickerOptions);
		show(options?: {
			focus?: boolean;
		}): void;
		focus(): void;
		hide(): void;
		/**
		 * Tears the picker down at once, for an owner that goes away without hiding it first: the
		 * popover of an orphaned picker keeps its focus trap, and a trap left behind takes over the
		 * Tab navigation of the whole page.
		 */
		destroy(): void;
		isShown(): boolean;
		adjustPosition(): void;
		getPopoverRect(): DOMRect | null;
	}

	/**
	 * @memberOf BX.Main.Popup
	 * @deprecated use BX.UI.Button
	 */
	class Button {
		popupWindow: Popup | null;
		params: ButtonOptions;
		text: string;
		id: string;
		className: string;
		events: ButtonEvents;
		contextEvents: ButtonEvents;
		buttonNode: HTMLElement;
		constructor(params: ButtonOptions);
		render(): Element;
		getId(): string;
		getContainer(): Element;
		getName(): string;
		setName(name: string): void;
		setClassName(className: string): void;
		addClassName(className: string): void;
		removeClassName(className: string): void;
	}

	/**
	 * @memberof BX.Main
	 */
	class Popup extends BX.Event.EventEmitter {
		private static options;
		private static fullscreenStatus;
		private static defaultOptions;
		static setOptions(options: Record<string, string | number>): void;
		static getOption(option: string, defaultValue?: string | number | null): string | number | null | undefined;
		private readonly compatibleMode;
		private params;
		private uniquePopupId;
		private buttons;
		private offsetTop;
		private offsetLeft;
		private firstShow;
		private bordersWidth;
		private bindElementPos;
		private bindElement;
		private closeIcon;
		private resizeIcon;
		private angle;
		private angleArrowElement;
		private overlay;
		private overlayTimeout;
		private titleBar;
		private bindOptions;
		private autoHide;
		private disableScroll;
		private autoHideHandler;
		private isAutoHideBound;
		private closeByEsc;
		private blockBackgroundEsc;
		private isCloseByEscBound;
		private toFrontOnShow;
		private cacheable;
		private destroyed;
		private fixed;
		private width;
		private height;
		private minWidth;
		private minHeight;
		private maxWidth;
		private maxHeight;
		private padding;
		private contentPadding;
		private background;
		private contentBackground;
		private borderRadius;
		private contentBorderRadius;
		private targetContainer;
		private dragOptions;
		private dragged;
		private dragPageX;
		private dragPageY;
		private animationShowClassName;
		private animationCloseClassName;
		private designSystemContext;
		private contentContainer;
		private popupContainer;
		private zIndexComponent;
		private buttonsContainer;
		private resizeContentPos;
		private resizeContentOffset;
		/**
		 * Modern signature: a single options object.
		 */
		constructor(options?: PopupOptions);
		/**
		 * Legacy positional signature `(id, bindElement, params)`. Kept for backward
		 * compatibility: enables compatible mode unless `params.compatibleMode === false`.
		 * `params` is an extensible options bag and may carry legacy keys that are not
		 * part of {@link PopupOptions}.
		 */
		constructor(id: string | null, bindElement?: PopupTarget, params?: PopupLegacyOptions);
		private initializeState;
		subscribeFromOptions(events: {
			[eventName: string]: Function;
		}): void;
		getId(): string;
		isCompatibleMode(): boolean;
		setContent(content: string | Element | Node | undefined): void;
		setButtons(buttons: PopupButton[] | undefined): void;
		getButtons(): PopupButton[];
		getButton(id: string): PopupButton | null;
		setBindElement(bindElement: PopupTarget | undefined): void;
		private getBindElementPos;
		/**
		 * @internal
		 */
		getPositionRelativeToTarget(element: HTMLElement): DOMRect;
		getWindowSize(): {
			innerWidth: number;
			innerHeight: number;
		};
		getWindowScroll(): {
			scrollLeft: number;
			scrollTop: number;
		};
		setAngle(params: PopupAngleOptions | boolean): void;
		private removeAngle;
		private createAngle;
		private setAnglePosition;
		private setAngleOffset;
		private setVerticalAngleOffset;
		private setSideAngleOffset;
		private calculateAngleOffset;
		getWidth(): number | null;
		setWidth(width: number | null | false | undefined): void;
		getHeight(): number | null;
		setHeight(height: number | null | false | undefined): void;
		getMinWidth(): number | null;
		setMinWidth(width: number | null | false | undefined): void;
		getMinHeight(): number | null;
		setMinHeight(height: number | null | false | undefined): void;
		getMaxWidth(): number | null;
		setMaxWidth(width: number | null | false | undefined): void;
		getMaxHeight(): number | null;
		setMaxHeight(height: number | null | false | undefined): void;
		private setWidthProperty;
		private setHeightProperty;
		setPadding(padding: number | null | undefined): void;
		getPadding(): number | null;
		setContentPadding(padding: number | null | undefined): void;
		getContentPadding(): number | null;
		setBorderRadius(radius: string | null | undefined): void;
		getBorderRadius(): string | null;
		setContentBorderRadius(radius: string | null | undefined): void;
		getContentBorderRadius(): string | null;
		setContentColor(color: string | null): void;
		setBackground(background: string | null | undefined): void;
		getBackground(): string | null;
		setContentBackground(background: string | null | undefined): void;
		getContentBackground(): string | null;
		isDestroyed(): boolean;
		setCacheable(cacheable: boolean | undefined): void;
		isCacheable(): boolean;
		static shouldUseFocusTrapByDefault(): boolean;
		getFocusTrap(): BX.UI.Accessibility.FocusTrap | null;
		setToFrontOnShow(flag: boolean | undefined): void;
		shouldFrontOnShow(): boolean;
		setFixed(flag: boolean | undefined): void;
		isFixed(): boolean;
		setResizeMode(mode: boolean | {
			minWidth?: number;
			minHeight?: number;
		} | undefined): void;
		getDesignSystemContext(): string;
		setDesignSystemContext(context: string | undefined): void;
		setTargetContainer(targetContainer: HTMLElement | undefined): void;
		getTargetContainer(): HTMLElement;
		isTargetDocumentBody(): boolean;
		getPopupContainer(): HTMLElement;
		getContentContainer(): HTMLElement;
		getResizableContainer(): HTMLElement;
		getTitleContainer(): HTMLElement;
		private onTitleMouseDown;
		private handleResizeMouseDown;
		private handleResize;
		isTopAngle(): boolean;
		isBottomAngle(): boolean;
		isTopOrBottomAngle(): boolean;
		private getAngleHeight;
		setOffset(params: {
			offsetTop?: number;
			offsetLeft?: number;
		}): void;
		setTitleBar(params: PopupTitleBar | undefined): void;
		setDraggable(draggable: PopupDraggable | boolean | undefined): void;
		setClosingByEsc(enable: boolean): void;
		private bindClosingByEsc;
		private unbindClosingByEsc;
		setAutoHide(enable: boolean): void;
		private bindAutoHide;
		private unbindAutoHide;
		private handleAutoHide;
		/** CRM consumers replace it at runtime. */
		private _tryCloseByEvent;
		private tryCloseByEvent;
		private handleOverlayClick;
		setOverlay(params: PopupOverlay | boolean | undefined): void;
		isModal(): boolean;
		hasOverlay(): boolean;
		removeOverlay(): void;
		hideOverlay(): void;
		showOverlay(): void;
		resizeOverlay(): void;
		getZindex(): number;
		getZIndexComponent(): BX.ZIndexComponent;
		setDisableScroll(flag: boolean): void;
		show(): void;
		close(): void;
		bringToFront(): void;
		toggle(): void;
		private bindAnimationEnd;
		private animateOpening;
		private animateClosing;
		setAnimation(options: PopupAnimationOptions | undefined): void;
		isShown(): boolean;
		shouldBlockBackgroundEsc(): boolean;
		destroy(): void;
		adjustPosition(bindOptions?: PopupTargetOptions): void;
		private hasUnchangedBindPosition;
		private updateBindElementPosition;
		private calculatePopupLeft;
		private calculatePopupTop;
		private calculatePopupTopFromAbove;
		private calculatePopupTopFromBelow;
		enterFullScreen(): void;
		private handleFullScreen;
		private handleCloseIconClick;
		private handleContainerClick;
		private handleDocumentKeyUp;
		private handleResizeWindow;
		private handleMove;
		private handleDocumentMouseMove;
		private handleDocumentMouseUp;
	}

	/**
	 * @namespace {BX.Main.Popup}
	 */
	const CloseIconSize: Readonly<{
		LARGE: "large";
		SMALL: "small";
	}>;

	class Reaction extends BX.Event.EventEmitter {
		static "__#private@#LottieInstance": null;
		constructor(options?: EmojiOptions);
		render(): HTMLElement;
		/**
		 * @deprecated used only for a vue component
		 */
		renderOnNode(node: HTMLElement): void;
		setSize(size: number): void;
		setInfiniteAnimate(value: boolean): void;
		playAnimation(): void;
		pauseAnimation(): void;
		destroy(): void;
	}

	class ReactionService {
		setReaction(messageId: number, reaction: string): void;
		removeReaction(messageId: number, reaction: string): void;
	}

	const ReactionUser: BX.Vue3.DefineComponent<BX.Vue3.ExtractPropTypes<{
		userId: {
			type: NumberConstructor;
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
		user(): BX.Messenger.v2.Model.ImModelUser;
		avatarStyle(): Object;
	}, {}, BX.Vue3.ComponentOptionsMixin, BX.Vue3.ComponentOptionsMixin, {}, string, BX.Vue3.PublicProps, Readonly<BX.Vue3.ExtractPropTypes<{
		userId: {
			type: NumberConstructor;
			required: true;
		};
	}>> & Readonly<{}>, {}, {}, {
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
				user(): BX.Messenger.v2.Model.ImModelUser;
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

	const AdditionalUsers: BX.Vue3.DefineComponent<BX.Vue3.ExtractPropTypes<{
		messageId: {
			type: (NumberConstructor | StringConstructor)[];
			required: true;
		};
		reaction: {
			type: StringConstructor;
			required: true;
		};
		show: {
			type: BooleanConstructor;
			required: true;
		};
		bindElement: {
			type: ObjectConstructor;
			required: true;
		};
	}>, {
		userService: UserService | null;
	}, {
		showPopup: boolean;
		loadingAdditionalUsers: boolean;
		additionalUsers: number[];
	}, {}, {
		loadUsers(): Promise<void>;
		onScroll(event: Event): Promise<void>;
		onPopupClose(): void;
		prepareAdditionalUsers(userIds: number[]): number[];
		getUserService(): UserService;
	}, BX.Vue3.ComponentOptionsMixin, BX.Vue3.ComponentOptionsMixin, "close"[], "close", BX.Vue3.PublicProps, Readonly<BX.Vue3.ExtractPropTypes<{
		messageId: {
			type: (NumberConstructor | StringConstructor)[];
			required: true;
		};
		reaction: {
			type: StringConstructor;
			required: true;
		};
		show: {
			type: BooleanConstructor;
			required: true;
		};
		bindElement: {
			type: ObjectConstructor;
			required: true;
		};
	}>> & Readonly<{
		onClose?: ((...args: any[]) => any) | undefined;
	}>, {}, {}, {
		UserListPopup: typeof BX.Messenger.v2.Component.Elements.UserListPopup;
	}, {}, string, BX.Vue3.ComponentProvideOptions, true, {}, any>;

	class UserService extends BX.Messenger.v2.Service.BaseUserService<{
		reactions: ReactionItem[];
	}> {
		loadFirstPage: (messageId: number | string) => Promise<number[]>;
		loadNextPage: (messageId: number | string) => Promise<number[] | null>;
		hasMoreItemsToLoad: () => boolean;
		constructor(reaction: string);
		getRequestFilter(firstPage?: boolean): Record<string, any>;
		getRestMethodName(): string;
		getLastId(result: {
			reactions: ReactionItem[];
		}): number;
	}

	const CardBlock: BX.Vue3.DefineComponent<BX.Vue3.ExtractPropTypes<{
		message: {
			type: ObjectConstructor;
			required: true;
		};
		block: {
			type: BX.Vue3.PropType<BX.Messenger.v2.Const.CardBlockType>;
			required: true;
		};
		dialogId: {
			type: StringConstructor;
			required: true;
		};
	}>, {}, {}, {
		cardBlock(): BX.Messenger.v2.Const.CardBlockType;
		imageSource(): string;
		hasTitle(): boolean;
		hasText(): boolean;
		hasButtons(): boolean;
		formattedText(): string;
		purifiedText(): string;
		buttons(): BX.Messenger.v2.Const.AnyButtonBlock[][];
	}, {
		getButtonUniqueKey(button: BX.Messenger.v2.Const.AnyButtonBlock): string;
	}, BX.Vue3.ComponentOptionsMixin, BX.Vue3.ComponentOptionsMixin, {}, string, BX.Vue3.PublicProps, Readonly<BX.Vue3.ExtractPropTypes<{
		message: {
			type: ObjectConstructor;
			required: true;
		};
		block: {
			type: BX.Vue3.PropType<BX.Messenger.v2.Const.CardBlockType>;
			required: true;
		};
		dialogId: {
			type: StringConstructor;
			required: true;
		};
	}>> & Readonly<{}>, {}, {}, {
		BaseBlock: BX.Vue3.DefineComponent<BX.Vue3.ExtractPropTypes<{
			message: {
				type: ObjectConstructor;
				required: true;
			};
			block: {
				type: ObjectConstructor;
				required: true;
			};
			dialogId: {
				type: StringConstructor;
				required: true;
			};
		}>, {}, {}, {}, {}, BX.Vue3.ComponentOptionsMixin, BX.Vue3.ComponentOptionsMixin, {}, string, BX.Vue3.PublicProps, Readonly<BX.Vue3.ExtractPropTypes<{
			message: {
				type: ObjectConstructor;
				required: true;
			};
			block: {
				type: ObjectConstructor;
				required: true;
			};
			dialogId: {
				type: StringConstructor;
				required: true;
			};
		}>> & Readonly<{}>, {}, {}, {}, {}, string, BX.Vue3.ComponentProvideOptions, true, {}, any>;
		TextContent: BX.Vue3.DefineComponent<BX.Vue3.ExtractPropTypes<{
			text: {
				type: StringConstructor;
				required: true;
			};
		}>, {}, {}, {}, {}, BX.Vue3.ComponentOptionsMixin, BX.Vue3.ComponentOptionsMixin, {}, string, BX.Vue3.PublicProps, Readonly<BX.Vue3.ExtractPropTypes<{
			text: {
				type: StringConstructor;
				required: true;
			};
		}>> & Readonly<{}>, {}, {}, {}, {}, string, BX.Vue3.ComponentProvideOptions, true, {}, any>;
		ButtonBlock: BX.Vue3.DefineComponent<BX.Vue3.ExtractPropTypes<{
			message: {
				type: BX.Vue3.PropType<import("../../../../../../../model/src/registry").ImModelMessage>;
				required: true;
			};
			block: {
				type: BX.Vue3.PropType<BX.Messenger.v2.Const.AnyButtonBlock>;
				required: true;
			};
			dialogId: {
				type: StringConstructor;
				required: true;
			};
			loading: {
				type: BooleanConstructor;
				default: boolean;
			};
			disabled: {
				type: BooleanConstructor;
				default: boolean;
			};
			wide: {
				type: BooleanConstructor;
				default: boolean;
			};
		}>, {}, {}, {
			ButtonSize: () => typeof import("../../../../../../../../../../../../ui/install/js/ui/buttons/src").ButtonSize;
			AirButtonStyle: () => typeof import("../../../../../../../../../../../../ui/install/js/ui/buttons/src").AirButtonStyle;
			button(): BX.Messenger.v2.Const.AnyButtonBlock;
			buttonStyle(): $Values<typeof import("../../../../../../../../../../../../ui/install/js/ui/buttons/src").AirButtonStyle>;
		}, {
			onButtonClick(event: PointerEvent): void;
		}, BX.Vue3.ComponentOptionsMixin, BX.Vue3.ComponentOptionsMixin, "click"[], "click", BX.Vue3.PublicProps, Readonly<BX.Vue3.ExtractPropTypes<{
			message: {
				type: BX.Vue3.PropType<import("../../../../../../../model/src/registry").ImModelMessage>;
				required: true;
			};
			block: {
				type: BX.Vue3.PropType<BX.Messenger.v2.Const.AnyButtonBlock>;
				required: true;
			};
			dialogId: {
				type: StringConstructor;
				required: true;
			};
			loading: {
				type: BooleanConstructor;
				default: boolean;
			};
			disabled: {
				type: BooleanConstructor;
				default: boolean;
			};
			wide: {
				type: BooleanConstructor;
				default: boolean;
			};
		}>> & Readonly<{
			onClick?: ((...args: any[]) => any) | undefined;
		}>, {
			disabled: boolean;
			loading: boolean;
			wide: boolean;
		}, {}, {
			UiButton: import("ui.vue3").BitrixVueComponentProps | {
				button: import("../../../../../../../../../../../../ui/install/js/ui/buttons/src").Button | null;
			};
		}, {}, string, BX.Vue3.ComponentProvideOptions, true, {}, any>;
	}, {}, string, BX.Vue3.ComponentProvideOptions, true, {}, any>;

	/**
	 * @namespace {BX.UI}
	 */
	class ButtonSize {
		static EXTRA_LARGE: string;
		static LARGE: string;
		static MEDIUM: string;
		static SMALL: string;
		static EXTRA_SMALL: string;
		static EXTRA_EXTRA_SMALL: string;
	}

	/**
	 * @namespace {BX.UI}
	 */
	class AirButtonStyle {
		static FILLED: string;
		static FILLED_WHITE: string;
		static FILLED_BITRIX_GPT: string;
		static TINTED: string;
		static TINTED_ALERT: string;
		static TINTED_BITRIX_GPT: string;
		static OUTLINE_ACCENT_1: string;
		static OUTLINE_ACCENT_2: string;
		static OUTLINE: string;
		static OUTLINE_NO_ACCENT: string;
		static OUTLINE_BITRIX_GPT: string;
		static PLAIN_ACCENT: string;
		static PLAIN: string;
		static PLAIN_NO_ACCENT: string;
		static SELECTION: string;
		static FILLED_COPILOT: string;
		static FILLED_SUCCESS: string;
		static FILLED_ALERT: string;
		static FILLED_BOOST: string;
	}

	/**
	 * @namespace {BX.UI}
	 */
	class Button extends BaseButton {
		static BASE_CLASS: string;
		static Size: typeof ButtonSize;
		static Color: typeof ButtonColor;
		static State: typeof ButtonState;
		static Icon: typeof ButtonIcon;
		static Tag: typeof ButtonTag;
		static Style: typeof ButtonStyle;
		static AirStyle: typeof AirButtonStyle;
		constructor(options: ButtonOptions);
		isDependOnTheme: any;
		size: any;
		color: any;
		icon: any;
		state: any;
		id: string | null;
		context: any;
		menuWindow: Object | null;
		/**
		 * @protected
		 */
		protected handleMenuClick(event: MouseEvent): void;
		setText(text: string): this;
		setProps(props: {
			[propertyName: string]: string;
		}): this;
		setDataSet(props: {
			[propertyName: string]: string;
		}): this;
		setSize(size: ButtonSize | null): this;
		getSize(): ButtonSize | null;
		setColor(color: ButtonColor | null): this;
		getColor(): ButtonColor | null;
		setIcon(icon: string | null, iconPosition?: "right" | "left"): this;
		setCollapsedIcon(icon: ButtonIcon | null): this;
		getIcon(): ButtonIcon | null;
		setState(state: ButtonState | null): this;
		getState(): ButtonState | null;
		setNoCaps(noCaps?: boolean): this;
		isNoCaps(): boolean;
		setRound(round?: boolean): this;
		isRound(): boolean;
		setDependOnTheme(dependOnTheme?: boolean): this;
		setDropdown(dropdown?: boolean): this;
		isDropdown(): boolean;
		setCollapsed(collapsed?: boolean): this;
		isCollapsed(): boolean;
		setLeftCorners(withLeftCorners?: boolean): this;
		setRightCorners(withRightCorners?: boolean): this;
		/**
		 * @protected
		 */
		protected setMenu(options: BX.Main.MenuOptions): this;
		/**
		 * Sets a menu rendered by the ui.system.menu extension instead of the main.popup one.
		 * Passing false removes it, while the PHP setter takes null for that. The arrow is a caller's
		 * concern here, unlike the PHP setter, which keeps it in sync itself.
		 */
		setSystemMenu(options: SystemMenuOptions | false): this;
		/**
		 * Returns the menu instance, which is created on the first opening: the ui.system.menu class
		 * is available at runtime only. A menu that has never been opened gives null, unlike
		 * getMenuWindow(), which has its instance right after setMenu().
		 */
		getSystemMenu(): Object | null;
		/**
		 * Unlike getSystemMenu(), tells a kind of the set menu apart even before its first opening.
		 */
		hasSystemMenu(): boolean;
		getMenuBindElement(): HTMLElement;
		getMenuClickElement(): HTMLElement;
		/**
		 * @protected
		 */
		protected handleMenuShow(): void;
		/**
		 * @protected
		 */
		protected handleMenuClose(): void;
		getMenuWindow(): BX.Main.Menu | null;
		setId(id: string | null): this;
		getId(): string | null;
		setActive(active?: boolean): this;
		isActive(): boolean;
		setHovered(hovered?: boolean): this;
		isHover(): boolean;
		setDisabled(disabled?: boolean): this;
		setWaiting(waiting?: boolean): this;
		isWaiting(): boolean;
		setClocking(clocking?: boolean): this;
		isClocking(): boolean;
		/**
		 * @protected
		 */
		protected setProperty(property: string, value?: any, enumeration: Object): this;
		setContext(context: any): this;
		getContext(): any;
		setWide(isWide: boolean): this;
		isWide(): boolean;
		setStyle(style: string): void;
		getStyle(): string;
		setLeftCounter(options: BX.UI.ButtonCounterOptions | null): this;
		setRightCounter(options: BX.UI.ButtonCounterOptions | null): this;
		/**
		 * @protected
		 */
		protected prepareCounterOptions(options: BX.UI.ButtonCounterOptions | null): BX.UI.ButtonCounterOptions | null;
		startShimmer(): void;
		stopShimmer(): void;
	}

	class BaseButton {
		constructor(options: BaseButtonOptions);
		options: Object & BaseButtonOptions;
		/**
		 * 'buttonNode', 'textNode' and counterNode options use only in ButtonManager.createFromNode
		 */
		button: any;
		textNode: any;
		counterNode: any;
		text: string;
		counter: string | number | null;
		events: {};
		link: string;
		maxWidth: number | null;
		tag: ButtonTag | undefined;
		baseClass: string;
		disabled: boolean;
		/**
		 * @protected
		 */
		protected init(): void;
		setAirDesign(use: boolean): void;
		hasAirDesign(): boolean;
		/**
		 * @protected
		 */
		protected getDefaultOptions(): Object;
		render(): HTMLElement;
		renderTo(node: HTMLElement): HTMLElement;
		getContainer(): HTMLElement;
		/**
		 * @protected
		 */
		protected getBaseClass(): string;
		setText(text: string): this;
		getTextContainer(): HTMLElement;
		getText(): string;
		/**
		 * Use for buttons with air option
		 * Use only to create or delete a counter. Update counter value via getLeftCounter() method.
		 *
		 * @param options Object | null Object for creating. null for deleting.
		 */
		setLeftCounter(options: ButtonCounterOptions | null): this;
		/**
		 * Use for buttons with air option
		 * Use only to create or delete a counter. Update counter value via getRightCounter() method.
		 *
		 * @param options Object | null Object for creating. null for deleting.
		 */
		setRightCounter(options: ButtonCounterOptions | null): this;
		getLeftCounter(): ButtonCounter;
		getRightCounter(): ButtonCounter;
		/**
		 * use for old buttons (without useAirTheme option)
		 */
		setCounter(counter: number | string): this;
		getCounter(): number | string | null;
		setLink(link: string): this;
		getLink(): string;
		setMaxWidth(maxWidth: number): this;
		getMaxWidth(): number | null;
		getTag(): ButtonTag;
		setProps(props: {
			[propertyName: string]: string;
		}): this;
		getProps(): {
			[property: string]: string;
		};
		setDataSet(props: {
			[propertyName: string]: string;
		}): this;
		getDataSet(): DOMStringMap;
		addClass(className: string): this;
		removeClass(className: string): this;
		setDisabled(disabled?: boolean): this;
		isDisabled(): boolean;
		isInputType(): boolean;
		bindEvents(events: {
			[event: string]: (button: this, event: MouseEvent) => {};
		}): this;
		unbindEvents(events: string[]): this;
		bindEvent(eventName: string, fn: (button: this, event: MouseEvent) => {}): this;
		unbindEvent(eventName: string): this;
		/**
		 * @protected
		 */
		protected isEnumValue(value: any, enumeration: Object): boolean;
	}

	/**
	 * @namespace {BX.UI}
	 */
	class ButtonTag {
		static BUTTON: number;
		static LINK: number;
		static SUBMIT: number;
		static INPUT: number;
		static DIV: number;
		static SPAN: number;
	}

	class ButtonCounter {
		constructor(options: ButtonCounterOptions);
		render(): HTMLElement;
		getValue(): number;
		setValue(value: number): void;
		setColor(color: string): void;
		setStyle(style: BX.UI.CounterStyle): void;
		validateOptions(options: ButtonCounterOptions): void;
	}

	/**
	 * @namespace {BX.UI}
	 */
	class ButtonColor {
		static DANGER: string;
		static DANGER_DARK: string;
		static DANGER_LIGHT: string;
		static SUCCESS: string;
		static SUCCESS_DARK: string;
		static SUCCESS_LIGHT: string;
		static PRIMARY_DARK: string;
		static PRIMARY: string;
		static SECONDARY: string;
		static SECONDARY_LIGHT: string;
		static WARNING_LIGHT: string;
		static LINK: string;
		static LIGHT: string;
		static LIGHT_BORDER: string;
		static AI: string;
		static BASE_LIGHT: string;
		static COLLAB: string;
		static PRIMARY_BORDER: string;
		static CURTAIN_PRIMARY: string;
		static CURTAIN_WARNING: string;
	}

	/**
	 * @namespace {BX.UI}
	 */
	class ButtonState {
		static HOVER: string;
		static ACTIVE: string;
		static DISABLED: string;
		static CLOCKING: string;
		static WAITING: string;
		static AI_WAITING: string;
	}

	/**
	 * @namespace {BX.UI}
	 */
	class ButtonIcon {
		static UNFOLLOW: string;
		static FOLLOW: string;
		static ADD: string;
		static ADD_M: string;
		static STOP: string;
		static START: string;
		static PAUSE: string;
		static ADD_FOLDER: string;
		static SETTING: string;
		static TASK: string;
		static INFO: string;
		static SEARCH: string;
		static PRINT: string;
		static LIST: string;
		static BUSINESS: string;
		static BUSINESS_CONFIRM: string;
		static BUSINESS_WARNING: string;
		static CAMERA: string;
		static PHONE_UP: string;
		static PHONE_DOWN: string;
		static PHONE_CALL: string;
		static BACK: string;
		static REMOVE: string;
		static DOWNLOAD: string;
		static DOTS: string;
		static DONE: string;
		static CANCEL: string;
		static DISK: string;
		static LOCK: string;
		static MAIL: string;
		static CHAT: string;
		static PAGE: string;
		static CLOUD: string;
		static EDIT: string;
		static SHARE: string;
		static ANGLE_UP: string;
		static ANGLE_DOWN: string;
		static EYE_OPENED: string;
		static EYE_CLOSED: string;
		static ALERT: string;
		static FAIL: string;
		static SUCCESS: string;
		static PLAN: string;
		static TARIFF: string;
		static BATTERY: string;
		static NO_BATTERY: string;
		static HALF_BATTERY: string;
		static LOW_BATTERY: string;
		static CRIT_BATTERY: string;
		static DEMO: string;
		static ROBOTS: string;
		static NOTE: string;
		static SCRIPT: string;
		static PRINT2: string;
		static FUNNEL: string;
		static FORWARD: string;
		static COPY: string;
		static AI: string;
		static BUSINESS_NEW: string;
		static OUTLINE_ADD: string;
		static HELP: string;
		static CHECK: string;
		static CHEVRON_LEFT_S: string;
		static CHEVRON_RIGHT_S: string;
		static REFRESH: string;
		static APPS: string;
		static IMAGE: string;
		static CITY: string;
		static TWO_PERSONS: string;
		static COPILOT: string;
		static RELOAD: string;
		static WORKFLOW: string;
		static PERSON: string;
		static WORKFLOW_STOP: string;
		static MARKET: string;
		static KEY: string;
		static MAIL_PLUS: string;
		static FUNNEL_FILTER: string;
		static CALENDAR_WITH_SLOTS: string;
		static CHATS: string;
		static CALENDAR_WITH_CHECKS: string;
		static EXCLAMATION: string;
	}

	/**
	 * @namespace {BX.UI}
	 */
	class ButtonStyle {
		static NO_CAPS: string;
		static ROUND: string;
		static DROPDOWN: string;
		static COLLAPSED: string;
		static DEPEND_ON_THEME: string;
	}

	const Outline: Readonly<{
		readonly DOUBLE_GIS: "o-double-gis";
		readonly THREE_PERSONS: "o-three-persons";
		readonly A_LETTER: "o-a-letter";
		readonly ACHIEVEMENT: "o-achievement";
		readonly ACTIVITY: "o-activity";
		readonly ADD_CHAT: "o-add-chat";
		readonly ADD_EVENT: "o-add-event";
		readonly ADD_FUNNEL: "o-add-funnel";
		readonly ADD_PERSON: "o-add-person";
		readonly ADD_PRODUCT: "o-add-product";
		readonly ADD_TIMELINE: "o-add-timeline";
		readonly AI_STARS_QUESTION: "o-ai-stars-question";
		readonly AI_STARS: "o-ai-stars";
		readonly ALARM: "o-alarm";
		readonly ALERT_ACCENT: "o-alert-accent";
		readonly ALERT: "o-alert";
		readonly ALIGN_CENTER: "o-align-center";
		readonly ALIGN_JUSTIFY: "o-align-justify";
		readonly ALIGN_LEFT: "o-align-left";
		readonly ALIGN_RIGHT: "o-align-right";
		readonly APPS: "o-apps";
		readonly ATTACH_2: "o-attach-2";
		readonly ATTACH: "o-attach";
		readonly AUTOFILL: "o-autofill";
		readonly BACK_10: "o-back-10";
		readonly BACK_15: "o-back-15";
		readonly BARCODE: "o-barcode";
		readonly BATTERY_1_STICK: "o-battery-1-stick";
		readonly BATTERY_2_STICKS: "o-battery-2-sticks";
		readonly BATTERY_NO_CHARGE: "o-battery-no-charge";
		readonly BLUETOOTH: "o-bluetooth";
		readonly BOARD: "o-board";
		readonly BOLD: "o-bold";
		readonly BOOKMARK_2: "o-bookmark-2";
		readonly BOOKMARK: "o-bookmark";
		readonly BOTTLENECK: "o-bottleneck";
		readonly BOTTOM_MENU: "o-bottom-menu";
		readonly BOX_WITH_LID: "o-box-with-lid";
		readonly BOX: "o-box";
		readonly BUG: "o-bug";
		readonly BULLETED_LIST: "o-bulleted-list";
		readonly BUSINES_PROCESS_STAGES: "o-busines-process-stages";
		readonly BUSINESS_PROCESS_PROGRESS: "o-business-process-progress";
		readonly BUSINESS_PROCESS: "o-business-process";
		readonly CALENDAR_EMPTY: "o-calendar-empty";
		readonly CALENDAR_SHARE: "o-calendar-share";
		readonly CALENDAR_WITH_CHECKS: "o-calendar-with-checks";
		readonly CALENDAR_WITH_SLOTS: "o-calendar-with-slots";
		readonly CALENDAR: "o-calendar";
		readonly CAMERA_OFF: "o-camera-off";
		readonly CAMERA: "o-camera";
		readonly CARD: "o-card";
		readonly CASH_TERMINAL: "o-cash-terminal";
		readonly CHANGE_FUNNEL: "o-change-funnel";
		readonly CHANGE_ORDER_2: "o-change-order-2";
		readonly CHANGE_ORDER: "o-change-order";
		readonly CHAT_LIST: "o-chat-list";
		readonly CHATS: "o-chats";
		readonly CHECK_LIST: "o-check-list";
		readonly CIRCLE_CHECK: "o-circle-check";
		readonly CIRCLE_CROSS: "o-circle-cross";
		readonly CIRCLE_MINUS: "o-circle-minus";
		readonly CIRCLE_MORE: "o-circle-more";
		readonly CIRCLE_PLUS: "o-circle-plus";
		readonly CLOCK_BACK: "o-clock-back";
		readonly CLOCK: "o-clock";
		readonly CLOSE_CHAT: "o-close-chat";
		readonly CLOUD_DOWNLOAD: "o-cloud-download";
		readonly CLOUD_SYNC: "o-cloud-sync";
		readonly CLOUD_TIME: "o-cloud-time";
		readonly CLOUD_WITH_CHECK: "o-cloud-with-check";
		readonly CLOUD: "o-cloud";
		readonly COLLAB: "o-collab";
		readonly COLLABORATION: "o-collaboration";
		readonly COLUMNS_SIDEBAR_PENDING: "o-columns-sidebar-pending";
		readonly COLUMNS: "o-columns";
		readonly COMPANY: "o-company";
		readonly COMPLETE_TASK_LIST: "o-complete-task-list";
		readonly CONTACT: "o-contact";
		readonly COPILOT: "o-copilot";
		readonly COPY: "o-copy";
		readonly CREATE_CHAT: "o-create-chat";
		readonly CREATE_FILE: "o-create-file";
		readonly CRM_LETTERS: "o-crm-letters";
		readonly CRM: "o-crm";
		readonly CROSSED_EYE: "o-crossed-eye";
		readonly CROWN: "o-crown";
		readonly CURSOR_CLICK: "o-cursor-click";
		readonly CURSORS_STRIKE: "o-cursors-strike";
		readonly DAY_OFF: "o-day-off";
		readonly DELAY: "o-delay";
		readonly DELEGATE: "o-delegate";
		readonly DELIVERY: "o-delivery";
		readonly DEMONSTRATION_ON: "o-demonstration-on";
		readonly DEPARTMENT: "o-department";
		readonly DESIGN: "o-design";
		readonly DEVELOPER_RESOURCES: "o-developer-resources";
		readonly DEVICE_ROTATE: "o-device-rotate";
		readonly DISK_SHARED: "o-disk-shared";
		readonly DISLIKE: "o-dislike";
		readonly DISTRIBUTION: "o-distribution";
		readonly DOCUMENT_UPDATE: "o-document-update";
		readonly DOUBLE_CHECK: "o-double-check";
		readonly DOWNLOAD: "o-download";
		readonly DUPLICATE: "o-duplicate";
		readonly EARTH_WITH_CHECK: "o-earth-with-check";
		readonly EARTH_WITH_CLOCK: "o-earth-with-clock";
		readonly EARTH_WITH_CROSS: "o-earth-with-cross";
		readonly EARTH_WITH_STOP: "o-earth-with-stop";
		readonly EARTH_WITH_TREE: "o-earth-with-tree";
		readonly EARTH: "o-earth";
		readonly EMPTY_BATTERY: "o-empty-battery";
		readonly EMPTY_MESSAGE: "o-empty-message";
		readonly ENTERPRISE: "o-enterprise";
		readonly EXPERT_MODE: "o-expert-mode";
		readonly FAVORITE: "o-favorite";
		readonly FEEDBACK: "o-feedback";
		readonly FILE_WITH_CHECK_2: "o-file-with-check-2";
		readonly FILE_WITH_CHECK: "o-file-with-check";
		readonly FILE_WITH_CLOCK: "o-file-with-clock";
		readonly FILE_SETTINGS: "o-file-settings";
		readonly FILE: "o-file";
		readonly FILTER_2_LINES: "o-filter-2-lines";
		readonly FILTER_FUNNEL: "o-filter-funnel";
		readonly FILTER: "o-filter";
		readonly FIND_FILTERS: "o-find-filters";
		readonly FIRE: "o-fire";
		readonly FIRE_SOLID: "o-fire-solid";
		readonly FLAG_WITH_CROSS: "o-flag-with-cross";
		readonly FLAG: "o-flag";
		readonly FOLDER_24: "o-folder-24";
		readonly FOLDER_PLUS: "o-folder-plus";
		readonly FOLDER_SUCCESS: "o-folder-success";
		readonly FOLDER_WITH_CARD: "o-folder-with-card";
		readonly FOLDER: "o-folder";
		readonly FORM: "o-form";
		readonly FORWARD_10: "o-forward-10";
		readonly FORWARD_15: "o-forward-15";
		readonly FORWARD: "o-forward";
		readonly FREELANCE: "o-freelance";
		readonly FULL_BATTERY: "o-full-battery";
		readonly GIFT: "o-gift";
		readonly GLASSES: "o-glasses";
		readonly GLOBE_EXTRANET: "o-globe-extranet";
		readonly GO_TO_MESSAGE: "o-go-to-message";
		readonly GOOGLE_MAPS: "o-google-maps";
		readonly GRADUATION_CAP: "o-graduation-cap";
		readonly GRAPHS_DIAGRAM: "o-graphs-diagram";
		readonly GROUP: "o-group";
		readonly HAMBURGER_MENU: "o-hamburger-menu";
		readonly HANDSHAKE: "o-handshake";
		readonly HEADSET: "o-headset";
		readonly HEART: "o-heart";
		readonly HIGH_TEMPERATURE: "o-high-temperature";
		readonly HOME_STAR: "o-home-star";
		readonly HOME: "o-home";
		readonly HOURGLASS: "o-hourglass";
		readonly IDEA_LAMP: "o-idea-lamp";
		readonly IMAGE: "o-image";
		readonly IMAGE_PLUS: "o-image-plus";
		readonly INFO_CIRCLE: "o-info-circle";
		readonly INTERVAL: "o-interval";
		readonly INTRANET: "o-intranet";
		readonly INVENTORY_MANAGEMENT: "o-inventory-management";
		readonly INVOICE: "o-invoice";
		readonly ISSUE_INVOICE: "o-issue-invoice";
		readonly ITALIC: "o-italic";
		readonly KANBAN: "o-kanban";
		readonly KEY: "o-key";
		readonly KNOWLEDGE_BASE: "o-knowledge-base";
		readonly LAYERS: "o-layers";
		readonly LEAD: "o-lead";
		readonly LEFT_RIGHT: "o-left-right";
		readonly LIKE: "o-like";
		readonly LINK_SETTINGS: "o-link-settings";
		readonly LINK: "o-link";
		readonly LINKS_LIST: "o-links-list";
		readonly LOCATION_TIME: "o-location-time";
		readonly LOCATION: "o-location";
		readonly LOG_IN: "o-log-in";
		readonly LOG_OUT: "o-log-out";
		readonly LOWER_RIGHT_ARROW: "o-lower-right-arrow";
		readonly MAGIC_WAND: "o-magic-wand";
		readonly MAIL_COUNTER: "o-mail-counter";
		readonly MAIL_FORWARD: "o-mail-forward";
		readonly MAIL_IN_PROGRESS: "o-mail-in-progress";
		readonly MAIL_OPEN: "o-mail-open";
		readonly MAIL_RETURN: "o-mail-return";
		readonly MAIL_SEND: "o-mail-send";
		readonly MAIL: "o-mail";
		readonly MAIN_TOOL: "o-main-tool";
		readonly MAP: "o-map";
		readonly MARKET: "o-market";
		readonly MAXIMIZE: "o-maximize";
		readonly MAXIMIZE_2: "o-maximize-2";
		readonly MAX: "o-max";
		readonly MEETING_POINT: "o-meeting-point";
		readonly MENTION: "o-mention";
		readonly MESSAGE: "o-message";
		readonly MESSAGES: "o-messages";
		readonly MESSENGER_META: "o-messenger-meta";
		readonly MESSENGER: "o-messenger";
		readonly MICROPHONE_OFF: "o-microphone-off";
		readonly MICROPHONE_ON: "o-microphone-on";
		readonly MINIMIZE: "o-minimize";
		readonly MINIMIZE_2: "o-minimize-2";
		readonly MOBILE_CONSTRUCTOR: "o-mobile-constructor";
		readonly MOBILE_SERVICE: "o-mobile-service";
		readonly MOBILE_STARS: "o-mobile-stars";
		readonly MOBILE: "o-mobile";
		readonly MODERATOR: "o-moderator";
		readonly MONEY: "o-money";
		readonly MOON: "o-moon";
		readonly MOVE_TO_CHECKLIST: "o-move-to-checklist";
		readonly MOVE_TO: "o-move-to";
		readonly MULTICHOICE_OFF: "o-multichoice-off";
		readonly MULTICHOICE_ON: "o-multichoice-on";
		readonly MUSIC: "o-music";
		readonly MY_DEALS: "o-my-deals";
		readonly MY_PLAN: "o-my-plan";
		readonly NEUTRAL: "o-neutral";
		readonly NEW_MESSAGE: "o-new-message";
		readonly NEWSFEED: "o-newsfeed";
		readonly NEXT: "o-next";
		readonly NO_WIFI: "o-no-wifi";
		readonly NON_FAVORITE: "o-non-favorite";
		readonly NOTE: "o-note";
		readonly NOTIFICATION_OFF: "o-notification-off";
		readonly NOTIFICATION_SETTINGS: "o-notification-settings";
		readonly NOTIFICATION_WITH_CROSS: "o-notification-with-cross";
		readonly NOTIFICATION: "o-notification";
		readonly NUMBERED_LIST: "o-numbered-list";
		readonly OBSERVER: "o-observer";
		readonly ONLINE_BOOKING: "o-online-booking";
		readonly OPEN_CHANNELS: "o-open-channels";
		readonly OPEN_CHANNELS_CROSS: "o-open-channels-cross";
		readonly OPEN_CHAT: "o-open-chat";
		readonly CHATS_WITH_CHECK: "o-chats-with-check";
		readonly REPLY: "o-reply";
		readonly PACKAGE: "o-package";
		readonly PALETTE: "o-palette";
		readonly PARTNER_NFC: "o-partner-nfc";
		readonly PATH: "o-path";
		readonly PAYMENT_TERMINAL: "o-payment-terminal";
		readonly PAYMENT: "o-payment";
		readonly PERSON_CHECKS: "o-person-checks";
		readonly PERSON_DESCENDING: "o-person-descending";
		readonly PERSON_SEARCH: "o-person-search";
		readonly PERSON_SETTINGS: "o-person-settings";
		readonly PERSON_SPEAK: "o-person-speak";
		readonly PERSON: "o-person";
		readonly PHONE_ADD: "o-phone-add";
		readonly PHONE_BROKEN: "o-phone-broken";
		readonly PHONE_DOWN: "o-phone-down";
		readonly PHONE_IN: "o-phone-in";
		readonly PHONE_OUT: "o-phone-out";
		readonly PHONE_UP: "o-phone-up";
		readonly PIN_LIST: "o-pin-list";
		readonly PIN: "o-pin";
		readonly PING: "o-ping";
		readonly PITCH_ZOOM: "o-pitch-zoom";
		readonly PLANNING: "o-planning";
		readonly POINT_LEFT: "o-point-left";
		readonly POINT_RIGHT: "o-point-right";
		readonly POWER: "o-power";
		readonly PRINTER: "o-printer";
		readonly PROCESSES: "o-processes";
		readonly PRODUCT: "o-product";
		readonly PROMPT_LIBRARY: "o-prompt-library";
		readonly PROMPT_VAR: "o-prompt-var";
		readonly PULSE: "o-pulse";
		readonly QR_CODE: "o-qr-code";
		readonly QUANTITY: "o-quantity";
		readonly QUESTION_L: "o-question-l";
		readonly QUESTION: "o-question";
		readonly QUOTE: "o-quote";
		readonly RECORD_VIDEO: "o-record-video";
		readonly REDO: "o-redo";
		readonly REFRESH: "o-refresh";
		readonly RELATED_TASKS: "o-related-tasks";
		readonly REMOVE_PERSON: "o-remove-person";
		readonly REPEAT_CYCLE: "o-repeat-cycle";
		readonly REPEAT_SALES: "o-repeat-sales";
		readonly REPEAT: "o-repeat";
		readonly RESUME: "o-resume";
		readonly ROBOT: "o-robot";
		readonly ROCKET: "o-rocket";
		readonly RUNNING_MAN: "o-running-man";
		readonly SAD: "o-sad";
		readonly SALE_TAG: "o-sale-tag";
		readonly SCREEN: "o-screen";
		readonly SCRUM: "o-scrum";
		readonly SEARCH: "o-search";
		readonly SEND: "o-send";
		readonly SENDED: "o-sended";
		readonly SERVICES: "o-services";
		readonly SET_COLUMNS: "o-set-columns";
		readonly SETTINGS: "o-settings";
		readonly SHARE_TASK: "o-share-task";
		readonly SHARE: "o-share";
		readonly SHIELD_ATTENTION: "o-shield-attention";
		readonly SHIELD_CHECKED: "o-shield-checked";
		readonly SHIELD: "o-shield";
		readonly SHOPPING_CART: "o-shopping-cart";
		readonly SHUFFLE: "o-shuffle";
		readonly SICK: "o-sick";
		readonly SIGMA_SUMM: "o-sigma-summ";
		readonly SIGN: "o-sign";
		readonly SMART_ACTIVITY: "o-smart-activity";
		readonly SMART_PROCESS: "o-smart-process";
		readonly SMILE: "o-smile";
		readonly SMS: "o-sms";
		readonly SORT_ACTIVITY: "o-sort-activity";
		readonly SORT_CALENDAR: "o-sort-calendar";
		readonly SOUND_OFF: "o-sound-off";
		readonly SOUND_ON: "o-sound-on";
		readonly SPEAKER: "o-speaker";
		readonly SPEED_0_5: "o-speed-0_5";
		readonly SPEED_0_7: "o-speed-0_7";
		readonly SPEED_1: "o-speed-1";
		readonly SPEED_1_2: "o-speed-1_2";
		readonly SPEED_1_5: "o-speed-1_5";
		readonly SPEED_1_7: "o-speed-1_7";
		readonly SPEED_2: "o-speed-2";
		readonly SPEED_METER: "o-speed-meter";
		readonly SPORT_MARATHON: "o-sport-marathon";
		readonly STAGE_MINUS: "o-stage-minus";
		readonly STAGE_PLUS: "o-stage-plus";
		readonly STAGE: "o-stage";
		readonly STAGES: "o-stages";
		readonly STOCK: "o-stock";
		readonly STOP_HAND_CROSSED: "o-stop-hand-crossed";
		readonly STOP_HAND: "o-stop-hand";
		readonly STORAGE: "o-storage";
		readonly STRESS: "o-stress";
		readonly STRIKETHROUGH: "o-strikethrough";
		readonly STRUCTURE_HORIZONTAL: "o-structure-horizontal";
		readonly STRUCTURE_VERTICAL: "o-structure-vertical";
		readonly SUBTASK: "o-subtask";
		readonly SUITCASE: "o-suitcase";
		readonly SUN: "o-sun";
		readonly SWITCH_CAMERA: "o-switch-camera";
		readonly SWITCHER: "o-switcher";
		readonly TABLET: "o-tablet";
		readonly TAG: "o-tag";
		readonly TARIFF_SCANER: "o-tariff-scaner";
		readonly TASK_LIST: "o-task-list";
		readonly TASK: "o-task";
		readonly TELEGRAM: "o-telegram";
		readonly TELEPHONY: "o-telephony";
		readonly TEXT: "o-text";
		readonly THEME: "o-theme";
		readonly THREAD_SINGLE: "o-thread-single";
		readonly THREAD: "o-thread";
		readonly TIMELINE: "o-timeline";
		readonly TIMER_DOT: "o-timer-dot";
		readonly TIMER: "o-timer";
		readonly TOPIC: "o-topic";
		readonly TRANSLATION: "o-translation";
		readonly TRASHCAN: "o-trashcan";
		readonly TREND_DOWN: "o-trend-down";
		readonly TREND_UP: "o-trend-up";
		readonly UNDERLINE: "o-underline";
		readonly UNDO: "o-undo";
		readonly UNLINK: "o-unlink";
		readonly UNPIN: "o-unpin";
		readonly UPLOAD_DOCUMENT: "o-upload-document";
		readonly UPLOAD_FILE: "o-upload-file";
		readonly UPLOAD: "o-upload";
		readonly USER_MASK: "o-user-mask";
		readonly VACATION: "o-vacation";
		readonly WALLET: "o-wallet";
		readonly WHATSAPP: "o-whatsapp";
		readonly WIFI: "o-wifi";
		readonly WINDOW_FLAG: "o-window-flag";
		readonly WINDOW_RING: "o-window-ring";
		readonly YANDEX_MAPS: "o-yandex-maps";
		readonly ZOOM_IN: "o-zoom-in";
		readonly ZOOM_OUT: "o-zoom-out";
		readonly ARROW_DOWN_L: "arrow-down-l";
		readonly ARROW_DOWN_M: "arrow-down-m";
		readonly ARROW_DOWN_S: "arrow-down-s";
		readonly ARROW_DOWN_XS: "arrow-down-xs";
		readonly ARROW_LEFT_L: "arrow-left-l";
		readonly ARROW_LEFT_M: "arrow-left-m";
		readonly ARROW_LEFT_S: "arrow-left-s";
		readonly ARROW_LEFT_XS: "arrow-left-xs";
		readonly ARROW_RIGHT_L: "arrow-right-l";
		readonly ARROW_RIGHT_M: "arrow-right-m";
		readonly ARROW_RIGHT_S: "arrow-right-s";
		readonly ARROW_RIGHT_XS: "arrow-right-xs";
		readonly ARROW_TOP_L: "arrow-top-l";
		readonly ARROW_TOP_M: "arrow-top-m";
		readonly ARROW_TOP_S: "arrow-top-s";
		readonly ARROW_TOP_XS: "arrow-top-xs";
		readonly BAN_L: "ban-l";
		readonly BAN_M: "ban-m";
		readonly BAN_S: "ban-s";
		readonly BAN_XS: "ban-xs";
		readonly CHECK_L: "check-l";
		readonly CHECK_M: "check-m";
		readonly CHECK_S: "check-s";
		readonly CHECK_XS: "check-xs";
		readonly CHEVRON_DOWN_L: "chevron-down-l";
		readonly CHEVRON_DOWN_M: "chevron-down-m";
		readonly CHEVRON_DOWN_S: "chevron-down-s";
		readonly CHEVRON_DOWN_XS: "chevron-down-xs";
		readonly CHEVRON_LEFT_L: "chevron-left-l";
		readonly CHEVRON_LEFT_M: "chevron-left-m";
		readonly CHEVRON_LEFT_S: "chevron-left-s";
		readonly CHEVRON_LEFT_XS: "chevron-left-xs";
		readonly CHEVRON_RIGHT_L: "chevron-right-l";
		readonly CHEVRON_RIGHT_M: "chevron-right-m";
		readonly CHEVRON_RIGHT_S: "chevron-right-s";
		readonly CHEVRON_RIGHT_XS: "chevron-right-xs";
		readonly CHEVRON_TOP_L: "chevron-top-l";
		readonly CHEVRON_TOP_M: "chevron-top-m";
		readonly CHEVRON_TOP_S: "chevron-top-s";
		readonly CHEVRON_TOP_XS: "chevron-top-xs";
		readonly COLLAPSE_L: "collapse-l";
		readonly COLLAPSE_M: "collapse-m";
		readonly COLLAPSE_S: "collapse-s";
		readonly COLLAPSE_XS: "collapse-xs";
		readonly CROSS_L: "cross-l";
		readonly CROSS_M: "cross-m";
		readonly CROSS_S: "cross-s";
		readonly CROSS_XS: "cross-xs";
		readonly DRAG_L: "drag-l";
		readonly DRAG_M: "drag-m";
		readonly DRAG_S: "drag-s";
		readonly DRAG_XS: "drag-xs";
		readonly EDIT_L: "edit-l";
		readonly EDIT_M: "edit-m";
		readonly EDIT_S: "edit-s";
		readonly EDIT_XS: "edit-xs";
		readonly EXCLAMATION_L: "exclamation-l";
		readonly EXCLAMATION_M: "exclamation-m";
		readonly EXCLAMATION_S: "exclamation-s";
		readonly EXCLAMATION_XS: "exclamation-xs";
		readonly EXCLAMATION_CIRCLE: "o-exclamation-circle";
		readonly EXPAND_L: "expand-l";
		readonly EXPAND_M: "expand-m";
		readonly EXPAND_S: "expand-s";
		readonly EXPAND_XS: "expand-xs";
		readonly FILTER_2_L: "filter-2-l";
		readonly FILTER_2_M: "filter-2-m";
		readonly FILTER_2_S: "filter-2-s";
		readonly FILTER_2_XS: "filter-2-xs";
		readonly GO_TO_L: "go-to-l";
		readonly GO_TO_M: "go-to-m";
		readonly GO_TO_S: "go-to-s";
		readonly GO_TO_XS: "go-to-xs";
		readonly LOCK_L: "lock-l";
		readonly LOCK_M: "lock-m";
		readonly LOCK_S: "lock-s";
		readonly LOCK_XS: "lock-xs";
		readonly LOCK_2: "lock-2";
		readonly MINUS_L: "minus-l";
		readonly MINUS_M: "minus-m";
		readonly MINUS_S: "minus-s";
		readonly MINUS_XS: "minus-xs";
		readonly MORE_L: "more-l";
		readonly MORE_M: "more-m";
		readonly MORE_S: "more-s";
		readonly MORE_XS: "more-xs";
		readonly PAUSE_L: "pause-l";
		readonly PAUSE_M: "pause-m";
		readonly PAUSE_S: "pause-s";
		readonly PAUSE_XS: "pause-xs";
		readonly PLAY_L: "play-l";
		readonly PLAY_M: "play-m";
		readonly PLAY_S: "play-s";
		readonly PLAY_XS: "play-xs";
		readonly PLUS_L: "plus-l";
		readonly PLUS_M: "plus-m";
		readonly PLUS_S: "plus-s";
		readonly PLUS_XS: "plus-xs";
		readonly STOP_L: "stop-l";
		readonly STOP_M: "stop-m";
		readonly STOP_S: "stop-s";
		readonly STOP_XS: "stop-xs";
		readonly UNLOCK_L: "unlock-l";
		readonly UNLOCK_M: "unlock-m";
		readonly UNLOCK_S: "unlock-s";
		readonly UNLOCK_XS: "unlock-xs";
		readonly SETTINGS_L: "settings-l";
		readonly SETTINGS_M: "settings-m";
		readonly SETTINGS_S: "settings-s";
		readonly SETTINGS_XS: "settings-xs";
		readonly AI_PROCESS: "ai-process";
		readonly AUTO_SELECTION: "auto-selection";
		readonly BUSINESS_PROCESS_MONEY: "business-process-money";
		readonly CALL_BACK: "call-back";
		readonly COLLAB_ADD: "collab-add";
		readonly CONTACT_DETAILS: "contact-details";
		readonly CONTRAST: "contrast";
		readonly CRM_FIELD_EXCEPT: "crm-field-except";
		readonly CRM_FIELD_LINKED: "crm-field-linked";
		readonly CRM_FIELD_SIMPLE: "crm-field-simple";
		readonly CUSTOMIZATION: "customization";
		readonly DDOS_ATTACK: "ddos-attack";
		readonly DELETE_EVENT: "delete-event";
		readonly DELIVERY_WITH_ITEM: "delivery-with-item";
		readonly DIGITS_24: "digits-24";
		readonly DOTS: "dots";
		readonly FEEDBACK_FORM: "feedback-form";
		readonly IP_ADDRESS: "ip-address";
		readonly IP_ADDRESS_CROSSED: "ip-address-crossed";
		readonly LETTER_SORT_DOWN: "letter-sort-down";
		readonly LETTER_SORT_UP: "letter-sort-up";
		readonly LIST_AI: "list-ai";
		readonly LOGO_ANDROID: "logo-android";
		readonly LOGO_APPLE: "logo-apple";
		readonly MULTI_PAGE_FORM: "multi-page-form";
		readonly NO_SCREENSHOT: "no-screenshot";
		readonly ONLINE_EVENTS: "online-events";
		readonly PAYMENT_AND_DELIVERY: "o-payment-and-delivery";
		readonly PERSONAL_FORM: "personal-form";
		readonly PRIVATE_MESSAGE: "private-message";
		readonly PROCESS: "process";
		readonly PROCESS_STOP: "process-stop";
		readonly PRODUCTS_CUBE: "products-cube";
		readonly PRODUCTS_PAYMENT: "products-payment";
		readonly PRODUCTS_PHOTO: "products-photo";
		readonly PRODUCTS_SHIRT: "products-shirt";
		readonly PRODUCTS_QUICK_CRM_FILL: "products-quick-crm-fill";
		readonly RECEIPT: "receipt";
		readonly RECEIPT_NOTE: "receipt-note";
		readonly RECORD_ON: "record-on";
		readonly REGISTRATION_ON_SITE: "registration-on-site";
		readonly SCREEN_PHONE: "screen-phone";
		readonly SERVER_SETTINGS: "server-settings";
		readonly SPEAKER_ADD: "speaker-add";
		readonly TEMPLATE_TASK: "template-task";
		readonly TEXT_FORMAT_BOTTOM: "text-format-bottom";
		readonly TEXT_FORMAT_CANCEL: "text-format-cancel";
		readonly TEXT_FORMAT_TOP: "text-format-top";
		readonly TEXT_FORMAT_TOP_LEFT: "text-format-top-left";
		readonly TEXT_FORMAT_TOP_RIGHT: "text-format-top-right";
		readonly TRAINEE: "trainee";
		readonly USER_PROFILE: "user-profile";
		readonly VERIFICATION: "verification";
		readonly VIRTUAL_SERVER: "virtual-server";
		readonly VIRTUAL_STORAGE: "virtual-storage";
		readonly VK_LEAD_FORM: "vk-lead-form";
		readonly WATERMARK: "watermark";
		readonly WIKI: "wiki";
		readonly POLL: "poll";
		readonly ACTION_REQUIRED: "action-required";
		readonly AI_INTERNET_SEARCH: "ai-internet-search";
		readonly AI_REFLECTION: "ai-reflection";
		readonly CONTACT_CENTER: "contact-center";
		readonly DELETE_PERSON: "delete-person";
		readonly DIGITS_123: "digits123";
		readonly LOCATION_PLUS: "o-location-plus";
		readonly TRANSCRIPTION: "transcription";
		readonly AUTO_CHECK_IN: "auto-check-in";
		readonly BROOM: "broom";
		readonly CHECK_DEFERRED: "check-deferred";
		readonly CHECK_IN_CANCEL: "check-in-cancel";
		readonly CHECK_IN_NEGATIVE: "check-in-negative";
		readonly COMPASS: "compass";
		readonly FACE_IDENT: "face-ident";
		readonly FINGERPRINT: "fingerprint";
		readonly GRAPHS_SETTINGS: "graphs-settings";
		readonly KEYBOARD: "o-keyboard";
		readonly MEDIA_MESSAGE: "media-message";
		readonly MOBILE_SELECTED: "mobile-selected";
		readonly NO_COMPASS: "no-compass";
		readonly PERSON_DETECT: "person-detect";
		readonly REPLY_ALL: "reply-all";
		readonly SCREEN_SELECTED: "screen-selected";
		readonly SCREEN_SHARE_PAUSE: "screen-share-pause";
		readonly SIGN_DEFAULT: "sign-default";
		readonly SIZE_W_L: "size-w-l";
		readonly STATISTICS_ARROW: "statistics-arrow";
		readonly STICKER: "sticker";
		readonly BROWSER: "browser";
		readonly MORE_VERTICAL_XS: "more-vertical-xs";
		readonly MORE_VERTICAL_S: "more-vertical-s";
		readonly MORE_VERTICAL_M: "more-vertical-m";
		readonly MORE_VERTICAL_L: "more-vertical-l";
		readonly DATABASE: "o-database";
		readonly CLIENT_CHAT: "o-client-chat";
		readonly LEGAL_PROCESSES: "o-legal-processes";
		readonly MARKETING: "o-marketing";
		readonly ROLES_LIBRARY: "o-roles-library";
		readonly AI_ROBOT: "o-ai-robot";
		readonly CONDITION: "o-condition";
		readonly DATA_READING: "o-data-reading";
		readonly FRAME_CREATE: "o-frame-create";
		readonly MCP: "o-mcp";
		readonly MCP_LETTERS: "o-mcp-letters";
		readonly MERGE: "o-merge";
		readonly STICKER_SMILE: "o-sticker-smile";
		readonly CLIENT_LETTER: "o-client-letter";
		readonly CONNECTION: "o-connection";
		readonly COPIED: "o-copied";
		readonly CRM_ONLINE_STORE: "o-crm-online-store";
		readonly CRM_PAYMENT_AND_DELIVERY: "o-crm-payment-and-delivery";
		readonly LIGHTNING_PLUS: "o-lightning-plus";
		readonly UNC_1: "o-unc-1";
		readonly DOCUMENT_SIGN: "o-document-sign";
		readonly BLACK_LIST: "o-black-list";
		readonly IMPORTANT_TASK: "o-important-task";
		readonly ADD_DATABASE: "o-add-database";
		readonly BANK_CARD: "o-bank-card";
		readonly CIRCLECHECK_FORWARD: "o-circlecheck-forward";
		readonly CROWN_1: "o-crown-1";
		readonly DIAL_10: "o-dial-10";
		readonly DIAL_20: "o-dial-20";
		readonly DOCUMENT_LINK: "o-document-link";
		readonly DOCUMENT_PRINT: "o-document-print";
		readonly LIST_AI_2: "o-list-ai-2";
		readonly PARTS_RECORD: "o-parts-record";
		readonly PARTS_RECORD_PLAY: "o-parts-record-play";
		readonly PARTS_RECORD_STOP: "o-parts-record-stop";
		readonly PLANNING_2: "o-planning-2";
		readonly SEEN_ITEMS: "o-seen-items";
		readonly SHOP_ORDER: "o-shop-order";
		readonly SSO: "o-sso";
		readonly TABLE: "o-table";
		readonly TASK_FIRE: "o-task-fire";
		readonly UNIVERSAL_ACCESS: "o-universal-access";
		readonly VISITED_ITEMS: "o-visited-items";
		readonly WEBHOOK: "o-webhook";
		readonly TEXT_FORMAT_RESET: "o-text-format-reset";
		readonly SPOILER: "o-spoiler";
		readonly OPEN_NEW: "o-open-new";
		readonly LIST_VIEWER: "o-list-viewer";
		readonly VIDEO_RECORD_2: "o-video-record-2";
		readonly THREE_PERSONS_CHECK: "o-three-persons-check";
		readonly PACKAGE_RECEIVE: "o-package-receive";
		readonly PACKAGE_CANCEL: "o-package-cancel";
		readonly LOWER_LEFT_ARROW: "o-lower-left-arrow";
		readonly MAIL_PLUS: "o-mail-plus";
		readonly MESSAGES_MULTI: "o-messages-multi";
		readonly CRM_FORM: "o-crm-form";
		readonly BITRIX_GPT: "bitrix-gpt";
		readonly RECENT_ITEMS: "o-recent-items";
		readonly SET_KANBAN: "o-set-kanban";
		readonly TEMPLATE_PLUS: "o-template-plus";
		readonly O_TEMPLATE_TASK: "o-template-task";
		readonly COOKIES: "o-cookies";
		readonly PAGES: "o-pages";
		readonly VIBECODE_CATALOG: "o-vibecode-catalog";
		readonly VIBE_BLACKHOLE: "o-vibe-blackhole";
		readonly COMMANDS: "o-commands";
		readonly FILE_WITH_CALENDAR: "o-file-with-calendar";
		readonly FILE_WITH_CROWN: "o-file-with-crown";
		readonly FILE_WITH_PERSON: "o-file-with-person";
		readonly NO_CLOUD_SYNC: "o-no-cloud-sync";
		readonly A_LETTER_SORT_DOWN: "o-a-letter-sort-down";
		readonly A_LETTER_SORT_UP: "o-a-letter-sort-up";
		readonly ADD_TO_CHAT: "o-add-to-chat";
		readonly AI_PROJECTS: "o-ai-projects";
		readonly AI_PROJECTS_2: "o-ai-projects-2";
		readonly AI_STARS_QUESTION_2: "o-ai-stars-question-2";
		readonly AI_TWO_STARS: "o-ai-two-stars";
		readonly ALIGN_IMAGE_CENTER: "o-align-image-center";
		readonly ALIGN_IMAGE_LEFT: "o-align-image-left";
		readonly ALIGN_IMAGE_RIGHT: "o-align-image-right";
		readonly BACK: "o-back";
		readonly BALL_ONE: "o-ball-one";
		readonly BEER: "o-beer";
		readonly BITRIX_GPT_ROUND: "o-bitrix-gpt-round";
		readonly BLOCK_INSERTION: "o-block-insertion";
		readonly BOOK_OPEN: "o-book-open";
		readonly BOTTOM_TOP_COLLAPSE_L: "o-bottom-top-collapse-l";
		readonly BOTTOM_TOP_COLLAPSE_M: "o-bottom-top-collapse-m";
		readonly BOTTOM_TOP_COLLAPSE_S: "o-bottom-top-collapse-s";
		readonly BOTTOM_TOP_COLLAPSE_XS: "o-bottom-top-collapse-xs";
		readonly BRANCH_NETWORK: "o-branch-network";
		readonly CAKE_CELEBRATING: "o-cake-celebrating";
		readonly CHANGE_PLACES: "o-change-places";
		readonly CLAW: "o-claw";
		readonly CLOUD_SYNC_CROSS: "o-cloud-sync-cross";
		readonly COLLECTION: "o-collection";
		readonly COLUMNS_SIDEBAR_PENDING_LEFT: "o-columns-sidebar-pending-left";
		readonly COMPANY_PLUS: "o-company-plus";
		readonly COMPANY_SEND: "o-company-send";
		readonly CONTACT_SEND: "o-contact-send";
		readonly COPY_LINK: "o-copy-link";
		readonly CORE: "o-core";
		readonly CRM_OPTIONAL_ACCEPTED: "o-crm-optional-accepted";
		readonly CRM_OPTIONAL_NOT_ACCEPTED: "o-crm-optional-not-accepted";
		readonly CRM_REQUIRED_CONSENT: "o-crm-required-consent";
		readonly CROWN_FORWARD: "o-crown-forward";
		readonly CUP_WINNER: "o-cup-winner";
		readonly DEEP_SEARCH_AI: "o-deep-search-ai";
		readonly DESKTOP_MACOS: "o-desktop-macos";
		readonly DESKTOP_WINDOWS: "o-desktop-windows";
		readonly DISCOUNT: "o-discount";
		readonly DO_NOT_USE_CAPTCHA: "o-do-not-use-captcha";
		readonly EMPLOYEE: "o-employee";
		readonly EXCEL: "o-excel";
		readonly EXPORT: "o-export";
		readonly FILL_OUT_AGAIN: "o-fill-out-again";
		readonly FLOWER: "o-flower";
		readonly FOLDERS: "o-folders";
		readonly FUNCTION: "o-function";
		readonly GALAXY: "o-galaxy";
		readonly GALAXY_SERVER: "o-galaxy-server";
		readonly GRAPHS_LINK: "o-graphs-link";
		readonly HANDSHAKE_SEND: "o-handshake-send";
		readonly HEADLINES: "o-headlines";
		readonly HEADLINES_H1: "o-headlines-h1";
		readonly HEADLINES_H2: "o-headlines-h2";
		readonly HEADLINES_H3: "o-headlines-h3";
		readonly HEADLINES_H4: "o-headlines-h4";
		readonly HEADLINES_H5: "o-headlines-h5";
		readonly HIDE_1: "o-hide-1";
		readonly HIDE_2: "o-hide-2";
		readonly IMAGE_SMALL: "o-image-small";
		readonly IMPORT: "o-import";
		readonly LEAD_SEND: "o-lead-send";
		readonly LIBRARY_BASE: "o-library-base";
		readonly LINK_UPDATE: "o-link-update";
		readonly LIST_TASKS_ADD: "o-list-tasks-add";
		readonly LOGIN_HISTORY: "o-login-history";
		readonly MARTINI_GLASS: "o-martini-glass";
		readonly MESSAGE_TO: "o-message-to";
		readonly MESSENGER_SEND: "o-messenger-send";
		readonly MICROPHONE_AI: "o-microphone-ai";
		readonly MICROPHONE_SOUNDS_AI: "o-microphone-sounds-ai";
		readonly MOBILE_FILL: "o-mobile-fill";
		readonly MONEY_PRIZE: "o-money-prize";
		readonly MY_DEALS_SEND: "o-my-deals-send";
		readonly ONLINE_BANK: "o-online-bank";
		readonly OPEN_SEQUENCE: "o-open-sequence";
		readonly OUTLINE_ICON_BUSINESS_PROCESS_PROGRESS: "o-outline-icon-business-process-progress";
		readonly PERSON_MENTION: "o-person-mention";
		readonly PERSON_OFFICE: "o-person-office";
		readonly PLAY_WAVES: "o-play-waves";
		readonly PLUG_LEFT: "o-plug-left";
		readonly PLUG_RIGHT: "o-plug-right";
		readonly PREVIOUS: "o-previous";
		readonly RADIANT: "o-radiant";
		readonly RECENT_CARDS: "o-recent-cards";
		readonly RECENT_CHATS: "o-recent-chats";
		readonly RECORD_VIDEO_AI: "o-record-video-ai";
		readonly REDIRECT: "o-redirect";
		readonly REVEAL_1: "o-reveal-1";
		readonly REVEAL_2: "o-reveal-2";
		readonly SAVE_TEMPLATE: "o-save-template";
		readonly SAVE_TEMPLATE_PLUS: "o-save-template-plus";
		readonly SCREEN_NO_SHARE: "o-screen-no-share";
		readonly SCREEN_SHARE: "o-screen-share";
		readonly SEARCH_AND_RAG: "o-search-and-rag";
		readonly SEND_VIA_BITRIX: "o-send-via-bitrix";
		readonly SERVICE: "o-service";
		readonly SIGNAL: "o-signal";
		readonly SLASH: "o-slash";
		readonly START_EDUCATION: "o-start-education";
		readonly STRESS_NO: "o-stress-no";
		readonly SUBSCRIPT: "o-subscript";
		readonly SUBSCRIPTION: "o-subscription";
		readonly SUPERSCRIPT: "o-superscript";
		readonly SWITCH_DEVICE: "o-switch-device";
		readonly TARIFF: "o-tariff";
		readonly TEAMS: "o-teams";
		readonly THREADS: "o-threads";
		readonly THREE_SQUARES: "o-three-squares";
		readonly TOP_BOTTOM_EXPAND_L: "o-top-bottom-expand-l";
		readonly TOP_BOTTOM_EXPAND_M: "o-top-bottom-expand-m";
		readonly TOP_BOTTOM_EXPAND_S: "o-top-bottom-expand-s";
		readonly TOP_BOTTOM_EXPAND_XS: "o-top-bottom-expand-xs";
		readonly TRASHCAN_TIMER: "o-trashcan-timer";
		readonly VIBE_PLUS: "o-vibe-plus";
		readonly VIBECODE: "o-vibecode";
		readonly VIDEO_RECORD: "o-video-record";
		readonly VIDEO_RECORD_3: "o-video-record-3";
		readonly VIDEO_RECORD_4: "o-video-record-4";
		readonly VIDEO_RECORD_5: "o-video-record-5";
	}>;
}
