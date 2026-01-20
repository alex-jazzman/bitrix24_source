import type { Coordinates } from './coordinates';

export type ActionPayload = {
	taskId: number,
	entityId?: number,
	bindElement: HTMLElement,
	coordinates?: Coordinates,
};
