/* eslint-disable */
type MountContext = {
	documentSessionHash?: string;
	adapter: EditorAdapter;
	boostContainerId: string;
	logoUrl: string;
	editUrl: string;
	presentationAdapter?: PresentationAdapter;
	sessionBoost: SessionBoostContext | null;
	shouldShowPromoImmediately: boolean;
	shouldRenderNameAsPageHeading?: boolean;
	composition?: unknown;
};

interface EditorAdapter {
	subscribeToSaveStatus(listener: (status: SaveStatus) => void): () => void;
	retrySave(): Promise<void>;
	canRetrySave(): boolean;
}

type SaveStatus = {
	state: SaveState;
	errorMessage?: string;
};

/**
 * `autosave` is a claim about the mode the object is opened in rather than about a write of its own:
 * the editor states that it saves by itself and reports no outcome. Everything else is an outcome.
 */
type SaveState = 'neutral' | 'autosave' | 'saving' | 'saved' | 'failed';

/**
 * The presentation mode as the shell of the page owns it: the node which goes full-screen, the
 * button of the exit, the cancel key and the announcements all belong to the page, and the header
 * only asks. The adapter is optional: a shell which gives none carries no presentation element.
 */
interface PresentationAdapter {
	enter(): void;
	exit(): void;
	/**
	 * The header subscribes once on mount; the returned function unsubscribes. The listeners are told
	 * in the order they subscribed, and the page counts on it: a shell subscribing before the header
	 * is mounted has the page ready by the time the header takes the focus back.
	 */
	subscribeToState(listener: (isActive: boolean) => void): () => void;
	isActive(): boolean;
}

/**
 * Everything about the widget of the boosts the header cannot learn from the composition. The decision
 * to open the widget by itself belongs to the server: it is taken once per pair of the user and the
 * extension of the file, and the header neither repeats nor overrides it.
 */
type SessionBoostContext = {
	shouldShowWidgetInstantly: boolean;
	widgetViewOption: UserOptionAddress;
};

/** Where the mark of the show is kept: the very same option the server reads before the page is built. */
type UserOptionAddress = {
	category: string;
	name: string;
};

type RenameResult = {
	success: true;
	name: string;
	editorSynchronized: boolean;
} | {
	success: false;
	refusal: RenameRefusalValue;
	message: string;
};

type RenameRefusalValue = typeof BX.Disk.RenameRefusal[keyof typeof BX.Disk.RenameRefusal];

type HeaderElementValue = typeof BX.Disk.HeaderElement[keyof typeof BX.Disk.HeaderElement];

type PresenceActions = {
	enter: string;
	heartbeat: string;
	leave: string;
};

/** The part of the presence configuration of the server the header itself reads. */
type PresenceConfig = {
	enabled: boolean;
	moduleId: string;
	command: string;
	scope: string;
	pullConfig: Record<string, unknown>;
	presenceContext: string;
	heartbeatInterval: number;
	actions: PresenceActions;
};

type CompositionState = {
	composition: CompositionModel | null;
};

type CompositionModel = {
	elements: HeaderElementValue[];
	objectType: ObjectType;
	mode: CompositionMode;
	object: CompositionObject;
	urls: CompositionUrls;
	access: CompositionAccess;
	editors: EditorItem[];
};

type ObjectType = 'document' | 'board';

type CompositionMode = 'view' | 'edit';

type CompositionObject = {
	id: number;
	name: string;
	uniqueCode: string;
	extension: string;
};

type CompositionUrls = {
	unifiedLink: string;
	/** Empty when the opening hands out no downloading at all. */
	download: string;
};

type CompositionAccess = {
	controlType: string;
};

type EditorItem = {
	code: string;
	name: string;
	isDefault: boolean;
};

type PresenceState = {
	participants: PresenceParticipant[];
	revision: number;
	isAvailable: boolean;
	scope: string;
};

/**
 * Everyone who has the document open. A participant is described by exactly what the server tells
 * about them - a name and an avatar - and nothing is derived on the client: seeing the list gives no
 * rights either on the object or on the profiles.
 */
type PresenceParticipant = {
	id: number;
	name: string;
	avatar: string;
	isGuest: boolean;
};

type HeaderServiceResult<TData> = {
	success: true;
	data: TData;
} | {
	success: false;
	error: HeaderServiceError;
};

/** Code comes from the server as is; the two codes below are the ones the service adds itself. */
type HeaderServiceError = {
	code: string;
	message: string;
};

/** The starting roster of the opening: the composition confirmed by the server and its revision. */
type PresenceRoster = {
	revision: number;
	participants: PresenceParticipant[];
};

type RenameDto = {
	name: string;
	editorSynchronized: boolean;
};

/** The description of one concrete opening. */
type CompositionDto = {
	elements: string[];
	objectType: string;
	mode: string;
	object: {
		/** `null` for an opening which offers the object none: a public one, a version, an attachment,
			and the minimal header of a page whose description was refused. */
		id: number | null;
		name: string;
		/** `null` for the same openings, for the same reason. */
		uniqueCode: string | null;
		extension: string;
	};
	urls: {
		unifiedLink: string;
		download: string;
	};
	access: {
		controlType: string;
	};
	editors: EditorDto[];
	presence: {
		enabled: boolean;
	};
	boost: {
		containerRequired: boolean;
	};
};

type EditorDto = {
	code: string;
	name: string;
	isDefault: boolean;
};

/**
 * Wire shapes of the `disk.api.documentHeader` controller: what leaves the header and what the
 * server answers with. The client model of the composition lives in `model/composition/types`.
 */
type CompositionRequest = {
	documentSessionHash: string;
};

type ParticipantDto = {
	id: number;
	name: string;
	avatar: string;
	isGuest: boolean;
};

/** The starting roster of the opening. */
type PresenceDto = {
	revision: number;
	participants: ParticipantDto[];
};

type PresenceRequest = {
	documentSessionHash: string;
};

type RenameRequest = {
	documentSessionHash: string;
	newName: string;
};

/**
 * The transport of the live channel of the roster: the heaviest thing the header could bring along,
 * and it serves one element alone, so an opening whose composition carries no presence neither loads
 * it nor runs the initialization declared next to it. A refusal is answered with `null`, and the next
 * beat asks for the transport again.
 */
/**
 * Written by hand instead of taken from `pull.client`: the extension is not a static dependency any
 * more, and its own declaration describes a surface the client does not have - no `stop`, no
 * `skipStorageInit` - so a binding to it would refuse this code rather than guard it.
 */
type PullClientInstance = {
	start: (config: unknown) => Promise<unknown>;
	stop: (reason: unknown, description?: string) => void;
	subscribe: (handler: unknown) => unknown;
};

type LoadCompositionResult = {
	success: true;
} | {
	success: false;
	error: HeaderServiceError;
};

type PresenceLoadResult = {
	success: true;
} | {
	success: false;
	error: HeaderServiceError;
};

type ShowBoostRequest = {
	containerId: string;
	sessionBoost: SessionBoostContext | null;
	/** The object may be closed while the package is still being loaded; nothing is drawn after that. */
	isCancelled: () => boolean;
};

/**
 * The gate of the restrictions of editing: the tariff and the limit of simultaneous sessions. It knows
 * on its own whether a scenario of the restriction is due and which one, so the header only asks it and
 * points at the control the scenario binds itself to.
 */
type PromoGate = {
	shouldShow: () => boolean;
	show: (target: HTMLElement | null, needOverlay: boolean) => void;
};

type StartEditRequest = {
	/** Empty for the button itself: it continues the current opening in editing mode. */
	editorCode: string;
	/** Address of the transition; it is built by the server for this very opening. */
	editUrl: string;
	/** Absent for an opening which carries no header of its own; only the analytics reads it. */
	composition: CompositionModel | null;
	/** The scenario of the restriction binds itself to the pressed control. */
	trigger: HTMLElement | null;
	/**
	 * Asked once the gate has been waited for: the wait can outlive the surface which asked for the
	 * transition, and a page nobody is on any more is neither left nor shown a scenario. Absent for a
	 * surface which lives as long as the page it is on.
	 */
	isStillWanted?: () => boolean;
};

/**
 * How the ask ended. A refusal is the scenario of the restriction shown instead of the editor, and
 * it answers the person on its own; nothing at all happened only under `unavailable`, and the answer
 * to that outcome belongs to whoever asked.
 */
type StartEditOutcome = 'opened' | 'refused' | 'unavailable';

type StateListener = (isActive: boolean) => void;

type WidthAdaptation = {
	level: HeaderWidthLevelValue;
	showButtonCaptions: boolean;
	/** The caption of the primary action; its icon and its accessible name stay at every width. */
	showEditCaption: boolean;
	/** The word of the portal mark; the mark itself and its accessible name stay at every width. */
	showLogoName: boolean;
};

type HeaderWidthLevelValue = typeof BX.Disk.HeaderWidthLevel[keyof typeof BX.Disk.HeaderWidthLevel];

type ActionBarContext = {
	AirButtonStyle: typeof BX.Vue3.Components.AirButtonStyle;
	ButtonSize: typeof BX.Vue3.Components.ButtonSize;
	presentationAdapter: PresentationAdapter | null;
};

