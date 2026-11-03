/* eslint-disable */
type MessageViewOptions = {
	containerId: string;
	bootstrap: Readonly<BootstrapViewModel>;
	threadLabels?: ThreadComponentLabels;
	mailUfMessageToken?: string;
};

type BootstrapViewModel = {
	readonly screen: ScreenViewModel;
	readonly currentMessage: CurrentMessageViewModel;
	readonly thread: ThreadBootstrapViewModel;
	readonly capabilities: ExistingActionMap;
	readonly hosts: ExternalHostsViewModel;
	readonly domContracts: ExistingDomContractViewModel;
};

type ScreenViewModel = {
	readonly id: string;
	readonly title: string;
	readonly pageSize: number;
	readonly source: string | null;
	readonly paths: Readonly<{
		ajaxUrl: string;
		messageList: string;
		messageNew: string;
		htmlBodyDownload: string;
	}>;
	readonly analytics: Readonly<{
		source: string;
	}> | null;
};

type CurrentMessageViewModel = {
	readonly id: number;
	readonly mailboxId: number;
	readonly uidKey: string;
	readonly subject: string;
	readonly sendError: string | null;
	readonly direction: MessageDirection;
	readonly sender: MailAddressViewModel;
	readonly recipients: RecipientListViewModel;
	readonly labels: Readonly<{
		sender: string;
		to: string;
		cc: string;
		bcc: string;
		moreRecipients: string;
		syncError: string;
		syncMailbox: string;
	}>;
	readonly date: Readonly<{
		timestamp: number;
		formatted: string;
		readConfirmedFormatted: string | null;
	}>;
	readonly flags: Readonly<{
		isSpam: boolean;
		isTrash: boolean;
		isSyncError: boolean;
		isTrackable: boolean;
		hideMailControlPanel: boolean;
		hideFastReplyPanel: boolean;
	}>;
	readonly mailbox: Readonly<{
		uri: string;
		host: string;
	}> | null;
};

type MessageDirection = 'incoming' | 'outgoing';

type MailAddressViewModel = {
	readonly name: string;
	readonly email: string;
	readonly href: string | null;
	readonly title: string;
	readonly isCurrentUser: boolean;
	readonly avatar: Readonly<{
		image: string | null;
		fallbackImage?: string | null;
		initials: string;
		color: string | null;
		management?: Readonly<SenderAvatarData> | null;
	}>;
};

type SenderAvatarData = {
	readonly messageId: number;
	readonly revision: number;
	readonly hasAvatar: boolean;
	readonly url: string | null;
	readonly canManage: boolean;
	readonly uploader: Readonly<{
		controller: string;
		controllerOptions: Readonly<Record<string, unknown>>;
	}> | null;
	readonly errorMessages?: Readonly<Record<string, string>>;
};

type RecipientListViewModel = {
	readonly to: readonly MailAddressViewModel[];
	readonly cc: readonly MailAddressViewModel[];
	readonly bcc: readonly MailAddressViewModel[];
	readonly replyTo: readonly MailAddressViewModel[];
};

type ThreadBootstrapViewModel = {
	readonly currentMessageId: number;
	readonly pageSize: number;
	readonly before: ThreadSideViewModel;
	readonly after: ThreadSideViewModel;
};

type ThreadSideViewModel = {
	readonly code: ThreadSideCode;
	readonly hasMore: boolean;
	readonly loadedCount: number;
};

type ThreadSideCode = 'before' | 'after';

type ExistingActionMap = {
	readonly reply: boolean;
	readonly replyAll: boolean;
	readonly forward: boolean;
	readonly more: boolean;
	readonly discussInChat: boolean;
	readonly assignLabels: boolean;
	readonly unbind: boolean;
	readonly markSpam: boolean;
	readonly delete: boolean;
	readonly quickReply: boolean;
	readonly refreshAttachments: boolean;
	readonly downloadHtmlBody: boolean;
	readonly pageSwapper: boolean;
	readonly iCal: boolean;
};

type ExternalHostsViewModel = {
	readonly messageBody: MessageBodyHostViewModel;
	readonly attachments: AttachmentsHostViewModel;
	readonly actions: HostViewModel;
	readonly labels: HostViewModel;
	readonly compose: ComposeHostViewModel;
	readonly pageSwapper: HostViewModel;
	readonly iCal: HostViewModel;
};

type MessageBodyHostViewModel = HostViewModel & {
	readonly useAjax: boolean;
	readonly loaderId: string | null;
	readonly warningWaitId: string | null;
	readonly warningFailId: string | null;
	readonly title: string;
	readonly titleTemplate: string;
	readonly loaderMaxTime: number;
};

type HostViewModel = {
	readonly id: string;
	readonly enabled: boolean;
};

type AttachmentsHostViewModel = HostViewModel & {
	readonly ajaxContainerId: string | null;
	readonly refreshButtonId: string | null;
	readonly hasDeferredContent: boolean;
};

type ComposeHostViewModel = HostViewModel & {
	readonly formId: string;
	readonly quickReplyButtonId: string | null;
	readonly quoteFieldName: string;
};

type ExistingDomContractViewModel = {
	readonly messageUidKey: string;
	readonly ids: Readonly<{
		pageTitle: string;
		root: string;
		currentDetails: string;
		body: string;
		navigation: string;
		actions: string;
		quickReply: string;
	}>;
	readonly testIds: Readonly<{
		header: string;
		title: string;
		navigation: string;
		scrollArea: string;
		root: string;
		senderName: string;
		senderEmail: string;
		recipient: string;
		recipientEmail: string;
		body: string;
		attachment: string;
		quickReply: string;
	}>;
};

type ThreadComponentLabels = {
	readonly beforeSeparator: string;
	readonly afterSeparator: string;
	readonly loadBefore: string;
	readonly loadAfter: string;
	readonly loadingBefore: string;
	readonly loadingAfter: string;
	readonly errorBefore: string;
	readonly errorAfter: string;
	readonly retryBefore: string;
	readonly retryAfter: string;
	readonly expandItem: string;
	readonly collapseItem: string;
	readonly loadingItem: string;
	readonly errorItem: string;
	readonly retryItem: string;
};

type ScreenOptions = {
	messageId: number;
	mailboxId: number;
	application: ScreenApplication;
	facade?: BX.Mail.Client.MessageView.ScreenFacade;
};

type ScreenApplication = {
	start(): void;
	destroy(): void;
};

type CleanupAction = () => void;

type AsyncCompletionGuard = (capturedGeneration: number, completion: () => void) => boolean;

declare namespace BX.Mail.Client.MessageView {
	class MessageView {
		constructor(options: MessageViewOptions);
		static getScreen(messageId?: number | string): Screen | undefined;
		start(): void;
		destroy(): void;
	}

	class Screen {
		readonly id: number;
		readonly mailboxId: number;
		constructor(options: ScreenOptions);
		get pageSwapper(): object | null;
		get slider(): object | null;
		start(): void;
		destroy(): void;
		isAlive(): boolean;
		getGeneration(): number;
		captureGeneration(): number;
		registerCleanup(action: CleanupAction): CleanupAction;
		guardCompletion: AsyncCompletionGuard;
		setPageSwapper(pageSwapper: object | null): void;
		setSlider(slider: object | null): void;
	}

	class ScreenFacade {
		attach(screen: Screen, generation: number): void;
		detachIfCurrent(screen: Screen): void;
		current(): Screen | null;
		getView(messageId?: number | string): Screen | undefined;
	}
}
