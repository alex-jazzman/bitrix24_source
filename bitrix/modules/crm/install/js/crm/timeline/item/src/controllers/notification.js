import { Event, Type } from 'main.core';
import { EventEmitter } from 'main.core.events';
import ConfigurableItem from '../configurable-item';
import { Base } from './base';

export class Notification extends Base
{
	onInitialize(item: ConfigurableItem): void
	{
		if (item)
		{
			this.#showTour(item);
		}
	}

	#showTour(item: ConfigurableItem): void
	{
		setTimeout(() => {
			const layout = item.getLayout()?.asPlainObject();

			const isSms = Type.isStringFilled(layout?.header?.title) && layout.header.title.includes('SMS');

			if (!isSms)
			{
				return;
			}

			if (this.#isInViewport(item.getLayoutComponent().$el))
			{
				EventEmitter.emit(
					this,
					'BX.Crm.Timeline.Notification:onShowForcedSmsTour',
					{
						target: item.getLayoutComponent().$el,
						stepId: 'notifications-forced-sms',
						delay: 1500,
					},
				);

				return;
			}

			const showTourOnScroll = () => {
				if (this.#isInViewport(item.getLayoutComponent().$el))
				{
					EventEmitter.emit(
						this,
						'BX.Crm.Timeline.Notification:onShowForcedSmsTour',
						{
							target: item.getLayoutComponent().$el,
							stepId: 'notifications-forced-sms',
							delay: 1000,
						},
					);

					Event.unbind(window, 'scroll', showTourOnScroll);
				}
			};

			Event.bind(window, 'scroll', showTourOnScroll);
		}, 50);
	}

	#isInViewport(element: HTMLElement): boolean
	{
		if (!Type.isDomNode(element))
		{
			return false;
		}

		const rect = element.getBoundingClientRect();

		return (
			rect.top >= 0
			&& rect.left >= 0
			&& rect.bottom <= (window.innerHeight || document.documentElement.clientHeight)
			&& rect.right <= (window.innerWidth || document.documentElement.clientWidth)
		);
	}

	static isItemSupported(item: ConfigurableItem): boolean
	{
		return item.getType() === 'Activity:Notification';
	}
}
