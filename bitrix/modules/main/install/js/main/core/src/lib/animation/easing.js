import Type from '../type';
import { FXOptions } from './fx';
import { Transition } from './transition';
import { type EasingOptions, type TransitionFunction } from './easing-options';

export class Easing
{
	#duration: number = 1000;
	#transition: Function = Transition.linear;
	#begin: Function = null;
	#step: Function = null;
	#complete: Function = null;

	#start: Object<string, number> = {};
	#finish: Object<string, number> = {};
	#currentState: Object<string, number> = {};
	#progress: (progress: number) => void = null;

	#timer: number = null;
	#options: FXOptions = null;

	constructor(easingOptions: EasingOptions)
	{
		this.setOptions(easingOptions);
	}

	setOptions(easingOptions: EasingOptions): void
	{
		const options = Type.isPlainObject(easingOptions) ? easingOptions : {};

		this.#duration = Type.isNumber(options.duration) && options.duration > 0 ? options.duration : this.#duration;
		this.#begin = Type.isFunction(options.begin) || options.begin === null ? options.begin : this.#begin;
		this.#step = Type.isFunction(options.step) || options.step === null ? options.step : this.#step;
		this.#complete = Type.isFunction(options.complete) || options.complete === null ? options.complete : this.#complete;
		this.#progress = Type.isFunction(options.progress) || options.progress === null ? options.progress : this.#progress;

		this.#start = Type.isPlainObject(options.start) ? { ...options.start } : this.#start;
		this.#finish = Type.isPlainObject(options.finish) ? { ...options.finish } : this.#finish;
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
			let decorator: TransitionFunction = null;
			if (transition.startsWith('ease-out-'))
			{
				funcName = funcName.replace('ease-out-', '');
				decorator = this.constructor.makeEaseOut;
			}
			else if (transition.startsWith('ease-in-out-'))
			{
				funcName = funcName.replace('ease-in-out-', '');
				decorator = this.constructor.makeEaseInOut;
			}

			if (Type.isFunction(Transition[funcName]))
			{
				this.#transition = decorator === null ? Transition[funcName] : decorator(Transition[funcName]);
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

		let start = null;
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
			this.#progress(delta);

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
				get(target, property, receiver)
				{
					switch (property)
					{
						case 'transition':
							return this.#transition;
						case 'start':
							return this.#start;
						case 'finish':
							return this.#finish;
						case 'duration':
							return this.#duration;
						default:
							return null;
					}
				},
				set(target, property, value, receiver)
				{
					target.setOptions({ [property]: value });

					return true;
				},
			});
		}

		return this.#options;
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

	static get transitions(): Object<string, Function>
	{
		return Transition;
	}
}
