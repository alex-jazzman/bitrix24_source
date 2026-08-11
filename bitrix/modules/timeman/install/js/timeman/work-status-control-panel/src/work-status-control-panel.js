import { Tag, Extension } from 'main.core';
import { BaseEvent, EventEmitter } from 'main.core.events';
import { BitrixVue } from 'ui.vue3';

import 'timeman';
import 'CJSTask';
import 'planner';
import 'tasks_planner_handler';
import 'calendar_planner_handler';
import 'ajax';
import 'timer';
import 'popup';
import 'ls';

import { App } from './component/app';

import './work-status-control-panel.css';

window.BX?.Runtime?.loadExtension?.('stafftrack.checkin-onboarding-banner')?.catch?.(() => {});

type Data = {
	workReport: Object,
	info: Object & {
		STATE: string,
		CAN_OPEN?: string,
		INFO: Object & {
			DATE_START: number,
			TIME_LEAKS: number,
		},
	},
	siteId: string,
	isReportsEnabled: boolean,
	hasAiReportAccess: boolean,
};

export class WorkStatusControlPanel
{
	#data: Data = {};
	#timemanInstantContainerNode: HTMLElement;

	constructor()
	{
		const settings = Extension.getSettings('timeman.work-status-control-panel');

		this.#data.workReport = settings.get('workReport');
		this.#data.info = settings.get('info');
		this.#data.siteId = settings.get('siteId');
		this.#data.isReportsEnabled = Boolean(settings.get('isReportsEnabled'));
		this.#data.hasAiReportAccess = Boolean(settings.get('hasAiReportAccess'));

		this.#timemanInstantContainerNode = Tag.render`
			<div class="timeman-instant-container"></div>
		`;

		EventEmitter.subscribe('onTimemanInit', this.#init.bind(this));
		EventEmitter.subscribe('onTimeManDataRecieved', this.#updateState.bind(this));

		if (!window.BXTIMEMAN)
		{
			window.BX.timeman('bx_tm', this.#data.info, this.#data.siteId);
		}
	}

	#mountApplication(container: HTMLElement, props: Object = {}): void
	{
		const application = BitrixVue.createApp(App, props);
		application.mount(container);
	}

	#init(): void
	{
		window.BXTIMEMAN.initFormWeekly(this.#data.workReport);
	}

	#updateState(baseEvent: BaseEvent): void
	{
		const [data] = baseEvent.getCompatData();

		this.#data.info = data;
	}

	renderWorkStatusControlPanel(options: Object = {}): HTMLElement
	{
		event?.stopPropagation?.();

		this.#mountApplication(this.#timemanInstantContainerNode, {
			...options,
			isReportsEnabled: this.#data.isReportsEnabled,
			hasAiReportAccess: this.#data.hasAiReportAccess,
		});

		return Tag.render`
			${this.#timemanInstantContainerNode}
		`;
	}
}
