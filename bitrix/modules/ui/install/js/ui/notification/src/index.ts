import { Reflection } from 'main.core';
import { Action } from './action';
import { Balloon } from './balloon';
import { NotificationEvent } from './event';
import { Manager } from './manager';
import { Stack } from './stack';
import { Position, State } from './types';

import './notification.css';

export { Manager, Balloon, Stack, Action, Position, State };
export { NotificationEvent as Event };
export type {
	BalloonOptions,
	StackOptions,
	ActionOptions,
	NotifyOptions,
	PositionValue,
	StateValue,
	BalloonRender,
	BalloonEventHandler,
} from './types';

// import { UI } from 'ui.notification';
export const UI = Reflection.getClass('BX.UI');

export const Center = new Manager();
