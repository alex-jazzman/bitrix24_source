import { Loc, Tag } from 'main.core';
import { PerfReviewContentOptions } from '../types';
import { Content } from './content';

export class PerfReviewContent extends Content
{
	getOptions(): PerfReviewContentOptions
	{
		return super.getOptions();
	}

	getLayout(): HTMLElement
	{
		return this.cache.remember('layout', () => {
			const onclick = () => {
				this.#onClick();
			};

			return Tag.render`
				<div onclick="${onclick}" class="intranet-avatar-widget-item__wrapper" data-id="bx-avatar-widget-content-perf-review">
					<i class="ui-icon-set --o-form intranet-avatar-widget-item__icon"/>
					<div class="intranet-avatar-widget-item__info-wrapper">
						<span class="intranet-avatar-widget-item__title">
							${this.getOptions().title}
						</span>
					</div>
					<i class="ui-icon-set --chevron-right-m intranet-avatar-widget-item__chevron"/>
				</div>
			`;
		});
	}

	#onClick(): void
	{
		document.location.href = `${Loc.getMessage('SITE_DIR')}company/stafftools/performance_review/passing/`;
	}
}
