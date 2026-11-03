import { Event, Type } from 'main.core';
import { EventEmitter } from 'main.core.events';

const SLIDER_INTERACTION_EVENTS = ['pointerdown', 'click', 'keydown', 'input', 'change', 'submit'];

export function getSliderFromEvent(event)
{
	const sliderEvent = Type.isFunction(event?.getData) ? (event.getData()?.[0] ?? event) : event;
	if (sliderEvent?.slider)
	{
		return sliderEvent.slider;
	}

	if (Type.isFunction(sliderEvent?.getSlider))
	{
		return sliderEvent.getSlider();
	}

	return null;
}

function isMainGridTransportIframe(frame)
{
	if (
		frame?.nodeName?.toLowerCase() !== 'iframe'
		|| !frame.id?.startsWith('main-grid-tmp-frame-')
		|| !frame.isConnected
		|| frame.hasAttribute('srcdoc')
		|| frame.ownerDocument?.activeElement === frame
	)
	{
		return false;
	}

	try
	{
		const source = frame.getAttribute('src');
		if (source !== null && source.trim() !== '' && source.trim().toLowerCase() !== 'about:blank')
		{
			return false;
		}

		const rect = frame.getBoundingClientRect();

		return rect.width === 0 && rect.height === 0;
	}
	catch
	{
		return false;
	}
}

function containsUnsupportedIframe(node)
{
	if (node?.nodeName?.toLowerCase() === 'iframe')
	{
		return !isMainGridTransportIframe(node);
	}

	if (!Type.isFunction(node?.querySelectorAll))
	{
		return false;
	}

	for (const frame of node.querySelectorAll('iframe'))
	{
		if (!isMainGridTransportIframe(frame))
		{
			return true;
		}
	}

	return false;
}

function containsIframe(node)
{
	return node?.nodeName?.toLowerCase() === 'iframe'
		|| (Type.isFunction(node?.querySelectorAll) && node.querySelectorAll('iframe').length > 0);
}

function isGridTransportAttributeMutation(record)
{
	const frame = record.target;
	if (frame?.nodeName?.toLowerCase() !== 'iframe')
	{
		return false;
	}

	const id = frame.id;
	const previousId = record.attributeName === 'id' ? record.oldValue : null;

	return id?.startsWith('main-grid-tmp-frame-') || previousId?.startsWith('main-grid-tmp-frame-');
}

function mutationAddsOrRemovesIframe(records)
{
	for (const record of records)
	{
		if (record.type === 'attributes' && isGridTransportAttributeMutation(record))
		{
			return true;
		}

		for (const node of record.addedNodes)
		{
			if (containsUnsupportedIframe(node))
			{
				return true;
			}
		}

		for (const node of record.removedNodes)
		{
			if (containsIframe(node))
			{
				return true;
			}
		}
	}

	return false;
}

export class SliderViewObserver
{
	#observations = new Map();
	#getEntityPath;
	#eventHandlers;

	constructor(getEntityPath)
	{
		this.#getEntityPath = getEntityPath;
		this.#eventHandlers = {
			'SidePanel.Slider:onOpenStart': this.#handleOpenStart.bind(this),
			'SidePanel.Slider:onLoad': this.#handleLoad.bind(this),
			'SidePanel.Slider:onReload': this.#handleReload.bind(this),
			'SidePanel.Slider:onCloseComplete': this.#handleCloseComplete.bind(this),
			'SidePanel.Slider:onDestroy': this.#handleDestroy.bind(this),
		};

