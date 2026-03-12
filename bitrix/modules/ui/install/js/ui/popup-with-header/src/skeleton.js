import { Tag } from 'main.core';

export class Skeleton
{
	#height: number;
	#width: number;

	constructor(height: number = 447, width: number = 344)
	{
		this.#height = height;
		this.#width = width;
	}

	get(): HTMLElement
	{
		return Tag.render`
			<div style="height: ${this.#height}px; width: ${this.#width}px;" class="popup-with-header-skeleton__wrap">
				<div class="popup-with-header-skeleton__header">
					<div class="popup-with-header-skeleton__header-top">
						<div class="popup-with-header-skeleton__header-circle">
							<div class="popup-with-header-skeleton__header-circle-inner"></div>
						</div>
						<div style="width: 100%;">
							<div style="margin-bottom: 12px; max-width: 219px; height: 6px; background: rgba(255,255,255,.8);" class="popup-with-header-skeleton__line"></div>
							<div style="max-width: 119px; height: 4px;" class="popup-with-header-skeleton__line"></div>
						</div>
					</div>
					<div class="popup-with-header-skeleton__header-bottom">
						<div class="popup-with-header-skeleton__header-bottom-circle-box">
							<div class="popup-with-header-skeleton__header-bottom-circle"></div>
						</div>
						<div style="width: 100%;">
							<div style="margin-bottom: 9px; max-width: 193px; height: 5px;" class="popup-with-header-skeleton__line"></div>
							<div style="margin-bottom: 15px; max-width: 163px; height: 5px;" class="popup-with-header-skeleton__line"></div>
							<div style="margin-bottom: 9px; max-width: 156px; height: 2px;" class="popup-with-header-skeleton__line"></div>
							<div style="margin-bottom: 9px; max-width: 93px; height: 2px;" class="popup-with-header-skeleton__line"></div>
						</div>
					</div>
				</div>
				<div class="popup-with-header-skeleton__bottom">
					${this.#getInnerBlock()}
					${this.#getInnerBlock('--green')}
				</div>
			</div>
		`;
	}

	#getInnerBlock(btnClass: string = ''): HTMLElement
	{
		return Tag.render`
			<div class="popup-with-header-skeleton__bottom-inner">
				<div class="popup-with-header-skeleton__bottom-title">
					<div class="popup-with-header-skeleton__bottom-left">
						<div style="margin-top: 9px; max-width: 183px; height: 5px;" class="popup-with-header-skeleton__line"></div>
					</div>
					<div class="popup-with-header-skeleton__bottom-right">
						<div class="popup-with-header-skeleton-btn ${btnClass}"></div>
					</div>
				</div>
				<div class="popup-with-header-skeleton__bottom-desc">
					<div style="margin-bottom: 9px; max-width: 238px; height: 3px; background: rgba(149,156,164,.23);" class="popup-with-header-skeleton__line --dark-animation"></div>
					<div style="margin-bottom: 9px; max-width: 201px; height: 3px; background: rgba(149,156,164,.23);" class="popup-with-header-skeleton__line --dark-animation"></div>
					<div style="margin-bottom: 9px; max-width: 220px; height: 3px; background: rgba(149,156,164,.23);" class="popup-with-header-skeleton__line --dark-animation"></div>
				</div>
			</div>
		`;
	}
}
