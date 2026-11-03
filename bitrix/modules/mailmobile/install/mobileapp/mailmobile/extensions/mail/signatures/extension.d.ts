export type MobileSignatureScope = 'owner' | 'shared';

export type MobileSignature = {
	id: number,
	text: string,
	scope: MobileSignatureScope,
	senderKey: string | null,
	senderKeys: string[],
	senderTexts?: Record<string, string>,
};

export type MobileSignatureSender = {
	key: string,
	email: string,
	name: string,
	availableSignatureIds: number[],
	selectedSignatureId: number | null,
};

export type MobileSignatureContext = {
	signatures: MobileSignature[],
	senders: MobileSignatureSender[],
};

export type SignatureCreateParams = {
	text: string,
	senderKey?: string | null,
	senderKeys?: string[],
};

export type SignatureNavigatorOptions = {
	onOpened?: () => void,
	perfPoint?: {
		startPoint: (key: string, label?: string) => void,
		endPoint: (key: string, extra?: object) => void,
		end: () => void,
	},
};

export type SignatureApiContract = {
	loadContext: () => Promise<MobileSignatureContext>,
	addOwner: (params: SignatureCreateParams) => Promise<MobileSignature>,
	deleteOwner: (id: number) => Promise<{ ok: boolean }>,
	setChoice: (
		senderKey: string,
		signatureId: number | null,
	) => Promise<{ senderKey: string, selectedSignatureId: number | null }>,
};

type SignatureListProps = {
	layoutWidget: LayoutWidget,
	api: SignatureApiContract,
	perfPoint?: SignatureNavigatorOptions['perfPoint'],
	onOpened?: () => void,
	onUnavailable?: () => void,
};

type SignatureListState = {
	loading: boolean,
	loadError: boolean,
	removingId: number | null,
	revision: number,
};

type SignatureCreateProps = {
	layoutWidget: LayoutWidget,
	api: SignatureApiContract,
	senders: MobileSignatureSender[],
	initialSenderKey?: string | null,
	onCreated?: (item: MobileSignature) => void,
};

type SignatureCreateState = {
	text: string,
	bindingEnabled: boolean,
	senderKeys: string[],
	saving: boolean,
};

export class SignatureSenderSelection {
	constructor(senders?: MobileSignatureSender[], selectedKeys?: string[]);
	selectedKeys: Set<string>;
	toggle(key: string): void;
	remove(key: string): void;
	setQuery(query: string): void;
	getSelectedKeys(): string[];
	getFilteredSenders(): MobileSignatureSender[];
}

export class SignatureApi implements SignatureApiContract {
	loadContext(): Promise<MobileSignatureContext>;
	addOwner(params: SignatureCreateParams): Promise<MobileSignature>;
	deleteOwner(id: number): Promise<{ ok: boolean }>;
	setChoice(
		senderKey: string,
		signatureId: number | null,
	): Promise<{ senderKey: string, selectedSignatureId: number | null }>;
	static isUnavailableFailure(failure: unknown): boolean;
}

export class SignatureModel {
	constructor(context?: Partial<MobileSignatureContext>);
	signatures: MobileSignature[];
	senders: MobileSignatureSender[];
	updateContext(context?: Partial<MobileSignatureContext>): void;
	getOwnerSignatures(): MobileSignature[];
	getAvailableSignatures(senderKey: string): MobileSignature[];
	findSignature(id: number): MobileSignature | null;
	resolveSignature(id: number, senderKey: string): MobileSignature | null;
	findSender(senderKey: string): MobileSignatureSender | null;
	addOwner(item: MobileSignature): void;
	setSelectedSignature(senderKey: string, signatureId: number | null): boolean;
	removeOwner(id: number): boolean;
}

export class SignatureNavigator {
	static open(options?: SignatureNavigatorOptions): void;
}

export class SignatureList {
	constructor(props: SignatureListProps);
	state: SignatureListState;
}

export class SignatureCreate {
	constructor(props: SignatureCreateProps);
	state: SignatureCreateState;
}

export class ComposeSignatureState {
	constructor(signature?: MobileSignature | null, options?: { restoredDraft?: boolean });
	automaticTransitionsEnabled: boolean;
	selectedSignatureId: number | null;
	originalText: string;
	text: string;
	isDirty: boolean;
	isEnabled: boolean;
	apply(signature: MobileSignature | null): boolean;
	transition(signature: MobileSignature | null): boolean;
	select(signature: MobileSignature | null): boolean;
	clearExplicitly(): void;
	edit(text: string): void;
	clear(): void;
	serialize(body: string): string;
}

export const SIGNATURE_SEPARATOR: string;

export type ComposeSenderEntry = {
	menuId: string,
	email: string,
	name: string,
	senderKey: string | null,
};

export class ComposeSenderIdentity {
	constructor(
		senders?: Array<{ email?: string, value?: string, name?: string, title?: string }>,
		signatureSenders?: MobileSignatureSender[],
	);
	resolve(menuId: string): ComposeSenderEntry | null;
	findMenuId(value: string, name?: string | null): string | null;
	remapMenuId(previousIdentity: ComposeSenderIdentity, menuId: string): string | null;
	getMenuItems(icon: string): Array<{ id: string, title: string, subtitle: string, icon: string }>;
	toTransportEmail(menuId: string): string | null;
	reorderForTransport(menuId: string): Array<{ email?: string, value?: string, name?: string, title?: string }>;
}

export type SignatureTextRange = { start: number, end: number };

export function transformSignatureRange(
	previousText: string,
	nextText: string,
	range: SignatureTextRange,
): SignatureTextRange | null;

export function replaceSignatureRange(
	text: string,
	range: SignatureTextRange,
	replacement: string,
): { text: string, range: SignatureTextRange | null, replaced: boolean };

export function stripSignatureRange(text: string, range: SignatureTextRange | null): string;

export function replaceOrAppendSignature(
	text: string,
	range: SignatureTextRange | null,
	signatureText: string,
): { text: string, range: SignatureTextRange | null, replaced: boolean };

export function transformEditableSignatureRange(
	previousText: string,
	nextText: string,
	range: SignatureTextRange,
): SignatureTextRange | null;

export function extractSignatureText(text: string, range: SignatureTextRange | null): string | null;
export function findSignatureSuffixRange(text: string, signatureText: string): SignatureTextRange | null;

export class SignaturePicker {
	static buildItems(params: {
		signatures: MobileSignature[],
		selectedSignatureId: number | null,
		withoutSignatureText: string,
		createText: string,
		onSelect: (signature: MobileSignature) => void,
		onClear: () => void,
		onCreate: () => void,
	}): Array<{ id: string, testId: string, title: string, checked?: boolean }>;
	static getPreview(text: string): string;
}

export class SignatureChoiceQueue {
	constructor(saveChoice: (senderKey: string, signatureId: number | null) => Promise<unknown>);
	enqueue(senderKey: string, signatureId: number | null): Promise<unknown>;
}
