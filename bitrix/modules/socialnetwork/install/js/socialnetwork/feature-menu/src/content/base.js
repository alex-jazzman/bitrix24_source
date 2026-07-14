import { Tag } from 'main.core';
import { Content } from './content';

export class Base extends Content
{
	getLayout(): HTMLElement
	{
		return this.cache.remember('layout', () => {
			return Tag.render`
				<div class="socnet-feature-menu-content__wrapper --base">
					<div class="socnet-feature-menu-base-content-features__wrapper">
						${this.getFeaturesLayout()}
					</div>
				</div>
			`;
		});
	}
}
