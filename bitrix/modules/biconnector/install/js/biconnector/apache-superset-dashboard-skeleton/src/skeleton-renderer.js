import './css/skeleton.css';

import { Dom, Tag } from 'main.core';
import { Lottie } from 'ui.lottie';
import SkeletonAnimation from './skeleton/biconnector-dashboard-skeleton.json';

export class SkeletonRenderer
{
	static render(container: HTMLElement): void
	{
		if (!container)
		{
			return;
		}

		const animationBox = Tag.render`
			<div class="biconnector-dashboard__animation_box"></div>
		`;

		const animation = Lottie.loadAnimation({
			container: animationBox,
			renderer: 'svg',
			loop: true,
			autoplay: false,
			animationData: SkeletonAnimation,
		});

		animation.play();

		const skeletonNode = Tag.render`
			<div class="biconnector-dashboard__animation">
				<div class="biconnector-dashboard__hint_container"></div>
				<div class="biconnector-dashboard__filter_box">
					<div class="biconnector-dashboard__filter_box_top"></div>
					<div class="biconnector-dashboard__filter_box_bottom"></div>
				</div>
				<div class="biconnector-dashboard__skeleton">
					${animationBox}
				</div>
			</div>
		`;

		Dom.append(skeletonNode, container);
	}
}
