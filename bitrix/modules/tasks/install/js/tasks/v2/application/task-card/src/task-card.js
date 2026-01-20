import { Extension, Tag, Uri } from 'main.core';
import { Popup, PopupManager } from 'main.popup';
import type { Slider, LinkOptions, SliderEvent } from 'main.sidepanel';

import { renderSkeleton } from 'ui.system.skeleton';
import type { BitrixVueComponentProps } from 'ui.vue3';

import { idUtils } from 'tasks.v2.lib.id-utils';
import type { TaskModel } from 'tasks.v2.model.tasks';

export type Params = TaskModel & {
	taskId?: number,
	analytics: AnalyticsParams,
	url?: string,
	link?: LinkOptions,
	closeCompleteUrl?: string,
};

export type AnalyticsParams = {
	context: string,
	additionalContext: string,
	element: string,
};

export type AppField = {
	title: string,
	component: BitrixVueComponentProps,
	props: { [prop: string]: any },
	chip: AppChip,
};

export type AppChip = {
	component: BitrixVueComponentProps,
	props: { [prop: string]: any },
	events: { [event: string]: Function },
	collapsed: boolean,
	isEnabled: boolean,
};

type TaskCardSettings = {
	userId: number,
	formV2Enabled: boolean,
	userTaskPath: string,
	groupTaskPath: string,
	templatePath: string,
	userDetailUrlTemplate: string,
	hasMandatoryTaskUserFields: boolean,
	hasMandatoryTemplateUserFields: boolean,
};

const settings: TaskCardSettings = Extension.getSettings('tasks.v2.application.task-card');
const load = top.BX.Runtime.loadExtension;

export class TaskCard
{
	static showCompactCard(params: Params = {}): void
	{
		if (window !== top)
		{
			void load('tasks.v2.application.task-card').then((exports) => exports.TaskCard.showCompactCard(params));

			return;
		}

		const hasMandatoryUserFields = idUtils.isTemplate(params.taskId ?? 0)
			? settings.hasMandatoryTemplateUserFields
			: settings.hasMandatoryTaskUserFields
		;

		if (hasMandatoryUserFields && settings.formV2Enabled)
		{
			this.showFullCard(params);

			return;
		}

		const id = `tasks-compact-card-${params.taskId}`;
		if (PopupManager.getPopupById(id))
		{
			return;
		}

		const content = Tag.render`<div/>`;
		void renderSkeleton(
			'/bitrix/js/tasks/v2/application/task-card/src/skeleton.html?v=1',
			content,
		);

		let card = null;
		const popup = new Popup({
			id,
			className: 'tasks-compact-card-popup',
			width: 580,
			minHeight: 324,
			borderRadius: '16px',
			noAllPaddings: true,
			content,
			cacheable: false,
			events: {
				onAfterClose: (): void => card.unmount(),
			},
			overlay: {
				opacity: 100,
				backgroundColor: '#0363',
				blur: 'blur(2px)',
			},
		});

		void load('tasks.v2.application.task-compact-card').then((exports) => {
			card = new exports.TaskCompactCard(params);
			card.mount(popup);
		});

		popup.show();
	}

	static showFullCard(params: Params = {}): void
	{
		let card = null;
		const options = {
			contentCallback: async (slider: Slider): Promise<HTMLElement> => {
				const exports = await load('tasks.v2.application.task-full-card');

				card = new exports.TaskFullCard(params);

				return card.mount(slider);
			},
			events: {
				onClose: (event: SliderEvent): void => card?.onClose(event),
				onCloseComplete: (): void => {
					if (card)
					{
						card.onCloseComplete();
					}
					else if (params.closeCompleteUrl)
					{
						location.href = params.closeCompleteUrl;
					}
				},
			},
		};

		BX.SidePanel.Instance.open(params.url ?? this.getUrl(params.taskId), options);
	}

	static getUrl(entityId: number | string, groupId: number): string
	{
		const template = String(entityId).split('template')[1];
		const id = Number(template) || template || entityId;
		const isReal = Number.isInteger(id);

		const path = (entityId?.startsWith?.('template') ? settings.templatePath : (groupId ? settings.groupTaskPath : settings.userTaskPath))
			.replace('#user_id#', settings.userId)
			.replace('#group_id#', groupId)
			.replace('#task_id#', isReal ? id : 0)
			.replace('#template_id#', isReal ? id : 0)
			.replace('#action#', isReal ? 'view' : 'edit')
		;

		if (isReal)
		{
			return path;
		}

		return new Uri(path).setQueryParam('id', id).toString();
	}
}
