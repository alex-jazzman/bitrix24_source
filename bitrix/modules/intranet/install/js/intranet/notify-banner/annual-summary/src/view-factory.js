import { Loc } from 'main.core';
import { Analytic } from './analytic';
import { Message } from './message';
import { StartView } from './views/start-view';
import { View } from './views/view';
import { SummaryView } from './views/summary-view';
import { ProgressBar } from './views/progress-bar';
import FeatureType from './feature-type';
import { WinnerView } from './views/winner-view';
import { ShareService } from './share-service';

export class ViewFactory
{
	#signedUserId: string;
	#isShowStartView: boolean = true;
	#hideBtn: boolean = false;
	#showProgressBar: boolean;
	#analytic: ?Analytic;

	constructor(options = {})
	{
		this.#signedUserId = options.signedUserId;
		this.#isShowStartView = options.isShowStartView !== false;
		this.#hideBtn = options.hideBtn === true;
		this.#showProgressBar = options.showProgressBar ?? true;
		this.#analytic = options.analytic instanceof Analytic ? options.analytic : null;
	}

	create(data, context, progressBar): ?View
	{
		return new SummaryView({
			hideBtn: this.#hideBtn,
			count: data.count,
			btn: {
				text: Loc.getMessage('INTRANET_ANNUAL_SUMMARY_CARD_SHARE_BTN'),
			},
			events: {
				left: () => context.previous(),
				right: () => context.next(),
				close: () => context.close(),
			},
			message: new Message(data?.message),
			feature: data.id,
			progressBar,
			analytic: this.#analytic,
			shareService: new ShareService({
				signedType: data?.signedId,
				signedUserId: this.#signedUserId,
			}),
		});
	}

	createTop(data: [], context): View[]
	{
		const summary = [];

		if (this.#isShowStartView)
		{
			summary.push(this.createStartView(context));
		}

		const totalStep = data.length;

		data.forEach((item, index) => {
			let progressBar = null;

			if (this.#showProgressBar)
			{
				progressBar = new ProgressBar({
					currentStep: index,
					totalStep,
				});
			}
			let view = null;
			if (item?.id?.includes('winner_'))
			{
				view = this.createWinner(item, context, progressBar);
			}
			else
			{
				view = this.create(item, context, progressBar);
			}

			if (view)
			{
				summary.push(view);
			}
		});

		return [
			...summary,
		];
	}

	createWinner(data, context, progressBar): View
	{
		return new WinnerView({
			feature: data.id,
			hideBtn: this.#hideBtn,
			message: data?.message,
			featureClass: (data?.featureId ?? 'base') === 'base' ? '' : `intranet-year-results-popup__slide--${data?.featureId}`,
			btn: {
				text: Loc.getMessage('INTRANET_ANNUAL_SUMMARY_CARD_SHARE_BTN'),
			},
			events: {
				left: () => context.previous(),
				close: () => context.close(),
			},
			progressBar,
			analytic: this.#analytic,
			shareService: new ShareService({
				signedType: data?.signedId,
				signedUserId: this.#signedUserId,
			}),
		});
	}

	createList(data: [], context): View[]
	{
		const commonEvents = {
			btn: {
				text: Loc.getMessage('INTRANET_ANNUAL_SUMMARY_CARD_SHARE_BTN'),
			},
			events: {
				left: () => context.previous(),
				right: () => context.next(),
				close: () => context.close(),
			},
		};

		const result = [
			this.createStartView(context),
		];

		Object.entries(FeatureType).forEach(([id, feature]) => {
			result.push(new SummaryView({
				...commonEvents,
				message: new Message({
					title: `You often use ${feature}`,
					description: `You use "${feature}" more than others in your company. Total: ${Math.floor(Math.random() * (1000 - 1 + 1)) + 1}`,
				}),
				feature,
				analytic: this.#analytic,
			}));
		});

		result.push(new WinnerView({
			message: {
				title: 'You are',
				name: 'Mr. Busy Bro',
				description: 'Use more Busy',
			},
			featureClass: '',
			btn: {
				text: Loc.getMessage('INTRANET_ANNUAL_SUMMARY_CARD_LOOK_BTN'),
				click: () => context.next(),
			},
			events: {
				left: () => context.previous(),
				right: () => context.next(),
				close: () => context.close(),
			},
			analytic: this.#analytic,
		}));

		Object.entries(FeatureType).forEach(([id, feature]) => {
			result.push(new WinnerView({
				message: {
					title: 'You are',
					name: `Mr. ${feature}`,
					description: `Use more ${feature}`,
				},
				featureClass: (feature ?? 'base') === 'base' ? '' : `intranet-year-results-popup__slide--${feature}`,
				btn: {
					text: Loc.getMessage('INTRANET_ANNUAL_SUMMARY_CARD_LOOK_BTN'),
					click: () => context.next(),
				},
				events: {
					left: () => context.previous(),
					right: () => context.next(),
					close: () => context.close(),
				},
			}));
		});

		return [
			...result,
		];
	}

	createStartView(context): View
	{
		return new StartView({
			btn: {
				text: Loc.getMessage('INTRANET_ANNUAL_SUMMARY_CARD_LOOK_BTN'),
				click: () => context.next(),
			},
			events: {
				right: () => context.next(),
				close: () => context.close(),
			},
		});
	}
}
