import { Analytic } from './analytic';
import { Carousel } from './carousel';
import { Navigation } from './navigation';
import { ViewFactory } from './view-factory';

export class AnnualSummary
{
	#carousel: Carousel;
	#analytic: ?Analytic;

	constructor(top: {}, options: {})
	{
		this.#analytic = new Analytic({ section: options.section ?? 'auto' });
		const factory = new ViewFactory({ ...options, analytic: this.#analytic });
		const navigation = new Navigation({
			start: 0,
			views: top?.all ? factory.createList(top, this) : factory.createTop(top, this),
		});

		this.#carousel = new Carousel({
			navigation,
			isUseArrowNavigation: true,
			canClose: options.canClose !== false,
			userpicPath: options.userpicPath,
			showOverlay: options.showOverlay,
			analytic: this.#analytic,
		});
	}

	close(): void
	{
		this.#carousel.close();
	}

	show(): void
	{
		this.#carousel.show();
	}

	subscribe(eventName, callback): void
	{
		this.#carousel.subscribe(eventName, callback);
	}

	next(): void
	{
		this.#carousel.right();
	}

	previous(): void
	{
		this.#carousel.left();
	}
}
