import { Type, Text, Dom, Reflection, addCustomEvent } from 'main.core';

import { Balloon } from './balloon';
import { NotificationEvent } from './event';
import { Position, State, type BalloonOptions, type PositionValue, type StackOptions } from './types';

type BalloonConstructor = new (options: BalloonOptions) => Balloon;

// Fields are intentionally public so subclasses or external code mirroring
// the legacy BX.UI.Notification.Stack API (where every field was open) keep working.
export class Stack
{
	id: string;
	position: PositionValue | string;

	spacing = 20;
	offsetX = 25;
	offsetY = 25;
	newestOnTop = false;
	balloonType: BalloonConstructor = Balloon as unknown as BalloonConstructor;

	balloons: Balloon[] = [];
	queueStack: Balloon[] = [];

	constructor(options: StackOptions = {})
	{
		const opts = Type.isPlainObject(options) ? options : ({} as StackOptions);

		this.id = Type.isStringFilled(opts.id) ? (opts.id as string) : Text.getRandom(8).toLowerCase();
		this.position = Stack.getPositionCode(opts.position) ? (opts.position as string) : 'top-right';

		this.setOptions(opts);

		addCustomEvent(window, NotificationEvent.getFullName('onClose'), (event: NotificationEvent) => this.handleBalloonClose(event));
	}

	static getPositionCode(position: unknown): string | null
	{
		const entry = Object.entries(Position).find(([, value]) => value === position);

		return entry ? entry[0] : null;
	}

	adjustPosition(balloon?: Balloon): void
	{
		let offset = 0;
		this.getBalloons().forEach((currentBalloon) => {
			if (!balloon || balloon === currentBalloon)
			{
				if ((currentBalloon as Balloon & { doNotAdjustPosition?: boolean }).doNotAdjustPosition)
				{
					return;
				}

				const container = currentBalloon.getContainer();
				const offsetX = `${this.getOffsetX()}px`;
				const offsetY = `${offset + this.getOffsetY()}px`;

				switch (this.getPosition())
				{
					case Position.TOP_LEFT:
						Dom.style(container, { left: offsetX, top: offsetY });
						break;
					case Position.TOP_CENTER:
						Dom.style(container, { left: '50%', transform: 'translateX(-50%)', top: offsetY });
						break;
					case Position.TOP_RIGHT:
						Dom.style(container, { right: offsetX, top: offsetY });
						break;
					case Position.BOTTOM_LEFT:
						Dom.style(container, { left: offsetX, bottom: offsetY });
						break;
					case Position.BOTTOM_CENTER:
						Dom.style(container, { left: '50%', transform: 'translateX(-50%)', bottom: offsetY });
						break;
					case Position.BOTTOM_RIGHT:
						Dom.style(container, { right: offsetX, bottom: offsetY });
						break;
					default:
						break;
				}
			}

			offset += this.getSpacing() + currentBalloon.getHeight();
		});
	}

	/**
	 * The balloons of the stack the way the user reads them: from the top of the screen
	 * down. A bottom-anchored stack grows upwards, so the balloon that came last stands
	 * highest and opens the list.
	 */
	getVisualOrder(): Balloon[]
	{
		const balloons = [...this.getBalloons()];

		return this.isBottomPosition() ? balloons.reverse() : balloons;
	}

	isBottomPosition(): boolean
	{
		return String(this.getPosition()).startsWith('bottom');
	}

	/**
	 * Lines the balloon container up with the neighbours it already has in the document,
	 * so that the document order of the stack repeats its visual order.
	 *
	 * Balloons are appended to the body one by one, which for a bottom-anchored stack is
	 * the reverse of what the user sees: the keyboard would then walk the notifications
	 * bottom-up and leave the stack right after the topmost one. Placing every container
	 * next to its visual neighbour keeps Tab going from one notification to the next and,
	 * after the last one, out to the usual order of the page — without a focus trap.
	 */
	placeContainer(balloon: Balloon): void
	{
		const container = balloon.getContainer();
		const parent = container.parentNode;
		if (parent === null)
		{
			return;
		}

		const order = this.getVisualOrder();
		const index = order.indexOf(balloon);
		if (index === -1)
		{
			return;
		}

		const after = order.slice(index + 1)
			.find((item) => item.getContainer().parentNode === parent)?.getContainer() ?? null;
		const before = order.slice(0, index).reverse()
			.find((item) => item.getContainer().parentNode === parent)?.getContainer() ?? null;
		const precedes = (first: Node, second: Node): boolean => {
			return (first.compareDocumentPosition(second) & Node.DOCUMENT_POSITION_FOLLOWING) > 0;
		};

		if ((after === null || precedes(container, after)) && (before === null || precedes(before, container)))
		{
			return;
		}

		// Moving a node takes the focus off whatever it holds, so it goes back afterwards.
		const active = container.ownerDocument.activeElement;
		const focused = Type.isElementNode(active) && container.contains(active) ? active as HTMLElement : null;

		if (after === null)
		{
			Dom.insertAfter(container, before);
		}
		else
		{
			Dom.insertBefore(container, after);
		}

		focused?.focus({ preventScroll: true });
	}

