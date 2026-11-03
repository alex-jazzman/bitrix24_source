/* eslint-disable */
type AiTaskIndicationLayoutValue = (typeof BX.Messenger.v2.Component.Message.AiTaskIndicationLayout)[keyof typeof BX.Messenger.v2.Component.Message.AiTaskIndicationLayout];

type AiTaskFrame = {
	name: string;
	matches: (operation: BX.Messenger.v2.Model.AiTaskOperation) => boolean;
	labelKey: string;
	icon: string;
	tone: string;
	isTerminal: boolean;
	extinguishesDecor: boolean;
	politeness: BX.UI.Accessibility.AriaLivePoliteness;
};

type AiTaskOperationSource = {
	getters: {
		'aiTask/getForChat': (chatId: number) => BX.Messenger.v2.Model.AiTaskOperation | null;
	};
};

type ChangeResult = {
	status: typeof BX.Messenger.v2.Component.Message.ChangeStatus[keyof typeof BX.Messenger.v2.Component.Message.ChangeStatus];
};

type ReactionItem = {
	id: number;
	messageId: number;
	userId: number;
	reaction: string;
	dateReaction: string;
};

type ReactionSelectorData = {
	mainReactionOnboardingGeometry: MainReactionOnboardingGeometry | null;
};

type MainReactionOnboardingGeometry = {
	popoverRect: DOMRect;
	selectorRect: DOMRect;
};

type MainReactionOnboardingData = {
	isClosed: boolean;
	isDisplayConfirmed: boolean;
};

type PopupPosition = 'top' | 'bottom';

type SourceEntry = {
	url: string;
	title: string;
	description: string;
};

type SourceItem = {
	url: string;
	metaData?: {
		title: string;
		description: string;
	};
};

