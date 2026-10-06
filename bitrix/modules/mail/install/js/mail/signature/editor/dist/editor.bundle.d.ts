/* eslint-disable */
type SignatureEditorOptions = EditorPanels & {
	editorInstanceId: string;
	signatureId: number;
	alertContainer: HTMLElement;
	transport: SignatureTransport;
	sliderMessage: SliderMessage;
	panelContainer?: HTMLElement | null;
	scopeCardContainer?: HTMLElement | null;
	capabilities?: SignatureEditorCapability[];
};

/**
 * The cards the save data may come from. The editor itself is one of them, hence the shape is
 * a part of SignatureEditorOptions rather than an argument of its own.
 */
type EditorPanels = {
	panel?: PanelSlot | null;
	scopeCard?: ScopeCardSlot | null;
};

type PanelSlot = {
	renderTo(container: HTMLElement): void;
	getSaveData(): PanelSaveData;
};

type PanelSaveData = {
	kind?: PanelKind;
	sender?: string;
	preserveAssignment?: boolean;
	senderChanged?: boolean;
	assignments?: Assignment[];
};

type PanelKind = 'user' | 'shared';

type Assignment = {
	targetType: string;
	targetId: number;
	targetValue?: string;
	isFlat: boolean;
	title?: string;
};

/**
 * The third card of the editor: the switcher of the scope in its header and the assignments
 * behind it. The switcher is the primary choice of the screen — the editor gives the sender card
 * away to the assignments by it — so the card lets the editor subscribe instead of taking a
 * handler at construction, where the editor does not exist yet.
 */
type ScopeCardSlot = PanelSlot & {
	isSharedScope(): boolean;
	subscribeToScope(handler: (shared: boolean) => void): void;
	/**
	 * Whether the choice of the card is finished. A way of assigning made of a selector with nothing
	 * chosen in it is not: the signature has an own way of being assigned to nobody. The card says
	 * what is missing itself, the editor only learns that there is nothing to save yet.
	 */
	validate(): boolean;
};

interface SignatureTransport {
	save(payload: SavePayload): Promise<number>;
	getUpdateSuccessText(): string;
}

type SavePayload = {
	signatureId: number;
	signature: string;
	panelData: PanelSaveData | null;
	scopeChanged?: boolean;
};

type SliderMessage = {
	eventId: string;
	idKey: string;
};

interface SignatureEditorCapability {
	connect(context: SignatureEditorContext): void;
	beforeSave(): boolean | Promise<boolean>;
	disconnect?(): void;
}

type SignatureEditorContext = {
	editor: SignatureHtmlEditor;
	showError(text: string): void;
	clearError(): void;
};

type SignatureHtmlEditor = {
	getContent(): string;
	insertHtml(html: string): void;
	focus(): void;
};

type SignatureMacroCatalogGroup = {
	id: string;
	label: string;
	items: SignatureMacroCatalogItem[];
};

type SignatureMacroCatalogItem = SignatureMacroCatalogItemDto & {
	label: string;
};

type SignatureMacroCatalogItemDto = {
	id: string;
	token: string;
	labelKey: string;
};

type SignatureMacroCapabilityOptions = {
	catalog: {
		getGroups(): SignatureMacroCatalogGroup[];
		getTokens(): Set<string>;
	};
	actionContainer: HTMLElement;
};

type SignatureMacroMenuOptions = {
	sections: MenuSectionOptions[];
	items: MenuItemOptions[];
	closeOnItemClick: boolean;
};

type MenuSectionOptions = {
	code: string;
	title: string;
};

type MenuItemOptions = {
	id: string;
	title: string;
	sectionCode: string;
	onClick: () => void;
};

type SenderBindingPanelOptions = {
	senderOptions: SenderOption[];
};

type SenderOption = {
	id: string;
	title: string;
	value: string;
	selected?: boolean;
	preserveAssignment?: boolean;
};

type SenderSelectorItem = {
	id: string;
	entityId: string;
	title: string;
	tabs: string;
	sort: number;
	selected: boolean;
	deselectable: boolean;
};

type CompositeTransportOptions = {
	/**
	 * The shared signature the editor was opened on, if it was opened on one at all. The `signatureId`
	 * of the editor answers for the personal path alone, so the shared one is named separately.
	 */
	sharedSignatureId?: number;
	/** The original row of the unified model, used only when its scope changes. */
	unifiedSignatureId?: number;
	/** Scope of the original unified row. */
	initialKind?: 'user' | 'shared';
	/** Transport of the unified model, required when unifiedSignatureId is set. */
	unifiedTransport?: SignatureTransport;
};

