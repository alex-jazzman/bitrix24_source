import { Tag, Text } from 'main.core';
import { Outline } from 'ui.icon-set.api.core';

import { Row } from './row';

/**
 * Lists keeps its own ordinary pages, so the tool is opened in a new tab and the project stays
 * in the tab the menu was opened from. The page is reached either by the link this row renders
 * or, when the menu shows Lists as a menu item, by the click handler below — either way the tab
 * is opened synchronously, while the user gesture still allows it.
 */
export class Lists extends Row
{
	getIcon(): string
	{
		return Outline.ACTION_REQUIRED;
	}

	getId(): string
	{
		return 'group_lists';
	}

	getLayout(): HTMLAnchorElement
	{
		return this.cache.remember('layout', () => {
			const layout: HTMLAnchorElement = Tag.render`
				<a
					data-testid="bx-socnet-feature-menu-content-row-feature-${this.getId()}"
					onclick="${this.handleClick.bind(this)}"
					class="socnet-feature-menu-row-feature__wrapper"
				>
					${this.getIconElement()}
					<div class="socnet-feature-menu-content-row-item__info-wrapper">
						<span class="socnet-feature-menu-content-row-item__title">
							${Text.encode(this.getTitle())}
						</span>
					</div>
					${this.getActionElement()}
				</a>
			`;

			// A row the server brought no url for is not a link: it leads nowhere and an empty
			// `href` would reload the project page instead.
			const url = this.getUrl();
			if (url)
			{
				layout.href = url;
				layout.target = '_blank';
				// The opened page keeps no handle on the tab of the project.
				layout.rel = 'noopener';
			}

			return layout;
		});
	}

	handleClick(event?: Event): void
	{
		this.emit('click');

		if (this.isLocked())
		{
			// A click handler is synchronous, so a rejection of the asynchronous window has
			// nowhere to go: showRestriction() has already reported the failure to the console,
			// and an unhandled rejection would only report it a second time.
			void this.showRestriction(this.getRestrictionCode()).catch(() => {});
			event?.stopPropagation();
			event?.preventDefault();

			return;
		}

		const url = this.getUrl();
		if (!url)
		{
			return;
		}

		this.trackOpen();

		// The link of getLayout() is followed by the browser itself: opening the page here on
		// top of it would open the tool twice.
		if (this.#isOwnLinkClick(event))
		{
			event.stopPropagation();

			return;
		}

		// A menu item is not the link — it calls the handler directly, so the new tab is opened
		// here. The default is prevented afterwards, the way the base row does it, so the click
		// leaves the menu container alone.
		window.open(url, '_blank', 'noopener');

		event?.stopPropagation();
		event?.preventDefault();
	}

	#isOwnLinkClick(event: ?Event): boolean
	{
		const layout = this.cache.get('layout', null);

		return (
			layout instanceof HTMLAnchorElement
			&& layout.hasAttribute('href')
			&& event?.currentTarget === layout
		);
	}
}