declare namespace BX.Messenger.v2.Component.Message {
	const TextContent: BX.Vue3.DefineComponent<BX.Vue3.ExtractPropTypes<{
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

	const MessageStatus: BX.Vue3.DefineComponent<BX.Vue3.ExtractPropTypes<{
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
		messageStatus(): $Values<typeof BX.Messenger.v2.Const.OwnMessageStatus>;
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

	const AiTaskIndication: BX.Vue3.DefineComponent<BX.Vue3.ExtractPropTypes<{
		message: {
			type: BX.Vue3.PropType<BX.Messenger.v2.Model.ImModelMessage>;
			required: true;
		};
		layout: {
			type: BX.Vue3.PropType<AiTaskIndicationLayoutValue>;
			default: "bubble";
		};
	}>, {}, {
		isOffscreen: boolean;
	}, {
		operation(): BX.Messenger.v2.Model.AiTaskOperation | null;
		frame(): AiTaskFrame | null;
		/**
		 * The name alone, so the watcher below hears a change of the frame and not every re-read of
		 * the operation the store hands out.
		 */
		frameName(): string | null;
		/**
		 * Every indicated source carries the rim, but the caption message alone reports its visibility
		 * and speaks for the operation. One expression of the rule, so the two cannot drift apart.
		 */
		isCaptionPlace(): boolean;
		/**
		 * The caption of a bubble is mounted by the content of the message, inside the row that
		 * already carries the time and the delivery ticks; the other two layouts have no such row,
		 * so their plate is a child of this fragment and stands under the graphics.
		 */
		withStatusPlate(): boolean;
		/** How many messages the operation was started on, those drawn without the rim included. */
		sourceCount(): number;
		/**
		 * A set of sources is named by its size, a single message is not: an operation on one message
		 * is the usual case, and reading a count out to it would be arithmetic instead of a fact.
		 */
		entryAnnouncement(): string;
		sourceMark(): string;
		decorClasses(): string[];
	}, {
		onMessageIsVisible(event: BX.Event.BaseEvent<{
			messageId: number;
		}>): void;
		onMessageIsNotVisible(event: BX.Event.BaseEvent<{
			messageId: number;
		}>): void;
		handleVisibilityEvent(event: BX.Event.BaseEvent<{
			messageId: number;
		}>, visible: boolean): void;
		/**
		 * The single writer of `anchorVisible`: the pull handler only reads the field, and it reads
		 * it as the visibility of the caption, so an instance mounted on any other source stays silent.
		 */
		reportAnchorVisibility(visible: boolean): void;
		/**
		 * The only announcement channel of the indication. The visual row carries no live semantics of
		 * its own: it enters the DOM together with its content, and a region born that way loses its
		 * first announcement. `LiveAnnouncer` keeps one region mounted ahead of any operation, holds a
		 * single shared instance for the whole page and pushes an assertive message past the queue -
		 * so the failure does not wait behind the progress of the run.
		 */
		announceFrame(previousName: string | null): void;
		loc(phraseCode: string): string;
	}, BX.Vue3.ComponentOptionsMixin, BX.Vue3.ComponentOptionsMixin, {}, string, BX.Vue3.PublicProps, Readonly<BX.Vue3.ExtractPropTypes<{
		message: {
			type: BX.Vue3.PropType<BX.Messenger.v2.Model.ImModelMessage>;
			required: true;
		};
		layout: {
			type: BX.Vue3.PropType<AiTaskIndicationLayoutValue>;
			default: "bubble";
		};
	}>> & Readonly<{}>, {
		layout: AiTaskIndicationLayoutValue;
	}, {}, {
		AiTaskStatusRow: typeof AiTaskStatusRow;
	}, {}, string, BX.Vue3.ComponentProvideOptions, true, {}, any>;

	/**
	 * The model side of the indication, shared by the layer around the message and the caption row.
	 * The two are mounted by different hosts (the layer by `BaseMessage` inside the body, the caption
	 * of a bubble by `DefaultMessageContent` inside the time row), so the frame table cannot live in
	 * either of them without one importing the other.
	 */
	/**
	 * Shape of the indication around the message. `BaseMessage` picks the value from the signs it
	 * already has: a bubble with a background, edge-to-edge media (a transparent body) or the round
	 * player of a video note.
	 */
	const AiTaskIndicationLayout: Readonly<{
		bubble: "bubble";
		media: "media";
		round: "round";
		mediaCaption: "media-caption";
	}>;

	/**
	 * The caption of the running operation: an icon, the stage and the running dots. Mounted by
	 * whoever owns the place it belongs in - the time row of the message for a bubble (map §3.2), the
	 * layer around the graphics for media and the round player (§3.3) - which is why it is a component
	 * of its own and not a branch of `AiTaskIndication`.
	 *
	 * It carries no state and speaks to nobody: the visibility of the caption message and the
	 * announcements of the operation stay with `AiTaskIndication`, mounted on every indicated message.
	 */
	const AiTaskStatusRow: BX.Vue3.DefineComponent<BX.Vue3.ExtractPropTypes<{
		message: {
			type: BX.Vue3.PropType<BX.Messenger.v2.Model.ImModelMessage>;
			required: true;
		};
		layout: {
			type: BX.Vue3.PropType<AiTaskIndicationLayoutValue>;
			default: "bubble";
		};
	}>, {}, {}, {
		stages: () => readonly AiTaskFrame[];
		operation(): BX.Messenger.v2.Model.AiTaskOperation | null;
		/**
		 * Every indicated source carries the layer, the caption message alone carries the caption. The
		 * row asks the operation about it rather than being told, so a host that mounts it on every
		 * source of the set still ends up with one caption.
		 */
		isCaptionPlace(): boolean;
		frame(): AiTaskFrame | null;
		layoutModifier(): string;
	}, {
		isCurrentStage(stage: AiTaskFrame): boolean;
		loc(phraseCode: string): string;
	}, BX.Vue3.ComponentOptionsMixin, BX.Vue3.ComponentOptionsMixin, {}, string, BX.Vue3.PublicProps, Readonly<BX.Vue3.ExtractPropTypes<{
		message: {
			type: BX.Vue3.PropType<BX.Messenger.v2.Model.ImModelMessage>;
			required: true;
		};
		layout: {
			type: BX.Vue3.PropType<AiTaskIndicationLayoutValue>;
			default: "bubble";
		};
	}>> & Readonly<{}>, {
		layout: AiTaskIndicationLayoutValue;
	}, {}, {
		BIcon: typeof BX.UI.IconSet.BIcon;
	}, {}, string, BX.Vue3.ComponentProvideOptions, true, {}, any>;

	/**
	 * Injection key of the placement contract. The host of the message provides the layout of the
	 * running indication (`null` when there is none), and the content of the message reads it to know
	 * whether the caption belongs in its own time row. A prop cannot carry it: the content is slotted
	 * into the host, so the host never renders it and has nothing to pass it through.
	 */
	const AiTaskIndicationLayoutKey = "imAiTaskIndicationLayout";

	/**
	 * Gate for the `v-if` in `BaseMessage`: costs a single collection lookup and answers `false`
	 * right there when the chat has no operation. Exported so the membership rule (the message is
	 * one of the indicated sources) lives in one place only.
	 */
	function hasAiTaskIndication(store: AiTaskOperationSource, message: BX.Messenger.v2.Model.ImModelMessage): boolean;

	const MessageAttach: BX.Vue3.DefineComponent<BX.Vue3.ExtractPropTypes<{
		item: {
			type: BX.Vue3.PropType<BX.Messenger.v2.Model.ImModelMessage>;
			required: true;
		};
		dialogId: {
			type: StringConstructor;
			required: true;
		};
	}>, {}, {}, {
		dialog(): BX.Messenger.v2.Model.ImModelChat;
		user(): BX.Messenger.v2.Model.ImModelUser;
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
		Attach: typeof BX.Messenger.v2.Component.Elements.Attach;
	}, {}, string, BX.Vue3.ComponentProvideOptions, true, {}, any>;

	const MessageKeyboard: BX.Vue3.DefineComponent<BX.Vue3.ExtractPropTypes<{
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
		dialog(): BX.Messenger.v2.Model.ImModelChat;
		user(): BX.Messenger.v2.Model.ImModelUser;
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
		Keyboard: typeof BX.Messenger.v2.Component.Elements.Keyboard;
	}, {}, string, BX.Vue3.ComponentProvideOptions, true, {}, any>;

	const ChangeStatus: {
		readonly confirmed: "confirmed";
		readonly pending: "pending";
		readonly superseded: "superseded";
	};

	class MessageDefaultReactionManager {
		static getInstance(): MessageDefaultReactionManager;
		init(): void;
		destroy(): void;
		changeDefaultReaction(reaction: string): Promise<ChangeResult>;
		onDefaultReactionPull(reaction: string): void;
		onOnline(): void;
	}

	const ReactionList: BX.Vue3.DefineComponent<BX.Vue3.ExtractPropTypes<{
		messageId: {
			type: (NumberConstructor | StringConstructor)[];
			required: true;
		};
	}>, {
		reactionService: ReactionService | null;
	}, {
		reactionsToAnimate: Set<string>;
	}, {
		message(): BX.Messenger.v2.Model.ImModelMessage;
		dialog(): BX.Messenger.v2.Model.ImModelChat;
		reactionsData(): BX.Messenger.v2.Model.ImModelReactions;
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
		onPickerReactionSelected(event: BX.Event.BaseEvent<{
			messageId: number;
			reaction: string;
		}>): Promise<void>;
		getReactionUsers(reaction: string): number[];
		getReactionService(): ReactionService;
		getEmitter(): BX.Event.EventEmitter;
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
			Reaction: typeof import("../../../../../../../../../../ui/install/js/ui/reaction/item/src/vue").Reaction;
		}, {}, string, BX.Vue3.ComponentProvideOptions, true, {}, any>;
	}, {}, string, BX.Vue3.ComponentProvideOptions, true, {}, any>;

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

	const ReactionSelector: BX.Vue3.DefineComponent<BX.Vue3.ExtractPropTypes<{
		messageId: {
			type: (NumberConstructor | StringConstructor)[];
			required: true;
		};
	}>, {
		picker: BX.UI.Reaction.Picker.ReactionPicker | null;
		showTimeout: number;
		hideTimeout: number;
	}, ReactionSelectorData, {
		message(): BX.Messenger.v2.Model.ImModelMessage;
		dialog(): BX.Messenger.v2.Model.ImModelChat;
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
		onSelectorSelect(selectEvent: BX.Event.BaseEvent): void;
		onSelectorExpand(): void;
		onSelectorHide(): void;
		startHideTimer(): void;
		clearHideTimer(): void;
		onIconClick(): void;
		getEmitter(): BX.Event.EventEmitter;
	}, BX.Vue3.ComponentOptionsMixin, BX.Vue3.ComponentOptionsMixin, {}, string, BX.Vue3.PublicProps, Readonly<BX.Vue3.ExtractPropTypes<{
		messageId: {
			type: (NumberConstructor | StringConstructor)[];
			required: true;
		};
	}>> & Readonly<{}>, {}, {}, {
		MainReactionOnboarding: typeof MainReactionOnboarding;
		Reaction: typeof BX.UI.Reaction.Item.Vue.Reaction;
	}, {}, string, BX.Vue3.ComponentProvideOptions, true, {}, any>;

	const MainReactionOnboarding: BX.Vue3.DefineComponent<BX.Vue3.ExtractPropTypes<{
		geometry: {
			type: BX.Vue3.PropType<MainReactionOnboardingGeometry | null>;
			default: null;
		};
		messageId: {
			type: (NumberConstructor | StringConstructor)[];
			required: true;
		};
	}>, {}, MainReactionOnboardingData, {
		closeIcon(): string;
		isVisible(): boolean;
		popupId(): string;
		position(): PopupPosition;
		width(): number;
		config(): BX.Main.PopupOptions;
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
		MessengerPopup: typeof BX.Messenger.v2.Component.Elements.MessengerPopup;
		BIcon: typeof BX.UI.IconSet.BIcon;
	}, {}, string, BX.Vue3.ComponentProvideOptions, true, {}, any>;

	const Reply: BX.Vue3.DefineComponent<BX.Vue3.ExtractPropTypes<{
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
		dialog(): BX.Messenger.v2.Model.ImModelChat;
		replyMessage(): BX.Messenger.v2.Model.ImModelMessage | null | undefined;
		replyMessageChat(): BX.Messenger.v2.Model.ImModelChat | null | undefined;
		replyAuthor(): BX.Messenger.v2.Model.ImModelUser | null | undefined;
		replyTitle(): string;
		/** Files attached to the original message — read once, reused by the file/gallery computed below */
		messageFiles(): BX.Messenger.v2.Model.ImModelFile[];
		messageFile(): BX.Messenger.v2.Model.ImModelFile | null | undefined;
		contactAvatarTitle(): string;
		contactAvatarUrl(): string;
		isImage(): boolean;
		isVideo(): boolean;
		/**
		 * Video note (round video message). Keeps FileType.video — there is no separate file type;
		 * the round-message flag lives on the file. Rendered as a compact round thumbnail (its
		 * urlPreview poster) instead of the rectangular video thumbnail — like a single media
		 * thumbnail. The thumbnail itself carries no type caption: the type label belongs to the quote
		 * text row and arrives with the general parse (see showVideoNoteTypeLabel). The
		 * IM_PARSER_ICON_TYPE_VIDEO_NOTE phrase is still used as the image alt (a11y).
		 */
		isVideoNote(): boolean;
		isFile(): boolean;
		isAudio(): boolean;
		isSticker(): boolean;
		/** Sticker image URI of the original message (null if not a sticker or sticker data is not in store) */
		stickerImageUri(): string | null;
		/** Number of files attached to the original message */
		galleryCount(): number;
		/** First files of the original message shown as an overlapped stack (max GALLERY_STACK_MAX) */
		galleryThumbnails(): BX.Messenger.v2.Model.ImModelFile[];
		/** Files beyond the ones shown in the stack — rendered as a "+N" badge */
		galleryRemainingCount(): number;
		/**
		 * Count modifier for the gallery stack. The stack items are absolutely positioned, so the
		 * container cannot size itself to its content (fit-content would collapse it). The fixed base
		 * width fits the 3-thumbnail layout; for 1/2 shown thumbnails the container must shrink to the
		 * actual right edge of the last (rotated) thumbnail — otherwise the flex gap to the caption
		 * grows and the stack↔text spacing looks inconsistent between 2- and 3-media quotes.
		 */
		galleryStackModifier(): string;
		/** True when the original bundles several media (image/video) — show the stack instead of a single thumbnail */
		isGallery(): boolean;
		/**
		 * The gallery stack is rendered only when there are several media AND the first file has a
		 * preview (otherwise the type icon is shown instead). Used both to gate the stack template
		 * and the preview media-offset so the extra top margin is not added when the icon is shown.
		 */
		showGalleryStack(): boolean;
		/** Pluralized "N media" caption for the gallery preview */
		mediaCountText(): string;
		showIcon(): boolean;
		truncatedFileName(): string;
		iconClass(): string;
		/** Human-readable size of the file reply (empty when the file has no known size) */
		fileSize(): string;
		isMessageDeleted(): boolean;
		replyText(): string;
		isQuoteFromTheSameChat(): boolean;
		replyContext(): string;
		canShowReply(): boolean;
		isActiveQuote(): boolean;
		quoteClasses(): Record<string, boolean>;
		toggleLabel(): string;
		/**
		 * The original always travels with the reply (server bundles it as additionalMessages/additionalEntities).
		 * So an absent original means it is inaccessible to the current user — show the "unavailable" fallback.
		 */
		isUnavailable(): boolean;
		/** True when the original is present and not deleted */
		hasOriginal(): boolean;
		/** True when the original is present but deleted */
		isDeleted(): boolean;
		/** Show media preview only when the original is present and not deleted */
		showMediaPreview(): boolean;
		useCompactContactLayout(): boolean;
		isContactMessage(): boolean;
		/**
		 * With the caption feature on, a video note quote keeps the type label in both preview states,
		 * so it goes through the general quote parse: that parse is the single source of the label and
		 * of its wording, shared with the chat list preview.
		 */
		showVideoNoteTypeLabel(): boolean;
		/**
		 * Caption shown next to the media preview. For image/video and stickers with a thumbnail the type
		 * is already conveyed by the thumbnail, so the textual type prefix (image/video/sticker) would
		 * duplicate it — suppress it. Other types keep the full quote text.
		 */
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

	const AuthorTitle: BX.Vue3.DefineComponent<BX.Vue3.ExtractPropTypes<{
		item: {
			type: BX.Vue3.PropType<BX.Messenger.v2.Model.ImModelMessage>;
			required: true;
		};
	}>, {}, {}, {
		message(): BX.Messenger.v2.Model.ImModelMessage;
		dialog(): BX.Messenger.v2.Model.ImModelChat;
		user(): BX.Messenger.v2.Model.ImModelUser;
		isSystemMessage(): boolean;
		isSelfMessage(): boolean;
		isUserChat(): boolean;
		isBotWithFakeAuthorNames(): boolean;
		isNetworkBot(): boolean;
		isSupportBot(): boolean;
		showTitle(): boolean;
		authorDialogId(): string;
		isCopilot(): boolean;
		canMentionByClick(): boolean;
	}, {
		onAuthorNameClick(): void;
		getEmitter(): BX.Event.EventEmitter;
	}, BX.Vue3.ComponentOptionsMixin, BX.Vue3.ComponentOptionsMixin, {}, string, BX.Vue3.PublicProps, Readonly<BX.Vue3.ExtractPropTypes<{
		item: {
			type: BX.Vue3.PropType<BX.Messenger.v2.Model.ImModelMessage>;
			required: true;
		};
	}>> & Readonly<{}>, {}, {}, {
		MessageAuthorTitle: typeof BX.Messenger.v2.Component.Elements.MessageAuthorTitle;
	}, {}, string, BX.Vue3.ComponentProvideOptions, true, {}, any>;

	const ContextMenu: BX.Vue3.DefineComponent<BX.Vue3.ExtractPropTypes<{
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
		getEmitter(): BX.Event.EventEmitter;
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

	const RetryButton: BX.Vue3.DefineComponent<BX.Vue3.ExtractPropTypes<{
		message: {
			type: BX.Vue3.PropType<BX.Messenger.v2.Model.ImModelMessage>;
			required: true;
		};
		dialogId: {
			type: StringConstructor;
			required: true;
		};
	}>, {
		contextMenu: RetryContextMenu | null;
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

	class RetryContextMenu extends BX.Messenger.v2.Lib.BaseMenu {
		context: BX.Messenger.v2.Model.ImModelMessage & {
			dialogId: string;
		};
		constructor();
		getMenuItems(): BX.UI.System.MenuItemOptions[] | null[];
		getRetryItem(): BX.UI.System.MenuItemOptions | null;
		getDeleteItem(): BX.UI.System.MenuItemOptions | null | undefined;
	}

	const MessageHeader: BX.Vue3.DefineComponent<BX.Vue3.ExtractPropTypes<{
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
		OutlineIcons(): typeof BX.UI.IconSet.Outline;
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
		/**
		 * By parentChatId, not by chatType: a thread and the comments of a channel share the type
		 * 'comment', so branching by type would swap the two captions.
		 */
		isDiscussionForward(): boolean;
		isCommentsForwardParent(): boolean;
		/** Unlike forwardChatName, an absent name stays absent instead of becoming a closed channel. */
		forwardParentName(): string | null;
		forwardAuthorName(): string;
		forwardChatName(): string;
		isSystemMessage(): boolean;
		isSystemAuthor(): boolean;
		shouldShowAuthorTitle(): boolean;
		forwardAuthorTitle(): string;
		/**
		 * Without the name the caption still speaks the language of its source. A parent of an unknown
		 * kind - a deleted chat, an answer of a server that does not send the type - has no language of
		 * its own and keeps the generic caption.
		 */
		forwardDiscussionNoNamePhraseCode(): string;
		forwardDiscussionTitle(): string;
		forwardChannelTitle(): string;
		iconColor(): string;
	}, {
		onForwardClick(): void;
		getEmitter(): BX.Event.EventEmitter;
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
		AuthorTitle: typeof AuthorTitle;
		BIcon: typeof BX.UI.IconSet.BIcon;
	}, {}, string, BX.Vue3.ComponentProvideOptions, true, {}, any>;

	const MessageFooter: BX.Vue3.DefineComponent<BX.Vue3.ExtractPropTypes<{
		item: {
			type: BX.Vue3.PropType<BX.Messenger.v2.Model.ImModelMessage>;
			required: true;
		};
		dialogId: {
			type: StringConstructor;
			required: true;
		};
	}>, {}, BX.JsonObject, {
		dialog(): BX.Messenger.v2.Model.ImModelChat;
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
		CommentsPanel: typeof CommentsPanel;
	}, {}, string, BX.Vue3.ComponentProvideOptions, true, {}, any>;

	const CommentsPanel: BX.Vue3.DefineComponent<BX.Vue3.ExtractPropTypes<{
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
		dialog(): BX.Messenger.v2.Model.ImModelChat;
		message(): BX.Messenger.v2.Model.ImModelMessage;
		commentInfo(): BX.Messenger.v2.Model.ImModelCommentInfo;
		commentsChatId(): number;
		commentsCount(): number;
		commentsCountText(): string;
		noComments(): boolean;
		lastUsers(): BX.Messenger.v2.Model.ImModelUser[];
		unreadCount(): string;
		isSubscribed(): boolean;
		showSubscribeIcon(): boolean;
		subscribeIconTitle(): string;
		isRealMessage(): boolean;
	}, {
		onCommentsClick(): void;
		onSubscribeIconClick(): void;
		getEmitter(): BX.Event.EventEmitter;
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
				user(): BX.Messenger.v2.Model.ImModelUser;
				customAvatarUrl(): string;
				avatarDialog(): BX.Messenger.v2.Model.ImModelChat;
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

	const DefaultMessageContent: BX.Vue3.DefineComponent<BX.Vue3.ExtractPropTypes<{
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
		/**
		 * The caption of a running AI task, when the host says it belongs in the time row of this
		 * message (map §3.2). The row itself decides whether this very message is the one to carry
		 * it: the operation marks a whole set of sources, and only its caption message gets one.
		 */
		aiTaskStatusLayout(): AiTaskIndicationLayoutValue | null;
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
		AiTaskStatusRow: typeof AiTaskStatusRow;
		MessageStatus: typeof MessageStatus;
		MessageAttach: typeof MessageAttach;
		ReactionList: typeof ReactionList;
		Reply: typeof Reply;
		TextContent: typeof TextContent;
		BuilderContent: typeof BuilderContent;
	}, {}, string, BX.Vue3.ComponentProvideOptions, true, {}, any>;

	const BuilderContent: BX.Vue3.DefineComponent<BX.Vue3.ExtractPropTypes<{
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
		SourceListButton: typeof SourceListButton;
		CardBlock: typeof CardBlock;
	}, {}, string, BX.Vue3.ComponentProvideOptions, true, {}, any>;

	const SourceListButton: BX.Vue3.DefineComponent<BX.Vue3.ExtractPropTypes<{
		messageBlocks: {
			type: BX.Vue3.PropType<Array<{
				sources?: Record<string, unknown>;
			}>>;
			required: true;
		};
		messageId: {
			type: (NumberConstructor | StringConstructor)[];
			required: true;
		};
	}>, {}, {
		showSlider: boolean;
	}, {
		ChipSize: () => Readonly<{
			Lg: "l";
			Md: "m";
			Sm: "s";
			Xs: "xs";
		}>;
		ChipDesign: () => Readonly<{
			Filled: "filled";
			FilledSuccess: "filled-success";
			FilledAlert: "filled-alert";
			FilledWarning: "filled-warning";
			FilledNoAccent: "filled-no-accent";
			FilledInverted: "filled-inverted";
			FilledSuccessInverted: "filled-success-inverted";
			FilledAlertInverted: "filled-alert-inverted";
			FilledWarningInverted: "filled-warning-inverted";
			FilledNoAccentInverted: "filled-no-accent-inverted";
			FilledBitrixGpt: "filled-bitrix-gpt";
			Tinted: "tinted";
			TintedSuccess: "tinted-success";
			TintedAlert: "tinted-alert";
			TintedWarning: "tinted-warning";
			TintedNoAccent: "tinted-no-accent";
			TintedBitrixGpt: "tinted-bitrix-gpt";
			OutlineAccent: "outline-accent";
			OutlineAccent2: "outline-accent-2";
			OutlineSuccess: "outline-success";
			OutlineAlert: "outline-alert";
			OutlineWarning: "outline-warning";
			Outline: "outline";
			OutlineNoAccent: "outline-no-accent";
			OutlineCopilot: "outline-copilot";
			OutlineBitrixGpt: "outline-bitrix-gpt";
			ShadowNoAccent: "shadow-no-accent";
			Shadow: "shadow";
			ShadowAccent: "shadow-accent";
			ShadowDisabled: "shadow-disabled";
			ShadowOutlineAccent2: "shadow-outline-accent-2";
			ShadowOutline: "shadow-outline";
			Disabled: "disabled";
		}>;
		OutlineIcons(): typeof BX.UI.IconSet.Outline;
		hasSources(): boolean;
	}, {
		handleButtonClick(): void;
		handleSliderClose(): void;
		loc(phraseCode: string): string;
	}, BX.Vue3.ComponentOptionsMixin, BX.Vue3.ComponentOptionsMixin, {}, string, BX.Vue3.PublicProps, Readonly<BX.Vue3.ExtractPropTypes<{
		messageBlocks: {
			type: BX.Vue3.PropType<Array<{
				sources?: Record<string, unknown>;
			}>>;
			required: true;
		};
		messageId: {
			type: (NumberConstructor | StringConstructor)[];
			required: true;
		};
	}>> & Readonly<{}>, {}, {}, {
		Chip: typeof BX.UI.System.Chip.Vue.Chip;
		SourceListSlider: typeof SourceListSlider;
		BIcon: typeof BX.UI.IconSet.BIcon;
	}, {}, string, BX.Vue3.ComponentProvideOptions, true, {}, any>;

	const SourceListSlider: BX.Vue3.DefineComponent<BX.Vue3.ExtractPropTypes<{
		messageBlocks: {
			type: BX.Vue3.PropType<BX.Messenger.v2.Const.AnyBlockType[]>;
			required: true;
		};
		messageId: {
			type: (NumberConstructor | StringConstructor)[];
			required: true;
		};
	}>, {
		sliderId: string;
		contentContainer: HTMLElement | null;
	}, {}, {
		blocks(): BX.Messenger.v2.Const.AnyBlockType[];
		title(): string;
		allSources(): SourceEntry[];
	}, {
		openSlider(): void;
		closeSlider(): void;
		createLayoutContent(): Promise<any>;
		getSourceTitle(source: {
			url: string;
			title: string;
		}): string;
		loc(phraseCode: string): string;
	}, BX.Vue3.ComponentOptionsMixin, BX.Vue3.ComponentOptionsMixin, "close"[], "close", BX.Vue3.PublicProps, Readonly<BX.Vue3.ExtractPropTypes<{
		messageBlocks: {
			type: BX.Vue3.PropType<BX.Messenger.v2.Const.AnyBlockType[]>;
			required: true;
		};
		messageId: {
			type: (NumberConstructor | StringConstructor)[];
			required: true;
		};
	}>> & Readonly<{
		onClose?: ((...args: any[]) => any) | undefined;
	}>, {}, {}, {}, {}, string, BX.Vue3.ComponentProvideOptions, true, {}, any>;

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
		BaseBlock: typeof BaseBlock;
		TextContent: typeof TextContent;
		ButtonBlock: typeof ButtonBlock;
	}, {}, string, BX.Vue3.ComponentProvideOptions, true, {}, any>;

	const BaseBlock: BX.Vue3.DefineComponent<BX.Vue3.ExtractPropTypes<{
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

	const ButtonBlock: BX.Vue3.DefineComponent<BX.Vue3.ExtractPropTypes<{
		message: {
			type: BX.Vue3.PropType<BX.Messenger.v2.Model.ImModelMessage>;
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
		ButtonSize: () => typeof BX.Vue3.Components.ButtonSize;
		AirButtonStyle: () => typeof BX.Vue3.Components.AirButtonStyle;
		button(): BX.Messenger.v2.Const.AnyButtonBlock;
		buttonStyle(): $Values<typeof BX.Vue3.Components.AirButtonStyle>;
	}, {
		onButtonClick(event: PointerEvent): void;
	}, BX.Vue3.ComponentOptionsMixin, BX.Vue3.ComponentOptionsMixin, "click"[], "click", BX.Vue3.PublicProps, Readonly<BX.Vue3.ExtractPropTypes<{
		message: {
			type: BX.Vue3.PropType<BX.Messenger.v2.Model.ImModelMessage>;
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
		UiButton: typeof BX.Vue3.Components.Button;
	}, {}, string, BX.Vue3.ComponentProvideOptions, true, {}, any>;

	const CompactCommentsPanel: BX.Vue3.DefineComponent<BX.Vue3.ExtractPropTypes<{
		item: {
			type: BX.Vue3.PropType<BX.Messenger.v2.Model.ImModelMessage>;
			required: true;
		};
		dialogId: {
			type: StringConstructor;
			required: true;
		};
	}>, {}, {}, {
		dialog(): BX.Messenger.v2.Model.ImModelChat;
		message(): BX.Messenger.v2.Model.ImModelMessage;
		isChannelPost(): boolean;
		isSystemMessage(): boolean;
		showCommentsPanel(): boolean;
	}, {
		hasComments(totalCount: number): boolean;
		hasUnreadComments(unreadCount: string): boolean;
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
		CommentsPanel: typeof CommentsPanel;
	}, {}, string, BX.Vue3.ComponentProvideOptions, true, {}, any>;

	const BuilderTextContent: BX.Vue3.DefineComponent<BX.Vue3.ExtractPropTypes<{
		text: {
			type: StringConstructor;
			required: true;
		};
	}>, {}, {}, {
		formattedText(): string;
	}, {}, BX.Vue3.ComponentOptionsMixin, BX.Vue3.ComponentOptionsMixin, {}, string, BX.Vue3.PublicProps, Readonly<BX.Vue3.ExtractPropTypes<{
		text: {
			type: StringConstructor;
			required: true;
		};
	}>> & Readonly<{}>, {}, {}, {
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
	}, {}, string, BX.Vue3.ComponentProvideOptions, true, {}, any>;

	const SourceHandler: BX.Vue3.DefineComponent<BX.Vue3.ExtractPropTypes<{
		block: {
			type: ObjectConstructor;
			required: true;
		};
		messageId: {
			type: NumberConstructor;
			required: true;
		};
	}>, {
		hideTimeout: number;
	}, {
		showPopup: boolean;
		currentSource: SourceItem | null;
		bindElement: Element | null;
	}, {
		popupId(): string;
	}, {
		onClick(event: PointerEvent): void;
		onMouseOver(event: MouseEvent): void;
		onMouseLeave(): void;
		onPopupMouseEnter(): void;
		startHideTimer(): void;
		clearHideTimer(): void;
		getSourceForId(sourceId: string): SourceItem | null | undefined;
	}, BX.Vue3.ComponentOptionsMixin, BX.Vue3.ComponentOptionsMixin, {}, string, BX.Vue3.PublicProps, Readonly<BX.Vue3.ExtractPropTypes<{
		block: {
			type: ObjectConstructor;
			required: true;
		};
		messageId: {
			type: NumberConstructor;
			required: true;
		};
	}>> & Readonly<{}>, {}, {}, {
		SourcePopup: typeof SourcePopup;
	}, {}, string, BX.Vue3.ComponentProvideOptions, true, {}, any>;

	const SourcePopup: BX.Vue3.DefineComponent<BX.Vue3.ExtractPropTypes<{
		id: {
			type: StringConstructor;
			required: true;
		};
		source: {
			type: BX.Vue3.PropType<SourceItem>;
			required: true;
		};
		bindElement: {
			type: BX.Vue3.PropType<HTMLElement>;
			required: true;
		};
	}>, {}, {}, {
		sourceItem(): SourceItem;
		popupConfig(): BX.Main.PopupOptions;
		metaData(): SourceItem["metaData"] | null | void;
		title(): string;
		description(): string | null | undefined;
	}, {}, BX.Vue3.ComponentOptionsMixin, BX.Vue3.ComponentOptionsMixin, ("close" | "mouseEnter" | "mouseLeave")[], "close" | "mouseEnter" | "mouseLeave", BX.Vue3.PublicProps, Readonly<BX.Vue3.ExtractPropTypes<{
		id: {
			type: StringConstructor;
			required: true;
		};
		source: {
			type: BX.Vue3.PropType<SourceItem>;
			required: true;
		};
		bindElement: {
			type: BX.Vue3.PropType<HTMLElement>;
			required: true;
		};
	}>> & Readonly<{
		onClose?: ((...args: any[]) => any) | undefined;
		onMouseEnter?: ((...args: any[]) => any) | undefined;
		onMouseLeave?: ((...args: any[]) => any) | undefined;
	}>, {}, {}, {
		MessengerPopup: typeof BX.Messenger.v2.Component.Elements.MessengerPopup;
	}, {}, string, BX.Vue3.ComponentProvideOptions, true, {}, any>;

	const AudioItem: BX.Vue3.DefineComponent<BX.Vue3.ExtractPropTypes<{
		item: {
			type: BX.Vue3.PropType<BX.Messenger.v2.Model.ImModelFile>;
			required: true;
		};
		messageId: {
			type: (NumberConstructor | StringConstructor)[];
			required: true;
		};
		withTranscription: {
			type: BooleanConstructor;
			default: boolean;
		};
	}>, {}, {}, {
		ProgressBarSize: () => Readonly<{
			S: "S";
			L: "L";
		}>;
		file(): BX.Messenger.v2.Model.ImModelFile;
	}, {
		onCancelClick(event: PointerEvent): void;
	}, BX.Vue3.ComponentOptionsMixin, BX.Vue3.ComponentOptionsMixin, "cancelClick"[], "cancelClick", BX.Vue3.PublicProps, Readonly<BX.Vue3.ExtractPropTypes<{
		item: {
			type: BX.Vue3.PropType<BX.Messenger.v2.Model.ImModelFile>;
			required: true;
		};
		messageId: {
			type: (NumberConstructor | StringConstructor)[];
			required: true;
		};
		withTranscription: {
			type: BooleanConstructor;
			default: boolean;
		};
	}>> & Readonly<{
		onCancelClick?: ((...args: any[]) => any) | undefined;
	}>, {
		withTranscription: boolean;
	}, {}, {
		AudioPlayer: typeof BX.Messenger.v2.Component.Elements.AudioPlayer;
		ProgressBar: typeof BX.Messenger.v2.Component.Elements.ProgressBar;
	}, {}, string, BX.Vue3.ComponentProvideOptions, true, {}, any>;

	const BaseFileItem: BX.Vue3.DefineComponent<BX.Vue3.ExtractPropTypes<{
		id: {
			type: (NumberConstructor | StringConstructor)[];
			required: true;
		};
		messageId: {
			type: (NumberConstructor | StringConstructor)[];
			required: true;
		};
	}>, {}, {}, {
		ProgressBarSize: () => Readonly<{
			S: "S";
			L: "L";
		}>;
		OutlineIcons(): typeof BX.UI.IconSet.Outline;
		file(): BX.Messenger.v2.Model.ImModelFile;
		fileShortName(): string;
		fileSize(): string;
		iconClass(): string;
		canBeOpenedWithViewer(): boolean;
		viewerAttributes(): any;
		isLoaded(): boolean;
		imageStyles(): {
			backgroundImage: string;
		};
		hasPreview(): boolean;
	}, {
		download(): void;
		loc(phraseCode: string, replacements?: {
			[key: string]: string;
		}): string;
		openContextMenu(event: PointerEvent): void;
		onCancelClick(event: unknown): void;
	}, BX.Vue3.ComponentOptionsMixin, BX.Vue3.ComponentOptionsMixin, ("cancelClick" | "openContextMenu")[], "cancelClick" | "openContextMenu", BX.Vue3.PublicProps, Readonly<BX.Vue3.ExtractPropTypes<{
		id: {
			type: (NumberConstructor | StringConstructor)[];
			required: true;
		};
		messageId: {
			type: (NumberConstructor | StringConstructor)[];
			required: true;
		};
	}>> & Readonly<{
		onCancelClick?: ((...args: any[]) => any) | undefined;
		onOpenContextMenu?: ((...args: any[]) => any) | undefined;
	}>, {}, {}, {
		ProgressBar: typeof BX.Messenger.v2.Component.Elements.ProgressBar;
		BIcon: typeof BX.UI.IconSet.BIcon;
	}, {}, string, BX.Vue3.ComponentProvideOptions, true, {}, any>;

	const VideoItem: BX.Vue3.DefineComponent<BX.Vue3.ExtractPropTypes<{
		id: {
			type: (NumberConstructor | StringConstructor)[];
			required: true;
		};
		message: {
			type: BX.Vue3.PropType<BX.Messenger.v2.Model.ImModelMessage>;
			required: true;
		};
	}>, {}, {}, {
		messageItem(): BX.Messenger.v2.Model.ImModelMessage;
		file(): BX.Messenger.v2.Model.ImModelFile;
		autoplay(): boolean;
		canBeOpenedWithViewer(): boolean;
		viewerAttributes(): any;
		imageSize(): {
			width: string;
			height: string;
			"object-fit"?: string;
		};
		isLoaded(): boolean;
		isForward(): boolean;
	}, {
		download(): void;
		onCancelClick(event: unknown): void;
		getHandleStatus(): Array<string>;
		getStatusMap(): {
			[key: string]: {
				iconClass: string;
				labelText: string;
			};
		};
	}, BX.Vue3.ComponentOptionsMixin, BX.Vue3.ComponentOptionsMixin, "cancelClick"[], "cancelClick", BX.Vue3.PublicProps, Readonly<BX.Vue3.ExtractPropTypes<{
		id: {
			type: (NumberConstructor | StringConstructor)[];
			required: true;
		};
		message: {
			type: BX.Vue3.PropType<BX.Messenger.v2.Model.ImModelMessage>;
			required: true;
		};
	}>> & Readonly<{
		onCancelClick?: ((...args: any[]) => any) | undefined;
	}>, {}, {}, {
		DefaultVideoPlayer: typeof BX.Messenger.v2.Component.Elements.DefaultVideoPlayer;
		ProgressBar: typeof BX.Messenger.v2.Component.Elements.ProgressBar;
	}, {}, string, BX.Vue3.ComponentProvideOptions, true, {}, any>;
}
