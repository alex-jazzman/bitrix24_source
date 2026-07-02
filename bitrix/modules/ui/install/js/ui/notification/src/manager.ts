import { Type, Runtime, addCustomEvent } from 'main.core';

import { Balloon } from './balloon';
import { Stack } from './stack';
import { NotificationEvent } from './event';
import { Position, type BalloonOptions, type NotifyOptions, type PositionValue, type StackOptions } from './types';

// Fields are intentionally public to match the legacy BX.UI.Notification.Manager API.
export class Manager
{
	stacks: Record<string, Stack> = Object.create(null);
	balloons: Record<string, Balloon> = Object.create(null);

	balloonDefaults: Partial<BalloonOptions> = {};
	stackDefaults: Partial<StackOptions> = {};
	defaultPosition: PositionValue | string = Position.TOP_RIGHT;

	constructor()
	{
		addCustomEvent(
			window,
			NotificationEvent.getFullName('onClose'),
			(event: NotificationEvent) => this.handleBalloonClose(event),
		);
	}

	notify(options: NotifyOptions): Balloon | undefined
	{
		const opts = Type.isPlainObject(options) ? options : ({} as NotifyOptions);

		const currentBalloon = (opts.id ? this.getBalloonById(opts.id) : null)
			?? (opts.category ? this.getBalloonByCategory(opts.category) : null);

		if (currentBalloon)
		{
			currentBalloon.setOptions(opts);
			currentBalloon.show();

			if (opts.blinkOnUpdate === false)
			{
				currentBalloon.update(null);
			}
			else
			{
				currentBalloon.blink();
			}

			return undefined;
		}

		const stack: Stack = (() => {
			if (opts.stack instanceof Stack)
			{
				this.addStack(opts.stack);

				return opts.stack;
			}

			const resolved = Type.isStringFilled(opts.position)
				? this.getStackByPosition(opts.position as string)
				: this.getDefaultStack();
			opts.stack = resolved;

			return resolved;
		})();

		const balloonOptions = Runtime.merge({}, this.getBalloonDefaults(), opts);
		const BalloonType = stack.getBalloonType(opts.type);
		const balloon = new (BalloonType as new (options: BalloonOptions) => Balloon)(balloonOptions);

		if (!(balloon instanceof Balloon))
		{
			throw new TypeError('Balloon type must be an instance of BX.UI.Notification.Balloon');
		}

		this.balloons[balloon.getId()] = balloon;
		balloon.show();

		return balloon;
	}

	getBalloonById(balloonId: string): Balloon | null
	{
		return this.balloons[balloonId] ?? null;
	}

	getBalloonByCategory(category: string): Balloon | null
	{
		if (Type.isStringFilled(category))
		{
			for (const balloon of Object.values(this.balloons))
			{
				if (balloon.getCategory() === category)
				{
					return balloon;
				}
			}
		}

		return null;
	}

	removeBalloon(balloon: Balloon): void
	{
		delete this.balloons[balloon.getId()];
	}

	handleBalloonClose(event: NotificationEvent): void
	{
		const balloon = event.getBalloon();
		if (balloon !== null)
		{
			this.removeBalloon(balloon);
		}
	}

	getStack(stackId: string): Stack | null
	{
		return this.stacks[stackId] ?? null;
	}

	getDefaultStack(): Stack
	{
		return this.getStackByPosition(this.getDefaultPosition());
	}

	getStackByPosition(position: string): Stack
	{
		let stack = this.getStack(position);
		if (stack === null)
		{
			stack = new Stack(Runtime.merge({}, this.getStackDefaults(), { id: position, position }));
			this.addStack(stack);
		}

		return stack;
	}

	addStack(stack: Stack): void
	{
		if (stack instanceof Stack && this.getStack(stack.getId()) === null)
		{
			this.stacks[stack.getId()] = stack;
		}
	}

	setBalloonDefaults(options: BalloonOptions): void
	{
		if (Type.isPlainObject(options))
		{
			// Preserve BX.mergeEx semantics: mutate the target object in place,
			// not Runtime.merge which always returns a fresh object.
			Object.assign(this.balloonDefaults, Runtime.merge(this.balloonDefaults, options));
		}
	}

	getBalloonDefaults(): Partial<BalloonOptions>
	{
		return this.balloonDefaults;
	}

	setStackDefaults(position: unknown, options?: StackOptions): void
	{
		if (Stack.getPositionCode(position))
		{
			const stack = this.getStackByPosition(position as string);
			stack.setOptions(options ?? null);
		}
		else if (Type.isPlainObject(position))
		{
			const opts = position as StackOptions;
			for (const pos of Object.values(Position))
			{
				this.setStackDefaults(pos, opts);
			}
		}
	}

	setDefaultPosition(position: string): void
	{
		if (Stack.getPositionCode(position))
		{
			this.defaultPosition = position;
		}
	}

	getDefaultPosition(): PositionValue | string
	{
		return this.defaultPosition;
	}

	getStackDefaults(): Partial<StackOptions>
	{
		return this.stackDefaults;
	}
}
