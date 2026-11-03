import { Dom, Event, Type } from 'main.core';

const FALLBACK_DELAY_MS = 100;
const VISIBLE_CLASS = 'is-visible';

function parseTime(value)
{
	const normalizedValue = value.trim();
	const numericValue = Number.parseFloat(normalizedValue);
	if (!Number.isFinite(numericValue))
	{
		return 0;
	}

	return normalizedValue.endsWith('ms') ? numericValue : numericValue * 1000;
}

function splitTransitionList(value)
{
	return value.split(',').map((item) => item.trim());
}

function resolveTransitionTime(element, propertyName)
{
	const computedStyle = window.getComputedStyle(element);
	const properties = splitTransitionList(computedStyle.transitionProperty);
	const durations = splitTransitionList(computedStyle.transitionDuration);
	const delays = splitTransitionList(computedStyle.transitionDelay);

	return properties.reduce((transitionTime, transitionProperty, index) => {
		if (transitionProperty !== propertyName && transitionProperty !== 'all')
		{
			return transitionTime;
		}

		const duration = parseTime(durations[index % durations.length] ?? '0s');
		if (duration <= 0)
		{
			return transitionTime;
		}

		const delay = parseTime(delays[index % delays.length] ?? '0s');

		return Math.max(transitionTime, Math.max(0, duration + delay));
	}, 0);
}

function hasActiveTransition(element, propertyName)
{
	if (!Type.isFunction(element.getAnimations))
	{
		return false;
	}

	return element.getAnimations().some((animation) => {
		return animation?.constructor?.name === 'CSSTransition'
			&& animation.transitionProperty === propertyName
			&& animation.playState !== 'finished'
			&& animation.playState !== 'idle';
	});
}

export function waitForToolbarLayoutTransition(
	element,
	{ visible, propertyName = 'height', onComplete },
)
{
	let cancelled = false;
	let completed = false;
	let fallbackTimer = 0;
	let validationRaf = 0;

	function clear()
	{
		if (fallbackTimer)
		{
			clearTimeout(fallbackTimer);
			fallbackTimer = 0;
		}

		if (validationRaf)
		{
			cancelAnimationFrame(validationRaf);
			validationRaf = 0;
		}

		if (element)
		{
			Event.unbind(element, 'transitionend', handleTransitionEvent);
			Event.unbind(element, 'transitioncancel', handleTransitionEvent);
		}
	}

	function complete()
	{
		if (cancelled || completed)
		{
			return;
		}

		completed = true;
		clear();
		onComplete();
	}

	function matchesTargetState()
	{
		return !element || Dom.hasClass(element, VISIBLE_CLASS) === visible;
	}

	function validateCompletion(ignoreActiveTransition)
	{
		if (validationRaf)
		{
			cancelAnimationFrame(validationRaf);
		}

		validationRaf = requestAnimationFrame(() => {
			validationRaf = 0;
			if (!matchesTargetState())
			{
				return;
			}

			if (!ignoreActiveTransition && element && hasActiveTransition(element, propertyName))
			{
				return;
			}

			complete();
		});
	}

	function handleTransitionEvent(event)
	{
		if (event.target !== element || event.propertyName !== propertyName)
		{
			return;
		}

		validateCompletion(false);
	}

	if (element)
	{
		const transitionTime = resolveTransitionTime(element, propertyName);
		if (transitionTime <= 0)
		{
			validateCompletion(true);
		}
		else
		{
			Event.bind(element, 'transitionend', handleTransitionEvent);
			Event.bind(element, 'transitioncancel', handleTransitionEvent);
			fallbackTimer = setTimeout(() => {
				fallbackTimer = 0;
				validateCompletion(true);
			}, transitionTime + FALLBACK_DELAY_MS);
		}
	}
	else
	{
		validateCompletion(true);
	}

	return () => {
		if (cancelled || completed)
		{
			return;
		}

		cancelled = true;
		clear();
	};
}
