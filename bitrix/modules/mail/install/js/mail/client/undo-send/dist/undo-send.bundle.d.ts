/* eslint-disable */
type RunAction = (action: string, options: AjaxActionOptions) => Promise<AjaxActionResponse>;

type AjaxActionOptions = {
	data: Record<string, unknown>;
};

type AjaxActionResponse = {
	data?: unknown;
};

type CancelRequest = (request: CancelUndoSendRequest) => Promise<AjaxActionResponse>;

type CancelUndoSendRequest = {
	token: string;
};

type CreateUndoSendRequest = Omit<BX.Mail.Client.ScheduledMessage.ScheduleScheduledMessageRequest, 'scheduledAt'> & {
	idempotencyKey: string;
	largeAttachments?: UndoSendLargeAttachment[];
};

type UndoSendLargeAttachment = {
	token: string;
	publicUrl: string;
	fileIds: number[];
	sourceFileIds: number[];
	tokenFileIds?: number[];
};

type UndoSendOperationDto = {
	operationId: number;
	revision: number;
	status: UndoSendStatus;
	cancelUntil: string;
	serverNow: string;
	subject?: string;
	restoreUrl: string | null;
	restoreSliderWidth: number;
	cancelToken: string | null;
	/** The letter was asked to be kept as a template and the portal could not keep it. */
	templateSaveWarning?: boolean;
};

type UndoSendStatus = 'scheduled' | 'cancelled' | 'sending' | 'sent' | 'error';

type UndoSendPreference = {
	delaySeconds: UndoSendDelay;
};

type UndoSendDelay = 0 | 5 | 10 | 20;

type SetUndoSendPreferenceRequest = UndoSendPreference;

type UndoSendGuideOptions = {
	optionName: string;
	bindSelector?: string;
	ready?: boolean;
};

type UndoSendGuideDependencies = {
	enqueue: (callback: (onDone: () => void) => void, options: {
		id: string;
	}) => void;
	unregister: (id: string) => void;
	createPopup: (bindElement: HTMLElement, onDone: () => void) => GuidePopup;
	save: (optionName: string) => void;
	subscribeExpired: (handler: (event: BX.Event.BaseEvent) => void) => () => void;
};

type GuidePopup = Pick<BX.Main.Popup, 'show' | 'close'>;

type UndoSendMenuOptions = {
	delaySeconds: UndoSendDelay;
	api?: PreferenceApi;
	onSaveError?: (error: unknown) => void;
};

type PreferenceApi = {
	setPreference(request: UndoSendPreference): Promise<UndoSendPreference>;
};

type UndoSendMenuItemOptions = {
	id: string;
	text: string;
	className?: string;
	dataset?: Record<string, string>;
	items?: UndoSendMenuItemOptions[];
	events?: {
		onSubMenuShow?: (event: BX.Event.BaseEvent) => void;
	};
	onclick?: (event: MouseEvent, item: MenuItem) => void;
};

type MenuItem = {
	getContainer(): HTMLElement;
	getMenuWindow(): Menu;
	getSubMenu(): Menu | null;
	setText(text: string): void;
};

type Menu = {
	close(): void;
	getMenuItems(): MenuItem[];
	getParentMenuItem(): MenuItem | null;
	getRootMenuWindow(): Menu | null;
};

type UndoSendNotificationDependencies = {
	api?: Pick<BX.Mail.Client.UndoSend.UndoSendApi, 'cancel'>;
	center?: NotificationCenter;
	now?: () => number;
	setInterval?: (handler: () => void, timeout: number) => TimerId;
	clearInterval?: (timer: TimerId) => void;
	matchMedia?: (query: string) => MediaQueryList;
	createProgress?: (duration: number) => ProgressRoundView;
	getHostNotification?: () => NotificationView | null;
	sliderManager?: BX.SidePanel.SliderManager;
	markGuideReady?: () => void;
	openRestore?: (url: string) => void;
};

type NotificationCenter = {
	notify(options: Record<string, unknown>): BX.UI.Notification.Balloon | undefined;
};

type TimerId = ReturnType<typeof setInterval>;

type ProgressRoundView = {
	getContainer(): Element;
	update(value: number): void;
};

type NotificationView = {
	show(operation: UndoSendOperationDto): void;
	destroy(): void;
};

type UndoSendApiError = Error & {
	code: string;
	retryable: boolean;
};

declare namespace BX.Mail.Client.UndoSend {
	class UndoSendApi {
		constructor(runAction?: RunAction, runCancelRequest?: CancelRequest);
		create(request: CreateUndoSendRequest): Promise<UndoSendOperationDto>;
		cancel(request: CancelUndoSendRequest): Promise<UndoSendOperationDto>;
		getPreference(): Promise<UndoSendPreference>;
		setPreference(request: SetUndoSendPreferenceRequest): Promise<UndoSendPreference>;
	}

	const undoSendApi: UndoSendApi;

	class UndoSendGuide {
		constructor(options: UndoSendGuideOptions, dependencies?: UndoSendGuideDependencies);
		show(): void;
		destroy(): void;
	}

	class UndoSendMenu {
		constructor(options: UndoSendMenuOptions);
		getItem(): UndoSendMenuItemOptions;
	}

	const UndoSendEvent: Readonly<{
		readonly Cancelled: "Mail.UndoSend:onCancelled";
		readonly Expired: "Mail.UndoSend:onExpired";
		readonly CancelFailed: "Mail.UndoSend:onCancelFailed";
	}>;

	class UndoSendNotification {
		constructor(dependencies?: UndoSendNotificationDependencies);
		show(operation: UndoSendOperationDto): void;
		destroy(): void;
	}

	const UndoSendErrorCode: Readonly<{
		readonly Unknown: "unknown";
		readonly FeatureUnavailable: "feature_unavailable";
		readonly PreferenceDisabled: "preference_disabled";
		readonly AccessDenied: "access_denied";
		readonly CancelWindowExpired: "cancel_window_expired";
		readonly AlreadySending: "already_sending";
		readonly InvalidDelay: "invalid_delay";
	}>;

	const undoSendNotification: UndoSendNotification;
}
