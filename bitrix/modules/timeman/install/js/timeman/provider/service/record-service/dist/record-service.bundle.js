/* eslint-disable */
this.BX = this.BX || {};
this.BX.Timeman = this.BX.Timeman || {};
this.BX.Timeman.Provider = this.BX.Timeman.Provider || {};
(function (exports, main_core) {
	'use strict';

	class RecordService {
		async getCurrentRecord(userId) {
			const response = await main_core.ajax.runAction('timeman.V2.Record.getCurrentRecord', {
				json: {
					userId
				}
			});
			return response?.data ?? null;
		}
	}
	const recordService = new RecordService();

	exports.RecordService = RecordService;
	exports.recordService = recordService;

})(this.BX.Timeman.Provider.Service = this.BX.Timeman.Provider.Service || {}, BX);
//# sourceMappingURL=record-service.bundle.js.map