type UnifiedTransportCondition = {
	/** The row of the unified model the editor was opened on, 0 for a signature being created. */
	unifiedSignatureId?: number;
	/** Whether the screen offers the card of the shared scope. */
	hasSharedScopeCard?: boolean;
};

/**
 * The third card of the signature editor: the shared signature.
 *
 * Its switcher expresses the scope of the signature and is the primary choice of the screen —
 * turned on, the card takes the place of the sender card and asks whom the signature is assigned
 * to instead. The card owns the switcher and the choice between the ways of assigning, and keeps
 * the block of targets that way of assigning needs.
 *
 * The card implements ScopeCardSlot, so SignatureEditor reads its data the way it reads any panel
 * and learns of the switcher through subscribeToScope().
 */
type AssignmentTypeSelectorOptions = {
	/** Whether the card opens with the shared scope on. Defaults to off. */
	shared?: boolean;
	/** Assignments of an existing shared signature; they decide the way of assigning it opens on. */
	assignments?: Assignment[];
	/** Way of assigning to open on, when it is not to be read from the assignments. */
	mode?: AssignmentMode;
};

type AssignmentMode = 'all' | 'mailbox' | 'department' | 'draft';

type AssignmentBlockOptions = {
	/** Assignments of an existing signature; a new one opens with none. */
	assignments?: Assignment[];
	/** Called when a target is added to a selector, so the card may drop what it said was missing. */
	onTargetAdd?: () => void;
};

type SaveRequest = {
	action: string;
	data: Record<string, unknown>;
};

type UserSignatureResponseData = {
	userSignature?: {
		id?: number | string;
	};
};

type SharedSignatureResponseData = {
	item?: {
		id?: number | string;
	};
};

type SignatureMacroCatalogDto = {
	version: number | string;
	groups: SignatureMacroCatalogGroupDto[];
};

type SignatureMacroCatalogGroupDto = {
	id: string;
	items: SignatureMacroCatalogItemDto[];
};

declare namespace BX.Mail.Signature.Editor {
	class SignatureEditor {
		constructor(options: SignatureEditorOptions);
		save(closeAfter?: boolean): void;
		destroy(): void;
		showError(text: string): void;
		clearError(): void;
		closeSlider(signatureId: number): void;
	}

	class SignatureMacroCatalog {
		private constructor();
		static fromDto(dto: unknown): SignatureMacroCatalog | null;
		getGroups(): SignatureMacroCatalogGroup[];
		getTokens(): Set<string>;
	}

	class SignatureMacroCapability {
		constructor(options: SignatureMacroCapabilityOptions);
		connect(context: SignatureEditorContext): void;
		beforeSave(): boolean;
		disconnect(): void;
	}

	function buildSignatureMacroMenuOptions(groups: SignatureMacroCatalogGroup[], onSelect: (item: SignatureMacroCatalogItem) => void): SignatureMacroMenuOptions;

	function findFirstUnknownMacro(template: string, knownTokens: Set<string>): string | null;

	class SenderBindingPanel implements PanelSlot {
		constructor(options: SenderBindingPanelOptions);
		renderTo(container: HTMLElement): void;
		getSaveData(): PanelSaveData;
	}

	const SENDER_OPTION_ENTITY_ID: string;

	function buildSenderSelectorItems(options: SenderOption[]): SenderSelectorItem[];

	function getInitialSenderOptionId(options: SenderOption[]): string | null;

	function getSenderValueById(options: SenderOption[], id: string | null): string;

	/**
	 * Routes save() to the personal or corporate transport depending on the active
	 * panel's `kind`. The unified editor (admin) uses this so a single
	 * SignatureEditor can persist either a user signature or a shared one without
	 * the editor core knowing about the two storage backends.
	 *
	 * Existing signatures keep their unified identifier when the scope changes. Saves that keep the
	 * original scope still use the compatibility transports.
	 */
	class CompositeTransport implements SignatureTransport {
		constructor(userTransport: SignatureTransport, sharedTransport: SignatureTransport, options?: CompositeTransportOptions);
		save(payload: SavePayload): Promise<number>;
		getUpdateSuccessText(): string;
	}

	/**
	 * Whether the screen has to route its saves through the unified model. A signature that already has
	 * a row there is saved by the identifier of that row — the card of the shared scope is a separate
	 * matter, it decides the scope of the signature and not the identifier space the row lives in, so a
	 * screen without the card needs the same routing.
	 */
	function needsUnifiedTransport(condition: UnifiedTransportCondition): boolean;