type ActionBarState = {
	/** The bar carries out one action at a time, so a single element names the button which waits. */
	waitingElement: HeaderElementValue | null;
	spinner: BX.Disk.ButtonSpinner | null;
	isPresentationActive: boolean;
	unsubscribeFromPresentation: (() => void) | null;
};

/**
 * What the shell of the page gave the header besides the composition. An action which needs it is
 * only shown while the shell answers for it.
 */
type ActionContext = {
	presentationAdapter: PresentationAdapter | null;
};

type HeaderAction = {
	element: HeaderElementValue;
	icon: string;
	caption: string;
	text: string;
	linkUrl: string;
	dataset: {
		headerAction: HeaderElementValue;
		testid: string;
	};
	run: (() => void | Promise<void>) | null;
};

type ActionDescriptor = {
	element: HeaderElementValue;
	icon: string;
	phraseCode: string;
	testId: string;
	/** The access and the downloading carry a visible caption; the rest are icons on every width. */
	hasCaption: boolean;
	/**
	 * The address of an action which is a link: the browser does the work, so such an action carries
	 * no `run` of its own.
	 */
	linkUrl?: (composition: CompositionModel) => string;
	/** An action the shell of the page answers for is out of the bar while the shell does not. */
	isAvailable?: (context: ActionContext) => boolean;
	/** An action which gives its promise back keeps its own button waiting until the work is over. */
	run?: (composition: CompositionModel, context: ActionContext) => void | Promise<void>;
};

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

type ContentWarningContext = {
	HeaderTestId: typeof BX.Disk.HeaderTestId;
	IconSize: number;
	WarningIcon: string;
};

type HintBinding = {
	text: string;
	popupOptions: Object;
};

type EditActionContext = {
	AirButtonStyle: typeof BX.Vue3.Components.AirButtonStyle;
	ButtonSize: typeof BX.Vue3.Components.ButtonSize;
	EditControl: string;
	EditIcon: string;
	EditorsControl: string;
	HeaderTestId: typeof BX.Disk.HeaderTestId;
	editUrl: string;
	shouldShowPromoImmediately: boolean;
};

type EditActionState = {
	isMenuOpen: boolean;
	anchor: HTMLElement | null;
	closedAt: number;
	/** The menu of the design system arrives on the first opening and stays for the next ones. */
	menuComponent: DeferredComponent | null;
	isMenuLoading: boolean;
	spinner: BX.Disk.ButtonSpinner | null;
};

/**
 * Parts of the design system no first render of the header needs. Each of them serves an action of the
 * person - the menu of the editors, the list of the present, the field of the name - and arrives with
 * the extension of its own only when such an action is taken, so the opening of an object no longer
 * carries them.
 *
 * A refusal is answered with `null`: the control which asked stays where it is, and the next attempt
 * asks again. Nothing already rendered is replaced here, so no focus moves because of a load.
 */
/** A component of the design system, as `<component :is>` takes it. */
type DeferredComponent = Record<string, unknown>;

type MenuBinding = {
	bindElement: HTMLElement | null;
	items: MenuItem[];
};

/** What the menu of the design system is given, described here so it is not carried by the opening. */
type MenuItem = {
	id: string;
	title: string;
	onClick: () => void;
};

type HeaderState = {
	adaptation: WidthAdaptation;
	unobserve: (() => void) | null;
};

type LogoAttributes = {
	href?: string;
	target?: string;
	rel?: string;
	role?: string;
};

type DeferredInput = {
	component: DeferredComponent;
	size: string;
	design: string;
};

type DeferredPopover = {
	component: DeferredComponent;
	position: string;
	alignment: string;
};

type ObjectNameContext = {
	shouldRenderNameAsPageHeading: boolean;
	HeaderTestId: typeof BX.Disk.HeaderTestId;
	CheckIcon: string;
	CheckSize: number;
	PencilIcon: string;
	PencilSize: number;
};

type ObjectNameState = {
	draft: string;
	errorMessage: string;
	fieldWidth: number;
	isEditing: boolean;
	isSaving: boolean;
	isShortened: boolean;
	unobserve: (() => void) | null;
	/** The field of the design system arrives on the first rename and stays for the next ones. */
	field: DeferredInput | null;
	isFieldLoading: boolean;
	spinner: BX.Disk.ButtonSpinner | null;
	/** The address the field points at its reason by; one header can share a page with another. */
	errorId: string;
};

type HintBinding = {
	text: string;
	popupOptions: Object;
};

type PresenceStackState = {
	isOpen: boolean;
	anchor: HTMLElement | null;
	closedAt: number;
	/** The bubble of the design system arrives on the first opening and stays for the next ones. */
	popover: DeferredPopover | null;
	isPopoverLoading: boolean;
	/** The faces arrive with the first roster to draw; until they do, the block holds their place. */
	avatar: DeferredComponent | null;
	isAvatarLoading: boolean;
	/** Asks made for the faces, counted so a refusal which repeats stops being answered. */
	avatarAttempts: number;
	spinner: BX.Disk.ButtonSpinner | null;
};

/** What the bubble of the design system is given, described here so it is not carried by the opening. */
type PopoverBinding = {
	target: HTMLElement | null;
	positioning: {
		position: string;
		alignment: string;
		offset: number;
	};
};

type AvatarOptions = {
	size: number;
	userName: string;
	userpicPath: string;
};

type IndicatorContext = {
	AirButtonStyle: typeof BX.Vue3.Components.AirButtonStyle;
	ButtonSize: typeof BX.Vue3.Components.ButtonSize;
	HeaderTestId: typeof BX.Disk.HeaderTestId;
	IconSize: number;
	RetryControl: string;
	adapter: EditorAdapter | null;
	status: SaveStatus;
};

type IndicatorState = {
	spinner: Spinner | null;
	isRetrying: boolean;
	retrySpinner: BX.Disk.ButtonSpinner | null;
};

/** The loader is a class of its own: only the part of it the status uses is described here. */
type Spinner = {
	show: (target: HTMLElement) => void;
	hide: () => void;
	destroy: () => void;
};

declare namespace BX.Disk {
	/**
	 * The header of an opened document or board. The shell of the page gives it a container and the
	 * context of the opening; everything specific to the editor arrives through the adapter, and nothing
	 * outside the composition is ever drawn.
	 */
	class DocumentHeader {
		constructor(container: HTMLElement, context: MountContext);
		unmount(): void;
		/**
		 * Renaming of the object from outside the header - the editor of the object may rename it on its
		 * own side, and the object follows. The header owns its own store, so the store is addressed here
		 * rather than through whichever one happens to be active on the page.
		 */
		rename(newName: string): Promise<RenameResult>;
	}

	/**
	 * Why the rename did not happen. `InvalidName` belongs next to the input - it is about the entered
	 * value; everything else is about the attempt and is reported away from the field.
	 */
	const RenameRefusal: Readonly<{
		readonly InvalidName: "invalidName";
		readonly Refused: "refused";
	}>;

	/**
	 * Elements the header may consist of. Declaration order is the left-to-right render order,
	 * the same order the server keeps in the `elements` list of the composition.
	 */
	const HeaderElement: Readonly<{
		readonly Logo: "logo";
		readonly Name: "name";
		readonly ContentWarning: "contentWarning";
		readonly Rename: "rename";
		readonly SaveStatus: "saveStatus";
		readonly Boost: "boost";
		readonly Edit: "edit";
		readonly Presence: "presence";
		readonly Access: "access";
		readonly CopyLink: "copyLink";
		readonly Download: "download";
		readonly Presentation: "presentation";
	}>;

	const EditorAdapterInjectionKey = "diskDocumentHeaderEditorAdapter";

	const EditUrlInjectionKey = "diskDocumentHeaderEditUrl";

	/** The header stands on a page of its own, so the name of the object is the heading of that page. */
	const NameAsPageHeadingInjectionKey = "diskDocumentHeaderNameAsPageHeading";

	/** The shell of the page which owns the presentation mode; absent for a shell which has none. */
	const PresentationAdapterInjectionKey = "diskDocumentHeaderPresentationAdapter";

	/**
	 * Keys the wrapper of the application puts the context of the opening under. Everything here belongs
	 * to the concrete opening and not to the composition, so the components take it by injection instead
	 * of carrying it through props of the components which do not use it.
	 */
	const SaveStatusInjectionKey = "diskDocumentHeaderSaveStatus";

	const ShowPromoImmediatelyInjectionKey = "diskDocumentHeaderShowPromoImmediately";

	/**
	 * The registration of the opening in the roster. The shell of the page serves these actions, and the
	 * server sends their names in the same configuration - the header only compares them with what it
	 * expects, exactly as it does with the name of the pull command.
	 */
	const PresenceActionContract: Readonly<{
		readonly enter: "presenceEnter";
		readonly heartbeat: "presenceHeartbeat";
		readonly leave: "presenceLeave";
	}>;

	/**
	 * The live channel of the roster. The server sends the name of the command in the presence
	 * configuration of the opening; the header keeps the expected value here and compares the two, so the
	 * name is never written down a second time.
	 */
	const PresencePullContract: Readonly<{
		readonly moduleId: "disk";
		readonly command: "documentPresence";
	}>;

