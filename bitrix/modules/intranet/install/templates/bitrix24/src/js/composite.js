import { Type, Tag, Dom, ajax as Ajax } from 'main.core';
import { EventEmitter, type BaseEvent } from 'main.core.events';
import { MemoryCache, type BaseCache } from 'main.core.cache';
import { PULL } from 'pull.client';
import { getBackUrl } from './helpers';

export class Composite
{
	#refs: BaseCache<HTMLElement> = new MemoryCache();

	constructor()
	{
		if (this.isEnabled())
		{
			this.#bindEvents();
		}
	}

	isEnabled(): boolean
	{
		return !Type.isUndefined(window.frameRequestStart);
	}

	isReady(): boolean
	{
		return window.BX?.frameCache?.frameDataInserted === true || !Type.isUndefined(window.frameRequestFail);
	}

	showLoader(): void
	{
		const page = window.location.pathname;
		if (page === '/stream/' || page === '/stream/index.php' || page === '/index.php')
		{
			this.#showLoader('stream');
		}
		else
		{
			setTimeout(() => {
				this.#showLoader();
			}, 500);
		}
	}

	#showLoader(page: string = null): void
	{
		if (this.isReady())
		{
			return;
		}

		const skeleton = this.#getPageSkeleton(page);
		const container = this.getStubContainer();
		const stub = skeleton ?? this.getLoaderContainer();
		if (!container || stub.parentNode)
		{
			return;
		}

		Dom.append(stub, container);
	}

	#getPageSkeleton(page: string): HTMLElement | null
	{
		const map = {
			stream: () => this.getLiveFeedSkeleton(),
		};

		if (map[page])
		{
			return map[page]();
		}

		return null;
	}

	getStubContainer(): HTMLElement | null
	{
		return document.querySelector('#page-area');
	}

