export type Stub = ((...args: any[]) => any) & { callCount: number };

/**
 * Lightweight replacement for `sinon.stub().callsFake(fn)`.
 * Returns a function that records its call count and delegates to `fake`.
 */
export function createStub(fake?: (...args: any[]) => any): Stub
{
	const stub = ((...args: any[]): any => {
		stub.callCount += 1;

		return fake ? fake(...args) : undefined;
	}) as Stub;

	stub.callCount = 0;

	return stub;
}

/**
 * Lightweight replacement for `sinon.spy(target, method)`.
 * Wraps the method on `target`, recording its call count while calling through.
 */
export function spyOn<T extends object, K extends keyof T>(target: T, method: K): Stub
{
	const original = target[method] as unknown as (...args: any[]) => any;

	const spy = ((...args: any[]): any => {
		spy.callCount += 1;

		return original.apply(target, args);
	}) as Stub;

	spy.callCount = 0;
	(target[method] as unknown) = spy;

	return spy;
}
