import { Tag } from 'main.core';
import { Content } from './content';

export class List extends Content
{
	getLayout(): HTMLElement
	{
		return this.cache.remember('layout', () => {
			return Tag.render`
				<div class="socnet-feature-menu-content__wrapper">
					${this.getFeaturesLayout()}
				</div>
			`;
		});
	}
}
