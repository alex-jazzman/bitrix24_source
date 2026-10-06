import { Dom, Event, Loc, Tag, Type } from 'main.core';
import { EventEmitter, type BaseEvent } from 'main.core.events';
import { Button, ButtonIcon, AirButtonStyle } from 'ui.buttons';
import { Outline } from 'ui.icon-set.api.core';
import 'ui.design-tokens';
import 'ui.fonts.opensans';
import 'ui.icon-set.outline';

import { type LabelCounters, type LabelDto } from 'mail.label.core';

import { LabelMenuItem } from './item';
import { createSectionDivider } from './section-divider';
import { type LabelsMenuOptions } from './types';

import './style.css';

const PULL_COMMAND_COUNTERS_UPDATED = 'labelCountersUpdated';

export class LabelsMenu
{
	#container: HTMLElement;
	#onSelect: (labelId: number) => void;
	#onCreate: (() => void) | null;

	#labels: LabelDto[];
	#items: Map<number, LabelMenuItem> = new Map();
	#activeLabelId: number | null = null;

	#root: HTMLElement | null = null;
	#bodyElement: HTMLElement | null = null;

	constructor(options: LabelsMenuOptions)
	{
		this.#container = options.container;
		this.#labels = options.labels ?? [];
		this.#onSelect = options.onSelect;
		this.#onCreate = options.onCreate ?? null;

		EventEmitter.subscribe('onPullEvent-mail', this.#handlePullEvent);
	}

	render(): HTMLElement
	{
		if (this.#root)
		{
			return this.#root;
		}

		const root = Tag.render`
			<div class="mail-label-menu" data-testid="mail_label-menu">
				${this.#renderDivider()}
			</div>
		`;
		this.#root = root;

		this.#renderBody();

		Dom.append(root, this.#container);

		return root;
	}

	setLabels(labels: LabelDto[]): void
	{
		this.#labels = labels;
		this.#renderBody();
	}

	updateCounters(counters: LabelCounters): void
	{
		for (const [id, unread] of Object.entries(counters))
		{
			const labelId = Number(id);

			const item = this.#items.get(labelId);
			if (item)
			{
				item.setCount(unread);
			}

			const label = this.#labels.find((candidate) => candidate.id === labelId);
			if (label)
			{
				label.unread = unread;
			}
		}
	}

	setActive(labelId: number | null): void
	{
		this.#activeLabelId = labelId;
		for (const [id, item] of this.#items)
		{
			item.setActive(id === labelId);
		}
	}

	destroy(): void
	{
		EventEmitter.unsubscribe('onPullEvent-mail', this.#handlePullEvent);
		Dom.remove(this.#root);
		this.#root = null;
		this.#bodyElement = null;
		this.#items.clear();
	}

	#renderBody(): void
	{
		if (!this.#root)
		{
			return;
		}

		Dom.remove(this.#bodyElement);
		this.#bodyElement = null;
		this.#items.clear();

		this.#bodyElement = this.#labels.length > 0 ? this.#renderList() : this.#renderEmptyState();

		if (this.#bodyElement)
		{
			Dom.append(this.#bodyElement, this.#root);
		}
	}

	#renderList(): HTMLElement
	{
		const list = Tag.render`<ul class="ui-mail-left-directory-menu mail-label-menu__list" aria-label="${Loc.getMessage('MAIL_LABEL_MENU_TITLE') ?? ''}"></ul>`;

		for (const label of this.#labels)
		{
			const item = new LabelMenuItem(label, this.#onSelect);
			item.setActive(label.id === this.#activeLabelId);
			this.#items.set(label.id, item);
			Dom.append(item.getElement(), list);
		}

		return list;
	}

	#renderEmptyState(): HTMLElement | null
	{
		const onCreate = this.#onCreate;
		if (!onCreate)
		{
			return null;
		}

		const createButton = new Button({
			text: Loc.getMessage('MAIL_LABEL_MENU_CREATE') ?? '',
			useAirDesign: true,
			style: AirButtonStyle.FILLED_SUCCESS,
			icon: Outline.PLUS_M,
			collapsedIcon: ButtonIcon.ADD,
			wide: true,
			dataset: { testid: 'mail-label-menu-empty-create' },
		});

		const buttonNode = createButton.render();
		Event.bind(buttonNode, 'click', () => onCreate());

		return Tag.render`
			<div class="mail-label-menu__empty">
				${buttonNode}
			</div>
		`;
	}

	#renderDivider(): HTMLElement
	{
		return createSectionDivider();
	}

	#handlePullEvent = (event: BaseEvent): void => {
		const data = event.getData();
		const command = data?.[0];
		const params = data?.[1];

		if (command === PULL_COMMAND_COUNTERS_UPDATED && Type.isPlainObject(params) && Type.isPlainObject(params.counters))
		{
			this.updateCounters(params.counters as LabelCounters);
		}
	};
}
