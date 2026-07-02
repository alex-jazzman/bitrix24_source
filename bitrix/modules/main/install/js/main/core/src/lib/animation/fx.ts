import Type from '../type';
import Dom from '../dom';
import { Easing } from './easing';
import { type EasingOptions } from './easing-options';

export type FXOptions = {
	start: number | Record<string, number>;
	finish: number | Record<string, number>;
	time?: number; // in seconds
	type?: 'linear' | 'accelerated' | 'decelerated' | Function;
	callback?: Function;
	callback_start?: Function;
	callback_complete?: Function;
	step?: number; // in seconds
	allowFloat?: boolean;
};

/**
 * @deprecated
 */
export class FX
{
	#easing: Easing | null = null;

	constructor(options: FXOptions)
	{
		const fxOptions: FXOptions = Type.isPlainObject(options) ? options as unknown as FXOptions : {} as FXOptions;
		const callback = Type.isFunction(fxOptions.callback) ? fxOptions.callback : null;
		const callbackStart = Type.isFunction(fxOptions.callback_start) ? fxOptions.callback_start : null;
		const callbackComplete = Type.isFunction(fxOptions.callback_complete) ? fxOptions.callback_complete : null;

		const easingOptions: EasingOptions = {
			transition: 'linear',
			duration: Type.isNumber(fxOptions.time) && fxOptions.time > 0 ? fxOptions.time * 1000 : 1000,
			begin: (state: Record<string, number>) => {
				if (callbackStart !== null)
				{
					// eslint-disable-next-line no-underscore-dangle
					callbackStart(Type.isUndefined(state._param) ? state : state._param);
				}
			},
			step: (state: Record<string, number>) => {
				if (callback !== null)
				{
					// eslint-disable-next-line no-underscore-dangle
					callback(Type.isUndefined(state._param) ? state : state._param);
				}
			},
			complete: (state: Record<string, number>) => {
				if (callbackComplete !== null)
				{
					// eslint-disable-next-line no-underscore-dangle
					callbackComplete(Type.isUndefined(state._param) ? state : state._param);
				}
			},
		};

		if (Type.isPlainObject(fxOptions.start))
		{
			easingOptions.start = fxOptions.start as unknown as Record<string, number>;
			easingOptions.finish = fxOptions.finish as unknown as Record<string, number>;
		}
		else
		{
			easingOptions.start = { _param: fxOptions.start as number };
			easingOptions.finish = { _param: fxOptions.finish as number };
		}

		if (fxOptions.type === 'accelerated')
		{
			easingOptions.transition = 'quint';
		}
		else if (fxOptions.type === 'decelerated')
		{
			(fxOptions as any).transition = 'ease-out-quint';
		}

		this.#easing = new Easing(easingOptions);
	}

	start(): this
	{
		this.#easing!.animate();

		return this;
	}

	stop(silent: boolean = false): void
	{
		this.#easing!.stop(silent);
	}

	pause(): void
	{
		// just for compatibility
	}

	/**
	 * @deprecated
	 */
	static hide(el: any, type: any, opts: any): FX | void
	{
		return this.#toggle('hide', el, type, opts);
	}

	/**
	 * @deprecated
	 */
	static show(el: HTMLElement | string, type: 'fade' | 'scroll', opts: any): FX | void
	{
		return this.#toggle('show', el, type, opts);
	}

	static #toggle(mode: 'show' | 'hide', el: HTMLElement | string, type: 'fade' | 'scroll', opts: any): FX | void
	{
		let options: any = {};
		let effect: any = null;
		const element: HTMLElement = Type.isStringFilled(el)
			? document.getElementById(el) as HTMLElement
			: el as HTMLElement;
		if (Type.isPlainObject(type) && Type.isNil(opts))
		{
			options = type;
			effect = options.type;
		}
		else if (Type.isPlainObject(opts))
		{
			options = opts;
			effect = type;
		}

		if (!Type.isStringFilled(effect))
		{
			Dom.style(element, 'display', mode === 'show' ? 'block' : 'none');

			return undefined;
		}

		const fxOptions: any = effect === 'scroll' ? this.#scroll(element, options, mode) : this.#fade(element, options, mode);

		fxOptions.callback_complete = () => {
			if (options.show !== false && options.hide !== false)
			{
				Dom.style(element, 'display', mode === 'show' ? 'block' : 'none');
			}

			if (options.callback_complete)
			{
				options.callback_complete();
			}
		};

		return new FX(fxOptions).start();
	}

	static #scroll(el: any, opts: any, mode?: any): FXOptions
	{
		const param = opts.direction === 'horizontal' ? 'width' : 'height';
		let currentValue = parseInt(String(Dom.style(el, param)), 10);
		if (Number.isNaN(currentValue))
		{
			currentValue = Dom.getPosition(el)[param];
		}

		const start = currentValue;
		const finish = opts.min_height ? parseInt(opts.min_height, 10) : 0;

		return {
			start,
			finish,
			time: opts.time || 1,
			type: 'linear',
			callback_start: () => {
				if (Dom.style(el, 'position') === 'static')
				{
					Dom.style(el, 'position', 'relative');
				}

				Dom.style(el, 'overflow', 'hidden');
				Dom.style(el, param, `${start}px`);
				Dom.style(el, 'display', 'block');
			},
			callback: (value: any) => {
				Dom.style(el, param, `${value}px`);
			},
		};
	}

	static #fade(element: any, opts: any, mode: 'show' | 'hide'): FXOptions
	{
		return {
			time: opts.time || 1,
			type: mode === 'show' ? 'linear' : 'decelerated',
			start: mode === 'show' ? 0 : 100,
			finish: mode === 'show' ? 100 : 0,
			callback_start: () => {
				Dom.style(element, 'display', 'block');
			},
			callback: (val: any) => {
				Dom.style(element, 'opacity', val / 100);
			},
		};
	}
}
