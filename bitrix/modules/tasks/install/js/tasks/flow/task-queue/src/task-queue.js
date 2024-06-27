import { ajax, AjaxError, AjaxResponse, Dom, Event, Loc, Tag } from 'main.core';
import { Loader } from 'main.loader';
import { Popup, PopupManager } from 'main.popup';

import { SidePanelIntegration } from 'tasks.side-panel-integration';

import { Line, LineData } from './line';

type Params = {
	flowId: number,
	type: string,
	bindElement: HTMLElement,
};

import './css/base.css';

export class TaskQueue
{
	static instances = {};

	static TYPES = {
		PENDING: 'PENDING',
		AT_WORK: 'AT_WORK',
		COMPLETED: 'COMPLETED',
	};

	#params: Params;
	#flowId: number;
	#type: string;

	#pageSize: number = 10;
	#pageNum: number = 1;
	#pending: boolean = false;
	#pages: { [key: number]: Line[] };

	#popup: Popup;
	#loader: Loader;

	#layout: {
		popupContainer: HTMLElement,
		popupContent: HTMLElement,
		popupInner: HTMLElement,
	};

	constructor(params: Params)
	{
		this.#params = params;

		this.#flowId = parseInt(params.flowId, 10);

		if (!(params.type in TaskQueue.TYPES))
		{
			throw new Error('The specified queue type is incorrect');
		}
		this.#type = params.type;

		this.#pages = {};
		this.#layout = {};
	}

	static showInstance(params: Params): void
	{
		this.getInstance(params).show(params.bindElement);
	}

	static getInstance(params: Params): this
	{
		const queueId = params.flowId + params.type;

		this.instances[queueId] ??= new this(params);

		return this.instances[queueId];
	}

	show(bindElement: HTMLElement): void
	{
		this.#popup = this.getPopup();

		this.#popup.setContent(this.#renderContent());
		this.#popup.setBindElement(bindElement);

		this.#popup.show();
	}

	getPopup(): Popup
	{
		const queueId = this.#params.flowId + this.#params.type;

		const id = `tasks-flow-task-queue-popup-${queueId}`;

		if (PopupManager.getPopupById(id))
		{
			return PopupManager.getPopupById(id);
		}

		const popup = new Popup({
			id,
			className: 'tasks-flow__task-queue-popup',
			width: 200,
			padding: 2,
			autoHide: true,
			closeByEsc: true,
			events: {
				onFirstShow: () => {
					this.#showLines();
				},
			},
		});

		new SidePanelIntegration(popup);

		return popup;
	}

	#getList(pageNum: number): Promise
	{
		this.#pending = true;

		const map = {
			PENDING: 'Pending',
			AT_WORK: 'Progress',
			COMPLETED: 'Completed',
		};

		return new Promise((resolve) => {
			ajax.runAction(`tasks.flow.Task.${map[this.#type]}.list`, {
				data: {
					flowData: { id: this.#flowId },
					ago: { days: 30 },
				},
				navigation: {
					page: pageNum,
					size: this.#pageSize,
				},
			})
				.then((response: AjaxResponse) => {
					this.#pending = false;
					if (response.data.tasks.length >= this.#pageSize)
					{
						this.#pageNum++;
					}
					resolve(response.data.tasks);
				})
				.catch((error: AjaxError) => {
					this.#consoleError('getList', error);
				})
			;
		});
	}

	#renderContent(): HTMLElement
	{
		const { popupContainer, popupContent } = Tag.render`
			<div ref="popupContainer" class="tasks-flow__task-queue-popup_container">
				<div ref="listContainer" class="tasks-flow__task-queue-popup_content">
					<div class="tasks-flow__task-queue-popup_content-box">
						<span class="tasks-flow__task-queue-popup_label">
							<span class="tasks-flow__task-queue-popup_label-text">
								${Loc.getMessage(`TASKS_FLOW_TASK_QUEUE_POPUP_LABEL_${this.#type}`)}
							</span>
						</span>
						${this.#renderLines()}
					</div>
				</div>
			</div>
		`;

		this.#layout.popupContainer = popupContainer;
		this.#layout.popupContent = popupContent;

		return this.#layout.popupContainer;
	}

	#renderLines(): HTMLElement
	{
		this.#layout.popupInner = Tag.render`
			<div class="tasks-flow__task-queue-popup_inner">
				${Object.values(this.#pages).flat().map((line: Line) => line.render())}
			</div>
		`;

		Event.bind(this.#layout.popupInner, 'scroll', () => {
			const scrollTop = this.#layout.popupInner.scrollTop;
			const maxScroll = this.#layout.popupInner.scrollHeight - this.#layout.popupInner.offsetHeight;

			if (Math.abs(scrollTop - maxScroll) < 1 && this.#pending === false)
			{
				this.#showLines();
			}
		});

		return this.#layout.popupInner;
	}

	#showLines(): void
	{
		this.#showLoader();

		// eslint-disable-next-line promise/catch-or-return
		this.#appendLines(this.#pageNum).then(() => {
			this.#destroyLoader();
		});
	}

	#appendLines(pageNum: number): Promise
	{
		if (this.#pages[pageNum])
		{
			return Promise.resolve();
		}

		const list: HTMLElement = this.#layout.popupInner;

		// eslint-disable-next-line promise/catch-or-return
		return this.#getList(pageNum)
			.then((lines: Array<LineData>) => {
				this.#pages[pageNum] = lines.map((data: LineData) => new Line(data));

				this.#pages[pageNum].forEach((line: Line) => Dom.append(line.render(), list));
			})
		;
	}

	#showLoader()
	{
		const targetPosition = Dom.getPosition(this.#layout.popupInner);
		const size = 40;

		this.#loader = new Loader({
			target: this.#layout.popupInner,
			size: size,
			mode: 'inline',
			offset: {
				left: `${((targetPosition.width / 2) - (size / 2))}px`,
			},
		});

		this.#loader.show();
	}

	#destroyLoader()
	{
		this.#loader.destroy();
	}

	#consoleError(action: string, error: AjaxError)
	{
		// eslint-disable-next-line no-console
		console.error(`TaskQueue: ${action} error`, error);
	}
}
