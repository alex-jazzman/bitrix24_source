// @ts-ignore
import { JNBaseClassInterface } from '../../../../../../../../mobile/dev/janative/api'

export type DialogId = number | string;

export declare interface JNChatBaseClassInterface<TEvent extends Record<string, Function>> extends JNBaseClassInterface {
	on<T extends keyof TEvent>(eventName: T, handler: TEvent[T]): void;

	off<T extends keyof TEvent>(eventName: T, handler: TEvent[T]): void;

	once<T extends keyof TEvent>(eventName: T, handler: TEvent[T]): void;
}

export declare interface IChatRecentList extends BaseList {}
