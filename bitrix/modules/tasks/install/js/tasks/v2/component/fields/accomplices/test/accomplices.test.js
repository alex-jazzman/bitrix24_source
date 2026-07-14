import { mount } from '@vue/test-utils';
import { createStore } from 'ui.vue3.vuex';

import 'tasks.v2.test';

import { Core } from 'tasks.v2.core';
import { Model } from 'tasks.v2.const';
import { taskService } from 'tasks.v2.provider.service.task-service';

import { Accomplices } from '../src/accomplices';
import { registerPendingAbsenceArm } from '../src/pending-absence-arm';

// Vue 3 lazily defines this global on first mount; predefine it so Mocha's
// global-leak detector does not flag it as a leak introduced by the test.
if (!('__VUE_DEVTOOLS_PLUGINS__' in window))
{
	window.__VUE_DEVTOOLS_PLUGINS__ = undefined;
}

function createAbsencesStore(collection = {}, fetching = false)
{
	return createStore({
		modules: {
			[Model.Absences]: {
				namespaced: true,
				state: () => ({
					collection,
					fetching,
				}),
				getters: {
					getByUserIds: (state) => (userIds) => {
						return Object.values(state.collection)
							.filter((absence) => !absence.viewed && userIds.includes(absence.userId));
					},
				},
				mutations: {
					setFetching: (state, value) => {
						state.fetching = value;
					},
				},
				actions: {
					setFetching: ({ commit }, value) => {
						commit('setFetching', value);
					},
				},
			},
		},
	});
}

function createAbsence(userId)
{
	return { userId, viewed: false, fromTs: 0, toTs: 0 };
}

const ParticipantsStub = {
	name: 'TaskParticipants',
	props: ['userIds'],
	emits: ['update', 'absenceLoaded'],
	template: `
		<div class="participants-stub">
			<template v-for="(userId, index) in userIds" :key="userId">
				<slot
					name="user"
					:userId="userId"
					:index="index"
					:getUserEl="() => document.createElement('div')"
				/>
			</template>
		</div>
	`,
};

const AbsencePopupStub = {
	name: 'AbsencePopup',
	props: ['userId', 'getBindElement', 'delay'],
	template: '<div class="absence-popup-stub" :data-user-id="userId"></div>',
};

function makeTask(accomplicesIds)
{
	return {
		accomplicesIds,
		auditorsIds: [],
		rights: { changeAccomplices: true },
	};
}

function mountAccomplices(store, task)
{
	return mount(Accomplices, {
		global: {
			plugins: [store],
			provide: {
				task,
				taskId: 'temp-1',
				analytics: {},
				cardType: 'task',
			},
			stubs: {
				TaskParticipants: ParticipantsStub,
				AbsencePopup: AbsencePopupStub,
			},
		},
	});
}

describe('TaskAccomplices absence tooltip gating', () => {
	let store;
	let wrapper;
	let originalGetParams;
	let originalUpdate;
	let originalHasChanges;

	const accomplicesIds = [10, 20];

	beforeEach(() => {
		originalGetParams = Core.getParams;
		originalUpdate = taskService.update;
		originalHasChanges = taskService.hasChanges;

		Core.getParams = () => ({
			restrictions: { stakeholder: { available: true, featureId: '' } },
		});
		taskService.update = () => Promise.resolve();
		taskService.hasChanges = () => false;
	});

	afterEach(() => {
		wrapper?.unmount();
		Core.getParams = originalGetParams;
		taskService.update = originalUpdate;
		taskService.hasChanges = originalHasChanges;
	});

	it('does NOT render AbsencePopup when user is in store but not armed', async () => {
		store = createAbsencesStore({});
		wrapper = mountAccomplices(store, makeTask(accomplicesIds));
		await wrapper.vm.$nextTick();

		// Absence appears without being armed.
		store.state[Model.Absences].collection['1'] = createAbsence(20);
		await wrapper.vm.$nextTick();

		assert.isFalse(
			wrapper.find('.absence-popup-stub[data-user-id="20"]').exists(),
			'unarmed user must not get an AbsencePopup',
		);
	});

	it('renders AbsencePopup when armed via mounted snapshot and absence exists', async () => {
		store = createAbsencesStore({ '1': createAbsence(20) });
		wrapper = mountAccomplices(store, makeTask(accomplicesIds));
		await wrapper.vm.$nextTick();

		assert.isTrue(
			wrapper.find('.absence-popup-stub[data-user-id="20"]').exists(),
			'armed user with absence must render AbsencePopup',
		);
	});

	it('arms users on @absenceLoaded', async () => {
		store = createAbsencesStore({ '1': createAbsence(20) });
		wrapper = mountAccomplices(store, makeTask(accomplicesIds));
		await wrapper.vm.$nextTick();

		store.state[Model.Absences].collection['2'] = createAbsence(10);
		await wrapper.vm.$nextTick();
		assert.isFalse(wrapper.find('.absence-popup-stub[data-user-id="10"]').exists());

		wrapper.findComponent(ParticipantsStub).vm.$emit('absenceLoaded', [10]);
		await wrapper.vm.$nextTick();

		assert.isTrue(
			wrapper.find('.absence-popup-stub[data-user-id="10"]').exists(),
			'AbsencePopup must render after @absenceLoaded',
		);
	});

	it('arms users via the chip-flow pending promise (no store-wide fetching flag)', async () => {
		// Chip flow parks its own load promise by taskId before the field mounts.
		// At mount only the pre-existing absence (20) is in the store and armed by
		// the snapshot; user 10 is added by the chip's load that resolves later.
		let resolveLoad;
		const loadPromise = new Promise((resolve) => {
			resolveLoad = resolve;
		});
		store = createAbsencesStore({ '1': createAbsence(20) });
		registerPendingAbsenceArm('temp-1', loadPromise);

		wrapper = mountAccomplices(store, makeTask(accomplicesIds));
		await wrapper.vm.$nextTick();
		assert.isFalse(
			wrapper.find('.absence-popup-stub[data-user-id="10"]').exists(),
			'user 10 must not be armed before the chip-flow load resolves',
		);

		// Chip-flow load finished: data is in the store and the promise resolves
		// with exactly the userIds it loaded.
		store.state[Model.Absences].collection['2'] = createAbsence(10);
		resolveLoad([10]);
		await loadPromise;
		await wrapper.vm.$nextTick();

		assert.isTrue(
			wrapper.find('.absence-popup-stub[data-user-id="10"]').exists(),
			'chip-flow pending promise must arm its loaded users',
		);
	});

	it('disarms a user removed from accomplices on update (normalize)', async () => {
		store = createAbsencesStore({ '1': createAbsence(20), '2': createAbsence(10) });
		const task = makeTask(accomplicesIds);
		wrapper = mountAccomplices(store, task);
		await wrapper.vm.$nextTick();

		assert.isTrue(wrapper.find('.absence-popup-stub[data-user-id="10"]').exists());
		assert.isTrue(wrapper.find('.absence-popup-stub[data-user-id="20"]').exists());

		// User 10 removed.
		task.accomplicesIds = [20];
		wrapper.findComponent(ParticipantsStub).vm.$emit('update', [20]);
		await wrapper.vm.$nextTick();

		assert.isFalse(
			wrapper.find('.absence-popup-stub[data-user-id="10"]').exists(),
			'removed accomplice must be disarmed',
		);
		assert.isTrue(
			wrapper.find('.absence-popup-stub[data-user-id="20"]').exists(),
			'remaining accomplice stays armed',
		);
	});
});
