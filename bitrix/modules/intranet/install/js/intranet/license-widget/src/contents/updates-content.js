import { Tag } from 'main.core';

import { AdminRestrictedPopup } from '../popups/admin-restricted-popup';
import { Content } from './content';

export class UpdatesContent extends Content
{
	getConfig(): Object
	{
		return {
			html: this.getLayout(),
			minHeight: '43px',
			sizeLoader: 30,
		};
	}

	getLayout(): HTMLElement
	{
		return this.cache.remember('layout', () => {
			if (this.getOptions().isAdminRestricted)
			{
				const onclick = (event) => {
					AdminRestrictedPopup.show(event.currentTarget);
				};

				return Tag.render`
					<button
						type="button"
						onclick="${onclick}"
						data-id="license-widget-block-whatsnew"
						class="license-widget-item license-widget-item--secondary --pointer"
					>
						${this.#getLayoutContent()}
					</button>
				`;
			}

			return Tag.render`
				<a
					href="${this.getOptions().link}"
					target="_blank"
					rel="noopener noreferrer"
					data-id="license-widget-block-whatsnew"
					class="license-widget-item license-widget-item--secondary --pointer"
				>
					${this.#getLayoutContent()}
				</a>
			`;
		});
	}

	#getLayoutContent(): HTMLElement
	{
		return Tag.render`
			<span class="license-widget-inner">
				<span class="license-widget-content">
					${this.getMainIcon()}
					<span class="license-widget-item-content">
						${this.getTitle()}
					</span>
				</span>
				<span class="license-widget-item-icon__arrow-right ui-icon-set --arrow-right" aria-hidden="true"></span>
			</span>
		`;
	}

	getMainIcon(): HTMLSpanElement
	{
		return this.cache.remember('main-icon', () => {
			return Tag.render`
				<span class="license-widget-item-icon license-widget-item-icon--updates" aria-hidden="true"></span>
			`;
		});
	}

	getTitle(): HTMLSpanElement
	{
		return this.cache.remember('title', () => {
			return Tag.render`
				<span class="license-widget-item-name">
					<span>
						${this.getOptions().title}
					</span>
				</span>
			`;
		});
	}
}
