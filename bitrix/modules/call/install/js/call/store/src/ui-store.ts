import { defineStore } from 'ui.vue3.pinia';

import type { CallActionBridge } from './media-store';

export type ViewState = 'Closed' | 'Folded' | 'Opened';
export type LayoutMode = 'Grid' | 'Centered' | 'Mobile';
export type UiState = 'Idle' | 'Preparing' | 'Connecting' | 'Connected' | 'Reconnecting' | 'Error';
export type ViewSize = 'full' | 'compact';

export type ButtonState = {
	active: boolean;
	blocked: boolean;
	visible: boolean;
	counter: number;
};

export type Notification = {
	id: string;
	type: string;
	data: Record<string, unknown>;
	createdAt: number;
	ttl: number;
};

export type ConfirmModalButton = {
	text: string;
	action: string;
	type?: string;
};

export type ConfirmModal = {
	visible: boolean;
	title: string;
	message: string;
	buttons: ConfirmModalButton[];
	promiseId: string | null;
};

type UiStoreState = {
	viewState: ViewState;
	isFullScreen: boolean;
	layout: LayoutMode;
	uiState: UiState;
	callTitle: string;
	size: ViewSize;
	maxWidth: number | null;
	isWindowFocus: boolean;
	roomState: string;
	pinnedUserId: number | null;
	layoutWidth: number;
	layoutHeight: number;
	layoutContentHeight: number;
	isCopilotActive: boolean;
	isCopilotFeaturesEnabled: boolean;
	buttons: Record<string, ButtonState>;
	notifications: Notification[];
	notificationTick: number;
	confirmModal: ConfirmModal;
	isRenameSliderOpen: boolean;
	_bridge: CallActionBridge | null;
};

export const useUiStore = defineStore('callUi', {
	state: (): UiStoreState => ({
		viewState: 'Closed',
		isFullScreen: false,
		layout: 'Grid',
		uiState: 'Idle',
		callTitle: '',
		size: 'full',
		maxWidth: null,
		isWindowFocus: true,
		roomState: '',
		pinnedUserId: null,
		layoutWidth: 0,
		layoutHeight: 0,
		layoutContentHeight: 0,
		isCopilotActive: false,
		isCopilotFeaturesEnabled: false,
		buttons: {},
		notifications: [],
		notificationTick: Date.now(),
		confirmModal: {
			visible: false,
			title: '',
			message: '',
			buttons: [],
			promiseId: null,
		},
		isRenameSliderOpen: false,
		_bridge: null,
	}),

	getters: {
		isGridMode: (state): boolean => state.layout === 'Grid',
		isCenteredMode: (state): boolean => state.layout === 'Centered',
		isMobileMode: (state): boolean => state.layout === 'Mobile',

		isUserPinned: (state) => (userId: number): boolean => state.pinnedUserId === userId,
		isButtonBlocked: (state) => (buttonName: string): boolean =>
			state.buttons[buttonName]?.blocked ?? false,
		isButtonVisible: (state) => (buttonName: string): boolean =>
			state.buttons[buttonName]?.visible ?? true,
		buttonCounter: (state) => (buttonName: string): number =>
			state.buttons[buttonName]?.counter ?? 0,

		activeNotifications: (state): Notification[] => state.notifications.filter(
			(n: Notification) => n.createdAt + n.ttl > state.notificationTick,
		),
	},

	actions: {
		setViewState(viewState: ViewState): void { this.viewState = viewState; },
		setFullScreen(value: boolean): void { this.isFullScreen = value; },
		setLayout(layout: LayoutMode): void { this.layout = layout; },
		setUiState(uiState: UiState): void { this.uiState = uiState; },
		setCallTitle(title: string): void { this.callTitle = title; },
		setSize(size: ViewSize): void { this.size = size; },
		setMaxWidth(maxWidth: number | null): void { this.maxWidth = maxWidth; },
		setWindowFocus(focus: boolean): void { this.isWindowFocus = focus; },
		setRoomState(state: string): void { this.roomState = state; },

		setLayoutDimensions(fields: { layoutWidth?: number; layoutHeight?: number; layoutContentHeight?: number }): void
		{
			if (fields.layoutWidth !== undefined) this.layoutWidth = fields.layoutWidth;
			if (fields.layoutHeight !== undefined) this.layoutHeight = fields.layoutHeight;
			if (fields.layoutContentHeight !== undefined) this.layoutContentHeight = fields.layoutContentHeight;
		},

		setPinnedUser(userId: number | null): void
		{
			this.pinnedUserId = userId;
		},

		togglePinnedUser(userId: number): void
		{
			this.pinnedUserId = this.pinnedUserId === userId ? null : userId;
		},

		setCopilotActive(value: boolean): void { this.isCopilotActive = value; },
		setCopilotFeaturesEnabled(value: boolean): void { this.isCopilotFeaturesEnabled = value; },

		closeRenameSlider(): void { this.isRenameSliderOpen = false; },

		// region Button registry

		setButtonState(buttonName: string, fields: Partial<ButtonState>): void
		{
			if (!this.buttons[buttonName])
			{
				this.buttons[buttonName] = { active: false, blocked: false, visible: true, counter: 0 };
			}

			this.buttons[buttonName] = { ...this.buttons[buttonName], ...fields };
		},

		blockButtons(names: string[]): void
		{
			names.forEach((n) => this.setButtonState(n, { blocked: true }));
		},

		unblockButtons(names: string[]): void
		{
			names.forEach((n) => this.setButtonState(n, { blocked: false }));
		},

		showButtons(names: string[]): void
		{
			names.forEach((n) => this.setButtonState(n, { visible: true }));
		},

		hideButtons(names: string[]): void
		{
			names.forEach((n) => this.setButtonState(n, { visible: false }));
		},

		// endregion

		// region Notifications

		addNotification(type: string, data: Record<string, unknown>): string
		{
			const id = crypto.randomUUID();

			this.notifications.push({ id, type, data, createdAt: Date.now(), ttl: 5000 });

			return id;
		},

		removeNotification(id: string): void
		{
			this.notifications = this.notifications.filter((n: Notification) => n.id !== id);
		},

		refreshNotificationTick(): void
		{
			this.notificationTick = Date.now();
		},

		// endregion

		// region Confirm modal

		showConfirmModal(params: Partial<ConfirmModal>): void
		{
			this.confirmModal = {
				visible: true,
				title: '',
				message: '',
				buttons: [],
				promiseId: null,
				...params,
			};
		},

		hideConfirmModal(): void
		{
			this.confirmModal = {
				visible: false,
				title: '',
				message: '',
				buttons: [],
				promiseId: null,
			};
		},

		// endregion

		// region Bridge (transitional — emits non-domain intents to legacy controller)

		attachBridge(bridge: CallActionBridge): void { this._bridge = bridge; },
		detachBridge(): void { this._bridge = null; },

		toggleChat(): void
		{
			this._bridge?.emit('onButtonClick', { buttonName: 'chat' });
		},

		toggleFollowUp(): void
		{
			this._bridge?.emit('onButtonClick', { buttonName: 'copilot' });
		},

		hangup(): void
		{
			this._bridge?.emit('onButtonClick', { buttonName: 'hangup' });
		},

		// endregion
	},
});

export type UiStoreInstance = ReturnType<typeof useUiStore>;