	const useCompositionStore: import("ui.vue3.pinia").StoreDefinition<"diskDocumentHeaderComposition", CompositionState, {
		hasElement: (state: CompositionState) => (element: HeaderElementValue) => boolean;
	}, {
		setComposition(composition: CompositionModel): void;
		setObjectName(name: string): void;
	}>;

	const usePresenceStore: import("ui.vue3.pinia").StoreDefinition<"diskDocumentHeaderPresence", PresenceState, {
		guest: (state: PresenceState) => PresenceParticipant | null;
	}, {
		setParticipants(participants: PresenceParticipant[]): void;
		setRevision(revision: number): void;
		setAvailable(isAvailable: boolean): void;
		setScope(scope: string): void;
	}>;

	const documentHeaderService: DocumentHeaderService;

	/**
	 * The `disk.api.documentHeader` controller. A refusal is returned to the caller instead of being
	 * thrown: a header that cannot be described must not take the opened object down with it.
	 */
	class DocumentHeaderService {
		getComposition(documentSessionHash: string): Promise<HeaderServiceResult<CompositionModel>>;
		getPresence(documentSessionHash: string): Promise<HeaderServiceResult<PresenceRoster>>;
		rename(documentSessionHash: string, newName: string): Promise<HeaderServiceResult<RenameDto>>;
	}

	/** Codes the service produces itself; every other code comes from the controller as is. */
	const HeaderServiceErrorCode: Readonly<{
		readonly Unexpected: "UNEXPECTED";
		readonly InvalidResponse: "INVALID_RESPONSE";
	}>;

	/**
	 * The composition description from the server to the client model. The header renders exactly the
	 * composition it was given: an unknown element is dropped, a missing one is never added back.
	 *
	 * `presence` and `boost` nodes of the answer are not read on purpose - they repeat the presence of
	 * the matching elements in `elements`, and that is what the components ask about.
	 *
	 * @returns `null` when the answer cannot describe an opening at all - such a composition is refused
	 *          instead of being rendered half-way.
	 */
	function mapCompositionDtoToModel(response: unknown): CompositionModel | null;

	/**
	 * The starting roster to the client model. A participant without a name cannot be shown at all and
	 * is dropped.
	 *
	 * @returns `null` when the answer describes no roster - a refused roster and an empty one are
	 *          different things, and only the first one hides the block.
	 */
	function mapPresenceDtoToModel(response: unknown): PresenceRoster | null;

	/**
	 * @returns `null` when the answer carries no stored name - the caller has nothing to apply then.
	 */
	function mapRenameDto(response: unknown): RenameDto | null;

	/**
	 * The live channel of the roster. The roster travels to the private channel of the user, so a page
	 * which already listens to it carries the events of the header as well - a second connection to the
	 * same channel would only double the cost of every opened document. A page without such a client - an
	 * opening by an external link among them - gets a client opened here instead.
	 *
	 * Listening alone would show nothing: the server sends a roster event to the openings registered in
	 * that roster, so the channel also holds the registration of this one - it enters the roster, confirms
	 * itself while the page lives and leaves when the page goes away. The shell of the page names the
	 * component serving those requests, because only it knows which one renders it.
	 *
	 * A channel that could not be opened is not an error of the header: the block keeps showing the last
	 * confirmed roster and adds nothing to it, while the beat keeps trying to open the channel again.
	 */
	class PresenceChannel {
		constructor(componentName: string, pageClient?: PullClientInstance | null);
		/**
		 * @returns whether the live channel is open; a refused one leaves the block on its last roster.
		 */
		start(config: PresenceConfig): Promise<boolean>;
		stop(): void;
	}

	/**
	 * The composition the page handed over together with itself. It is described by the very same service
	 * the action of the controller answers with, so nothing is decided here beyond «is this a description
	 * at all»: an answer which describes no opening is refused exactly the way a fetched one is.
	 *
	 * @returns `false` when the page carried no usable description - the caller then asks for it.
	 */
	function applyComposition(response: unknown): boolean;

	/**
	 * The composition of the header for the opened object. The store knows nothing about the network and
	 * the service knows nothing about the store, so the two are put together here; a refusal is handed
	 * over to the caller, which decides that the header simply does not appear.
	 */
	function loadComposition(documentSessionHash: string | undefined): Promise<LoadCompositionResult>;

	/**
	 * Renaming of the opened object: the new name is shown at once and rolled back if the server refuses
	 * it. The refusal is handed over to the caller with its reason - the header never swallows it.
	 *
	 * @param newName the name without the extension: the extension is appended by the server
	 */
	function renameObject(documentSessionHash: string | undefined, newName: string): Promise<RenameResult>;

	/**
	 * The presence configuration the server gave to this opening. The name of the pull command comes from
	 * it and is compared with the one the header expects, so a configuration built for anything else than
	 * the `documentPresence` command of `disk` leaves the live channel unused: the block then keeps the
	 * last confirmed roster.
	 *
	 * @returns whether the live channel described by the configuration may be listened to.
	 */
	function applyPresenceConfig(config: PresenceConfig): boolean;

	/**
	 * The starting roster of the opening. A roster that could not be received leaves the block
	 * unavailable: an empty stack and a knowingly incomplete one are both worse than no stack at all.
	 *
	 * The answer travels next to the live channel and may arrive after it: a roster older than the one
	 * already applied describes a state which is no longer true, so it confirms the block and changes
	 * nothing else.
	 */
	function loadInitialPresence(documentSessionHash: string | undefined): Promise<PresenceLoadResult>;

	/**
	 * A change of the roster reported by the live channel. The event carries named participants only, so the
	 * guest of the starting roster is kept as it is: the live channel neither adds nor removes it.
	 */
	function syncPresenceFromPull(payload: unknown): void;

	/**
	 * Copying of the object address. The address does not depend on the state of the public access and
	 * copying never turns that access on - the header hands over exactly the link it was given.
	 */
	function copyLink(url: string): Promise<boolean>;

	/**
	 * The button of the boosts. It is drawn by `disk.promo-boost` into the container the header rendered,
	 * and the same side plays the scenario of the purchase: the widget is laid over the page and, when the
	 * server says the user has not seen it yet, opened right away with the mark of the show.
	 */
	function showBoost(request: ShowBoostRequest): Promise<void>;

	/**
	 * The scenario of the restriction shown right after the object is opened. Whether it is due at all is
	 * decided before the page is built - the header receives the sign with the context of the opening and
	 * only anchors the scenario to the control of the transition to editing.
	 */
	function showPromo(anchor: HTMLElement | null): Promise<void>;

	/**
	 * The gate is loaded on demand. A refused load leaves the object open: the limit is kept by the server
	 * as well, so the editor answers with the scenario of the restriction itself instead of the promo.
	 * A caller holding a person waiting hands a limit of its own; without it the load is awaited for as
	 * long as it takes, because a scenario shown late is still a scenario shown.
	 */
	function loadPromoGate(analytics?: Partial<BX.UI.Analytics.AnalyticsOptions> | null, limitMs?: number | null): Promise<PromoGate | null>;

	/**
	 * The access of the opening as the composition describes it. An opening whose sharing the tariff of
	 * the portal closed answers with the slider of that restriction and opens no popup - the previous
	 * shells of both editors kept the button and answered the same way.
	 */
	function openAccess(composition: CompositionModel): Promise<void>;

	/**
	 * The header does not own the access popup: it loads `disk.sharing-access-popup` on demand and opens
	 * it with the same parameters the editors pass today, changing neither its composition nor its rules.
	 */
	function openAccessPopup(objectId: number, uniqueCode: string): Promise<void>;

	/**
	 * The page is about to be left for the editor of the same object. The session of the current opening
	 * continues there, so the shell of the page is told before the transition: the lifetime of the session
	 * belongs to the shell, and closing it on the way out would take the editing down with it.
	 */
	const BeforeStartEditEvent = "Disk.DocumentHeader:onBeforeStartEdit";

	/**
	 * The code of the opening itself. The item under it does not move the object to a concrete engine:
	 * the server picks the engine again, exactly as it did when the object was opened.
	 */
	const ServerChosenEditor = "onlyoffice";

	/**
	 * The transition to editing. Tariff restrictions and the limit of simultaneous sessions are checked
	 * by the existing gate before anything is opened: it decides whether the editor opens at all or the
	 * scenario of the restriction is shown instead. Another editor of the menu is opened by the package
	 * which owns that transition today, with the rules of the chosen service.
	 */
	function startEdit(request: StartEditRequest): Promise<StartEditOutcome>;

	/**
	 * The presentation mode of a page over the full-screen mode of the browser. The shell of the page
	 * owns it and builds its adapter around the node which goes full-screen.
	 *
	 * The mode is turned on at once, without waiting for the browser: a refused request, or a browser
	 * without the mode at all, still leaves the mode on - only the full screen of the window is missing.
	 */
	class FullscreenPresentation implements PresentationAdapter {
		constructor(container: HTMLElement);
		enter(): void;
		exit(): void;
		isActive(): boolean;
		subscribeToState(listener: StateListener): () => void;
		destroy(): void;
	}

