/**
 * @module more-menu/block/company/personal-account/src/api/salary-vacation-api
 */
jn.define('more-menu/block/company/personal-account/src/api/salary-vacation-api', (require, exports, module) => {
	const { RunActionExecutor } = require('rest/run-action-executor');
	const { PerfPoint } = require('debug/prism');

	const ACTION = {
		requestPin: 'humanresources.HcmLink.SalaryVacation.requestPin',
		requestDocument: 'humanresources.HcmLink.SalaryVacation.requestDocument',
		getResult: 'humanresources.HcmLink.SalaryVacation.getResult',
	};

	/**
	 * Thin client over the humanresources HCM Link salary/vacation flow actions.
	 * The only place that knows the server contract (action and parameter names);
	 * flow and steps call these methods, never RunActionExecutor directly.
	 *
	 * @class SalaryVacationApi
	 */
	class SalaryVacationApi
	{
		/**
		 * @param {{ companyId: number, employeeId: number, type: string }} params
		 * @return {Promise<{ taskId: number }>}
		 */
		async requestPin({ companyId, employeeId, type })
		{
			const point = new PerfPoint('Personal Account Request PIN', type).start();
			try
			{
				const response = await this.#runAction(ACTION.requestPin, {
					companyId,
					employeeId,
					type,
				});

				return { taskId: response?.data?.taskId };
			}
			finally
			{
				point.end();
			}
		}

		/**
		 * `period` ({ month, year }) is sent for salary only; vacation ignores it.
		 *
		 * @param {{ companyId: number, employeeId: number, type: string, pin: string, period?: { month: number, year: number } }} params
		 * @return {Promise<{ taskId: number }>}
		 */
		async requestDocument({ companyId, employeeId, type, pin, period })
		{
			const point = new PerfPoint('Personal Account Request Document', type).start();
			try
			{
				const options = {
					companyId,
					employeeId,
					type,
					pin,
				};

				if (type === 'salary' && period)
				{
					options.period = period;
				}

				const response = await this.#runAction(ACTION.requestDocument, options);

				return { taskId: response?.data?.taskId };
			}
			finally
			{
				point.end();
			}
		}

		/**
		 * @param {{ taskId: number, companyId: number, employeeId: number }} params
		 * @return {Promise<object>}
		 */
		async getResult({ taskId, companyId, employeeId })
		{
			const response = await this.#runAction(ACTION.getResult, {
				taskId,
				companyId,
				employeeId,
			});

			return response?.data;
		}

		/**
		 * @param {string} action
		 * @param {object} options
		 * @return {Promise<object>}
		 */
		#runAction(action, options = {})
		{
			return new Promise((resolve, reject) => {
				(new RunActionExecutor(action, options))
					.setHandler((response) => {
						if (response?.errors?.length > 0)
						{
							reject(response);

							return;
						}

						resolve(response);
					})
					.call();
			});
		}
	}

	module.exports = { SalaryVacationApi };
});
