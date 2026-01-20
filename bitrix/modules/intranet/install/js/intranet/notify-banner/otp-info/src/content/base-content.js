import { Tag } from 'main.core';
import { ButtonFactory } from '../button-factory';
import { sendData } from 'ui.analytics';

export class BaseContent
{
	btnFactory: ButtonFactory;

	constructor(options)
	{
		this.btnFactory = new ButtonFactory(options, this);
	}

	getId(): string
	{
		return '';
	}

	getTitle(): string
	{
		return '';
	}

	getFirstContentBlock(): string
	{
		return '';
	}

	getSecondContentBlock(): string
	{
		return '';
	}

	getButtons(): Array
	{
		return [];
	}

	getAlertContentBlock(): string
	{
		return '';
	}

	getMiddleBlock(): string
	{
		return Tag.render``;
	}

	isTimeEnd(): boolean
	{
		return false;
	}

	onShow(): void
	{
		this.#sendAnalytics('show');
	}

	onClickEnable(): void
	{
		this.#sendAnalytics('click', 'on');
	}

	onClickLater(): void
	{
		this.#sendAnalytics('click', 'later');
	}

	getAnalyticsType(): string
	{
		return '';
	}

	getAnalyticsCategory(): string
	{
		return '';
	}

	#sendAnalytics(event: string, cSection: string = null): void
	{
		const options = {
			tool: 'push',
			event,
		};

		if (cSection)
		{
			options.c_section = cSection;
		}

		if (this.getAnalyticsType())
		{
			options.type = this.getAnalyticsType();
		}

		if (this.getAnalyticsCategory())
		{
			options.category = this.getAnalyticsCategory();
		}

		sendData(options);
	}
}
