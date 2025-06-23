import { Type } from 'main.core';
import { Metrika } from 'landing.metrika';

export class Analytics
{
	/**
	 * Constructor.
	 */
	constructor(options)
	{
		this.isPublished = options.isPublished;

		const blocks = [].slice.call(document.getElementsByClassName('block-wrapper'));
		if (Type.isArray(blocks) && blocks.length > 0)
		{
			blocks.forEach((block) => {
				block.addEventListener('click', this.onClick.bind(this));
			});
		}
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
		if (
			!(
				target.tagName.toLowerCase() === 'a'
				|| (target.parentNode && target.parentNode.tagName.toLowerCase() === 'a')
				|| (target.firstElementChild && target.firstElementChild.tagName.toLowerCase() === 'a')
				|| target.tagName.toLowerCase() === 'button'
				|| target.hasAttribute('data-pseudo-url')
			)
		)
		{
			return;
		}

		let widgetId = '';
		const blockWrapper = event.currentTarget;
		blockWrapper.classList.forEach(className => {
			if (className !== 'block-wrapper')
			{
				widgetId += className;
			}
		});
		widgetId = widgetId.replace('block-', '');

		const metrika = new Metrika(true);
		metrika.sendData({
			category: 'vibe',
			event: 'click_on_button',
			c_section: this.isPublished ? 'active_page' : 'preview_page',
			params: {
				'widget-id': widgetId,
			},
		});
	}
}