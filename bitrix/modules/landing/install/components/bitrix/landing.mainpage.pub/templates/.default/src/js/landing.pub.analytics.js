import { Event } from 'main.core';
import { Metrika } from 'landing.metrika';

export class Analytics
{
	/**
	 * Constructor.
	 */
	constructor(options)
	{
		this.isPublished = options.isPublished;
		this.templateCode = options.templateCode;
		this.metrika = new Metrika(true);
		this.initEventListeners();
	}

	initEventListeners(): void
	{
		const blocks = [...document.getElementsByClassName('block-wrapper')];
		blocks.forEach((block) => {
			Event.bind(block, 'click', this.onClick.bind(this));
		});
	}

	/**
	 * Click callback.
	 *
	 * @param {MouseEvent} event
	 * @return {void}
	 */
	onClick(event: MouseEvent)
	{
		const target = event.target;

		if (!this.isClickableElement(target))
		{
			return;
		}

		const analyticsData = this.getAnalyticsData(event);
		this.metrika.sendData(analyticsData);
	}

	isClickableElement(element: HTMLElement): boolean
	{
		const tag = element.tagName.toLowerCase();

		return (
			tag === 'a'
			|| tag === 'button'
			|| element.hasAttribute('data-pseudo-url')
			|| (element.parentElement && element.parentElement.tagName.toLowerCase() === 'a')
			|| (element.firstElementChild && element.firstElementChild.tagName.toLowerCase() === 'a')
		);
	}

	getTrackingParameter(target: HTMLElement): string
	{
		const href = this.extractHrefFromPseudoUrl(target) || this.extractHrefFromElement(target);

		if (!href)
		{
			return '';
		}

		const sliderMatch = href.match(/BX\.Helper\.show\(["'].*?code=(\d+)["']\)/);
		if (sliderMatch)
		{
			return ['slider', sliderMatch[1]];
		}

		if (href.startsWith('/') || href.includes(window.location.origin))
		{
			return ['b24url', href];
		}

		return ['otherurl', href];
	}

	extractHrefFromPseudoUrl(target: HTMLElement): string | null
	{
		if (!target.hasAttribute('data-pseudo-url'))
		{
			return null;
		}

		const raw = target.getAttribute('data-pseudo-url');
		if (!raw)
		{
			return null;
		}

		try
		{
			const data = JSON.parse(raw.replaceAll('&quot;', '"'));
			if (data && data.href && data.enabled)
			{
				if (!/^\/|^https?:\/\/|^#/.test(data.href))
				{
					return '';
				}

				return data.href;
			}
		}
		catch
		{
			console.warn('Invalid pseudo-url JSON:', raw);
		}

		return null;
	}

	extractHrefFromElement(target: HTMLElement): string | null
	{
		const linkElement = target.closest('a');

		return linkElement ? linkElement.getAttribute('href') || null : null;
	}

	getAnalyticsData(event: MouseEvent): Object
	{
		let code = '';
		const blockWrapper = event.currentTarget;
		blockWrapper.classList.forEach((className) => {
			if (className !== 'block-wrapper')
			{
				code += className;
			}
		});
		code = code.replace('block-', '');
		code = code.replaceAll('-', '.');

		const isTrialButton = event.target.id === 'trialButton';
		const eventName = isTrialButton ? 'demo_activated' : 'click_on_button';

		return {
			category: 'vibe',
			event: eventName,
			c_section: this.isPublished ? 'active_page' : 'preview_page',
			p1: ['templateCode', this.templateCode],
			p2: ['widgetId', code],
			p4: this.getTrackingParameter(event.target),
		};
	}
}
