/**
 * @module tasks/statemanager/redux/slices/tasks
 */
jn.define('tasks/statemanager/redux/slices/tasks', (require, exports, module) => {
	const { ReducerRegistry } = require('statemanager/redux/reducer-registry');
	const { createSlice } = require('statemanager/redux/toolkit');
	const { isOffline } = require('device/connection');

	const { ExpirationRegistry } = require('tasks/statemanager/redux/slices/tasks/expiration-registry');
	const { sliceName, tasksAdapter, initialState } = require('tasks/statemanager/redux/slices/tasks/meta');
	const { TaskModel } = require('tasks/statemanager/redux/slices/tasks/model/task');
	const { mapStateToTaskModel } = require('tasks/statemanager/redux/slices/tasks/mapper');
	const {
		selectAll,
		selectById,
		selectEntities,
		selectIds,
		selectTotal,
		selectByTaskIdOrGuid,
		selectIsMember,
		selectIsCreator,
		selectIsResponsible,
		selectIsPureCreator,
		selectIsAccomplice,
		selectIsAuditor,
		selectIsCreating,
		selectIsSupposedlyCompleted,
		selectIsCompleted,
		selectInProgress,
		selectIsDeferred,
		selectIsExpiredSoon,
		selectIsExpired,
		selectMarkedAsRemoved,
		selectWillExpire,
		selectCounter,
		selectHasChecklist,
		selectIsSubTasksLoaded,
		selectIsRelatedTasksLoaded,
		selectSubTasksById,
		selectSubTasksIdsByTaskId,
		selectRelatedTasksById,
		selectActions,
	} = require('tasks/statemanager/redux/slices/tasks/selector');
	const {
		create,
		update,
		updateDeadline,
		delegate,
		follow,
		unfollow,
		startTimer,
		pauseTimer,
		start,
		pause,
		complete,
		renew,
		defer,
		approve,
		disapprove,
		ping,
		pin,
		unpin,
		mute,
		unmute,
		addToFavorites,
		removeFromFavorites,
		remove,
		read,
		readAllForRole,
		readAllForProject,
		updateSubTasks,
		updateRelatedTasks,
	} = require('tasks/statemanager/redux/slices/tasks/thunk');
	const {
		fetch: taskResultFetched,
		create: taskResultCreate,
		remove: taskResultRemove,
	} = require('tasks/statemanager/redux/slices/tasks-results/thunk');
	const {
		createPending,
		createFulfilled,
		updatePending,
		updateFulfilled,
		updateDeadlinePending,
		updateDeadlineFulfilled,
		delegatePending,
		delegateFulfilled,
		followPending,
		followFulfilled,
		unfollowPending,
		unfollowFulfilled,
		startTimerPending,
		startTimerFulfilled,
		pauseTimerPending,
		pauseTimerFulfilled,
		startPending,
		startFulfilled,
		pausePending,
		pauseFulfilled,
		completePending,
		completeFulfilled,
		renewPending,
		renewFulfilled,
		deferPending,
		deferFullfilled,
		approvePending,
		approveFulfilled,
		disapprovePending,
		disapproveFulfilled,
		pingPending,
		pingFulfilled,
		pinPending,
		pinFulfilled,
		unpinPending,
		unpinFulfilled,
		mutePending,
		muteFulfilled,
		unmutePending,
		unmuteFulfilled,
		addToFavoritesPending,
		removeFromFavoritesPending,
		removePending,
		readPending,
		readFulfilled,
		readAllForRolePending,
		readAllForRoleFulfilled,
		readAllForProjectPending,
		readAllForProjectFulfilled,
		taskResultFetchedFulfilled,
		taskResultCreatedFulfilled,
		taskResultRemovedFulfilled,
		updateSubTasksPending,
		updateSubTasksFulfilled,
		updateRelatedTasksPending,
		updateRelatedTasksFulfilled,
	} = require('tasks/statemanager/redux/slices/tasks/extra-reducer');

	const tasksSlice = createSlice({
		name: sliceName,
		initialState,
		reducers: {
			tasksAdded: (state, { payload }) => {
				const tasks = payload.map((task) => {
					return TaskModel.prepareReduxTaskFromServerTask(task, state.entities[task.id]);
				});

				tasksAdapter.addMany(state, tasks);
			},
			tasksUpserted: (state, { payload }) => {
				const tasks = payload.map((task) => {
					return TaskModel.prepareReduxTaskFromServerTask(task, state.entities[task.id]);
				});

				tasksAdapter.upsertMany(state, tasks);
			},
			setRelatedTasks: (state, { payload }) => {
				const { taskId, relatedTasks } = payload;

				const task = state.entities[taskId];
				if (task)
				{
					tasksAdapter.upsertOne(state, {
						...task,
						relatedTasks,
					});
				}
			},
			taskUpdatedFromOldTaskModel: (state, { payload }) => {
				const { task: oldTaskModel } = payload;
				// eslint-disable-next-line no-underscore-dangle
				const task = state.entities[oldTaskModel._id];

				tasksAdapter.upsertOne(state, TaskModel.prepareReduxTaskFromOldTaskModel(oldTaskModel, task));
			},
			taskExpired: (state, { payload }) => {
				const { taskId } = payload;
				const task = state.entities[taskId];

				tasksAdapter.upsertOne(state, {
					...task,
					isExpired: true,
					isConsideredForCounterChange: true,
				});
			},
			taskRemoved: (state, { payload }) => {
				const { taskId } = payload;

				tasksAdapter.removeOne(state, taskId);
			},
			markAsRemoved: (state, { payload }) => {
				if (isOffline())
				{
					return;
				}

				const { taskId } = payload;
				const task = state.entities[taskId];

				tasksAdapter.upsertOne(state, {
					...task,
					isConsideredForCounterChange: true,
					isRemoved: true,
				});
			},
			unmarkAsRemoved: (state, { payload }) => {
				if (isOffline())
				{
					return;
				}

				const { taskId } = payload;
				const task = state.entities[taskId];

				tasksAdapter.upsertOne(state, {
					...task,
					isConsideredForCounterChange: true,
					isRemoved: false,
				});
			},
			updateChecklist: (state, { payload }) => {
				const { taskId, checklist, checklistDetails } = payload;
				const task = state.entities[taskId];

				tasksAdapter.upsertOne(state, {
					...task,
					checklist,
					checklistDetails,
				});
			},
			updateUploadingFiles: (state, { payload }) => {
				const { taskId, uploadedFiles } = payload;
				const task = state.entities[taskId];

				tasksAdapter.upsertOne(state, {
					...task,
					uploadedFiles,
				});
			},
			tasksRead: (state, { payload }) => {
				const { taskIds } = payload;
				const readTasks = (
					Object.values(state.entities)
						.filter((task) => taskIds.includes(task.id))
						.map((task) => ({ ...task, newCommentsCount: 0 }))
				);

				tasksAdapter.upsertMany(state, readTasks);
			},
		},
		extraReducers: (builder) => {
			builder
				.addCase(create.pending, createPending)
				.addCase(create.fulfilled, createFulfilled)
				.addCase(update.pending, updatePending)
				.addCase(update.fulfilled, updateFulfilled)
				.addCase(updateDeadline.pending, updateDeadlinePending)
				.addCase(updateDeadline.fulfilled, updateDeadlineFulfilled)
				.addCase(delegate.pending, delegatePending)
				.addCase(delegate.fulfilled, delegateFulfilled)
				.addCase(follow.pending, followPending)
				.addCase(follow.fulfilled, followFulfilled)
				.addCase(unfollow.pending, unfollowPending)
				.addCase(unfollow.fulfilled, unfollowFulfilled)
				.addCase(startTimer.pending, startTimerPending)
				.addCase(startTimer.fulfilled, startTimerFulfilled)
				.addCase(pauseTimer.pending, pauseTimerPending)
				.addCase(pauseTimer.fulfilled, pauseTimerFulfilled)
				.addCase(start.pending, startPending)
				.addCase(start.fulfilled, startFulfilled)
				.addCase(pause.pending, pausePending)
				.addCase(pause.fulfilled, pauseFulfilled)
				.addCase(complete.pending, completePending)
				.addCase(complete.fulfilled, completeFulfilled)
				.addCase(renew.pending, renewPending)
				.addCase(renew.fulfilled, renewFulfilled)
				.addCase(defer.pending, deferPending)
				.addCase(defer.fulfilled, deferFullfilled)
				.addCase(approve.pending, approvePending)
				.addCase(approve.fulfilled, approveFulfilled)
				.addCase(disapprove.pending, disapprovePending)
				.addCase(disapprove.fulfilled, disapproveFulfilled)
				.addCase(ping.pending, pingPending)
				.addCase(ping.fulfilled, pingFulfilled)
				.addCase(pin.pending, pinPending)
				.addCase(pin.fulfilled, pinFulfilled)
				.addCase(unpin.pending, unpinPending)
				.addCase(unpin.fulfilled, unpinFulfilled)
				.addCase(mute.pending, mutePending)
				.addCase(mute.fulfilled, muteFulfilled)
				.addCase(unmute.pending, unmutePending)
				.addCase(unmute.fulfilled, unmuteFulfilled)
				.addCase(addToFavorites.pending, addToFavoritesPending)
				.addCase(removeFromFavorites.pending, removeFromFavoritesPending)
				.addCase(remove.pending, removePending)
				.addCase(read.pending, readPending)
				.addCase(read.fulfilled, readFulfilled)
				.addCase(readAllForRole.pending, readAllForRolePending)
				.addCase(readAllForRole.fulfilled, readAllForRoleFulfilled)
				.addCase(readAllForProject.pending, readAllForProjectPending)
				.addCase(readAllForProject.fulfilled, readAllForProjectFulfilled)
				.addCase(taskResultFetched.fulfilled, taskResultFetchedFulfilled)
				.addCase(taskResultCreate.fulfilled, taskResultCreatedFulfilled)
				.addCase(taskResultRemove.fulfilled, taskResultRemovedFulfilled)
				.addCase(updateSubTasks.pending, updateSubTasksPending)
				.addCase(updateSubTasks.fulfilled, updateSubTasksFulfilled)
				.addCase(updateRelatedTasks.pending, updateRelatedTasksPending)
				.addCase(updateRelatedTasks.fulfilled, updateRelatedTasksFulfilled)
			;
		},
	});

	const { reducer: tasksReducer, actions } = tasksSlice;
	const {
		tasksAdded,
		tasksUpserted,
		setRelatedTasks,
		taskUpdatedFromOldTaskModel,
		taskExpired,
		taskRemoved,
		markAsRemoved,
		unmarkAsRemoved,
		updateChecklist,
		updateUploadingFiles,
		tasksRead,
	} = actions;

	ExpirationRegistry.setReducers({ taskExpired });
	ExpirationRegistry.setSelectors({ selectWillExpire });
	ReducerRegistry.register(sliceName, tasksReducer);

	module.exports = {
		tasksReducer,
		mapStateToTaskModel,

		tasksAdded,
		tasksUpserted,
		setRelatedTasks,
		taskUpdatedFromOldTaskModel,
		taskExpired,
		taskRemoved,
		markAsRemoved,
		unmarkAsRemoved,
		updateChecklist,
		updateUploadingFiles,
		tasksRead,

		selectAll,
		selectById,
		selectEntities,
		selectIds,
		selectTotal,
		selectByTaskIdOrGuid,
		selectIsMember,
		selectIsCreator,
		selectIsResponsible,
		selectIsPureCreator,
		selectIsAccomplice,
		selectIsAuditor,
		selectIsCreating,
		selectIsSupposedlyCompleted,
		selectIsCompleted,
		selectInProgress,
		selectIsDeferred,
		selectIsExpiredSoon,
		selectIsExpired,
		selectMarkedAsRemoved,
		selectWillExpire,
		selectCounter,
		selectActions,
		selectHasChecklist,
		selectIsSubTasksLoaded,
		selectIsRelatedTasksLoaded,
		selectSubTasksById,
		selectSubTasksIdsByTaskId,
		selectRelatedTasksById,

		create,
		update,
		updateDeadline,
		delegate,
		follow,
		unfollow,
		startTimer,
		pauseTimer,
		start,
		pause,
		complete,
		renew,
		defer,
		approve,
		disapprove,
		ping,
		pin,
		unpin,
		mute,
		unmute,
		addToFavorites,
		removeFromFavorites,
		remove,
		read,
		readAllForRole,
		readAllForProject,
		updateSubTasks,
		updateRelatedTasks,
	};
});
