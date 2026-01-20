/**
 * @module tasks/statemanager/redux/slices/tasks-results-v2/thunk
 */
jn.define('tasks/statemanager/redux/slices/tasks-results-v2/thunk', (require, exports, module) => {
	const { createAsyncThunk } = require('statemanager/redux/toolkit');
	const { RunActionExecutor } = require('rest/run-action-executor');
	const { isOnline } = require('device/connection');
	const { sliceName } = require('tasks/statemanager/redux/slices/tasks-results-v2/meta');

	const runActionPromise = (action, options = {}, navigation = {}) => (
		new Promise((resolve) => {
			void new RunActionExecutor(action, options, navigation)
				.enableJson()
				.setHandler(resolve)
				.call()
			;
		})
	);
	const condition = () => isOnline();

	const tail = createAsyncThunk(
		`${sliceName}:taskResult/tail`,
		({ taskId, navigation }) => (
			runActionPromise('tasksmobile.v2.Task.Result.tail', { taskId }, navigation)
		),
		{ condition },
	);

	const getAll = createAsyncThunk(
		`${sliceName}:taskResult/getAll`,
		({ taskId }) => (
			runActionPromise('tasksmobile.v2.Task.Result.getAll', { taskId })
		),
		{ condition },
	);

	const get = createAsyncThunk(
		`${sliceName}:taskResult/get`,
		({ resultId }) => (
			runActionPromise('tasksmobile.v2.Task.Result.get', { resultId })
		),
		{ condition },
	);

	const addFromMessage = createAsyncThunk(
		`${sliceName}:taskResult/addFromMessage`,
		({ messageId }) => (
			runActionPromise('tasksmobile.v2.Task.Result.addFromMessage', { messageId })
		),
		{ condition },
	);

	const add = createAsyncThunk(
		`${sliceName}:taskResult/add`,
		({ result }) => (
			runActionPromise('tasksmobile.v2.Task.Result.add', { result })
		),
		{ condition },
	);

	const update = createAsyncThunk(
		`${sliceName}:taskResult/update`,
		({ result }) => (
			runActionPromise('tasksmobile.v2.Task.Result.update', { result })
		),
		{ condition },
	);

	const remove = createAsyncThunk(
		`${sliceName}:taskResult/remove`,
		({ resultId }) => (
			runActionPromise('tasksmobile.v2.Task.Result.delete', { resultId })
		),
		{ condition },
	);

	module.exports = {
		tail,
		getAll,
		get,
		addFromMessage,
		add,
		update,
		remove,
	};
});
