/**
 * @module intranet/enum
 */
jn.define('intranet/enum', (require, exports, module) => {
	const { EmployeeActions } = require('intranet/enum/src/employee-actions');
	const { EmployeeStatus } = require('intranet/enum/src/employee-status');
	const { RequestStatus } = require('intranet/enum/src/request-status');

	module.exports = { EmployeeActions, EmployeeStatus, RequestStatus };
});
