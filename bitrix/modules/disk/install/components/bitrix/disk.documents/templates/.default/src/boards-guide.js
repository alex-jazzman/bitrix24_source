import { Loc } from 'main.core';

export default class BoardsGuide
{
	target: HTMLElement | null = null;
	targetSpotlight: HTMLElement | null = null;
	isBoardsPage: boolean;

	guide = null;

	constructor(options)
	{
		this.target = document.querySelector(options.targetSelector);
		this.targetSpotlight = document.querySelector(options.spotlightSelector);
		this.isBoardsPage = options.isBoardsPage;

		if (this.#checkParams())
		{
			this.guide = this.#createGuide(options.id);
		}
		else
		{
			console.error('Unable to create guide');
		}
	}

	start(): void
	{
		if (this.guide === null)
		{
			console.error('Unable to start guide');

			return;
		}

		BX.UI.BannerDispatcher.low.toQueue((done) => {
			let isDone = false;
			const complete = () => {
				if (isDone)
				{
					return;
				}

				isDone = true;
				done();
			};

			this.guide.subscribe('UI.Tour.Guide:onFinish', complete);
			this.guide.scrollToTarget(this.target);
			this.guide.start();
		}, { id: this.guide.getId() });
	}

	#checkParams(): boolean
	{
		return this.target !== null && this.targetSpotlight !== null;
	}

	#createGuide(id: string)
	{
		const spotlight = this.#createSpotlight();

		const guide = new BX.UI.Tour.Guide({
			id,
			simpleMode: true,
			overlay: false,
			onEvents: true,
			autoSave: true,
			steps: [
				{
					target: this.target,
					title: this.#getTitle(),
					text: this.#getText(),
					position: 'bottom',
					condition: {
						color: 'primary',
						bottom: false,
						top: true,
					},
				},
			],
			events: {
				onStart: () => {
					spotlight.show();
				},
				onFinish: () => {
					spotlight.close();
				},
			},
		});

		const guidePopup = guide.getPopup();

		guidePopup.setWidth(380);
		guidePopup.setAngle({
			offset: (this.target.offsetWidth / 2) - (guidePopup.contentContainer.offsetWidth / 2),
		});

		return guide;
	}

	#createSpotlight(): BX.SpotLight
	{
		const spotLight = new BX.SpotLight(
			{
				targetElement: this.targetSpotlight,
				targetVertex: 'middle-center',
				lightMode: true,
			},
		);
		spotLight.getTargetContainer().style.pointerEvents = 'none';

		return spotLight;
	}

	#getTitle(): string
	{
		// noinspection JSAnnotator
		return this.isBoardsPage ? Loc.getMessage('DISK_BOARD_TOUR_TITLE') : Loc.getMessage('DISK_DOCUMENTS_TOUR_TITLE');
	}

	#getText(): string
	{
		// noinspection JSAnnotator
		return this.isBoardsPage ? Loc.getMessage('DISK_BOARD_TOUR_DESCRIPTION') : Loc.getMessage('DISK_DOCUMENTS_TOUR_DESCRIPTION');
	}
}