	/** Captions fit while the container is wider than this; 960 is the narrow layout of the mockups. */
	const CaptionsFitWidth = 960;

	/**
	 * Adaptation of the header to the width it actually got. The header lives on a full page and inside
	 * a slider alike, so the only honest measure is its own container - never the window.
	 *
	 * Captions of the buttons go first and everything else only after them: the header gives up
	 * information in that order and never lets a horizontal scrollbar appear instead.
	 *
	 * What it never gives up is a control. Down to 320px the words next to the icons go - the caption of
	 * the transition to editing and the name of the portal mark - while every button stays where it is and
	 * keeps the name it is addressed by.
	 */
	const HeaderWidthLevel: Readonly<{
		readonly Full: "full";
		readonly IconsOnly: "iconsOnly";
		readonly Essential: "essential";
	}>;

	/** Below this width the words standing next to the icons have to go as well. */
	const IconWordsFitWidth = 640;

	/**
	 * Reports the adaptation of the container at once and then on every change of the level. Returns the
	 * function which stops the observation.
	 */
	function observeContainerWidth(container: HTMLElement, listener: (adaptation: WidthAdaptation) => void): () => void;

	function resolveAdaptation(containerWidth: number): WidthAdaptation;

	/**
	 * Actions of the header. An action belongs to the bar only while its element belongs to the
	 * composition; the bar keeps no rules of its own and asks the features to do the work.
	 */
	const ActionBar: BX.Vue3.DefineComponent<BX.Vue3.ExtractPropTypes<{
		showCaptions: {
			type: BooleanConstructor;
			default: boolean;
		};
	}>, ActionBarContext, ActionBarState, {
		actionContext(): ActionContext;
		actions(): HeaderAction[];
		hasElement: () => (element: HeaderElementValue) => boolean;
		composition: () => {
			elements: HeaderElementValue[];
			objectType: ObjectType;
			mode: CompositionMode;
			object: {
				id: number;
				name: string;
				uniqueCode: string;
				extension: string;
			};
			urls: {
				unifiedLink: string;
				download: string;
			};
			access: {
				controlType: string;
			};
			editors: {
				code: string;
				name: string;
				isDefault: boolean;
			}[];
		} | null;
	}, {
		/** The mode is turned on and off from outside the header as well, so the state is asked for. */
		subscribeToPresentation(): void;
		createAction(descriptor: ActionDescriptor, composition: CompositionModel, linkUrl: string): HeaderAction;
		focusAction(element: HeaderElementValue): void;
		findActionNode(element: HeaderElementValue): HTMLElement | null;
		handleAction(action: HeaderAction): Promise<void>;
		/**
		 * The button of the design system carries neither the accessible name of an icon-only button, nor
		 * the mark of a downloading link, nor the wait through its props, so they are put onto the
		 * rendered node. A waiting button is never `disabled`: that would take it out of the tab order and
		 * drop the focus of the person who has just pressed it.
		 */
		syncButtonAttributes(): void;
		syncSpinner(): void;
		destroySpinner(): void;
	}, BX.Vue3.ComponentOptionsMixin, BX.Vue3.ComponentOptionsMixin, {}, string, BX.Vue3.PublicProps, Readonly<BX.Vue3.ExtractPropTypes<{
		showCaptions: {
			type: BooleanConstructor;
			default: boolean;
		};
	}>> & Readonly<{}>, {
		showCaptions: boolean;
	}, {}, {
		UiButton: import("ui.vue3").BitrixVueComponentProps | {
			button: import("../../../../../../../../ui/install/js/ui/buttons/src").Button | null;
		};
	}, {}, string, BX.Vue3.ComponentProvideOptions, true, {}, any>;

	/**
	 * The wait of a control which cannot answer at once - an action which asks the server, or one whose
	 * part of the design system is still on its way. The spinner is laid over the control itself: nothing
	 * is replaced in the page, so the control keeps its place in the tab order and the focus on it.
	 *
	 * One instance serves one control at a time, the way the header carries out one action at a time.
	 */
	class ButtonSpinner {
		showOver(target: HTMLElement): void;
		destroy(): void;
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
	 * Mount point of the boost button. The button is drawn by `disk.promo-boost` into the container with
	 * the given id - the header neither reproduces it nor re-checks the conditions of the package.
	 */
	const BoostSlot: BX.Vue3.DefineComponent<BX.Vue3.ExtractPropTypes<{
		containerId: {
			type: StringConstructor;
			required: true;
		};
	}>, Object, {}, {
		isPresent(): boolean;
		hasElement: () => (element: HeaderElementValue) => boolean;
	}, {}, BX.Vue3.ComponentOptionsMixin, BX.Vue3.ComponentOptionsMixin, {}, string, BX.Vue3.PublicProps, Readonly<BX.Vue3.ExtractPropTypes<{
		containerId: {
			type: StringConstructor;
			required: true;
		};
	}>> & Readonly<{}>, {}, {}, {}, {}, string, BX.Vue3.ComponentProvideOptions, true, {}, any>;

	/**
	 * The warning about content the portal does not vet. The text is the same for every opening which
	 * carries the element, so it lives in the phrases of the extension rather than in the composition.
	 * The hint is the only place the text is written, hence the icon carries it as its accessible name.
	 */
	const ContentWarning: BX.Vue3.DefineComponent<{}, ContentWarningContext, {}, {
		isPresent(): boolean;
		warningText(): string;
		/** The bubble is raised above the frame of the document, which lies right under the header. */
		hintParams(): HintBinding;
		hasElement: () => (element: HeaderElementValue) => boolean;
	}, {
		showHint: typeof showHint;
		hideHint: typeof hideHint;
	}, BX.Vue3.ComponentOptionsMixin, BX.Vue3.ComponentOptionsMixin, {}, string, BX.Vue3.PublicProps, Readonly<{}> & Readonly<{}>, {}, {}, {
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
	}, {
		hint: {
			mounted(element: HTMLElement, { value }: {
				value: import("ui.vue3.directives.hint").HintParams | Function;
			}): void;
			updated(element: HTMLElement, { value }: {
				value: import("ui.vue3.directives.hint").HintParams | Function;
			}): void;
			beforeUnmount(element: HTMLElement): void;
		};
	}, string, BX.Vue3.ComponentProvideOptions, true, {}, any>;

	/**
	 * Anchors of the header for the autotests. One header serves every viewer, so a name tells the
	 * element it marks and never the engine of the page behind it.
	 */
	const HeaderTestId: Readonly<{
		readonly Root: "disk-document-header";
		readonly Logo: "disk-document-header-logo";
		readonly Name: "disk-document-header-name";
		readonly NameField: "disk-document-header-name-field";
		readonly NameSubmit: "disk-document-header-name-submit";
		readonly ContentWarning: "disk-document-header-content-warning";
		readonly SaveStatus: "disk-document-header-save-status";
		readonly SaveStatusRetry: "disk-document-header-save-status-retry";
		readonly Boost: "disk-document-header-boost";
		readonly Edit: "disk-document-header-edit";
		readonly EditMenu: "disk-document-header-edit-menu";
		readonly Presence: "disk-document-header-presence";
		readonly PresenceTrigger: "disk-document-header-presence-trigger";
		readonly PresenceAvatar: "disk-document-header-presence-avatar";
		readonly PresenceList: "disk-document-header-presence-list";
		readonly PresenceItem: "disk-document-header-presence-item";
		readonly Access: "disk-document-header-access";
		readonly CopyLink: "disk-document-header-copy-link";
		readonly Download: "disk-document-header-download";
		readonly Presentation: "disk-document-header-presentation";
	}>;

	/**
	 * The hint directive of the design system listens to the mouse alone. A hint which is the only
	 * place a text is written has to be reachable without a pointer too.
	 */
	function showHint(event: FocusEvent | KeyboardEvent): void;

	function hideHint(event: FocusEvent | KeyboardEvent): void;

