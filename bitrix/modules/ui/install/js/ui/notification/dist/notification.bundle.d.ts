/* eslint-disable */
type PositionValue = typeof BX.UI.Notification.Position[keyof typeof BX.UI.Notification.Position];

type BalloonConstructor = new (options: BalloonOptions) => BX.UI.Notification.Balloon;

type BalloonOptions = {
	stack?: BX.UI.Notification.Stack;
	id?: string;
	content?: string | Element;
	autoHide?: boolean;
	autoHideDelay?: number;
	showOnTopWindow?: boolean;
	closeButton?: boolean;
	category?: string | null;
	actions?: ActionOptions[] | null;
	render?: BalloonRender;
	width?: number | 'auto';
	data?: Record<string, unknown>;
	events?: Record<string, BalloonEventHandler>;
	useAirDesign?: boolean;
};

type ActionOptions = {
	id?: string;
	href?: string;
	title?: string;
	events?: Record<string, (event: Event, balloon: BX.UI.Notification.Balloon, action: BX.UI.Notification.Action) => void>;
};

type StateValue = typeof BX.UI.Notification.State[keyof typeof BX.UI.Notification.State];

type DomEventHandler = (event: globalThis.Event) => void;

type BalloonRender = (balloon: BX.UI.Notification.Balloon) => HTMLElement;

type BalloonEventHandler = (event: BX.UI.Notification.NotificationEvent) => void;

type StackOptions = {
	id?: string;
	position?: PositionValue | string;
	spacing?: number;
	offsetX?: number;
	offsetY?: number;
	newestOnTop?: boolean;
	balloonType?: string | (new (options: BalloonOptions) => BX.UI.Notification.Balloon);
};

type NotifyOptions = BalloonOptions & {
	position?: PositionValue | string;
	type?: string;
	blinkOnUpdate?: boolean;
};

declare namespace BX.UI.Notification {
	class Manager {
		stacks: Record<string, Stack>;
		balloons: Record<string, Balloon>;
		balloonDefaults: Partial<BalloonOptions>;
		stackDefaults: Partial<StackOptions>;
		defaultPosition: PositionValue | string;
		constructor();
		notify(options: NotifyOptions): Balloon | undefined;
		getBalloonById(balloonId: string): Balloon | null;
		getBalloonByCategory(category: string): Balloon | null;
		removeBalloon(balloon: Balloon): void;
		handleBalloonClose(event: NotificationEvent): void;
		getStack(stackId: string): Stack | null;
		getDefaultStack(): Stack;
		getStackByPosition(position: string): Stack;
		addStack(stack: Stack): void;
		setBalloonDefaults(options: BalloonOptions): void;
		getBalloonDefaults(): Partial<BalloonOptions>;
		setStackDefaults(position: unknown, options?: StackOptions): void;
		setDefaultPosition(position: string): void;
		getDefaultPosition(): PositionValue | string;
		getStackDefaults(): Partial<StackOptions>;
	}

	class Stack {
		id: string;
		position: PositionValue | string;
		spacing: number;
		offsetX: number;
		offsetY: number;
		newestOnTop: boolean;
		balloonType: BalloonConstructor;
		balloons: Balloon[];
		queueStack: Balloon[];
		constructor(options?: StackOptions);
		static getPositionCode(position: unknown): string | null;
		adjustPosition(balloon?: Balloon): void;
		add(balloon: Balloon): void;
		clear(): void;
		push(balloon: Balloon): void;
		queue(balloon: Balloon): void;
		checkQueue(): void;
		getQueue(): Balloon[];
		isBalloonFitToViewport(balloon: Balloon): boolean;
		handleBalloonClose(event: NotificationEvent): void;
		setOptions(options: StackOptions | null | undefined): void;
		getId(): string;
		getBalloons(): Balloon[];
		getPosition(): PositionValue | string;
		getSpacing(): number;
		setSpacing(spacing: unknown): void;
		getOffsetX(): number;
		setOffsetX(offsetX: unknown): void;
		getOffsetY(): number;
		setOffsetY(offsetY: unknown): void;
		getHeight(): number;
		getBalloonType(className?: string | Function): BalloonConstructor;
		setBalloonType(balloonType: unknown): void;
		isNewestOnTop(): boolean;
		setNewestOnTop(onTop: unknown): void;
	}

