import Type from '../type';
import { type FXOptions } from './fx';
import { Transition } from './transition';
import { type EasingOptions, type TransitionFunction } from './easing-options';

export class Easing
{
	#duration: number = 1000;
	#transition: Function = Transition.linear;
	#begin: Function | null = null;
	#step: Function | null = null;
	#complete: Function | null = null;

	#start: Record<string, number> = {};
	#finish: Record<string, number> = {};
	#currentState: Record<string, number> = {};
	#progress: ((progress: number) => void) | null = null;

	#timer: number | null = null;
	#options: FXOptions | null = null;

	constructor(easingOptions: EasingOptions)
	{
		this.setOptions(easingOptions);
	}

	setOptions(easingOptions: EasingOptions): void
	{
		const options = Type.isPlainObject(easingOptions) ? easingOptions as unknown as EasingOptions : {} as EasingOptions;

		this.#duration = Type.isNumber(options.duration) && options.duration > 0 ? options.duration : this.#duration;
		this.#begin = Type.isFunction(options.begin) || options.begin === null ? options.begin : this.#begin;
		this.#step = Type.isFunction(options.step) || options.step === null ? options.step : this.#step;
		this.#complete = Type.isFunction(options.complete) || options.complete === null ? options.complete : this.#complete;
		this.#progress = Type.isFunction(options.progress) || options.progress === null ? options.progress : this.#progress;

		this.#start = Type.isPlainObject(options.start) ? { ...options.start } as Record<string, number> : this.#start;
		this.#finish = Type.isPlainObject(options.finish) ? { ...options.finish } as Record<string, number> : this.#finish;
	}

	setTransition(transition: TransitionFunction | string): void
	{
		if (Type.isFunction(transition))
		{
			this.#transition = transition;
		}
		else if (Type.isStringFilled(transition))
		{
			let funcName: string = transition;
			let decorator: TransitionFunction | null = null;
			if (transition.startsWith('ease-out-'))
			{
				funcName = funcName.replace('ease-out-', '');
				decorator = (Easing as any).makeEaseOut;
			}
			else if (transition.startsWith('ease-in-out-'))
			{
				funcName = funcName.replace('ease-in-out-', '');
				decorator = (Easing as any).makeEaseInOut;
			}

			if (Type.isFunction((Transition as any)[funcName]))
			{
				this.#transition = decorator === null
					? (Transition as any)[funcName]
					: decorator((Transition as any)[funcName]);
			}
		}
	}

	animateProgress()
	{
		this.#animate();
	}

	animate(): void
	{
		this.#progress = (progress: number) => {
			this.#currentState = {};
			for (const propName of Object.keys(this.#start))
			{
				this.#currentState[propName] = Math.round(
					this.#start[propName] + (this.#finish[propName] - this.#start[propName]) * progress,
				);
			}

			if (this.#step !== null)
			{
				this.#step(this.#currentState);
			}
		};

		this.#animate();
	}

	#animate(): void
	{
		for (const propName of Object.keys(this.#start))
		{
			if (Type.isUndefined(this.#finish[propName]))
			{
				delete this.#start[propName];
			}
		}

		let start: DOMHighResTimeStamp | null = null;
		const animation = (time: DOMHighResTimeStamp) => {
			if (start === null)
			{
				start = time;
			}

			let progress = (time - start) / this.#duration;
			if (progress > 1)
			{
				progress = 1;
			}

			const delta = this.#transition(progress);
			this.#progress!(delta);

			if (progress === 1)
			{
				this.stop(true);
			}
			else
			{
				this.#timer = requestAnimationFrame(animation);
			}
		};

		if (this.#begin !== null)
		{
			this.#begin(this.#currentState);
		}

		this.#timer = requestAnimationFrame(animation);
	}

	/**
	 * @private
	 * Compatible proxy for options
	 */
	get options(): EasingOptions
	{
		if (this.#options === null)
		{
			this.#options = new Proxy(this, {
				get(target: Easing, property: string | symbol, receiver: any): any
				{
					switch (property)
					{
						case 'transition':
							return target.#transition;
						case 'start':
							return target.#start;
						case 'finish':
							return target.#finish;
						case 'duration':
							return target.#duration;
						default:
							return null;
					}
				},
				set(target: Easing, property: string | symbol, value: any, receiver: any): boolean
				{
					target.setOptions({ [property]: value });

					return true;
				},
			}) as any;
		}

		return this.#options as unknown as EasingOptions;
	}

	stop(completed: boolean = false): void
	{
		if (this.#timer !== null)
		{
			cancelAnimationFrame(this.#timer);
			this.#timer = null;
			if (completed && this.#complete !== null)
			{
				this.#complete(this.#currentState);
			}
		}
	}

	static makeEaseInOut(delta: TransitionFunction): TransitionFunction
	{
		return (progress: number) => {
			if (progress < 0.5)
			{
				return delta(2 * progress) / 2;
			}

			return (2 - delta(2 * (1 - progress))) / 2;
		};
	}

	static makeEaseOut(delta: TransitionFunction): TransitionFunction
	{
		return (progress) => {
			return 1 - delta(1 - progress);
		};
	}

	static get transitions(): Record<string, Function>
	{
		return Transition as any;
	}
}
