import { UserId } from 'bizproc.types';
import { TimelineTask, TimelineUserData } from 'bizproc.workflow.timeline';
import { Dom, Tag } from 'main.core';
import { Timeline } from 'ui.timeline';

export class TimelineTaskView extends Timeline.Item
{
	#task: TimelineTask;

	constructor(props: {
		task: TimelineTask,
		users: Map<UserId, TimelineUserData>,
	})
	{
		super({
			id: props.task.id,
			createdTimestamp: props.task.modified,
			title: props.task.name,
		});

		this.#task = props.task;
		this.setTimeFormat('j F H:i');
		this.setEventNamespace('BX.Bizproc.Workflow.Timeline.TimelineTask');

		this.setUserData(props.users);
	}

	render(): Element
	{
		this.layout.container = this.renderContainer();

		Dom.append(this.renderIcon(), this.layout.container);
		Dom.append(this.renderContent(), this.layout.container);

		return this.layout.container;
	}

	renderMain(): Element
	{
		this.layout.main = Tag.render`
			<div></div>
		`;

		return this.layout.main;
	}

	getId(): string | number
	{
		return `task-${this.id}`;
	}
}