	/**
	 * The transition to editing: the button itself and the menu of the editors next to it. The list of
	 * the editors comes with the composition and is neither completed nor filtered here; an object which
	 * cannot be edited carries no such element at all, so there is no inactive button to press.
	 */
	const EditAction: BX.Vue3.DefineComponent<BX.Vue3.ExtractPropTypes<{
		/**
		 * The narrowest header keeps the button and gives up its caption; the name the control is
		 * addressed by does not depend on the width.
		 */
		showCaption: {
			type: BooleanConstructor;
			default: boolean;
		};
	}>, EditActionContext, EditActionState, {
		isPresent(): boolean;
		editors(): EditorItem[];
		hasMenu(): boolean;
		caption(): string;
		menuLabel(): string;
		menuOptions(): MenuBinding;
		hasElement: () => (element: HeaderElementValue) => boolean;
		composition: () => {
			elements: HeaderElementValue[];
			objectType: ObjectType;
			mode: CompositionMode;
			object: {
				id: number;
				name: string;
				uniqueCode: string;
				extension: string;
			};
			urls: {
				unifiedLink: string;
				download: string;
			};
			access: {
				controlType: string;
			};
			editors: {
				code: string;
				name: string;
				isDefault: boolean;
			}[];
		} | null;
	}, {
		createMenuItem(editor: EditorItem): MenuItem;
		handleEdit(): void;
		/**
		 * The scenario of the restriction due right after the object was opened. It is anchored to the
		 * button of the transition, so it appears only where there is a button to press.
		 */
		showPromoOverButton(): Promise<void>;
		/**
		 * The menu of the editors is not a part of the opening: it arrives with the extension of its own
		 * on the first press. The control it hangs on keeps its place while the extension is on the way,
		 * so the press does not throw the focus anywhere, and the wait is shown over that same control.
		 */
		toggleMenu(): Promise<void>;
		closeMenu(): void;
		syncSpinner(): void;
		destroySpinner(): void;
		startEditing(editorCode: string): Promise<void>;
		control(name: string): HTMLElement | null;
		/**
		 * The button of the design system takes no accessible name through its props, and the button
		 * which opens the menu shows an arrow alone - both names are put onto the rendered nodes.
		 *
		 * The menu the second button opens is told about there as well. The menu of the design system
		 * marks its own control while it is open, and it is not on the page until the first press: what
		 * the button carries by itself is what a person hears before pressing anything.
		 */
		syncButtonAttributes(): void;
	}, BX.Vue3.ComponentOptionsMixin, BX.Vue3.ComponentOptionsMixin, {}, string, BX.Vue3.PublicProps, Readonly<BX.Vue3.ExtractPropTypes<{
		/**
		 * The narrowest header keeps the button and gives up its caption; the name the control is
		 * addressed by does not depend on the width.
		 */
		showCaption: {
			type: BooleanConstructor;
			default: boolean;
		};
	}>> & Readonly<{}>, {
		showCaption: boolean;
	}, {}, {
		UiButton: import("ui.vue3").BitrixVueComponentProps | {
			button: import("../../../../../../../../ui/install/js/ui/buttons/src").Button | null;
		};
	}, {}, string, BX.Vue3.ComponentProvideOptions, true, {}, any>;

