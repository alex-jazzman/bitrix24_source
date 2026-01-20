import { Tag, Loc, Event, ajax } from 'main.core';
import { Popup } from 'main.popup';

import { Button, AirButtonStyle, ButtonSize } from 'ui.buttons';
import { Icon, Outline } from 'ui.icon-set.api.core';
import { BannerDispatcher } from 'ui.banner-dispatcher';

import './new-card-popup.css';

export class NewCardPopup
{
	#popup: Popup;

	static show(): void
	{
		return new this().showPopup();
	}

	showPopup(): void
	{
		BannerDispatcher.high.toQueue((onDone) => {
			this.#popup = this.getPopup();

			const onClose = () => {
				setTimeout(() => {
					onDone();
				}, 1000);
			};

			this.#popup.show();
			this.#popup.subscribe('onClose', onClose);
			this.#popup.subscribe('onDestroy', onClose);

			this.setViewed();
		});
	}

	getPopup(): Popup
	{
		return new Popup({
			content: this.getContent(),
			disableScroll: true,
			autoHide: true,
			padding: 0,
			width: 905,
			height: 525,
			autoHideHandler: () => true,
			overlay: {
				backgroundColor: '#0A2D5F',
				opacity: 58,
			},
			closeIcon: false,
			closeByEsc: false,
			className: 'tasks-onboarding-new-card-popup-wrapper',
		});
	}

	getContent(): HTMLElement
	{
		return Tag.render`
			<div class="tasks-onboarding-new-card-popup">
				<div class="tasks-onboarding-new-card-popup-content-gradient">
					<div class="tasks-onboarding-new-card-popup-content">
						<div class="tasks-onboarding-new-card-popup-left">
							<div class="tasks-onboarding-new-card-popup-title">
								${Loc.getMessage('TASKS_COMPONENT_ONBOARDING_NEW_CARD_POPUP_TITLE')}
							</div>
							<div class="tasks-onboarding-new-card-popup-feature-list">
								${this.getFeatures().map((feature) => this.getFeatureElement(feature))}
							</div>
							${this.getButton()}
						</div>
						<div class="tasks-onboarding-new-card-popup-right">
							<img 
								class="tasks-onboarding-new-card-popup-cosmozeph" 
								src="${this.getCosmozephPath()}" 
								alt=""
							/>
							<div class="tasks-onboarding-new-card-popup-video-border">
								${this.getVideoElement()}
							</div>
							<div class="tasks-onboarding-new-card-popup-pill --fast">${Loc.getMessage('TASKS_COMPONENT_ONBOARDING_NEW_CARD_POPUP_FAST')}</div>
							<div class="tasks-onboarding-new-card-popup-pill --simple">${Loc.getMessage('TASKS_COMPONENT_ONBOARDING_NEW_CARD_POPUP_SIMPLE')}</div>
							<div class="tasks-onboarding-new-card-popup-pill --ai">${Loc.getMessage('TASKS_COMPONENT_ONBOARDING_NEW_CARD_POPUP_AI')}</div>
						</div>
					</div>
				</div>
			</div>
		`;
	}

	getOverlay(): HTMLElement
	{
		const element = Tag.render`<div class="tasks-onboarding-new-card-popup-overlay"></div>`;

		Event.bind(element, 'click', () => {
			this.close();
		});

		return element;
	}

	getFeatureElement(feature): HTMLElement
	{
		return Tag.render`
			<div class="tasks-onboarding-new-card-popup-feature">
				${this.getFeatureIcon(feature.icon)}
				<div class="tasks-onboarding-new-card-popup-feature-content">
					<div class="tasks-onboarding-new-card-popup-feature-title">${feature.title}</div>
					<div class="tasks-onboarding-new-card-popup-feature-subtitle">${feature.subtitle}</div>
				</div>
			</div>
		`;
	}

	getFeatureIcon(featureIcon): HTMLElement
	{
		const icon = new Icon({
			icon: featureIcon,
			size: 22,
			color: '#fff',
		});

		return icon.render();
	}

	getButton(): HTMLElement
	{
		const button = new Button({
			useAirDesign: true,
			text: Loc.getMessage('TASKS_COMPONENT_ONBOARDING_NEW_CARD_POPUP_BUTTON_START'),
			style: AirButtonStyle.FILLED,
			size: ButtonSize.EXTRA_LARGE,
			onclick: () => {
				this.close();
			},
		});

		return Tag.render`
			<div class="tasks-onboarding-new-card-popup-button-container">
				${button.render()}
			</div>
		`;
	}

	getVideoElement(): HTMLElement
	{
		const video = Tag.render`
			<video
				class="tasks-onboarding-new-card-popup-video"
				autoplay
				loop
				muted
				playsinline
				preload="auto"
			>
				<source src="${this.getVideoPath()}" type="video/webm">
			</video>
		`;

		setTimeout(() => {
			Event.bind(video, 'error', () => {});

			Event.bind(video, 'loadeddata', () => {
				video.play().catch(() => {});
			});

			video.load();
			const playPromise = video.play();

			if (playPromise !== undefined)
			{
				playPromise.catch(() => {
					video.muted = true;
					video.play();
				});
			}
		}, 0);

		return video;
	}

	getVideoPath(): string
	{
		return '/bitrix/js/tasks/v2/component/onboarding/new-card-popup/src/preview.webm';
	}

	getCosmozephPath(): string
	{
		return '/bitrix/js/tasks/v2/component/onboarding/new-card-popup/src/cosmozeph.png';
	}

	getFeatures(): Array
	{
		return [
			{
				icon: Outline.AI_STARS,
				title: Loc.getMessage('TASKS_COMPONENT_ONBOARDING_NEW_CARD_POPUP_FEATURE_TITLE_1'),
				subtitle: Loc.getMessage('TASKS_COMPONENT_ONBOARDING_NEW_CARD_POPUP_FEATURE_DESCRIPTION_1'),
			},
			{
				icon: Outline.CHATS,
				title: Loc.getMessage('TASKS_COMPONENT_ONBOARDING_NEW_CARD_POPUP_FEATURE_TITLE_2'),
				subtitle: Loc.getMessage('TASKS_COMPONENT_ONBOARDING_NEW_CARD_POPUP_FEATURE_DESCRIPTION_2'),
			},
			{
				icon: Outline.ACTION_REQUIRED,
				title: Loc.getMessage('TASKS_COMPONENT_ONBOARDING_NEW_CARD_POPUP_FEATURE_TITLE_3'),
				subtitle: Loc.getMessage('TASKS_COMPONENT_ONBOARDING_NEW_CARD_POPUP_FEATURE_DESCRIPTION_3'),
			},
		];
	}

	close(): void
	{
		this.#popup.close();
	}

	setViewed(): void
	{
		void ajax.runAction('tasks.promotion.setViewed', {
			data: {
				promotion: 'tasks_new_card',
			},
		});
	}
}