	const Position: {
		readonly TOP_LEFT: "top-left";
		readonly TOP_CENTER: "top-center";
		readonly TOP_RIGHT: "top-right";
		readonly BOTTOM_LEFT: "bottom-left";
		readonly BOTTOM_CENTER: "bottom-center";
		readonly BOTTOM_RIGHT: "bottom-right";
	};

	class Balloon {
		id: string;
		stack: Stack;
		state: StateValue;
		showOnTopWindow: boolean;
		container: HTMLElement | null;
		content: string | Element | null;
		actions: Action[];
		animationClassName: string;
		customRender: BalloonRender | null;
		category: string | null;
		autoHide: boolean;
		autoHideDelay: number;
		autoHideTimeout: ReturnType<typeof setTimeout> | null;
		useAirDesign: boolean;
		data: Record<string, unknown>;
		width: number | 'auto';
		closeButton: HTMLElement | null;
		closeButtonVisibility: boolean;
		constructor(options?: BalloonOptions);
		show(): void;
		setOptions(options: BalloonOptions | null): void;
		update(options: BalloonOptions | null): void;
		close(): void;
		blink(): void;
		adjustPosition(): void;
		getId(): string;
		getCloseButton(): HTMLElement;
		setCloseButtonVisibility(visibility: unknown): void;
		isCloseButtonVisible(): boolean;
		getContent(): string | Element | null;
		setContent(content: unknown): void;
		getWidth(): number | 'auto';
		setWidth(width: unknown): void;
		getZIndex(): number;
		/**
		 * @deprecated
		 */
		setZIndex(_zIndex: number): void;
		getHeight(): number;
		getCategory(): string | null;
		setCategory(category: unknown): void;
		setActions(actions: unknown): void;
		getActions(): Action[];
		getAction(id: string): Action | null;
		getContainer(): HTMLElement;
		render(): HTMLElement;
		setCustomRender(render: unknown): void;
		getCustomRender(): BalloonRender | null;
		getStack(): Stack;
		setState(state: unknown): void;
		getState(): StateValue;
		getStateCode(mode: unknown): string | null;
		activateAutoHide(): void;
		deactivateAutoHide(): void;
		setAutoHide(autoHide: unknown): void;
		getAutoHide(): boolean;
		setAutoHideDelay(delay: unknown): void;
		getAutoHideDelay(): number;
		animateIn(callback: () => void): void;
		animateOut(callback: () => void): void;
		handleCloseBtnClick(): void;
		handleMouseEnter(): void;
		handleMouseLeave(): void;
		fireEvent(eventName: string): NotificationEvent;
		addEvent(eventName: string, fn: BalloonEventHandler): void;
		removeEvent(eventName: string, fn: BalloonEventHandler): void;
		getEvent(eventName: string): NotificationEvent;
		getData(): Record<string, unknown>;
		setData(data: unknown): void;
	}

	const State: {
		readonly INIT: 0;
		readonly OPENING: 1;
		readonly OPEN: 2;
		readonly CLOSING: 3;
		readonly CLOSED: 4;
		readonly PAUSED: 5;
		readonly QUEUED: 6;
	};

	class Action {
		balloon: Balloon;
		id: string;
		href: string | null;
		title: string | null;
		window: Window;
		container: HTMLElement | null;
		events: Record<string, DomEventHandler>;
		constructor(balloon: Balloon, options?: ActionOptions);
		getBalloon(): Balloon;
		getId(): string;
		getTitle(): string | null;
		getHref(): string | null;
		getContainer(): HTMLElement;
		getWindow(): Window;
	}

	class NotificationEvent {
		static getFullName(eventName: string): string;
		getBalloon(): Balloon | null;
		setBalloon(balloon: unknown): void;
		getName(): string | null;
		setName(name: unknown): void;
		getFullName(): string;
	}

	class Event {
		static getFullName(eventName: string): string;
		getBalloon(): Balloon | null;
		setBalloon(balloon: unknown): void;
		getName(): string | null;
		setName(name: unknown): void;
		getFullName(): string;
	}

	const UI: Function | null;

	const Center: Manager;
}
