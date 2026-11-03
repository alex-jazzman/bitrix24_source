import Type from '../type';

function isCssAnimation(animation: globalThis.Animation): animation is CSSAnimation
{
	return 'animationName' in animation;
}

function isCssTransition(animation: globalThis.Animation): animation is CSSTransition
{
	return 'transitionProperty' in animation;
}

// A movement of neither CSS kind is one started from a script by Element.animate(), and such a
// movement carries no name of its own.
function isScriptAnimation(animation: globalThis.Animation): boolean
{
	return !isCssAnimation(animation) && !isCssTransition(animation);
}

export class Animation
{
	/**
	 * Resolves when the transitions of the element are over, whether they finished or were cancelled.
	 * Call it after the change that starts the transition is applied: only the transitions the element
	 * already has are awaited, all of them, including the ones started by somebody else.
	 * `propertyName` narrows the wait to the transitions of the named properties.
	 *
	 * The promise never rejects and resolves right away when there is nothing to wait for: the element
	 * has no transition at all or none of a named property, the list of names is empty, the argument is
	 * not an element, or none of the transitions ends at a finite time (endless or on a progress timeline).
	 * A paused transition neither finishes nor cancels, so waiting for it never resolves.
	 */
	static waitTransitionEnd(element: Element, propertyName: string | string[] | null = null): Promise<void>
	{
		return this.#waitForEnd(
			element,
			propertyName,
			isCssTransition,
			(animation) => (isCssTransition(animation) ? animation.transitionProperty : null),
		);
	}

	/**
	 * Resolves when the animations of the element are over, whether they finished or were cancelled.
	 * Call it after the change that starts the animation is applied: only the animations the element
	 * already has are awaited, all of them, including the ones started by somebody else. A movement
	 * started from a script by `Element.animate()` is awaited as well.
	 * `animationName` narrows the wait to the animations with the given names. A movement started from
	 * a script has no name of its own, so no given name ever matches it.
	 *
	 * The promise never rejects and resolves right away when there is nothing to wait for: the element
	 * has no animation at all or none with a given name, the list of names is empty, the argument is not
	 * an element, or none of the animations ends at a finite time (endless or on a progress timeline).
	 * A paused animation neither finishes nor cancels, so waiting for it never resolves.
	 */
	static waitAnimationEnd(element: Element, animationName: string | string[] | null = null): Promise<void>
	{
		return this.#waitForEnd(
			element,
			animationName,
			(animation) => isCssAnimation(animation) || isScriptAnimation(animation),
			(animation) => (isCssAnimation(animation) ? animation.animationName : null),
		);
	}

	static async #waitForEnd(
		element: Element,
		names: string | string[] | null,
		isKind: (animation: globalThis.Animation) => boolean,
		readName: (animation: globalThis.Animation) => string | null,
	): Promise<void>
	{
		// Only an element has animations, and the class is reachable from untyped code as BX.Animation.
		if (!Type.isElementNode(element))
		{
			return;
		}

		const targets = element.getAnimations()
			.filter((animation) => isKind(animation))
			.filter((animation) => this.#matchesName(readName(animation), names))
			.filter((animation) => this.#hasFiniteEnd(animation));

		await Promise.allSettled(targets.map((animation) => animation.finished));
	}

	static #matchesName(name: string | null, names: string | string[] | null): boolean
	{
		if (Type.isNil(names))
		{
			return true;
		}

		if (Type.isNil(name))
		{
			return false;
		}

		if (Type.isArray(names))
		{
			return names.includes(name);
		}

		return name === names;
	}

	// An endless movement never ends, and one on a progress timeline measures its end in percent
	// instead of time, so neither of them can be awaited: the type check turns away the percentage,
	// the finite one turns away Infinity.
	static #hasFiniteEnd(animation: globalThis.Animation): boolean
	{
		const endTime = animation.effect?.getComputedTiming().endTime;

		return Type.isNumber(endTime) && Number.isFinite(endTime);
	}
}