	getLoaderContainer(): HTMLElement
	{
		return this.#refs.remember('loader', () => {
			return Tag.render`
				<div class="composite-skeleton-container">
					<div class="composite-loader-container">
						<svg class="composite-loader-circular" viewBox="25 25 50 50">
							<circle class="composite-loader-path" cx="50" cy="50" r="20" fill="none" stroke-miterlimit="10" />
						</svg>
					</div>
				</div>
			`;
		});
	}

	#bindEvents(): void
	{
		EventEmitter.subscribe('onFrameDataRequestFail', () => {
			console.error('Composite ajax request failed');
			top.location = `/auth/?backurl=${encodeURIComponent(getBackUrl())}`;
		});

		EventEmitter.subscribe('onAjaxFailure', (event: BaseEvent) => {
			const [reason, status] = event.getCompatData();
			const redirectUrl = `/auth/?backurl=${getBackUrl()}`;
			if (this.isEnabled() && (reason === 'auth' || (reason === 'status' && status === 401)))
			{
				console.error('Auth ajax request failed', reason, status);
				top.location = redirectUrl;
			}
		});

		if (PULL)
		{
			PULL.subscribe({
				moduleId: 'main',
				command: 'composite-cache-up',
				callback: () => {
					setTimeout(() => {
						const value = BX.localStorage.get('ajax-composite-cache-up-lock');
						if (!value)
						{
							BX.localStorage.set('ajax-composite-cache-up-lock', 'EXECUTE', 2);
							Ajax({
								url: '/blank.php',
								method: 'GET',
								processData: false,
								skipBxHeader: true,
								emulateOnload: false,
							});
						}
					}, Math.floor(Math.random() * 500));
				},
			});
		}
	}

	getLiveFeedSkeleton(): HTMLElement
	{
		return this.#refs.remember('feed-skeleton', () => {
			return Tag.render`
				<div class="page top-menu-mode start-page no-background no-all-paddings no-page-header">
					<div class="page__workarea">
						<div class="page__sidebar">${this.getLiveFeedSidebar()}</div>
						<main class="page__workarea-content">${this.getLiveFeedWorkArea()}</main>
					</div>
				</div>
			`;
		});
	}

	getLiveFeedSidebar(): HTMLElement
	{
		return this.#refs.remember('feed-sidebar', () => {
			return Tag.render`
				<div class="skeleton__white-bg-element skeleton__sidebar skeleton__intranet-ustat">
					<div class="skeleton__graph-circle"></div>
					<div class="skeleton__graph-right">
						<div class="skeleton__graph-right_top">
							<div class="skeleton__graph-right_top-circle --first"></div>
							<div class="skeleton__graph-right_top-circle"></div>
							<div class="skeleton__graph-right_top-circle"></div>
							<div class="skeleton__graph-right_top-circle"></div>
							<div class="skeleton__graph-right_top-circle"></div>
							<div class="skeleton__graph-right_top-circle"></div>
							<div class="skeleton__graph-right_top-circle"></div>
						</div>
						<div class="skeleton__graph-right_bottom">
							<div class="skeleton__graph-right_bottom-line"></div>
							<div class="skeleton__graph-right_bottom-line"></div>
						</div>
					</div>
				</div>
				
				<div class="skeleton__white-bg-element skeleton__sidebar">
					<div class="skeleton__sidebar-header">
						<div class="skeleton__sidebar-header_line"></div>
						<div class="skeleton__sidebar-header_circle"></div>
					</div>
					<div class="skeleton__tasks-row">
						<div class="skeleton__tasks-row_line"></div>
						<div class="skeleton__tasks-row_short-line"></div>
						<div class="skeleton__tasks-row_circle"></div>
					</div>
					<div class="skeleton__tasks-row">
						<div class="skeleton__tasks-row_line"></div>
						<div class="skeleton__tasks-row_short-line"></div>
						<div class="skeleton__tasks-row_circle"></div>
					</div>
					<div class="skeleton__tasks-row">
						<div class="skeleton__tasks-row_line"></div>
						<div class="skeleton__tasks-row_short-line"></div>
						<div class="skeleton__tasks-row_circle"></div>
					</div>
					<div class="skeleton__tasks-row">
						<div class="skeleton__tasks-row_line"></div>
						<div class="skeleton__tasks-row_short-line"></div>
						<div class="skeleton__tasks-row_circle"></div>
					</div>
				</div>
				<div class="skeleton__white-bg-element skeleton__sidebar">
					<div class="skeleton__sidebar-header">
						<div class="skeleton__sidebar-header_line"></div>
					</div>
					<div class="skeleton__birthdays-row">
						<div class="skeleton__birthdays-circle"></div>
						<div class="skeleton__birthdays-info">
							<div class="skeleton__birthdays-name"></div>
							<div class="skeleton__birthdays-date"></div>
						</div>
					</div>
					<div class="skeleton__birthdays-row">
						<div class="skeleton__birthdays-circle"></div>
						<div class="skeleton__birthdays-info">
							<div class="skeleton__birthdays-name"></div>
							<div class="skeleton__birthdays-date"></div>
						</div>
					</div>
					<div class="skeleton__birthdays-row">
						<div class="skeleton__birthdays-circle"></div>
						<div class="skeleton__birthdays-info">
							<div class="skeleton__birthdays-name"></div>
							<div class="skeleton__birthdays-date"></div>
						</div>
					</div>
					<div class="skeleton__birthdays-row">
						<div class="skeleton__birthdays-circle"></div>
						<div class="skeleton__birthdays-info">
							<div class="skeleton__birthdays-name"></div>
							<div class="skeleton__birthdays-date"></div>
						</div>
					</div>
				</div>
				<div class="skeleton__white-bg-element skeleton__sidebar">
					<div class="skeleton__sidebar-header">
						<div class="skeleton__sidebar-header_line"></div>
					</div>
					<div class="skeleton__birthdays-row">
						<div class="skeleton__birthdays-circle"></div>
						<div class="skeleton__birthdays-info">
							<div class="skeleton__birthdays-name"></div>
							<div class="skeleton__birthdays-date"></div>
						</div>
					</div>
					<div class="skeleton__birthdays-row">
						<div class="skeleton__birthdays-circle"></div>
						<div class="skeleton__birthdays-info">
							<div class="skeleton__birthdays-name"></div>
							<div class="skeleton__birthdays-date"></div>
						</div>
					</div>
					<div class="skeleton__birthdays-row">
						<div class="skeleton__birthdays-circle"></div>
						<div class="skeleton__birthdays-info">
							<div class="skeleton__birthdays-name"></div>
							<div class="skeleton__birthdays-date"></div>
						</div>
					</div>
					<div class="skeleton__birthdays-row">
						<div class="skeleton__birthdays-circle"></div>
						<div class="skeleton__birthdays-info">
							<div class="skeleton__birthdays-name"></div>
							<div class="skeleton__birthdays-date"></div>
						</div>
					</div>
				</div>
			`;
		});
	}

	getLiveFeedWorkArea(): HTMLElement
	{
		return this.#refs.remember('feed-work-area', () => {
			return Tag.render`
				<div class="skeleton__white-bg-element skeleton__feed-wrap">
					<div class="skeleton__feed-wrap_header">
						<div class="skeleton__feed-wrap_header-link --long"></div>
						<div class="skeleton__feed-wrap_header-link --one"></div>
						<div class="skeleton__feed-wrap_header-link --two"></div>
						<div class="skeleton__feed-wrap_header-link --one"></div>
						<div class="skeleton__feed-wrap_header-link --two"></div>
					</div>
					<div class="skeleton__feed-wrap_header-content">
						<div class="skeleton__feed-wrap_header-text"></div>
					</div>
				</div>
				<div class="skeleton__title-block">
					<div class="skeleton__title-block_text"></div>
				</div>
				<div class="skeleton__white-bg-element skeleton__feed-item">
					<div class="skeleton__feed-item_user-icon"></div>
					<div class="skeleton__feed-item_content">
						<div class="skeleton__feed-item_main">
							<div class="skeleton__feed-item_text --name"></div>
							<div class="skeleton__feed-item_date"></div>
							<div class="skeleton__feed-item_text"></div>
							<div class="skeleton__feed-item_text"></div>
							<div class="skeleton__feed-item_text"></div>
							<div class="skeleton__feed-item_text"></div>
							<div class="skeleton__feed-item_text --short"></div>
						</div>
						<div class="skeleton__feed-item_nav">
							<div class="skeleton__feed-item_nav-line --one"></div>
							<div class="skeleton__feed-item_nav-line --two"></div>
							<div class="skeleton__feed-item_nav-line --three"></div>
							<div class="skeleton__feed-item_nav-line --four"></div>
						</div>
						<div class="skeleton__feed-item_like">
							<div class="skeleton__feed-item_like-icon"></div>
							<div class="skeleton__feed-item_like-name"></div>
						</div>
						<div class="skeleton__feed-item_comment">
							<div class="skeleton__feed-item_comment-icon"></div>
							<div class="skeleton__feed-item_comment-block">
								<div class="skeleton__feed-item_comment-text"></div>
							</div>
						</div>
					</div>
				</div>
				<div class="skeleton__white-bg-element skeleton__feed-item">
					<div class="skeleton__feed-item_user-icon"></div>
					<div class="skeleton__feed-item_content">
						<div class="skeleton__feed-item_main">
							<div class="skeleton__feed-item_text --name"></div>
							<div class="skeleton__feed-item_date"></div>
							<div class="skeleton__feed-item_text"></div>
							<div class="skeleton__feed-item_text"></div>
							<div class="skeleton__feed-item_text"></div>
							<div class="skeleton__feed-item_text"></div>
							<div class="skeleton__feed-item_text --short"></div>
						</div>
						<div class="skeleton__feed-item_nav">
							<div class="skeleton__feed-item_nav-line --one"></div>
							<div class="skeleton__feed-item_nav-line --two"></div>
							<div class="skeleton__feed-item_nav-line --three"></div>
							<div class="skeleton__feed-item_nav-line --four"></div>
						</div>
						<div class="skeleton__feed-item_like">
							<div class="skeleton__feed-item_like-icon"></div>
							<div class="skeleton__feed-item_like-name"></div>
						</div>
						<div class="skeleton__feed-item_comment">
							<div class="skeleton__feed-item_comment-icon"></div>
							<div class="skeleton__feed-item_comment-block">
								<div class="skeleton__feed-item_comment-text"></div>
							</div>
						</div>
					</div>
				</div>
				<div class="skeleton__white-bg-element skeleton__feed-item">
					<div class="skeleton__feed-item_user-icon"></div>
					<div class="skeleton__feed-item_content">
						<div class="skeleton__feed-item_main">
							<div class="skeleton__feed-item_text --name"></div>
							<div class="skeleton__feed-item_date"></div>
							<div class="skeleton__feed-item_text"></div>
							<div class="skeleton__feed-item_text"></div>
							<div class="skeleton__feed-item_text"></div>
							<div class="skeleton__feed-item_text"></div>
							<div class="skeleton__feed-item_text --short"></div>
						</div>
						<div class="skeleton__feed-item_nav">
							<div class="skeleton__feed-item_nav-line --one"></div>
							<div class="skeleton__feed-item_nav-line --two"></div>
							<div class="skeleton__feed-item_nav-line --three"></div>
							<div class="skeleton__feed-item_nav-line --four"></div>
						</div>
						<div class="skeleton__feed-item_like">
							<div class="skeleton__feed-item_like-icon"></div>
							<div class="skeleton__feed-item_like-name"></div>
						</div>
						<div class="skeleton__feed-item_comment">
							<div class="skeleton__feed-item_comment-icon"></div>
							<div class="skeleton__feed-item_comment-block">
								<div class="skeleton__feed-item_comment-text"></div>
							</div>
						</div>
					</div>
				</div>
			`;
		});
	}
}
