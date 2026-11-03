import { Dom, Event, Loc, Tag, Type } from 'main.core';
import { AirButtonStyle, Button, ButtonSize, type ButtonOptions } from 'ui.buttons';
import 'ui.design-tokens.air';
import { Icon } from 'ui.icon-set.api.core';
import 'ui.icon-set.outline';
import { FeaturePromoter } from 'ui.info-helper';
import { Text as TypographyText } from 'ui.system.typography';

import { ApacheSupersetAnalytics } from 'biconnector.apache-superset-analytics';

import { CardIcon } from './const/card-icon';
import {
	Availability,
	LaunchState,
	Severity,
	StatusAction,
	getStatusPresentation,
	resolveErrorState,
	resolveRefusalState,
	type AvailabilityParams,
} from './model/launch-state';
import { Backdrop } from './infrastructure/backdrop/backdrop';
import { PanelOutcome, RightPanel } from './infrastructure/right-panel/right-panel';
import { ScenarioLaunch } from './infrastructure/service/scenario-launch/scenario-launch';

import './ai-agents-section.css';

const STATUS_CLASS = 'biconnector-ai-agents-status';
const CARD_STATE_CLASS = 'biconnector-ai-agents-card-state';

const CHAT_URL = '/online/?IM_DIALOG=chat';

const Selector = Object.freeze({
	Card: '[data-role="card"]',
	CardIcon: '[data-role="card-icon"]',
	CardState: '[data-role="card-state"]',
	SectionStatus: '[data-role="section-status"]',
	SectionAlert: '[data-role="section-alert"]',
	SectionAction: '[data-role="section-action"]',
});

const ANALYTICS_CATEGORY = 'ai_agents';
const ANALYTICS_SECTION = 'ai_agents_section';
const ANALYTICS_EVENT = 'card_click';
const AnalyticsType = Object.freeze({
	Available: 'available',
	LowTariff: 'low_tariff',
});

const getMessage = (phraseId: string): string => {
	return Loc.getMessage(phraseId) as string;
};

type AnalyticsData = Parameters<typeof ApacheSupersetAnalytics.sendAnalytics>[2];

export type AiAgentsSectionParams = {
	containerId: string,
	cardIds: string[],
	availability: AvailabilityParams,
};

export class AiAgentsSection
{
	#container: HTMLElement;
	#availability: AvailabilityParams;
	#rightPanel: RightPanel;
	#backdrop: Backdrop;
	#launchService: ScenarioLaunch = new ScenarioLaunch();

	#cards: HTMLElement[] = [];
	#statusNode: HTMLElement | null = null;
	#alertNode: HTMLElement | null = null;
	#actionNode: HTMLElement | null = null;
	#pendingSlot: HTMLElement | null = null;

	#isLaunching: boolean = false;
	#lastCard: HTMLElement | null = null;

	constructor(container: HTMLElement, params: AiAgentsSectionParams, rightPanel: RightPanel)
	{
		this.#container = container;
		this.#availability = params.availability;
		this.#rightPanel = rightPanel;
		this.#statusNode = container.querySelector(Selector.SectionStatus);
		this.#alertNode = container.querySelector(Selector.SectionAlert);
		this.#actionNode = container.querySelector(Selector.SectionAction);
		this.#cards = [...container.querySelectorAll<HTMLElement>(Selector.Card)];

		this.#backdrop = new Backdrop(container);

		this.#renderIcons(params.cardIds);
		this.#backdrop.start();
		Event.bind(this.#container, 'click', this.#handleClick);
	}

	static init(
		params: AiAgentsSectionParams,
		rightPanel: RightPanel = new RightPanel(),
	): AiAgentsSection | null
	{
		const container = document.getElementById(params?.containerId ?? '');
		if (!Type.isElementNode(container) || !Type.isArrayFilled(params.cardIds))
		{
			return null;
		}

		return new AiAgentsSection(container, params, rightPanel);
	}

	#renderIcons(cardIds: string[]): void
	{
		const cards = new Map<string, HTMLElement>();
		this.#cards.forEach((card: HTMLElement): void => {
			cards.set(card.dataset.cardId ?? '', card);
		});

