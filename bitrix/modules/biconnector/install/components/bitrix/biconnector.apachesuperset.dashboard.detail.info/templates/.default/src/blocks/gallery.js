import { Dom, Event, Text, Type } from 'main.core';
import { normalizeImageUrl } from '../image-url';

type GalleryOptions = {
	eps: number,
	defaultStep: number,
};

export class GalleryBlock
{
	constructor(gallery: Element, options: GalleryOptions)
	{
		this.gallery = gallery;
		this.eps = options.eps;
		this.defaultStep = options.defaultStep;
		this.viewport = null;
		this.btnPrev = null;
		this.btnNext = null;
		this.resizeObserver = null;
		this.isWindowLoadBound = false;
		this.onPrev = () => {
			if (Type.isDomNode(this.viewport))
			{
				this.viewport.scrollBy({ left: -this.getStepPx(), behavior: 'smooth' });
			}
		};
		this.onNext = () => {
			if (Type.isDomNode(this.viewport))
			{
				this.viewport.scrollBy({ left: this.getStepPx(), behavior: 'smooth' });
			}
		};
		this.onScroll = () => this.update();
		this.onResize = () => this.update();
		this.onWindowLoad = () => {
			this.isWindowLoadBound = false;
			this.update();
		};
	}

	static normalizeImages(imagesRaw: any): string[]
	{
		if (!Array.isArray(imagesRaw))
		{
			return [];
		}

		return imagesRaw
			.map((image) => normalizeImageUrl(GalleryBlock.getImageSrc(image)))
			.filter((imageSrc) => Type.isStringFilled(imageSrc))
		;
	}

	static render(images: string[], viewerGroupId: string): string
	{
		if (!Type.isArrayFilled(images))
		{
			return '';
		}

		const items = images
			.map((imageSrc) => {
				const normalizedImageSrc = normalizeImageUrl(imageSrc);
				if (!Type.isStringFilled(normalizedImageSrc))
				{
					return '';
				}

				const safeImageSrc = Text.encode(normalizedImageSrc);

				return `
					<a
						class="report-gallery__item"
						href="${safeImageSrc}"
						target="_blank"
						rel="noopener"
						style="background-image: url('${safeImageSrc}')"
						data-viewer
						data-viewer-type="image"
						data-src="${safeImageSrc}"
						data-viewer-group-by="${Text.encode(viewerGroupId)}"
					></a>
				`;
			})
			.filter((item) => item !== '')
			.join('')
		;
		if (items === '')
		{
			return '';
		}

		return `
			<div class="report__row">
				<div class="report__gallery" data-role="gallery">
					<button class="report-gallery__nav report-gallery__nav--left" type="button" aria-label="Назад" data-role="prev">
						<div class="ui-icon-set --chevron-left-l"></div>
					</button>

					<div class="report-gallery__viewport" tabindex="0" data-role="viewport">
						<div class="report-gallery__track" data-role="track">
							${items}
						</div>
					</div>

					<button class="report-gallery__nav report-gallery__nav--right" type="button" aria-label="Вперёд" data-role="next">
						<div class="ui-icon-set --chevron-right-l"></div>
					</button>

					<div class="report-gallery__fade report-gallery__fade--left" aria-hidden="true" data-role="fade-left"></div>
					<div class="report-gallery__fade report-gallery__fade--right" aria-hidden="true" data-role="fade-right"></div>
				</div>
			</div>
		`;
	}

	bind(): void
	{
		const viewport = this.gallery.querySelector('[data-role="viewport"]');

		if (!Type.isDomNode(viewport))
		{
			return;
		}

		this.destroy();
		this.viewport = viewport;
		this.btnPrev = this.gallery.querySelector('[data-role="prev"]');
		this.btnNext = this.gallery.querySelector('[data-role="next"]');

		Event.bind(this.btnPrev, 'click', this.onPrev);
		Event.bind(this.btnNext, 'click', this.onNext);
		Event.bind(this.viewport, 'scroll', this.onScroll, { passive: true });

		if (Type.isFunction(window.ResizeObserver))
		{
			this.resizeObserver = new ResizeObserver(this.onResize);
			this.resizeObserver.observe(this.viewport);
			this.resizeObserver.observe(this.gallery);
		}

		if (document.readyState === 'complete')
		{
			this.update();
		}
		else
		{
			this.isWindowLoadBound = true;
			Event.bind(window, 'load', this.onWindowLoad, { once: true });
		}
	}

