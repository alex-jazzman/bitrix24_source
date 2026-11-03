import { EventEmitter } from 'main.core.events';
import { Popup } from 'main.popup';
import { Event, Tag, Dom, Loc, Type } from 'main.core';
import { Searcher } from './searcher';
import { Loader } from 'main.loader';

export type renderOptions = {
	searcher: Searcher,
	inputNode: HTMLElement,
	iconContainer: HTMLElement,
	liveStatusNode?: HTMLElement,
	liveAlertNode?: HTMLElement,
	timeout: number
}

export class Renderer
{
	#searcher: Searcher;
	#inputNode: HTMLElement;
	#iconContainer: HTMLElement;
	#clearButton: ?HTMLButtonElement;
	#popup: Popup;
	#timeoutId: number;
	#timeout: number;
	#liveStatusNode: ?HTMLElement;
	#liveAlertNode: ?HTMLElement;
	#lastRenderedRequestId: number = 0;
	#restoreInputFocusAfterPopupClose: boolean = false;

	static EXTERNAL_LINK = 'EXTERNAL_LINKS';

	constructor(options: renderOptions)
	{
		this.#searcher = options.searcher;
		this.#inputNode = options.inputNode;
		this.#iconContainer = options.iconContainer;
		this.#clearButton = this.#iconContainer.querySelector('#intranet-settings-icon-delete');
		this.#liveStatusNode = Type.isDomNode(options.liveStatusNode) ? options.liveStatusNode : null;
		this.#liveAlertNode = Type.isDomNode(options.liveAlertNode) ? options.liveAlertNode : null;
		this.#timeout = options.timeout;
		this.#inputNode.setAttribute('aria-label', Loc.getMessage('INTRANET_SETTINGS_SEARCH_PLACEHOLDER'));

		this.#popup = new Popup('settings-search-popup', this.#inputNode, {
			ariaLabel: Loc.getMessage('INTRANET_SETTINGS_SEARCH_PLACEHOLDER'),
			focusTrap: false,
			closeByEsc: true,
			angle: false,
			overlay: false,
			width: 332,
			offsetTop: 4,
			background: '#fff',
			contentBackground: '#fff',
			contentPadding: 0,
			autoHide: true,
			borderRadius: 6,
			autoHideHandler: (event) => {
				return !this.#inputNode.contains(event.target) && !this.#clearButton?.contains(event.target);
			},
			events: {
				onAfterShow: () => {
					this.#inputNode.setAttribute('aria-expanded', 'true');
				},
				onAfterClose: () => {
					this.#resetActiveResult();
					this.#inputNode.setAttribute('aria-expanded', 'false');

					if (this.#restoreInputFocusAfterPopupClose)
					{
						this.#restoreInputFocusAfterPopupClose = false;
						this.#focusInput();
					}
				},
			},
		});
		const popupContainer = this.#popup.getPopupContainer();
		popupContainer.removeAttribute('aria-modal');
		Dom.attr(popupContainer, {
			role: 'listbox',
			'data-testid': 'intranet-settings-search-popup',
		});
		this.#popup.setContent(this.renderContent());
		this.#syncClearButton();

