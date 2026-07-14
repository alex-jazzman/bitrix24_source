import { mount } from '@vue/test-utils';
import { createStore } from 'ui.vue3.vuex';

import 'tasks.v2.test';

import { Core } from 'tasks.v2.core';
import { Model } from 'tasks.v2.const';
import { calendar } from 'tasks.v2.lib.calendar';
import { taskService } from 'tasks.v2.provider.service.task-service';

import { Responsible } from '../src/responsible';

// Vue 3 lazily defines this global on first mount; predefine it so Mocha's
// global-leak detector does not flag it as a leak introduced by the test.
if (!('__VUE_DEVTOOLS_PLUGINS__' in window))
{
	window.__VUE_DEVTOOLS_PLUGINS__ = undefined;
}

const TODAY_TS = 1000;

function createAbsencesStore(collection = {})
{
	return createStore({
		modules: {
			[Model.Absences]: {
				namespaced: true,
				state: () => ({
					collection,
					fetching: false,
				}),
				getters: {
					getByUserIds: (state) => (userIds) => {
						return Object.values(state.collection)
							.filter((absence) => !absence.viewed && userIds.includes(absence.userId));
					},
				},
				mutations: {
					setFetching: (state, fetching) => {
						state.fetching = fetching;
					},
				},
				actions: {
					setFetching: ({ commit }, fetching) => {
						commit('setFetching', fetching);
					},
				},
			},
		},
	});
}

function createAbsence(userId)
{
	return {
		userId,
		viewed: false,
		fromTs: TODAY_TS - 100,
		toTs: TODAY_TS + 100,
	};
}

