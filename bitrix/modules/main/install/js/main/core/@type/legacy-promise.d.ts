/**
 * Type declarations for BX.Promise from core_promise.js
 *
 * This is a custom promise implementation (NOT native Promise).
 * Used in legacy code for deferred resolution patterns.
 * For new code, prefer native `Promise`.
 *
 * Declared as `BXPromise` outside `namespace BX` to avoid shadowing the global `Promise`
 * inside other BX declarations. Use `BXPromise` in .d.ts files,
 * runtime code still uses `new BX.Promise()`.
 */

export {};

declare global {
	class BXPromise {
		state: boolean | null;
		value: any;
		reason: any;
		next: BXPromise | null;
		ctx: object;

		onFulfilled: Array<(value: any) => any>;
		onRejected: Array<(reason: any) => any>;

		constructor(fn?: any, ctx?: object);

		fulfill(value: any): void;
		reject(reason: any): void;
		then(onFulfilled?: (value: any) => any, onRejected?: (reason: any) => any): BXPromise;
		toString(): string;
	}

	namespace BX {
		export { BXPromise as Promise };
	}
}