	add(balloon: Balloon): void
	{
		if (this.getBalloons().length > 0 && (this.getQueue().length > 0 || !this.isBalloonFitToViewport(balloon)))
		{
			this.queue(balloon);
		}
		else
		{
			this.push(balloon);
		}
	}

	contains(balloon: Balloon): boolean
	{
		return this.balloons.includes(balloon) || this.queueStack.includes(balloon);
	}

	clear(): void
	{
		const balloons = [...this.balloons, ...this.queueStack];
		this.queueStack = [];
		this.balloons = [];

		balloons.forEach((balloon) => balloon.close());
	}

	push(balloon: Balloon): void
	{
		if (!(balloon instanceof Balloon))
		{
			throw new TypeError("'balloon' must be an instance of BX.UI.Notification.Balloon.");
		}

		if (!this.balloons.includes(balloon))
		{
			if (this.isNewestOnTop())
			{
				this.balloons.splice(0, 0, balloon);
			}
			else
			{
				this.balloons.push(balloon);
			}
		}
	}

	queue(balloon: Balloon): void
	{
		if (!(balloon instanceof Balloon))
		{
			throw new TypeError("'balloon' must be an instance of BX.UI.Notification.Balloon.");
		}

		if (!this.queueStack.includes(balloon))
		{
			balloon.setState(State.QUEUED);
			this.queueStack.push(balloon);
		}
	}

	checkQueue(): void
	{
		const queue = [...this.queueStack];
		for (const balloon of queue)
		{
			if (!this.isBalloonFitToViewport(balloon) && this.getBalloons().length > 0)
			{
				break;
			}

			balloon.setState(State.INIT);
			this.queueStack.shift();
			this.push(balloon);

			balloon.show();
		}
	}

	getQueue(): Balloon[]
	{
		return this.queueStack;
	}

	isBalloonFitToViewport(balloon: Balloon): boolean
	{
		const viewportHeight = document.documentElement.clientHeight;
		const balloonHeight = this.getSpacing() + balloon.getHeight();

		return this.getHeight() + balloonHeight <= viewportHeight;
	}

	handleBalloonClose(event: NotificationEvent): void
	{
		const closingBalloon = event.getBalloon();
		if (closingBalloon === null || closingBalloon.getStack() !== this)
		{
			return;
		}

		this.balloons = this.balloons.filter((balloon) => closingBalloon !== balloon);
		this.queueStack = this.queueStack.filter((balloon) => closingBalloon !== balloon);

		this.adjustPosition();
		this.checkQueue();
	}

	setOptions(options: StackOptions | null | undefined): void
	{
		const opts = options ?? {};

		this.setSpacing(opts.spacing);
		this.setOffsetX(opts.offsetX);
		this.setOffsetY(opts.offsetY);
		this.setNewestOnTop(opts.newestOnTop);
		this.setBalloonType(opts.balloonType);
	}

	getId(): string
	{
		return this.id;
	}

	getBalloons(): Balloon[]
	{
		return this.balloons;
	}

	getPosition(): PositionValue | string
	{
		return this.position;
	}

	getSpacing(): number
	{
		return this.spacing;
	}

	setSpacing(spacing: unknown): void
	{
		if (Type.isNumber(spacing))
		{
			this.spacing = spacing as number;
		}
	}

	getOffsetX(): number
	{
		return this.offsetX;
	}

	setOffsetX(offsetX: unknown): void
	{
		if (Type.isNumber(offsetX))
		{
			this.offsetX = offsetX as number;
		}
	}

	getOffsetY(): number
	{
		return this.offsetY;
	}

	setOffsetY(offsetY: unknown): void
	{
		if (Type.isNumber(offsetY))
		{
			this.offsetY = offsetY as number;
		}
	}

	getHeight(): number
	{
		return this.getBalloons().reduce(
			(height, balloon) => height + balloon.getHeight() + this.getSpacing(),
			this.getOffsetY(),
		);
	}

	getBalloonType(className?: string | Function): BalloonConstructor
	{
		if (Type.isFunction(className))
		{
			return className as BalloonConstructor;
		}

		if (Type.isStringFilled(className))
		{
			const classFn = Reflection.getClass(className as string);
			if (Type.isFunction(classFn))
			{
				return classFn as BalloonConstructor;
			}
		}

		return this.balloonType || (Balloon as unknown as BalloonConstructor);
	}

	setBalloonType(balloonType: unknown): void
	{
		if (Type.isFunction(balloonType))
		{
			this.balloonType = balloonType as BalloonConstructor;
		}
		else if (Type.isStringFilled(balloonType))
		{
			const classFn = Reflection.getClass(balloonType as string);
			if (Type.isFunction(classFn))
			{
				this.balloonType = classFn as BalloonConstructor;
			}
		}
	}

	isNewestOnTop(): boolean
	{
		return this.newestOnTop;
	}

	setNewestOnTop(onTop: unknown): void
	{
		if (Type.isBoolean(onTop))
		{
			this.newestOnTop = onTop as boolean;
		}
	}
}
