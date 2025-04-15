import { Dom, Text, Type } from 'main.core';
import { EventEmitter } from 'main.core.events';

export default class Theme
{
	backgroundNode: Element = null;

	constructor() {
		const theme: any = this.#getThemePicker()?.getAppliedTheme();
		this.backgroundNode = document.querySelector('body');

		if (theme)
		{
			this.#applyTheme(theme);
		}

		EventEmitter.subscribe(
			'BX.Intranet.Bitrix24:ThemePicker:onThemeApply',
			(event) => {
				this.#applyTheme(event.data.theme);
			},
		);
	}

	#getThemePicker(): ?BX.Intranet.Bitrix24.ThemePicker
	{
		return BX.Intranet?.Bitrix24?.ThemePicker.Singleton ?? top.BX.Intranet?.Bitrix24?.ThemePicker.Singleton;
	}

	#applyTheme(theme: any): void
	{
		theme.video ? this.#applyVideoTheme(theme) : this.#applyPictureTheme(theme);

		Dom.removeClass(this.backgroundNode, 'bitrix24-theme-default bitrix24-theme-dark bitrix24-theme-light');
		let themeClass = 'bitrix24-theme-default';

		if (theme.id !== 'default' && String(theme.id).indexOf('default:') !== 0)
		{
			themeClass = String(theme.id).indexOf('dark:') === 0 ? 'bitrix24-theme-dark' : 'bitrix24-theme-light';
		}

		Dom.addClass(this.backgroundNode, themeClass);
	}

	#applyPictureTheme(theme: any): void
	{
		let bgImage = theme.previewImage;
		if (Type.isArrayFilled(theme.prefetchImages))
		{
			bgImage = theme.prefetchImages[theme.prefetchImages.length - 1];
		}
		const imageUrl = `url('${Text.encode(bgImage)}')`;
		Dom.style(this.backgroundNode, 'backgroundImage', imageUrl);
	}

	#applyVideoTheme(theme: any): void
	{
		const sources = [];
		for (let type in theme.video.sources)
		{
			sources.push(BX.create('source', {
				attrs: {
					type: `video/${type}`,
					src: theme.video.sources[type],
				},
			}));
		}

		const video = Dom.create('div', {
			props: {
				className: 'theme-video-container',
			},
			dataset: {
				themeId: theme.id,
			},
			children: [
				Dom.create('video', {
					props: {
						className: 'theme-video',
					},
					attrs: {
						poster: theme.video.poster,
						autoplay: true,
						loop: true,
						muted: true,
						playsinline: true,
					},
					dataset: {
						themeId: theme.id,
					},
					children: sources,
				}),
			],
		});

		Dom.prepend(video, this.backgroundNode);
	}
}