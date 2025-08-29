import { Popup, PopupManager } from 'main.popup';
import type { Slider } from 'main.sidepanel';

import { Skeleton, FullSkeleton } from './task-card-skeleton';
export { FullSkeleton };

export type Params = {
	taskId?: number,
	groupId?: number,
	deadlineTs?: number,
	analytics: AnalyticsParams,
};

export type AnalyticsParams = {
	context: string,
	additionalContext: string,
	element: string,
};

export class TaskCard
{
	static showCompactCard(params: Params = {}): void
	{
		const id = `tasks-compact-card-${params.taskId}`;
		if (PopupManager.getPopupById(id))
		{
			return;
		}

		let card;
		const popup = new Popup({
			id,
			className: 'tasks-compact-card-popup',
			width: 580,
			borderRadius: '16px',
			noAllPaddings: true,
			content: Skeleton(),
			cacheable: false,
			events: {
				onAfterClose: (): void => card.unmountCard(),
			},
			overlay: {
				opacity: 100,
				backgroundColor: '#0363',
				blur: 'blur(2px)',
			},
		});

		void BX.Runtime.loadExtension('tasks.v2.application.task-compact-card').then(({ TaskCompactCard }) => {
			card = new TaskCompactCard({ analytics: {}, ...params });
			card.mountCard(popup);
		});

		popup.show();
	}

	static showFullCard(params: Params = {}): void
	{
		let card;
		BX.SidePanel.Instance.open(`tasks-full-card-${params.taskId}`, {
			contentClassName: 'tasks-full-card-slider-content',
			width: 1510,
			customLeftBoundary: 0,
			cacheable: false,
			contentCallback: (slider: Slider): void => {
				void BX.Runtime.loadExtension('tasks.v2.application.task-full-card').then(({ TaskFullCard }) => {
					card = new TaskFullCard({ analytics: {}, ...params });
					card.mountCard(slider);
				});

				return FullSkeleton();
			},
			events: {
				onClose: (): void => card?.unmountCard(),
			},
		});
	}
}