	class AssignmentTypeSelector implements ScopeCardSlot {
		constructor(options?: AssignmentTypeSelectorOptions);
		renderTo(container: HTMLElement): void;
		isSharedScope(): boolean;
		subscribeToScope(handler: (shared: boolean) => void): void;
		getSaveData(): PanelSaveData;
		/**
		 * A way of assigning made of a selector says whom by its targets, so an empty selector says
		 * nothing at all — an unfinished choice, not the wish to take the signature away from everybody
		 * it is assigned to. That wish has a way of its own on the card, and the message names it.
		 */
		validate(): boolean;
	}

	/**
	 * The targets a shared signature is assigned to. The way of assigning is the choice of the third
	 * card of the editor and arrives through setMode(); the block renders the selector that way needs
	 * and answers with the assignments it holds.
	 *
	 * Modes:
	 *  - all        → [{targetType: 'all', targetId: 0, isFlat: false}]
	 *  - mailbox    → [{targetType: 'mailbox', targetId: <id>, isFlat: false}, ...]
	 *  - department → [{targetType: 'department', targetId: <id>, isFlat: <bool>}, ...] for departments
	 *                 [{targetType: 'user', targetId: <id>, isFlat: false}, ...] for employees
	 *  - draft      → [] — the signature is assigned to nobody and has no targets to render
	 */
	class AssignmentBlock implements PanelSlot {
		constructor(options?: AssignmentBlockOptions);
		renderTo(container: HTMLElement): void;
		getSaveData(): PanelSaveData;
		getAssignments(): Assignment[];
		/**
		 * Switches the way of assigning: the card owns the choice, the block owns the selector behind it.
		 */
		setMode(mode: AssignmentMode): void;
	}

	const ASSIGNMENT_MODES: AssignmentMode[];

	/**
	 * The draft is the way of assigning nothing is assigned by, so it is also the answer for a set of
	 * targets no option of the card expresses: the editor must not read an unknown set as a wider scope
	 * than the signature actually has.
	 */
	const DEFAULT_ASSIGNMENT_MODE: AssignmentMode;

	/**
	 * The way an existing signature was assigned, as the third card of the editor has to show it.
	 * A signature given to everybody names it outright; targets of departments and employees are read
	 * as "by departments and employees", and only a set made of mailboxes alone is read as the choice
	 * of particular mailboxes. No targets at all is the draft — the signature applies to nobody, and
	 * reading it as any other way would hand it a scope its author never chose on the next save.
	 */
	function detectAssignmentMode(assignments: Assignment[]): AssignmentMode;

	/**
	 * Whether the way of assigning is one whose targets the author picks, and which is therefore
	 * unfinished until at least one is picked. "All mailboxes" names its target by itself, and the
	 * draft is the way of assigning the signature to nobody — neither has anything to pick.
	 */
	function modeRequiresTargets(mode: AssignmentMode): boolean;

	class UserSignatureTransport implements SignatureTransport {
		save(payload: SavePayload): Promise<number>;
		getUpdateSuccessText(): string;
	}

	class SharedSignatureTransport implements SignatureTransport {
		save(payload: SavePayload): Promise<number>;
		getUpdateSuccessText(): string;
	}

	class UnifiedSignatureTransport implements SignatureTransport {
		save(payload: SavePayload): Promise<number>;
		getUpdateSuccessText(): string;
	}

	/**
	 * A request body goes to the server form-encoded, and an empty list does not survive that: the
	 * `assignments` key disappears together with its contents, and an absent key has always meant "do
	 * not change the assignments". This flag says the set is being sent, so that a signature assigned to
	 * nobody — the draft — reaches the server as the empty set it is.
	 */
	const ASSIGNMENTS_PROVIDED = "Y";

	function buildUserSignatureSaveRequest(payload: SavePayload): SaveRequest;

	function buildSharedSignatureSaveRequest(payload: SavePayload): SaveRequest;

	function buildUnifiedSignatureUpdateRequest(payload: SavePayload): SaveRequest;

	function extractUserSignatureId(responseData: UserSignatureResponseData | null | undefined): number;

	function extractSharedSignatureId(responseData: SharedSignatureResponseData | null | undefined): number;

	/**
	 * Picks the card the save request is built from. The switcher of the third card is the single
	 * primary choice: with the shared scope on the assignments answer, with it off the sender binding
	 * does. An editor without the third card — a plain employee, or the shared interface turned off —
	 * has the personal path alone.
	 */
	function pickPanelData(panels: EditorPanels): PanelSaveData | null;
}