	destroy(): void
	{
		if (Type.isDomNode(this.btnPrev))
		{
			Event.unbind(this.btnPrev, 'click', this.onPrev);
		}

		if (Type.isDomNode(this.btnNext))
		{
			Event.unbind(this.btnNext, 'click', this.onNext);
		}

		if (Type.isDomNode(this.viewport))
		{
			Event.unbind(this.viewport, 'scroll', this.onScroll);
		}

		if (this.isWindowLoadBound)
		{
			Event.unbind(window, 'load', this.onWindowLoad);
			this.isWindowLoadBound = false;
		}

		if (this.resizeObserver)
		{
			this.resizeObserver.disconnect();
			this.resizeObserver = null;
		}

		this.viewport = null;
		this.btnPrev = null;
		this.btnNext = null;
	}

	update(): void
	{
		const viewport = this.gallery.querySelector('[data-role="viewport"]');
		const track = this.gallery.querySelector('[data-role="track"]');
		const btnPrev = this.gallery.querySelector('[data-role="prev"]');
		const btnNext = this.gallery.querySelector('[data-role="next"]');

		if (!Type.isDomNode(viewport) || !Type.isDomNode(track))
		{
			return;
		}

		const maxScrollLeft = viewport.scrollWidth - viewport.clientWidth;
		const isScrollable = maxScrollLeft > this.eps;
		this.toggleClass(this.gallery, 'is-static', !isScrollable);

		if (!isScrollable)
		{
			Dom.removeClass(this.gallery, 'has-left-fade');
			Dom.removeClass(this.gallery, 'has-right-fade');
			this.setButtonVisibility(btnPrev, false);
			this.setButtonVisibility(btnNext, false);

			return;
		}

		const atStart = viewport.scrollLeft <= this.eps;
		const atEnd = viewport.scrollLeft >= maxScrollLeft - this.eps;

		this.toggleClass(this.gallery, 'has-left-fade', !atStart);
		this.toggleClass(this.gallery, 'has-right-fade', !atEnd);

		this.setButtonVisibility(btnPrev, !atStart);
		this.setButtonVisibility(btnNext, !atEnd);
	}

	getStepPx(): number
	{
		const item = this.gallery.querySelector('.report-gallery__item');
		const track = this.gallery.querySelector('[data-role="track"]');

		if (!Type.isDomNode(item) || !Type.isDomNode(track))
		{
			return this.defaultStep;
		}

		const itemWidth = item.getBoundingClientRect().width;
		const styles = getComputedStyle(track);
		const gap = parseFloat(styles.columnGap || styles.gap || '0') || 0;

		return Math.round(itemWidth + gap);
	}

	setButtonVisibility(button: ?Element, isVisible: boolean): void
	{
		if (!Type.isDomNode(button))
		{
			return;
		}

		Dom.style(button, 'visibility', isVisible ? 'visible' : 'hidden');
	}

	toggleClass(node: Element, className: string, isEnabled: boolean): void
	{
		if (isEnabled)
		{
			Dom.addClass(node, className);
		}
		else
		{
			Dom.removeClass(node, className);
		}
	}

	static getImageSrc(image: any): string
	{
		if (Type.isStringFilled(image))
		{
			return image;
		}

		if (Type.isPlainObject(image) && Type.isStringFilled(image.SRC))
		{
			return image.SRC;
		}

		if (Type.isPlainObject(image) && Type.isStringFilled(image.src))
		{
			return image.src;
		}

		return '';
	}
}