	/**
	 * The header of the viewer: the logo, the name of the object, the actions and the mount point of the
	 * boosts. It measures the width it actually got - the header lives on a full page and inside a slider
	 * alike - and gives up the captions of the buttons before anything else.
	 */
	const Header: BX.Vue3.DefineComponent<BX.Vue3.ExtractPropTypes<{
		documentSessionHash: {
			type: StringConstructor;
			default: string;
		};
		boostContainerId: {
			type: StringConstructor;
			required: true;
		};
		/**
		 * The address of the logo depends on the surface and on the way the object was opened, so it is
		 * given by the shell which mounts the header. Without it the logo stays a plain mark.
		 */
		logoUrl: {
			type: StringConstructor;
			default: string;
		};
	}>, Object, HeaderState, {
		hasLogo(): boolean;
		logoTag(): string;
		logoAttributes(): LogoAttributes;
		logoLabel(): string;
		/** The tightest container gives up the spacing of the mockups along with the words. */
		isCompact(): boolean;
		hasElement: () => (element: HeaderElementValue) => boolean;
	}, {}, BX.Vue3.ComponentOptionsMixin, BX.Vue3.ComponentOptionsMixin, {}, string, BX.Vue3.PublicProps, Readonly<BX.Vue3.ExtractPropTypes<{
		documentSessionHash: {
			type: StringConstructor;
			default: string;
		};
		boostContainerId: {
			type: StringConstructor;
			required: true;
		};
		/**
		 * The address of the logo depends on the surface and on the way the object was opened, so it is
		 * given by the shell which mounts the header. Without it the logo stays a plain mark.
		 */
		logoUrl: {
			type: StringConstructor;
			default: string;
		};
	}>> & Readonly<{}>, {
		documentSessionHash: string;
		logoUrl: string;
	}, {}, {
		ActionBar: BX.Vue3.DefineComponent<BX.Vue3.ExtractPropTypes<{
			showCaptions: {
				type: BooleanConstructor;
				default: boolean;
			};
		}>, {
			AirButtonStyle: typeof import("../../../../../../../../ui/install/js/ui/buttons/src").AirButtonStyle;
			ButtonSize: typeof import("../../../../../../../../ui/install/js/ui/buttons/src").ButtonSize;
			presentationAdapter: PresentationAdapter | null;
		}, {
			waitingElement: HeaderElementValue | null;
			spinner: BX.Disk.ButtonSpinner | null;
			isPresentationActive: boolean;
			unsubscribeFromPresentation: (() => void) | null;
		}, {
			actionContext(): {
				presentationAdapter: PresentationAdapter | null;
			};
			actions(): {
				element: HeaderElementValue;
				icon: string;
				caption: string;
				text: string;
				linkUrl: string;
				dataset: {
					headerAction: HeaderElementValue;
					testid: string;
				};
				run: (() => void | Promise<void>) | null;
			}[];
			hasElement: () => (element: HeaderElementValue) => boolean;
			composition: () => {
				elements: HeaderElementValue[];
				objectType: ObjectType;
				mode: CompositionMode;
				object: {
					id: number;
					name: string;
					uniqueCode: string;
					extension: string;
				};
				urls: {
					unifiedLink: string;
					download: string;
				};
				access: {
					controlType: string;
				};
				editors: {
					code: string;
					name: string;
					isDefault: boolean;
				}[];
			} | null;
		}, {
			subscribeToPresentation(): void;
			createAction(descriptor: {
				element: HeaderElementValue;
				icon: string;
				phraseCode: string;
				testId: string;
				hasCaption: boolean;
				linkUrl?: (composition: CompositionModel) => string;
				isAvailable?: (context: {
					presentationAdapter: PresentationAdapter | null;
				}) => boolean;
				run?: (composition: CompositionModel, context: {
					presentationAdapter: PresentationAdapter | null;
				}) => void | Promise<void>;
			}, composition: CompositionModel, linkUrl: string): {
				element: HeaderElementValue;
				icon: string;
				caption: string;
				text: string;
				linkUrl: string;
				dataset: {
					headerAction: HeaderElementValue;
					testid: string;
				};
				run: (() => void | Promise<void>) | null;
			};
			focusAction(element: HeaderElementValue): void;
			findActionNode(element: HeaderElementValue): HTMLElement | null;
			handleAction(action: {
				element: HeaderElementValue;
				icon: string;
				caption: string;
				text: string;
				linkUrl: string;
				dataset: {
					headerAction: HeaderElementValue;
					testid: string;
				};
				run: (() => void | Promise<void>) | null;
			}): Promise<void>;
			syncButtonAttributes(): void;
			syncSpinner(): void;
			destroySpinner(): void;
		}, BX.Vue3.ComponentOptionsMixin, BX.Vue3.ComponentOptionsMixin, {}, string, BX.Vue3.PublicProps, Readonly<BX.Vue3.ExtractPropTypes<{
			showCaptions: {
				type: BooleanConstructor;
				default: boolean;
			};
		}>> & Readonly<{}>, {
			showCaptions: boolean;
		}, {}, {
			UiButton: import("ui.vue3").BitrixVueComponentProps | {
				button: import("../../../../../../../../ui/install/js/ui/buttons/src").Button | null;
			};
		}, {}, string, BX.Vue3.ComponentProvideOptions, true, {}, any>;
		BoostSlot: BX.Vue3.DefineComponent<BX.Vue3.ExtractPropTypes<{
			containerId: {
				type: StringConstructor;
				required: true;
			};
		}>, Object, {}, {
			isPresent(): boolean;
			hasElement: () => (element: HeaderElementValue) => boolean;
		}, {}, BX.Vue3.ComponentOptionsMixin, BX.Vue3.ComponentOptionsMixin, {}, string, BX.Vue3.PublicProps, Readonly<BX.Vue3.ExtractPropTypes<{
			containerId: {
				type: StringConstructor;
				required: true;
			};
		}>> & Readonly<{}>, {}, {}, {}, {}, string, BX.Vue3.ComponentProvideOptions, true, {}, any>;
		ContentWarning: BX.Vue3.DefineComponent<{}, {
			HeaderTestId: typeof HeaderTestId;
			IconSize: number;
			WarningIcon: string;
		}, {}, {
			isPresent(): boolean;
			warningText(): string;
			hintParams(): {
				text: string;
				popupOptions: Object;
			};
			hasElement: () => (element: HeaderElementValue) => boolean;
		}, {
			showHint: BX.Disk.showHint;
			hideHint: BX.Disk.hideHint;
		}, BX.Vue3.ComponentOptionsMixin, BX.Vue3.ComponentOptionsMixin, {}, string, BX.Vue3.PublicProps, Readonly<{}> & Readonly<{}>, {}, {}, {
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
		}, {
			hint: {
				mounted(element: HTMLElement, { value }: {
					value: import("../../../../../../../../ui/install/js/ui/vue3/directives/hint/src/tooltip").HintParams | Function;
				}): void;
				updated(element: HTMLElement, { value }: {
					value: import("../../../../../../../../ui/install/js/ui/vue3/directives/hint/src/tooltip").HintParams | Function;
				}): void;
				beforeUnmount(element: HTMLElement): void;
			};
		}, string, BX.Vue3.ComponentProvideOptions, true, {}, any>;
		EditAction: BX.Vue3.DefineComponent<BX.Vue3.ExtractPropTypes<{
			showCaption: {
				type: BooleanConstructor;
				default: boolean;
			};
		}>, {
			AirButtonStyle: typeof import("../../../../../../../../ui/install/js/ui/buttons/src").AirButtonStyle;
			ButtonSize: typeof import("../../../../../../../../ui/install/js/ui/buttons/src").ButtonSize;
			EditControl: string;
			EditIcon: string;
			EditorsControl: string;
			HeaderTestId: typeof HeaderTestId;
			editUrl: string;
			shouldShowPromoImmediately: boolean;
		}, {
			isMenuOpen: boolean;
			anchor: HTMLElement | null;
			closedAt: number;
			menuComponent: DeferredComponent | null;
			isMenuLoading: boolean;
			spinner: BX.Disk.ButtonSpinner | null;
		}, {
			isPresent(): boolean;
			editors(): EditorItem[];
			hasMenu(): boolean;
			caption(): string;
			menuLabel(): string;
			menuOptions(): {
				bindElement: HTMLElement | null;
				items: {
					id: string;
					title: string;
					onClick: () => void;
				}[];
			};
			hasElement: () => (element: HeaderElementValue) => boolean;
			composition: () => {
				elements: HeaderElementValue[];
				objectType: ObjectType;
				mode: CompositionMode;
				object: {
					id: number;
					name: string;
					uniqueCode: string;
					extension: string;
				};
				urls: {
					unifiedLink: string;
					download: string;
				};
				access: {
					controlType: string;
				};
				editors: {
					code: string;
					name: string;
					isDefault: boolean;
				}[];
			} | null;
		}, {
			createMenuItem(editor: EditorItem): {
				id: string;
				title: string;
				onClick: () => void;
			};
			handleEdit(): void;
			showPromoOverButton(): Promise<void>;
			toggleMenu(): Promise<void>;
			closeMenu(): void;
			syncSpinner(): void;
			destroySpinner(): void;
			startEditing(editorCode: string): Promise<void>;
			control(name: string): HTMLElement | null;
			syncButtonAttributes(): void;
		}, BX.Vue3.ComponentOptionsMixin, BX.Vue3.ComponentOptionsMixin, {}, string, BX.Vue3.PublicProps, Readonly<BX.Vue3.ExtractPropTypes<{
			showCaption: {
				type: BooleanConstructor;
				default: boolean;
			};
		}>> & Readonly<{}>, {
			showCaption: boolean;
		}, {}, {
			UiButton: import("ui.vue3").BitrixVueComponentProps | {
				button: import("../../../../../../../../ui/install/js/ui/buttons/src").Button | null;
			};
		}, {}, string, BX.Vue3.ComponentProvideOptions, true, {}, any>;
		HeadlineMd: {
			extends: {
				name: string;
				inheritAttrs: boolean;
				props: {
					size: {
						type: StringConstructor;
						required: boolean;
						validator: (value: any) => boolean;
					};
					accent: {
						type: BooleanConstructor;
						default: boolean;
					};
					tag: {
						type: StringConstructor;
						default: string;
					};
					align: {
						type: StringConstructor;
						default: null;
						validator: (value: any) => boolean;
					};
					transform: {
						type: StringConstructor;
						default: null;
						validator: (value: any) => boolean;
					};
					wrap: {
						type: StringConstructor;
						default: null;
						validator: (value: any) => boolean;
					};
					className: {
						type: (ObjectConstructor | ArrayConstructor | StringConstructor)[];
						default: null;
					};
				};
				computed: {
					classes(): any[];
				};
				template: string;
			};
			props: {
				size: {
					default: string;
				};
			};
		};
		ObjectName: BX.Vue3.DefineComponent<BX.Vue3.ExtractPropTypes<{
			documentSessionHash: {
				type: StringConstructor;
				default: string;
			};
		}>, {
			shouldRenderNameAsPageHeading: boolean;
			HeaderTestId: typeof HeaderTestId;
			CheckIcon: string;
			CheckSize: number;
			PencilIcon: string;
			PencilSize: number;
		}, {
			draft: string;
			errorMessage: string;
			fieldWidth: number;
			isEditing: boolean;
			isSaving: boolean;
			isShortened: boolean;
			unobserve: (() => void) | null;
			field: DeferredInput | null;
			isFieldLoading: boolean;
			spinner: BX.Disk.ButtonSpinner | null;
			errorId: string;
		}, {
			isPresent(): boolean;
			canRename(): boolean;
			nameTag(): string;
			triggerTag(): string;
			extension(): string;
			displayName(): string;
			triggerLabel(): string | null;
			fieldLabel(): string;
			submitLabel(): string;
			measurementText(): string;
			hintParams(): {
				text: string;
				popupOptions: Object;
			} | null;
			hasElement: () => (element: HeaderElementValue) => boolean;
			composition: () => {
				elements: HeaderElementValue[];
				objectType: ObjectType;
				mode: CompositionMode;
				object: {
					id: number;
					name: string;
					uniqueCode: string;
					extension: string;
				};
				urls: {
					unifiedLink: string;
					download: string;
				};
				access: {
					controlType: string;
				};
				editors: {
					code: string;
					name: string;
					isDefault: boolean;
				}[];
			} | null;
		}, {
			observeWidth(): void;
			measureName(): void;
			syncFieldWidth(): void;
			startRename(): Promise<void>;
			closeField(): void;
			holdsFocus(): boolean;
			handleFieldBlur(event: FocusEvent): void;
			submitRename(): Promise<void>;
			syncFieldError(): void;
			fieldNode(): HTMLElement | null;
			syncSpinner(): void;
			destroySpinner(): void;
			showHint: BX.Disk.showHint;
			hideHint: BX.Disk.hideHint;
		}, BX.Vue3.ComponentOptionsMixin, BX.Vue3.ComponentOptionsMixin, {}, string, BX.Vue3.PublicProps, Readonly<BX.Vue3.ExtractPropTypes<{
			documentSessionHash: {
				type: StringConstructor;
				default: string;
			};
		}>> & Readonly<{}>, {
			documentSessionHash: string;
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
			TextLg: {
				extends: {
					name: string;
					inheritAttrs: boolean;
					props: {
						size: {
							type: StringConstructor;
							required: boolean;
							validator: (value: any) => boolean;
						};
						accent: {
							type: BooleanConstructor;
							default: boolean;
						};
						tag: {
							type: StringConstructor;
							default: string;
						};
						align: {
							type: StringConstructor;
							default: null;
							validator: (value: any) => boolean;
						};
						transform: {
							type: StringConstructor;
							default: null;
							validator: (value: any) => boolean;
						};
						wrap: {
							type: StringConstructor;
							default: null;
							validator: (value: any) => boolean;
						};
						className: {
							type: (ObjectConstructor | ArrayConstructor | StringConstructor)[];
							default: null;
						};
					};
					computed: {
						classes(): string[];
					};
					template: string;
				};
				props: {
					size: {
						default: string;
					};
				};
			};
		}, {
			hint: {
				mounted(element: HTMLElement, { value }: {
					value: import("../../../../../../../../ui/install/js/ui/vue3/directives/hint/src/tooltip").HintParams | Function;
				}): void;
				updated(element: HTMLElement, { value }: {
					value: import("../../../../../../../../ui/install/js/ui/vue3/directives/hint/src/tooltip").HintParams | Function;
				}): void;
				beforeUnmount(element: HTMLElement): void;
			};
		}, string, BX.Vue3.ComponentProvideOptions, true, {}, any>;
		PresenceStack: BX.Vue3.DefineComponent<{}, Object, {
			isOpen: boolean;
			anchor: HTMLElement | null;
			closedAt: number;
			popover: DeferredPopover | null;
			isPopoverLoading: boolean;
			avatar: DeferredComponent | null;
			isAvatarLoading: boolean;
			avatarAttempts: number;
			spinner: BX.Disk.ButtonSpinner | null;
		}, {
			hasRoster(): boolean;
			isPresent(): boolean;
			isAwaited(): boolean;
			visibleParticipants(): PresenceParticipant[];
			hiddenCount(): number;
			triggerLabel(): string;
			listLabel(): string;
			stackSizeStyle(): Record<string, string>;
			popoverOptions(): {
				target: HTMLElement | null;
				positioning: {
					position: string;
					alignment: string;
					offset: number;
				};
			} | null;
			participants: () => {
				id: number;
				name: string;
				avatar: string;
				isGuest: boolean;
			}[];
			isAvailable: () => boolean;
			hasElement: () => (element: HeaderElementValue) => boolean;
		}, {
			loadFaces(): Promise<void>;
			avatarOptions(participant: PresenceParticipant, size: number): {
				size: number;
				userName: string;
				userpicPath: string;
			};
			toggleList(event: Event): Promise<void>;
			closeList(): void;
			hideList(): void;
			focusList(): Promise<void>;
			focusWaitsOnStack(): boolean;
			listHoldsFocus(): boolean;
			listNode(): HTMLElement | null;
			syncSpinner(trigger: HTMLElement): void;
			destroySpinner(): void;
		}, BX.Vue3.ComponentOptionsMixin, BX.Vue3.ComponentOptionsMixin, {}, string, BX.Vue3.PublicProps, Readonly<{}> & Readonly<{}>, {}, {}, {
			TextSm: {
				extends: {
					name: string;
					inheritAttrs: boolean;
					props: {
						size: {
							type: StringConstructor;
							required: boolean;
							validator: (value: any) => boolean;
						};
						accent: {
							type: BooleanConstructor;
							default: boolean;
						};
						tag: {
							type: StringConstructor;
							default: string;
						};
						align: {
							type: StringConstructor;
							default: null;
							validator: (value: any) => boolean;
						};
						transform: {
							type: StringConstructor;
							default: null;
							validator: (value: any) => boolean;
						};
						wrap: {
							type: StringConstructor;
							default: null;
							validator: (value: any) => boolean;
						};
						className: {
							type: (ObjectConstructor | ArrayConstructor | StringConstructor)[];
							default: null;
						};
					};
					computed: {
						classes(): string[];
					};
					template: string;
				};
				props: {
					size: {
						default: string;
					};
				};
			};
			TextXs: {
				extends: {
					name: string;
					inheritAttrs: boolean;
					props: {
						size: {
							type: StringConstructor;
							required: boolean;
							validator: (value: any) => boolean;
						};
						accent: {
							type: BooleanConstructor;
							default: boolean;
						};
						tag: {
							type: StringConstructor;
							default: string;
						};
						align: {
							type: StringConstructor;
							default: null;
							validator: (value: any) => boolean;
						};
						transform: {
							type: StringConstructor;
							default: null;
							validator: (value: any) => boolean;
						};
						wrap: {
							type: StringConstructor;
							default: null;
							validator: (value: any) => boolean;
						};
						className: {
							type: (ObjectConstructor | ArrayConstructor | StringConstructor)[];
							default: null;
						};
					};
					computed: {
						classes(): string[];
					};
					template: string;
				};
				props: {
					size: {
						default: string;
					};
				};
			};
		}, {}, string, BX.Vue3.ComponentProvideOptions, true, {}, any>;
		SaveStatusIndicator: BX.Vue3.DefineComponent<{}, {
			AirButtonStyle: typeof import("../../../../../../../../ui/install/js/ui/buttons/src").AirButtonStyle;
			ButtonSize: typeof import("../../../../../../../../ui/install/js/ui/buttons/src").ButtonSize;
			HeaderTestId: typeof HeaderTestId;
			IconSize: number;
			RetryControl: string;
			adapter: EditorAdapter | null;
			status: SaveStatus;
		}, {
			spinner: {
				show: (target: HTMLElement) => void;
				hide: () => void;
				destroy: () => void;
			} | null;
			isRetrying: boolean;
			retrySpinner: BX.Disk.ButtonSpinner | null;
		}, {
			state(): SaveState;
			isPresent(): boolean;
			isSaving(): boolean;
			isFailed(): boolean;
			isAutosave(): boolean;
			icon(): string;
			iconColor(): string;
			hasIcon(): boolean;
			message(): string;
			canRetry(): boolean;
			retryCaption(): string;
			hasElement: () => (element: HeaderElementValue) => boolean;
		}, {
			handleRetry(): void;
			retry(): Promise<void>;
			syncRetrySpinner(): void;
			destroyRetrySpinner(): void;
			announceOutcome(): void;
			syncSpinner(): void;
		}, BX.Vue3.ComponentOptionsMixin, BX.Vue3.ComponentOptionsMixin, {}, string, BX.Vue3.PublicProps, Readonly<{}> & Readonly<{}>, {}, {}, {
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
			TextXs: {
				extends: {
					name: string;
					inheritAttrs: boolean;
					props: {
						size: {
							type: StringConstructor;
							required: boolean;
							validator: (value: any) => boolean;
						};
						accent: {
							type: BooleanConstructor;
							default: boolean;
						};
						tag: {
							type: StringConstructor;
							default: string;
						};
						align: {
							type: StringConstructor;
							default: null;
							validator: (value: any) => boolean;
						};
						transform: {
							type: StringConstructor;
							default: null;
							validator: (value: any) => boolean;
						};
						wrap: {
							type: StringConstructor;
							default: null;
							validator: (value: any) => boolean;
						};
						className: {
							type: (ObjectConstructor | ArrayConstructor | StringConstructor)[];
							default: null;
						};
					};
					computed: {
						classes(): string[];
					};
					template: string;
				};
				props: {
					size: {
						default: string;
					};
				};
			};
			UiButton: import("ui.vue3").BitrixVueComponentProps | {
				button: import("../../../../../../../../ui/install/js/ui/buttons/src").Button | null;
			};
		}, {}, string, BX.Vue3.ComponentProvideOptions, true, {}, any>;
	}, {}, string, BX.Vue3.ComponentProvideOptions, true, {}, any>;

