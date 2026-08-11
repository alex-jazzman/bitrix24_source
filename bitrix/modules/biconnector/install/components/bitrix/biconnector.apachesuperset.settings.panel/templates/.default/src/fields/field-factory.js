import { EventEmitter } from 'main.core.events';
import type { BaseEvent } from 'main.core.events';

import {
	DashboardDateFilterField,
	DashboardGroupsField,
} from './entities/index';

export class FieldFactory
{
	constructor(entityEditorControlFactory: string = 'BX.UI.EntityEditorControlFactory')
	{
		EventEmitter.subscribe(`${entityEditorControlFactory}:onInitialize`, (event: BaseEvent) => {
			const [, eventArgs] = event.getCompatData();
			eventArgs.methods.dashboardSettings = this.factory.bind(this);
		});
	}

	factory(type, controlId, settings): ?BX.UI.EntityEditorField
	{
		switch (type)
		{
			case 'dashboardTimePeriod':
				return DashboardDateFilterField.create(controlId, settings);
			case 'dashboardGroupsSelector':
				return DashboardGroupsField.create(controlId, settings);
			default:
				return null;
		}
	}
}
