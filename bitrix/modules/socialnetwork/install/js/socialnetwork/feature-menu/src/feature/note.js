import { ajax, Dom } from 'main.core';
import { SidePanel } from 'main.sidepanel';
import { Outline } from 'ui.icon-set.api.core';

import { NavigationMode, type NavigationModeType } from './feature';
import { Row } from './row';

// socialnetwork.collab.Note.resolveSection: every field of the section may come back empty,
// and `collectionId` is a part of the answer the row itself does not need.
type SectionResponse = {
	data?: ?{
		url?: ?string,
		collectionId?: ?number,
		restriction?: ?string,
	},
};

export class Note extends Row
{
	getIcon(): string
	{
		if (this.isLocked())
		{
			return Outline.LOCK_L;
		}

		return Outline.KNOWLEDGE_BASE;
	}

	getId(): string
	{
		return 'note';
	}

	getNavigationMode(): NavigationModeType
	{
		return NavigationMode.SIDE_PANEL;
	}

	handleClick(event?: Event): void
	{
		// Locked (tariff) — keep the base upsell behaviour (restriction slider).
		if (this.isLocked())
		{
			super.handleClick(event);

			return;
		}

		this.emit('click');

		event?.stopPropagation();
		event?.preventDefault();

		// Lazy provisioning: the collab knowledge base is created on the FIRST click,
		// not at collab creation. The server resolves (and provisions on demand) the
		// section URL, which is then opened in a side panel.
		void this.#openSection();
	}

	async #openSection(): Promise<void>
	{
		const projectId = this.params.projectId;
		if (!projectId)
		{
			return;
		}

		// First click may lazily create the collection on the server — show a spinner
		// in the row and keep the menu open until the section URL is resolved.
		this.#setLoading(true);

		try
		{
			const response = await ajax.runAction(
				'socialnetwork.collab.Note.resolveSection',
				{ data: { groupId: projectId } },
			);

			// Awaited, so the spinner stays until the answer has been acted upon —
			// the restriction window may still have to load its own extension.
			await this.handleSectionResponse(response);
		}
		catch (error)
		{
			console.error('Note: failed to open the knowledge-base section', error);
		}
		finally
		{
			this.#setLoading(false);
		}
	}

	handleSectionResponse(response: ?SectionResponse): Promise<void>
	{
		const url = response?.data?.url;
		if (url)
		{
			SidePanel.Instance.open(url, this.getSliderOptions());

			return Promise.resolve();
		}

		// The menu is cached until the page reloads, so the tariff may have closed
		// after the row had been rendered as available.
		return this.showRestriction(response?.data?.restriction);
	}

	#setLoading(loading: boolean): void
	{
		const action = this.getActionElement();
		if (!(action instanceof HTMLElement))
		{
			return;
		}

		// Swap the chevron (Row::getActionElement) for a self-contained CSS spinner
		// (feature.css `.--is-loading`) — no extra icon-set dependency.
		const chevronClass = '--chevron-right-m';
		const loaderClass = '--is-loading';

		if (loading)
		{
			Dom.removeClass(action, chevronClass);
			Dom.addClass(action, loaderClass);
		}
		else
		{
			Dom.removeClass(action, loaderClass);
			Dom.addClass(action, chevronClass);
		}
	}
}