	/**
	 * Name of the opened object: shown without its extension, shortened when it does not fit and
	 * restored in full by the hint. Renaming is offered only when the composition carries that element.
	 */
	const ObjectName: BX.Vue3.DefineComponent<BX.Vue3.ExtractPropTypes<{
		documentSessionHash: {
			type: StringConstructor;
			default: string;
		};
	}>, ObjectNameContext, ObjectNameState, {
		isPresent(): boolean;
		canRename(): boolean;
		/**
		 * A header standing on a page of its own gives that page the only heading it has - the name of
		 * what is open. In a shell of an editor the page is not the header's to name, and the name is
		 * text like the rest of the strip.
		 */
		nameTag(): string;
		/** A heading is flow content, so what holds it cannot stay a span. */
		triggerTag(): string;
		extension(): string;
		/** The stored name carries the extension, the header shows the name without it. */
		displayName(): string;
		triggerLabel(): string | null;
		fieldLabel(): string;
		/** The checkmark carries out an action and is named by it, not by the field standing next to it. */
		submitLabel(): string;
		measurementText(): string;
		/**
		 * Only a name the header had to shorten has something to tell, so a name shown in full opens
		 * nothing at all. The bubble is raised above the frame of the editor, which lies right under
		 * the header and would otherwise leave nothing of it but the angle.
		 */
		hintParams(): HintBinding | null;
		hasElement: () => (element: HeaderElementValue) => boolean;
		composition: () => {
			elements: HeaderElementValue[];
			objectType: ObjectType;
			mode: CompositionMode;
			object: {
				id: number;
				name: string;
				uniqueCode: string;
				extension: string;
			};
			urls: {
				unifiedLink: string;
				download: string;
			};
			access: {
				controlType: string;
			};
			editors: {
				code: string;
				name: string;
				isDefault: boolean;
			}[];
		} | null;
	}, {
		observeWidth(): void;
		measureName(): void;
		syncFieldWidth(): void;
		/**
		 * The field is not a part of the opening and arrives with the extension of its own on the first
		 * rename. Until it is here the name stays a name: the same node keeps the focus it was activated
		 * by, and only when the field is ready does it take the place - and the focus - of that node.
		 */
		startRename(): Promise<void>;
		/**
		 * Closing takes the field off the page, and the field is what the keyboard was on: the name it
		 * grew out of gets the focus back. A closing which followed the focus leaving the block on its
		 * own - a press somewhere else - takes nothing back.
		 */
		closeField(): void;
		holdsFocus(): boolean;
		/**
		 * Leaving the field for something else stores the entered name. Escape is the other thing entirely:
		 * it closes the field, and the field is taken off the page with the focus on it, so the blur which
		 * follows belongs to a closing that has already happened and has nothing left to store.
		 */
		handleFieldBlur(event: FocusEvent): void;
		submitRename(): Promise<void>;
		/**
		 * The field of the design system draws the reason next to itself and ties it to nothing: a person on
		 * the field is told the name of the field and no word of why the entered one was refused. The state
		 * and the address of the reason are put onto the rendered nodes, as the names of the buttons are.
		 */
		syncFieldError(): void;
		fieldNode(): HTMLElement | null;
		syncSpinner(): void;
		destroySpinner(): void;
		showHint: typeof showHint;
		hideHint: typeof hideHint;
	}, BX.Vue3.ComponentOptionsMixin, BX.Vue3.ComponentOptionsMixin, {}, string, BX.Vue3.PublicProps, Readonly<BX.Vue3.ExtractPropTypes<{
		documentSessionHash: {
			type: StringConstructor;
			default: string;
		};
	}>> & Readonly<{}>, {
		documentSessionHash: string;
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
		TextLg: {
			extends: {
				name: string;
				inheritAttrs: boolean;
				props: {
					size: {
						type: StringConstructor;
						required: boolean;
						validator: (value: any) => boolean;
					};
					accent: {
						type: BooleanConstructor;
						default: boolean;
					};
					tag: {
						type: StringConstructor;
						default: string;
					};
					align: {
						type: StringConstructor;
						default: null;
						validator: (value: any) => boolean;
					};
					transform: {
						type: StringConstructor;
						default: null;
						validator: (value: any) => boolean;
					};
					wrap: {
						type: StringConstructor;
						default: null;
						validator: (value: any) => boolean;
					};
					className: {
						type: (ObjectConstructor | ArrayConstructor | StringConstructor)[];
						default: null;
					};
				};
				computed: {
					classes(): string[];
				};
				template: string;
			};
			props: {
				size: {
					default: string;
				};
			};
		};
	}, {
		hint: {
			mounted(element: HTMLElement, { value }: {
				value: import("ui.vue3.directives.hint").HintParams | Function;
			}): void;
			updated(element: HTMLElement, { value }: {
				value: import("ui.vue3.directives.hint").HintParams | Function;
			}): void;
			beforeUnmount(element: HTMLElement): void;
		};
	}, string, BX.Vue3.ComponentProvideOptions, true, {}, any>;

