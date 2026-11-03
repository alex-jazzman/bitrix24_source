import { Dom } from 'main.core';

export class WaterMarkButton
{
	constructor(config)
	{
		this.language = config.language;
		this.elements = {
			root: null,
		};
	}

	render()
	{
		if (this.elements.root)
		{
			return this.elements.root;
		}

		this.elements.root = Dom.create('div', {
			props: { className: 'bx-messenger-videocall-watermark' },
			attrs: { 'aria-hidden': 'true' },
			children: [
				Dom.create('img', {
					props: {
						className: 'bx-messenger-videocall-watermark-img',
						src: this.getWatermarkUrl(this.language),
						alt: '',
					},
				}),
			],
		});

		return this.elements.root;
	}

	getWatermarkUrl(language)
	{
		switch (language)
		{
			case 'ru':
			case 'kz':
			case 'by':
				return '/bitrix/js/call/images/new-logo-white-ru.svg';
			default:
				return '/bitrix/js/call/images/new-logo-white-en.svg';
		}
	}
}
