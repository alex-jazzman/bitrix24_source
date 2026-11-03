/**
 * @module timeman/statemanager/redux/slices/worktime/thunk
 */
jn.define('timeman/statemanager/redux/slices/worktime/thunk', (require, exports, module) => {
	const { createAsyncThunk } = require('statemanager/redux/toolkit');
	const { RunActionExecutor } = require('rest/run-action-executor');
	const { isOnline } = require('device/connection');
	const { sliceName } = require('timeman/statemanager/redux/slices/worktime/meta');

	const DEVICE = 'mobile';

	const runActionPromise = ({ action, options }) => new Promise((resolve, reject) => {
		(new RunActionExecutor(action, options))
			.enableJson()
			.setHandler((response) => {
				if (response.errors?.length > 0)
				{
					const error = new Error(response.errors[0].message);
					error.code = response.errors[0].code;
					reject(error);
				}
				else
				{
					resolve(response);
				}
			})
			.setSkipDuplicateRequests()
			.call(false)
			.catch(console.error);
	});

	const condition = () => isOnline();

	const fetchCurrentRecord = createAsyncThunk(
		`${sliceName}/fetchCurrentRecord`,
		async () => {
			const response = await runActionPromise({
				action: 'timeman.V2.Record.getCurrentRecord',
				options: { userId: env.userId },
			});

			const record = response?.data ?? null;

			return { record };
		},
		{ condition },
	);

	const startWorkday = createAsyncThunk(
		`${sliceName}/start`,
		async (params, { rejectWithValue }) => {
			try
			{
				const response = await runActionPromise({
					action: 'timeman.V2.Record.start',
					options: { device: DEVICE },
				});

				return response?.data ?? null;
			}
			catch (error)
			{
				return rejectWithValue({ code: error.code, message: error.message });
			}
		},
		{ condition },
	);

	const pauseWorkday = createAsyncThunk(
		`${sliceName}/pause`,
		async (params, { rejectWithValue }) => {
			try
			{
				const response = await runActionPromise({
					action: 'timeman.V2.Record.pause',
					options: { device: DEVICE },
				});

				return response?.data ?? null;
			}
			catch (error)
			{
				return rejectWithValue({ code: error.code, message: error.message });
			}
		},
		{ condition },
	);

	const continueWorkday = createAsyncThunk(
		`${sliceName}/continue`,
		async (params, { rejectWithValue }) => {
			try
			{
				const response = await runActionPromise({
					action: 'timeman.V2.Record.continue',
					options: { device: DEVICE },
				});

				return response?.data ?? null;
			}
			catch (error)
			{
				return rejectWithValue({ code: error.code, message: error.message });
			}
		},
		{ condition },
	);

	/**
	 * @param {Object} params
	 * @param {string} [params.reason]
	 * @param {number} [params.stopTimestamp]
	 */
	const stopWorkday = createAsyncThunk(
		`${sliceName}/stop`,
		async (params, { rejectWithValue }) => {
			const { reason, stopTimestamp } = params ?? {};
			const options = { device: DEVICE };
			if (reason)
			{
				options.reason = reason;
			}

			if (stopTimestamp)
			{
				options.stopTimestamp = stopTimestamp;
			}

			try
			{
				const response = await runActionPromise({
					action: 'timeman.V2.Record.stop',
					options,
				});

				return response?.data ?? null;
			}
			catch (error)
			{
				return rejectWithValue({ code: error.code, message: error.message });
			}
		},
		{ condition },
	);

	module.exports = {
		fetchCurrentRecord,
		startWorkday,
		pauseWorkday,
		continueWorkday,
		stopWorkday,
	};
});