	/**
	 * Everyone who has the document open: three avatars, a counter of the rest and a list of the whole
	 * roster. The block draws itself only on a confirmed roster - an empty stack and a knowingly incomplete
	 * one are both worse than no stack at all - and shows nothing about a participant beyond the name and
	 * the avatar the server gave: seeing the list grants no rights on the object nor on the profiles.
	 */
	const PresenceStack: BX.Vue3.DefineComponent<{}, Object, PresenceStackState, {
		/** A roster worth drawing; the faces of it are asked for only once there is one. */
		hasRoster(): boolean;
		isPresent(): boolean;
		/** The row holds the place of the faces while an ask for them is still left to make. */
		isAwaited(): boolean;
		visibleParticipants(): PresenceParticipant[];
		hiddenCount(): number;
		triggerLabel(): string;
		listLabel(): string;
		/** The faces take their size as an option, and the row is drawn to the very same size. */
		stackSizeStyle(): Record<string, string>;
		popoverOptions(): PopoverBinding | null;
		participants: () => {
			id: number;
			name: string;
			avatar: string;
			isGuest: boolean;
		}[];
		isAvailable: () => boolean;
		hasElement: () => (element: HeaderElementValue) => boolean;
	}, {
		/**
		 * A refusal leaves the block undrawn, and the next roster asks for the faces again - up to the
		 * ceiling of the asks, after which the page draws no roster until it is opened anew.
		 */
		loadFaces(): Promise<void>;
		avatarOptions(participant: PresenceParticipant, size: number): AvatarOptions;
		/**
		 * The list closes itself on a click outside, and the stack is outside it: such a click reaches the
		 * stack once the list is already closed and would open it right back. It is told from a new one by
		 * its own moment - an event born before the closing is the very activation that closed the list.
		 *
		 * The bubble the list is drawn in is not a part of the opening and arrives on the first press; the
		 * stack itself stays where it is meanwhile, so the press does not throw the focus anywhere.
		 */
		toggleList(event: Event): Promise<void>;
		closeList(): void;
		/**
		 * Taking the dialog off the page takes away what the keyboard was on: while the focus was inside
		 * the list, the stack it grew out of gets it back. A closing which followed the focus leaving on
		 * its own - a press somewhere else - takes nothing back.
		 */
		hideList(): void;
		/**
		 * A dialog the keyboard cannot enter gives the press no answer at all. There is nothing to press
		 * inside the list, so the dialog itself takes the focus and lets it go on with the next Tab.
		 *
		 * The dialog is not on the page in the tick it is rendered, and a node which is not there takes no
		 * focus - so the attempt is repeated frame by frame until the focus is really inside the list. A
		 * list which never took it - a bubble which never came - leaves the focus on the stack.
		 */
		focusList(): Promise<void>;
		/** A focus which went somewhere on its own while the bubble was on its way is not taken away. */
		focusWaitsOnStack(): boolean;
		listHoldsFocus(): boolean;
		listNode(): HTMLElement | null;
		syncSpinner(trigger: HTMLElement): void;
		destroySpinner(): void;
	}, BX.Vue3.ComponentOptionsMixin, BX.Vue3.ComponentOptionsMixin, {}, string, BX.Vue3.PublicProps, Readonly<{}> & Readonly<{}>, {}, {}, {
		TextSm: {
			extends: {
				name: string;
				inheritAttrs: boolean;
				props: {
					size: {
						type: StringConstructor;
						required: boolean;
						validator: (value: any) => boolean;
					};
					accent: {
						type: BooleanConstructor;
						default: boolean;
					};
					tag: {
						type: StringConstructor;
						default: string;
					};
					align: {
						type: StringConstructor;
						default: null;
						validator: (value: any) => boolean;
					};
					transform: {
						type: StringConstructor;
						default: null;
						validator: (value: any) => boolean;
					};
					wrap: {
						type: StringConstructor;
						default: null;
						validator: (value: any) => boolean;
					};
					className: {
						type: (ObjectConstructor | ArrayConstructor | StringConstructor)[];
						default: null;
					};
				};
				computed: {
					classes(): string[];
				};
				template: string;
			};
			props: {
				size: {
					default: string;
				};
			};
		};
		TextXs: {
			extends: {
				name: string;
				inheritAttrs: boolean;
				props: {
					size: {
						type: StringConstructor;
						required: boolean;
						validator: (value: any) => boolean;
					};
					accent: {
						type: BooleanConstructor;
						default: boolean;
					};
					tag: {
						type: StringConstructor;
						default: string;
					};
					align: {
						type: StringConstructor;
						default: null;
						validator: (value: any) => boolean;
					};
					transform: {
						type: StringConstructor;
						default: null;
						validator: (value: any) => boolean;
					};
					wrap: {
						type: StringConstructor;
						default: null;
						validator: (value: any) => boolean;
					};
					className: {
						type: (ObjectConstructor | ArrayConstructor | StringConstructor)[];
						default: null;
					};
				};
				computed: {
					classes(): string[];
				};
				template: string;
			};
			props: {
				size: {
					default: string;
				};
			};
		};
	}, {}, string, BX.Vue3.ComponentProvideOptions, true, {}, any>;

	/**
	 * State of saving of the opened object. The value comes from the editor through the adapter; a
	 * neutral value is not drawn at all, so an object nothing is claimed about carries no status. Which
	 * objects are claimed nothing about at rest is decided before the value reaches the indicator.
	 *
	 * An editor which saves by itself claims the mode instead of an outcome: the label of the autosaving
	 * is drawn the way a confirmed saving is, and it stays for as long as the object is open.
	 */
	const SaveStatusIndicator: BX.Vue3.DefineComponent<{}, IndicatorContext, IndicatorState, {
		state(): SaveState;
		isPresent(): boolean;
		isSaving(): boolean;
		isFailed(): boolean;
		isAutosave(): boolean;
		icon(): string;
		iconColor(): string;
		hasIcon(): boolean;
		/** The reason of a refusal comes from the editor; the text of the phrase is the fallback. */
		message(): string;
		canRetry(): boolean;
		retryCaption(): string;
		hasElement: () => (element: HeaderElementValue) => boolean;
	}, {
		handleRetry(): void;
		/**
		 * One press starts one attempt: while an attempt is being started the button keeps its place
		 * and answers nothing, so a row of presses does not turn into a row of attempts. The editor
		 * reports the outcome as the next status, and by then the button is gone unless the refusal
		 * repeated itself.
		 */
		retry(): Promise<void>;
		/** The wait is laid over the button itself, so it keeps its place in the tab order and the focus. */
		syncRetrySpinner(): void;
		destroyRetrySpinner(): void;
		/**
		 * The indicator appears together with the very message it would have to announce, and a live
		 * region born with its content is not read at all: the outcome goes through the announcer. The
		 * saving under way is not an outcome and is left to be seen rather than heard, and neither is
		 * the label of the autosaving: it states the mode of the opening and never changes afterwards.
		 */
		announceOutcome(): void;
		syncSpinner(): void;
	}, BX.Vue3.ComponentOptionsMixin, BX.Vue3.ComponentOptionsMixin, {}, string, BX.Vue3.PublicProps, Readonly<{}> & Readonly<{}>, {}, {}, {
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
		TextXs: {
			extends: {
				name: string;
				inheritAttrs: boolean;
				props: {
					size: {
						type: StringConstructor;
						required: boolean;
						validator: (value: any) => boolean;
					};
					accent: {
						type: BooleanConstructor;
						default: boolean;
					};
					tag: {
						type: StringConstructor;
						default: string;
					};
					align: {
						type: StringConstructor;
						default: null;
						validator: (value: any) => boolean;
					};
					transform: {
						type: StringConstructor;
						default: null;
						validator: (value: any) => boolean;
					};
					wrap: {
						type: StringConstructor;
						default: null;
						validator: (value: any) => boolean;
					};
					className: {
						type: (ObjectConstructor | ArrayConstructor | StringConstructor)[];
						default: null;
					};
				};
				computed: {
					classes(): string[];
				};
				template: string;
			};
			props: {
				size: {
					default: string;
				};
			};
		};
		UiButton: import("ui.vue3").BitrixVueComponentProps | {
			button: import("../../../../../../../../ui/install/js/ui/buttons/src").Button | null;
		};
	}, {}, string, BX.Vue3.ComponentProvideOptions, true, {}, any>;
}
