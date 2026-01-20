import { Extension } from 'main.core';
import { Builder, BuilderModel, Store } from 'ui.vue3.vuex';

import { CheckList } from 'tasks.v2.model.check-list';
import { CrmItems } from 'tasks.v2.model.crm-items';
import { ElapsedTimes } from 'tasks.v2.model.elapsed-times';
import { Epics } from 'tasks.v2.model.epics';
import { Flows } from 'tasks.v2.model.flows';
import { GanttLinks } from 'tasks.v2.model.gantt-links';
import { Groups } from 'tasks.v2.model.groups';
import { Interface } from 'tasks.v2.model.interface';
import { Placements } from 'tasks.v2.model.placements';
import { Results } from 'tasks.v2.model.results';
import { Stages } from 'tasks.v2.model.stages';
import { Tasks } from 'tasks.v2.model.tasks';
import { Reminders } from 'tasks.v2.model.reminders';
import { Users } from 'tasks.v2.model.users';

import { PullManager } from 'tasks.v2.provider.pull.pull-manager';

import type { CoreParams, RightsParams } from './types';
export type { CoreParams, RightsParams };

const params = Extension.getSettings('tasks.v2.core');

class CoreApplication
{
	#store: Store;
	#builder: Builder;
	#initPromise: Promise;
	#pullManager: ?PullManager = null;

	getParams(): CoreParams
	{
		return params;
	}

	getStore(): Store
	{
		return this.#store;
	}

	init(): Promise<void>
	{
		// eslint-disable-next-line no-async-promise-executor
		this.#initPromise ??= new Promise(async (resolve) => {
			this.#store = await this.#initStore();
			this.#initPull();
			resolve();
		});

		return this.#initPromise;
	}

	async addDynamicModel(vuexBuilderModel: BuilderModel): Promise<void>
	{
		if (!(this.#builder instanceof Builder))
		{
			throw new TypeError('Builder has not been init');
		}

		if (this.#store.hasModule(vuexBuilderModel.getName()))
		{
			return;
		}

		await this.#builder.addDynamicModel(vuexBuilderModel);
	}

	removeDynamicModel(vuexModelName: string): void
	{
		if (this.#builder instanceof Builder && this.#store.hasModule(vuexModelName))
		{
			this.#builder.removeDynamicModel(vuexModelName);
		}
	}

	async #initStore(): Promise<Store>
	{
		this.#builder = Builder.init();

		this.#builder
			.addModel(CheckList.create())
			.addModel(CrmItems.create())
			.addModel(ElapsedTimes.create())
			.addModel(Epics.create())
			.addModel(Flows.create())
			.addModel(GanttLinks.create())
			.addModel(Groups.createWithGroups([params.defaultCollab].filter((it) => it)))
			.addModel(Interface.createWithVariables(params))
			.addModel(Results.create())
			.addModel(Placements.create())
			.addModel(Stages.create())
			.addModel(Tasks.createWithVariables(params))
			.addModel(Reminders.create())
			.addModel(Users.createWithCurrentUser(params.currentUser))
		;

		const builderResult = await this.#builder.build();

		return builderResult.store;
	}

	#initPull(): void
	{
		this.#pullManager = new PullManager({
			currentUserId: params.currentUser.id,
		});

		this.#pullManager.initQueueManager();
	}
}

export const Core = new CoreApplication();