		Event.bind(this.#inputNode, 'click', () => {
			this.#activateInput();
		});

		EventEmitter.subscribe('BX.Intranet.Settings:searchChangeState', (event) => {
			const searchState = event.data;
			if (!this.#isActualSearchState(searchState))
			{
				return;
			}

			this.#lastRenderedRequestId = searchState.requestId;
			this.#resetActiveResult();
			this.#popup.setContent(this.renderContent(searchState.state));
			this.#syncLiveSearchState(searchState);
		});

		if (this.#clearButton)
		{
			Event.bind(this.#clearButton, 'click', () => {
				clearTimeout(this.#timeoutId);
				this.#inputNode.value = '';
				this.#searcher.reset();
				this.#closePopupAndFocusInput();
				this.#syncClearButton();
			});
		}

		Event.bind(this.#inputNode, 'keydown', (event) => {
			if (event.key === 'Enter')
			{
				event.preventDefault();

				if (this.#inputNode.hasAttribute('readonly'))
				{
					this.#activateInput();
				}
				else if (!this.#activateActiveResult())
				{
					this.#activateInput();
				}

				return;
			}

			if (event.key === 'ArrowDown' || event.key === 'ArrowUp')
			{
				if (this.#inputNode.hasAttribute('readonly'))
				{
					return;
				}

				if (!this.#popup.isShown())
				{
					this.#popup.show();
				}

				if (this.#moveActiveResult(event.key === 'ArrowDown' ? 1 : -1))
				{
					event.preventDefault();
				}

				return;
			}

			if (event.key === 'Escape')
			{
				this.#handleEscape(event);
			}
		});

		Event.bind(this.#inputNode, 'input', () => {
			this.#resetActiveResult();
			this.#syncClearButton();

			if (!this.#popup.isShown() && this.getQuery().length > 0)
			{
				this.#popup.show();
			}

			this.find();
		});
	}

	#handleEscape(event: KeyboardEvent): void
	{
		if (!this.#popup.isShown())
		{
			return;
		}

		event.preventDefault();
		event.stopPropagation();
		this.#closePopupAndFocusInput();
	}

	#isActualSearchState(searchState: Object): boolean
	{
		return Type.isNumber(searchState.requestId) && searchState.requestId >= this.#lastRenderedRequestId;
	}

	updateScroll(element): void
	{
		const rect = element.getBoundingClientRect();
		const container = this.#popup.getContentContainer().firstElementChild;
		const relTop = rect.top - container.getBoundingClientRect().top;
		const relBot = rect.bottom - container.getBoundingClientRect().bottom;
		const padding = 10;
		if (relTop < 0 && relBot <= 0)
		{
			container.scrollTo(0, relTop + container.scrollTop - padding);
		}
		else if (relTop >= 0 && relBot > 0)
		{
			container.scrollTo(0, relBot + container.scrollTop + padding);
		}
	}

	#syncClearButton(): void
	{
		const hasQuery = this.getQuery().length > 0;

		if (hasQuery)
		{
			Dom.addClass(this.#iconContainer, 'main-ui-show');
		}
		else
		{
			Dom.removeClass(this.#iconContainer, 'main-ui-show');
		}

		if (this.#clearButton)
		{
			this.#clearButton.hidden = !hasQuery;
		}
	}

	#getResultLinks(): Array<HTMLElement>
	{
		return [...this.#popup.getContentContainer().querySelectorAll('.search-title-top-item-link[href]')];
	}

	#getResultOptions(): Array<HTMLElement>
	{
		return [...this.#popup.getContentContainer().querySelectorAll('.search-title-top-item-link[role="option"][href]')];
	}

	#focusInput(): void
	{
		this.#inputNode.focus({ preventScroll: true });
	}

	#activateInput(): void
	{
		this.#inputNode.removeAttribute('readonly');

		if (!this.#popup.isShown())
		{
			this.#popup.show();
		}
	}

	#closePopupAndFocusInput(): void
	{
		this.#resetActiveResult();
		this.#inputNode.setAttribute('readonly', '');

		if (!this.#popup.isShown())
		{
			this.#inputNode.setAttribute('aria-expanded', 'false');
			this.#focusInput();

			return;
		}

		this.#restoreInputFocusAfterPopupClose = true;
		this.#popup.close();
	}

	#moveActiveResult(direction: number): boolean
	{
		const options = this.#getResultOptions();
		if (options.length === 0)
		{
			return false;
		}

		const activeId = this.#inputNode.getAttribute('aria-activedescendant');
		const currentIndex = options.findIndex((option) => option.id === activeId);
		const nextIndex = currentIndex === -1
			? (direction > 0 ? 0 : options.length - 1)
			: currentIndex + direction;
		const nextOption = options[nextIndex];

		if (nextOption)
		{
			this.#setActiveResult(nextOption);
		}

		return true;
	}

	#setActiveResult(option: HTMLElement): void
	{
		this.#resetActiveResult();
		option.setAttribute('aria-selected', 'true');
		Dom.addClass(option, 'active');
		this.#inputNode.setAttribute('aria-activedescendant', option.id);
		this.updateScroll(option);
	}

	#resetActiveResult(): void
	{
		this.#getResultOptions().forEach((option) => {
			option.setAttribute('aria-selected', 'false');
		});
		this.#getResultLinks().forEach((link) => {
			Dom.removeClass(link, 'active');
		});
		this.#inputNode.removeAttribute('aria-activedescendant');
	}

	#activateActiveResult(): boolean
	{
		const activeId = this.#inputNode.getAttribute('aria-activedescendant');
		const activeOption = this.#getResultOptions().find((option) => option.id === activeId);

		if (!(activeOption instanceof HTMLElement))
		{
			return false;
		}

		activeOption.click();

		return true;
	}

	renderWait(): HTMLElement
	{
		const loaderContainer = Tag.render`<span class="title-search-waiter-img"></span>`;
		const loader = new Loader({
			target: loaderContainer,
			size: 20,
			mode: 'inline',
		});
		loader.show();

		return Tag.render`
			<div class="title-search-waiter">
				${loaderContainer}
				<span class="title-search-waiter-text">${Loc.getMessage('INTRANET_SETTINGS_TITLE_SEARCHING')}</span>
			</div>
		`;
	}

	find(): void
	{
		clearTimeout(this.#timeoutId);
		const searchQuery = this.getQuery();
		this.#searcher.invalidate(searchQuery);

		if (searchQuery.length < this.#searcher.getMinSymbol())
		{
			return;
		}

		this.#timeoutId = setTimeout(() => {
			this.#searcher.find(String(searchQuery));
		}, this.#timeout);
	}

	getQuery(): string
	{
		return BX.util.trim(this.#inputNode.value);
	}

	createLinkOption(option): HTMLElement
	{
		const testId = `intranet-settings-search-external-${this.#normalizeTestId(option.code || option.url || String(option.index))}`;
		const optionId = `intranet-settings-search-external-${option.groupIndex}-${option.index}-option`;

		return this.#createExternalLink(
			option.url,
			option.title,
			testId,
			optionId,
		);
	}

	createBtnOption(page: string, option): HTMLElement
	{
		const testId = [
			'intranet-settings-search-result',
			this.#normalizeTestId(page),
			this.#normalizeTestId(option.code),
			this.#normalizeTestId(String(option.index)),
		].join('-');

		return Dom.create('a', {
			props: {
				className: 'search-title-top-item-link',
			},
			events: {
				click: (event) => {
					if (!this.#isPrimaryUnmodifiedClick(event))
					{
						return;
					}

					event.preventDefault();
					this.#popup.close();
					EventEmitter.emit(
						EventEmitter.GLOBAL_TARGET,
						'BX.Intranet.SettingsNavigation:onMove',
						{
							page,
							fieldName: option.code,
						},
					);
				},
			},
			attrs: {
				id: `${testId}-option`,
				role: 'option',
				'aria-selected': 'false',
				tabindex: '-1',
				title: option.title,
				href: this.#createInternalHref(page, option.code),
				'data-testid': testId,
			},
			children: [
				this.#createResultText(option.title),
			],
		});
	}

	renderOption(page: string, option): HTMLElement
	{
		if (page === Renderer.EXTERNAL_LINK)
		{
			return this.#createOptionItem(this.createLinkOption(option));
		}

		return this.#createOptionItem(this.createBtnOption(page, option));
	}

	#createOptionItem(link: HTMLElement): HTMLElement
	{
		return Dom.create('li', {
			props: {
				className: 'search-title-top-item search-title-top-item-js',
			},
			attrs: {
				role: 'presentation',
			},
			children: [
				link,
			],
		});
	}

	renderGroup(group, groupIndex: number): HTMLElement
	{
		const optionsContainer = Dom.create('ul', {
			props: {
				className: 'search-title-top-list search-title-top-list-js',
			},
			attrs: {
				role: 'presentation',
			},
		});

		group.options.forEach((option, index) => {
			Dom.append(this.renderOption(group.page, { ...option, groupIndex, index }), optionsContainer);
		});

		return Dom.create('div', {
			props: {
				className: 'search-title-top-block search-title-top-block-sonetgroups',
			},
			children: [
				Dom.create('div', {
					props: {
						className: 'search-title-top-subtitle',
					},
					children: [
						Dom.create('div', {
							props: {
								className: 'search-title-top-subtitle-text',
							},
							text: group.title,
						}),
					],
				}),
				Dom.create('div', {
					props: {
						className: 'search-title-top-list-wrap',
					},
					children: [
						optionsContainer,
					],
				}),
			],
		});
	}

	#syncLiveSearchState(searchState: Object): void
	{
		if (searchState.reset === true)
		{
			this.#setLiveText(this.#liveStatusNode, '');
			this.#setLiveText(this.#liveAlertNode, '');

			return;
		}

		if (searchState.state === Searcher.STATE_WAIT)
		{
			this.#setLiveText(this.#liveAlertNode, '');
			this.#setLiveText(this.#liveStatusNode, Loc.getMessage('INTRANET_SETTINGS_SEARCH_LOADING'));

			return;
		}

		if (searchState.state === Searcher.STATE_NOT_FOUND)
		{
			this.#setLiveText(this.#liveAlertNode, '');
			this.#setLiveText(this.#liveStatusNode, Loc.getMessage('INTRANET_SETTINGS_SEARCH_NOT_FOUND'));

			return;
		}

		if (searchState.state === Searcher.STATE_ERROR)
		{
			this.#setLiveText(this.#liveStatusNode, '');
			this.#setLiveText(this.#liveAlertNode, Loc.getMessage('INTRANET_SETTINGS_SEARCH_ERROR'));

			return;
		}

		this.#setLiveText(this.#liveAlertNode, '');
		this.#setLiveText(
			this.#liveStatusNode,
			Loc.getMessage(
				'INTRANET_SETTINGS_SEARCH_RESULTS_COUNT',
				{ '#COUNT#': searchState.resultCount },
			),
		);
	}

	#setLiveText(node: ?HTMLElement, text: ?string): void
	{
		if (!Type.isDomNode(node) || node.textContent === (text || ''))
		{
			return;
		}

		const liveNode = node;
		liveNode.textContent = text || '';
	}

	renderContent(state: 'wait'|'ready'|'not_found'|'error' = 'ready'): HTMLElement
	{
		const optionsContainer = Tag.render`<div class="search-title-top-result"></div>`;

		switch (state)
		{
			case 'ready':
				Dom.append(this.renderSearchResult(this.#searcher.getResult()), optionsContainer);
				break;
			case 'wait':
				Dom.append(this.renderWait(), optionsContainer);
				break;
			case 'not_found':
				Dom.append(this.renderNotFound(), optionsContainer);
				break;
			case 'error':
				Dom.append(this.renderSearchError(), optionsContainer);
				break;
			default:
				break;
		}
		Dom.append(this.renderOthers(this.#searcher.getOthers()), optionsContainer);

		return optionsContainer;
	}

	renderSearchError(): HTMLElement
	{
		return Tag.render`
			<div class="title-search-waiter">
				<span class="title-search-waiter-text">${Loc.getMessage('INTRANET_SETTINGS_SEARCH_ERROR')}</span>
			</div>
		`;
	}

	renderNotFound(): HTMLElement
	{
		return Tag.render`
			<div class="title-search-waiter">
				<span class="title-search-waiter-text">${Loc.getMessage('INTRANET_SETTINGS_SEARCH_NOT_FOUND')}</span>
			</div>
		`;
	}

	renderSearchResult(result): HTMLElement
	{
		const container = Tag.render`<div class="search-title-content-result"></div>`;
		result.forEach((item, index) => {
			Dom.append(this.renderGroup(item, index), container);
		});

		return container;
	}

	renderOthers(links): HTMLElement
	{
		const wrapper = Dom.create('ul', {
			props: {
				className: 'search-title-top-list search-title-top-list-js',
			},
			attrs: {
				role: 'presentation',
			},
		});
		const other = Dom.create('div', {
			props: {
				className: 'search-title-top-block search-title-top-block-tools',
			},
			children: [
				Dom.create('div', {
					props: {
						className: 'search-title-top-subtitle',
					},
					children: [
						Dom.create('div', {
							props: {
								className: 'search-title-top-subtitle-text',
							},
							text: Loc.getMessage('INTRANET_SETTINGS_TITLE_SEARCH_IN'),
						}),
					],
				}),
				Dom.create('div', {
					props: {
						className: 'search-title-top-list-height-wrap',
					},
					children: [
						Dom.create('div', {
							props: {
								className: 'search-title-top-list-wrap',
							},
							children: [
								wrapper,
							],
						}),
					],
				}),
			],
		});

		links.forEach((link, index) => {
			Dom.append(this.renderOtherLink(link, index), wrapper);
		});

		return other;
	}

	renderOtherLink(link, index: number): HTMLElement
	{
		const linkTag = this.#createExternalLink(
			link.link,
			link.title,
			`intranet-settings-search-other-${index}`,
		);

		return this.#createOptionItem(linkTag);
	}

	#createResultText(title: string): HTMLElement
	{
		return Dom.create('span', {
			props: {
				className: 'search-title-top-item-text',
			},
			children: [
				Dom.create('span', {
					text: title,
				}),
			],
		});
	}

	#createExternalLink(url: string, title: string, testId: string, optionId: ?string = null): HTMLElement
	{
		const href = this.#getSafeHref(url);
		const props = {
			className: 'search-title-top-item-link',
		};
		const attrs = {
			title,
			'data-testid': testId,
		};
		const children = [
			this.#createResultText(title),
		];

		if (!href)
		{
			return Dom.create('span', {
				props,
				attrs,
				children,
			});
		}

		return Dom.create('a', {
			props,
			attrs: {
				id: optionId || `${attrs['data-testid']}-option`,
				role: 'option',
				'aria-selected': 'false',
				tabindex: '-1',
				title: attrs.title,
				'data-testid': attrs['data-testid'],
				href,
				target: '_blank',
				rel: 'noopener',
			},
			children,
		});
	}

	#createInternalHref(page: string, optionCode: string): string
	{
		const params = new URLSearchParams();
		params.set('page', page);

		if (Type.isStringFilled(optionCode))
		{
			params.set('option', optionCode);
		}

		return `?${params.toString()}`;
	}

	#getSafeHref(url: string): ?string
	{
		if (!Type.isStringFilled(url))
		{
			return null;
		}

		const value = url.trim();

		if (this.#hasControlCharacters(value))
		{
			return null;
		}

		try
		{
			const parsedUrl = new URL(value, window.location.origin);

			if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:')
			{
				return null;
			}
		}
		catch
		{
			return null;
		}

		return value;
	}

	#isPrimaryUnmodifiedClick(event: MouseEvent): boolean
	{
		return event.button === 0
			&& !event.altKey
			&& !event.ctrlKey
			&& !event.metaKey
			&& !event.shiftKey
		;
	}

	#normalizeTestId(value: string): string
	{
		if (!Type.isStringFilled(value))
		{
			return 'item';
		}

		return value.toLowerCase().replaceAll(/[^\d_a-z-]+/g, '-').replaceAll(/^-+|-+$/g, '') || 'item';
	}

	#hasControlCharacters(value: string): boolean
	{
		for (const char of value)
		{
			const charCode = char.codePointAt(0);
			if (charCode < 32 || charCode === 127)
			{
				return true;
			}
		}

		return false;
	}
}