// Stub for Participants: renders the #user scoped slot for every userId so we can
// observe whether the parent decides to render AbsencePopup. Also lets the test
// drive the @absenceLoaded event.
const ParticipantsStub = {
	name: 'TaskParticipants',
	props: ['userIds'],
	emits: ['update', 'absenceLoaded', 'hintClick'],
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

function mountResponsible(store, { responsibleIds })
{
	return mount(Responsible, {
		props: {
			taskId: 'temp-1',
			isSingle: false,
		},
		global: {
			plugins: [store],
			provide: {
				analytics: {},
				cardType: 'task',
			},
			mixins: [{
				methods: {
					loc(key) { return key; },
				},
			}],
			stubs: {
				TaskParticipants: ParticipantsStub,
				AbsencePopup: AbsencePopupStub,
				ForNewUserSwitcher: true,
				NewUserLabel: true,
				Hint: true,
				BIcon: true,
				TextXs: true,
			},
		},
	});
}

describe('TaskResponsible absence tooltip gating', () => {
	let store;
	let wrapper;
	let originalGetStoreTask;
	let originalUpdate;
	let originalGetParams;
	let todayTsDescriptor;

	const responsibleIds = [10, 20];

	function setTask(ids)
	{
		taskService.getStoreTask = () => ({
			responsibleIds: ids,
			isForNewUser: false,
			creatorId: 1,
			flowId: 0,
			context: 'default',
			auditorsIds: [],
			accomplicesIds: [],
			rights: { delegate: true, changeResponsible: true },
		});
	}

	beforeEach(() => {
		originalGetStoreTask = taskService.getStoreTask;
		originalUpdate = taskService.update;
		originalGetParams = Core.getParams;

		taskService.update = () => Promise.resolve();

		Core.getParams = () => ({
			currentUser: { id: 1 },
			rights: { user: { admin: false } },
		});

		todayTsDescriptor = Object.getOwnPropertyDescriptor(calendar, 'todyTs');
		Object.defineProperty(calendar, 'todyTs', { value: TODAY_TS, configurable: true });

		setTask(responsibleIds);
	});

	afterEach(() => {
		wrapper?.unmount();
		taskService.getStoreTask = originalGetStoreTask;
		taskService.update = originalUpdate;
		Core.getParams = originalGetParams;

		if (todayTsDescriptor)
		{
			Object.defineProperty(calendar, 'todyTs', todayTsDescriptor);
		}
		else
		{
			delete calendar.todyTs;
		}
	});

	it('does NOT render AbsencePopup when user is in absences store but not armed', async () => {
		// Absence exists in store, but mounted() snapshot armed nothing because the
		// snapshot reads the same store — to model the anti-leak we add the absence
		// AFTER mount (simulating an absence that appeared without being armed).
		store = createAbsencesStore({});
		wrapper = mountResponsible(store, { responsibleIds });
		await wrapper.vm.$nextTick();

		// Inject an absence into the store that was never armed.
		store.state[Model.Absences].collection['1'] = createAbsence(20);
		await wrapper.vm.$nextTick();

		assert.isFalse(
			wrapper.find('.absence-popup-stub[data-user-id="20"]').exists(),
			'AbsencePopup must not render for an unarmed user even if absence is in store',
		);
	});

	it('renders AbsencePopup when user is armed (snapshot in mounted) and has absence', async () => {
		// Absence already present before mount -> mounted() snapshot arms it.
		store = createAbsencesStore({ '1': createAbsence(20) });
		wrapper = mountResponsible(store, { responsibleIds });
		await wrapper.vm.$nextTick();

		assert.isTrue(
			wrapper.find('.absence-popup-stub[data-user-id="20"]').exists(),
			'AbsencePopup must render for an armed user with an absence',
		);
	});

	it('arms users on @absenceLoaded so AbsencePopup appears', async () => {
		store = createAbsencesStore({ '1': createAbsence(20) });
		wrapper = mountResponsible(store, { responsibleIds });
		await wrapper.vm.$nextTick();

		// Not armed yet for userId 10.
		store.state[Model.Absences].collection['2'] = createAbsence(10);
		await wrapper.vm.$nextTick();
		assert.isFalse(
			wrapper.find('.absence-popup-stub[data-user-id="10"]').exists(),
			'precondition: user 10 not armed yet',
		);

		// Participants reports newly loaded absences -> armAbsenceForUsers.
		wrapper.findComponent(ParticipantsStub).vm.$emit('absenceLoaded', [10]);
		await wrapper.vm.$nextTick();

		assert.isTrue(
			wrapper.find('.absence-popup-stub[data-user-id="10"]').exists(),
			'AbsencePopup must render after @absenceLoaded arms the user',
		);
	});

	it('disarms a user when they are removed from responsibles (normalize on update)', async () => {
		store = createAbsencesStore({ '1': createAbsence(20), '2': createAbsence(10) });
		wrapper = mountResponsible(store, { responsibleIds });
		await wrapper.vm.$nextTick();

		// Both armed initially.
		assert.isTrue(wrapper.find('.absence-popup-stub[data-user-id="10"]').exists());
		assert.isTrue(wrapper.find('.absence-popup-stub[data-user-id="20"]').exists());

		// User 10 removed: task now only has user 20, update() -> normalize disarms 10.
		setTask([20]);
		wrapper.findComponent(ParticipantsStub).vm.$emit('update', [20]);
		await wrapper.vm.$nextTick();

		assert.isFalse(
			wrapper.find('.absence-popup-stub[data-user-id="10"]').exists(),
			'removed responsible must be disarmed and not render AbsencePopup',
		);
		assert.isTrue(
			wrapper.find('.absence-popup-stub[data-user-id="20"]').exists(),
			'remaining responsible stays armed',
		);
	});

	it('does not block the many-responsibles AHA when an unarmed user has a store-only absence', async () => {
		// Regression: hasUsersWithAbsence() must consider only locally armed users.
		// An absence that exists in the shared store for a non-armed responsible
		// (e.g. loaded by another task window) must NOT keep executeIfNoAbsences()
		// from firing the AHA callback — otherwise showManyAha() stays blocked forever.
		store = createAbsencesStore({});
		wrapper = mountResponsible(store, { responsibleIds });
		await wrapper.vm.$nextTick();

		// Absence for responsible 20 appears in the store without being armed here.
		store.state[Model.Absences].collection['1'] = createAbsence(20);
		await wrapper.vm.$nextTick();

		assert.isTrue(
			wrapper.vm.hasUserAbsence(20),
			'precondition: user 20 has an absence in the shared store',
		);
		assert.isFalse(
			wrapper.vm.armedAbsencePopupUserIds.has(20),
			'precondition: user 20 is not locally armed',
		);

		let ahaCalled = false;
		wrapper.vm.executeIfNoAbsences(() => { ahaCalled = true; });

		assert.isTrue(
			ahaCalled,
			'AHA callback must fire: a store-only absence for an unarmed user must not block executeIfNoAbsences()',
		);
	});
});