		cardIds.forEach((cardId: string): void => {
			const icon = CardIcon[cardId];
			const slot = cards.get(cardId)?.querySelector(Selector.CardIcon) ?? null;
			if (!Type.isStringFilled(icon) || !Type.isElementNode(slot))
			{
				return;
			}

			new Icon({ icon }).renderTo(slot);
		});
	}

	destroy(): void
	{
		Event.unbind(this.#container, 'click', this.#handleClick);

		this.#backdrop.destroy();
	}

	#handleClick = (event: MouseEvent): void => {
		const target = event.target as HTMLElement | null;
		const card = (target?.closest(Selector.Card) ?? null) as HTMLElement | null;
		if (!Type.isElementNode(card) || this.#isLaunching)
		{
			return;
		}

		const cardId = card.dataset.cardId ?? '';
		if (!Type.isStringFilled(cardId))
		{
			return;
		}

		// Track presses before local refusals, which send no request.
		this.#sendCardClick(cardId);

		void this.#launch(cardId, card);
	};

	async #launch(cardId: string, card: HTMLElement): Promise<void>
	{
		const refusal = resolveRefusalState(this.#availability.state);
		if (refusal !== null)
		{
			this.#showStatus(refusal, this.#availability.limitCode ?? '');

			return;
		}

		if (!this.#rightPanel.hasSurface())
		{
			this.#showStatus(LaunchState.LaunchNoSurface);

			return;
		}

		this.#startPending(card);

		try
		{
			this.#rightPanel.preload();

			const answer = await this.#launchService.launch(cardId);
			if (answer === null)
			{
				this.#showStatus(LaunchState.LaunchTimeout);

				return;
			}

			if (Type.isStringFilled(answer.errorCode) || answer.chatId <= 0)
			{
				this.#showStatus(resolveErrorState(answer.errorCode), answer.limitCode);

				return;
			}

			const outcome = await this.#rightPanel.show(answer.chatId);
			if (outcome !== PanelOutcome.Shown)
			{
				this.#showStatus(LaunchState.LaunchPanelFailed, '', answer.chatId);

				return;
			}

			// BitrixGPT handles errors after the chat opens.
			this.#showStatus(LaunchState.LaunchStarted);
		}
		catch
		{
			this.#showStatus(LaunchState.LaunchFailed);
		}
		finally
		{
			this.#stopPending();
		}
	}

	#startPending(card: HTMLElement): void
	{
		this.#isLaunching = true;
		this.#lastCard = card;
		this.#tellLaunching(card);

		this.#showStatus(LaunchState.LaunchStarting);

		const slot = card.querySelector(Selector.CardState);
		if (!Type.isElementNode(slot))
		{
			return;
		}

		Dom.append(
			Tag.render`
				<span class="${CARD_STATE_CLASS}" data-testid="${LaunchState.CardPending}">
					${TypographyText.render(getMessage('BICONNECTOR_AI_AGENTS_SECTION_CARD_PENDING'), {
						size: 'sm',
					})}
				</span>
			`,
			slot,
		);

		this.#pendingSlot = slot;
	}

	#stopPending(): void
	{
		this.#isLaunching = false;
		this.#tellLaunching(null);
		this.#dropStartingNotice();

		if (this.#pendingSlot === null)
		{
			return;
		}

		Dom.clean(this.#pendingSlot);
		this.#pendingSlot = null;
	}

	#dropStartingNotice(): void
	{
		const notice = this.#statusNode?.querySelector<HTMLElement>(
			`[data-testid="${LaunchState.LaunchStarting}"]`,
		) ?? null;
		if (notice !== null)
		{
			Dom.remove(notice);
		}
	}

	/** aria-disabled keeps the launching card focusable. */
	#tellLaunching(card: HTMLElement | null): void
	{
		this.#cards.forEach((item: HTMLElement): void => {
			Dom.attr(item, 'aria-disabled', card === null ? null : 'true');
			Dom.attr(item, 'aria-busy', item === card ? 'true' : null);
		});
	}

	#showStatus(state: string, limitCode: string = '', chatId: number = 0): void
	{
		const presentation = getStatusPresentation(state);
		if (presentation === null)
		{
			return;
		}

		const region = presentation.severity === Severity.Error
			? this.#alertNode ?? this.#statusNode
			: this.#statusNode;
		if (region === null)
		{
			return;
		}

		this.#clearStatus();

		const status: HTMLElement = Tag.render`
			<div class="${STATUS_CLASS}" data-testid="${state}">
				${TypographyText.render(getMessage(presentation.phraseId), {
					size: 'md',
					className: `${STATUS_CLASS}__text`,
				})}
			</div>
		`;

		Dom.append(status, region);

		this.#showAction(presentation.action, chatId, region);

		if (state === LaunchState.RefusalTariff && Type.isStringFilled(limitCode))
		{
			new FeaturePromoter({ code: limitCode }).show();
		}
	}

	#showAction(action: string, chatId: number, region: HTMLElement): void
	{
		const node = this.#renderAction(action, chatId);
		if (node === null)
		{
			return;
		}

		Dom.append(node, this.#actionNode ?? region);
	}

	#renderAction(action: string, chatId: number): HTMLElement | null
	{
		if (action === StatusAction.Retry)
		{
			return this.#renderRetry();
		}

		if (action === StatusAction.ChatLink && chatId > 0)
		{
			return Tag.render`
				<a
					class="${STATUS_CLASS}__link"
					data-testid="${StatusAction.ChatLink}"
					href="${CHAT_URL}${chatId}"
				>${getMessage('BICONNECTOR_AI_AGENTS_SECTION_LAUNCH_CHAT_LINK')}</a>
			`;
		}

		return null;
	}

	#renderRetry(): HTMLElement
	{
		const options: Partial<ButtonOptions> = {
			text: getMessage('BICONNECTOR_AI_AGENTS_SECTION_LAUNCH_RETRY'),
			style: AirButtonStyle.OUTLINE_ACCENT_1,
			size: ButtonSize.SMALL,
			useAirDesign: true,
			onclick: (): {} => {
				this.#retry();

				return {};
			},
		};

		const button = new Button(options as ButtonOptions);

		const node = button.render();
		Dom.attr(node, 'data-testid', StatusAction.Retry);

		return node;
	}

	#retry(): void
	{
		const card = this.#lastCard;
		if (card === null || this.#isLaunching)
		{
			return;
		}

		const cardId = card.dataset.cardId ?? '';
		if (!Type.isStringFilled(cardId))
		{
			return;
		}

		this.#sendCardClick(cardId);

		void this.#launch(cardId, card);
	}

	#clearStatus(): void
	{
		[this.#statusNode, this.#alertNode, this.#actionNode].forEach((region: HTMLElement | null): void => {
			if (region === null)
			{
				return;
			}

			this.#keepFocusOut(region);
			Dom.clean(region);
		});
	}

	/** Restore focus before removing the retry button. */
	#keepFocusOut(region: HTMLElement): void
	{
		if (!region.contains(document.activeElement))
		{
			return;
		}

		(this.#lastCard ?? region).focus();
	}

	#sendCardClick(cardId: string): void
	{
		const data = {
			c_section: ANALYTICS_SECTION,
			c_element: cardId,
			type: this.#availability.state === Availability.Tariff
				? AnalyticsType.LowTariff
				: AnalyticsType.Available,
		} as AnalyticsData;

		ApacheSupersetAnalytics.sendAnalytics(ANALYTICS_CATEGORY, ANALYTICS_EVENT, data);
	}
}