		for (const [eventName, handler] of Object.entries(this.#eventHandlers))
		{
			EventEmitter.subscribe(eventName, handler);
		}
	}

	destroy()
	{
		for (const [eventName, handler] of Object.entries(this.#eventHandlers))
		{
			EventEmitter.unsubscribe(eventName, handler);
		}

		for (const slider of this.#observations.keys())
		{
			this.#cleanupObservation(slider);
		}
	}

	#handleOpenStart(event)
	{
		const slider = getSliderFromEvent(event);
		if (!slider)
		{
			return;
		}

		for (const [activeSlider, state] of this.#observations)
		{
			if (activeSlider !== slider)
			{
				this.#invalidateObservation(state);
			}
		}

		this.#cleanupObservation(slider);

		const entityId = this.getEntityId(slider);
		if (!entityId || parseInt(entityId, 10) <= 0)
		{
			return;
		}

		const state = {
			slider,
			entityId,
			frameWindow: null,
			document: null,
			listeners: [],
			mutationObserver: null,
			installed: false,
			interacted: false,
			invalid: false,
		};

		this.#observations.set(slider, state);

		if (Type.isFunction(slider.isLoaded) && slider.isLoaded())
		{
			this.#observeFrame(state);
		}
	}

	#handleLoad(event)
	{
		const slider = getSliderFromEvent(event);
		const state = slider ? this.#observations.get(slider) : null;
		if (state)
		{
			this.#observeFrame(state);
		}
	}

	#handleReload(event)
	{
		const slider = getSliderFromEvent(event);
		const state = slider ? this.#observations.get(slider) : null;
		if (state)
		{
			this.#invalidateObservation(state);
		}
	}

	#handleCloseComplete(event)
	{
		this.#cleanupObservation(getSliderFromEvent(event));
	}

	#handleDestroy(event)
	{
		this.#cleanupObservation(getSliderFromEvent(event));
	}

	getEntityId(slider)
	{
		if (!Type.isFunction(slider?.getUrl))
		{
			return null;
		}

		try
		{
			const sliderUrl = slider.getUrl();
			if (!Type.isStringFilled(sliderUrl))
			{
				return null;
			}

			const maskUrl = this.#getEntityPath().replace(/#([^#]+)#/, '([\\d]+)');
			const match = sliderUrl.match(new RegExp(maskUrl));

			return match && match[1] ? match[1] : null;
		}
		catch
		{
			return null;
		}
	}

	#observeFrame(state)
	{
		const observation = state;
		const { slider, entityId, document: observedDocument, installed, invalid } = observation;
		if (invalid || !this.#isCurrentObservation(observation))
		{
			return false;
		}

		let frameWindow = null;
		let frameDocument = null;

		try
		{
			if (!Type.isFunction(slider.getFrameWindow) || !Type.isFunction(slider.isLoaded) || !slider.isLoaded())
			{
				return false;
			}

			frameWindow = slider.getFrameWindow();
			if (!frameWindow)
			{
				return false;
			}

			frameDocument = frameWindow.document;
			if (!frameDocument?.documentElement || frameDocument.defaultView !== frameWindow)
			{
				return false;
			}

			if (observedDocument)
			{
				if (observedDocument === frameDocument && installed)
				{
					return true;
				}

				this.#invalidateObservation(observation);

				return false;
			}

			if (this.getEntityId(slider) !== entityId || containsUnsupportedIframe(frameDocument))
			{
				this.#invalidateObservation(observation);

				return false;
			}

			if (!Type.isFunction(frameWindow.MutationObserver))
			{
				return false;
			}

			return this.#attachFrameObservation(observation, frameWindow, frameDocument);
		}
		catch
		{
			return false;
		}
	}

	#attachFrameObservation(observation, frameWindow, frameDocument)
	{
		let mutationObserver = null;
		const listeners = [];

		try
		{
			mutationObserver = new frameWindow.MutationObserver((records) => {
				if (this.#isCurrentObservation(observation) && mutationAddsOrRemovesIframe(records))
				{
					this.#invalidateObservation(observation);
				}
			});
			mutationObserver.observe(frameDocument.documentElement, {
				attributeFilter: ['class', 'height', 'id', 'src', 'srcdoc', 'style', 'tabindex', 'width'],
				attributeOldValue: true,
				attributes: true,
				childList: true,
				subtree: true,
			});

			const handleInteraction = () => {
				if (this.#isCurrentObservation(observation))
				{
					Object.assign(observation, { interacted: true });
				}
			};

			for (const eventName of SLIDER_INTERACTION_EVENTS)
			{
				Event.bind(frameWindow, eventName, handleInteraction, true);
				listeners.push({ target: frameWindow, eventName, handler: handleInteraction });
			}

			const handlePageHide = () => {
				if (this.#isCurrentObservation(observation))
				{
					this.#invalidateObservation(observation);
				}
			};
			Event.bind(frameWindow, 'pagehide', handlePageHide, true);
			listeners.push({ target: frameWindow, eventName: 'pagehide', handler: handlePageHide });

			Object.assign(observation, {
				frameWindow,
				document: frameDocument,
				listeners,
				mutationObserver,
				installed: true,
			});

			return true;
		}
		catch
		{
			for (const listener of listeners)
			{
				Event.unbind(listener.target, listener.eventName, listener.handler, true);
			}

			mutationObserver?.disconnect();

			return false;
		}
	}

	#isCurrentObservation(state)
	{
		return this.#observations.get(state.slider) === state;
	}

	canSkipCloseRefresh(slider, entityId)
	{
		const state = this.#observations.get(slider);
		if (
			!state
			|| state.entityId !== entityId
			|| !state.installed
			|| state.interacted
			|| state.invalid
			|| !this.#isCurrentObservation(state)
		)
		{
			return false;
		}

		try
		{
			if (!Type.isFunction(slider.isLoaded) || !slider.isLoaded())
			{
				return false;
			}

			const frameWindow = slider.getFrameWindow();
			if (frameWindow !== state.frameWindow || frameWindow.document !== state.document)
			{
				this.#invalidateObservation(state);

				return false;
			}

			if (
				mutationAddsOrRemovesIframe(state.mutationObserver.takeRecords())
				|| containsUnsupportedIframe(state.document)
			)
			{
				this.#invalidateObservation(state);

				return false;
			}
		}
		catch
		{
			this.#invalidateObservation(state);

			return false;
		}

		return true;
	}

	#invalidateObservation(state)
	{
		const observation = state;
		if (observation.invalid)
		{
			return;
		}

		observation.invalid = true;
		this.#removeObservationListeners(observation);
	}

	#removeObservationListeners(state)
	{
		const observation = state;
		for (const listener of observation.listeners)
		{
			Event.unbind(listener.target, listener.eventName, listener.handler, true);
		}
		observation.mutationObserver?.disconnect();

		Object.assign(observation, {
			listeners: [],
			mutationObserver: null,
			installed: false,
		});
	}

	#cleanupObservation(slider)
	{
		const state = slider ? this.#observations.get(slider) : null;
		if (!state)
		{
			return;
		}

		this.#removeObservationListeners(state);
		this.#observations.delete(slider);
	}
}
