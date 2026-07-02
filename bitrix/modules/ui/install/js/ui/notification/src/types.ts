import { type NotificationEvent } from './event';
import { type Action } from './action';
import { type Balloon } from './balloon';
import { type Stack } from './stack';

export const Position = {
	TOP_LEFT: 'top-left',
	TOP_CENTER: 'top-center',
	TOP_RIGHT: 'top-right',
	BOTTOM_LEFT: 'bottom-left',
	BOTTOM_CENTER: 'bottom-center',
	BOTTOM_RIGHT: 'bottom-right',
} as const;

export type PositionValue = typeof Position[keyof typeof Position];

export const State = {
	INIT: 0,
	OPENING: 1,
	OPEN: 2,
	CLOSING: 3,
	CLOSED: 4,
	PAUSED: 5,
	QUEUED: 6,
} as const;

export type StateValue = typeof State[keyof typeof State];

export type ActionOptions = {
	id?: string;
	href?: string;
	title?: string;
	events?: Record<string, (event: Event, balloon: Balloon, action: Action) => void>;
};

export type BalloonEventHandler = (event: NotificationEvent) => void;

export type BalloonRender = (balloon: Balloon) => HTMLElement;

export type BalloonOptions = {
	stack?: Stack;
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

export type StackOptions = {
	id?: string;
	position?: PositionValue | string;
	spacing?: number;
	offsetX?: number;
	offsetY?: number;
	newestOnTop?: boolean;
	balloonType?: string | (new (options: BalloonOptions) => Balloon);
};

export type NotifyOptions = BalloonOptions & {
	position?: PositionValue | string;
	type?: string;
	blinkOnUpdate?: boolean;
};
