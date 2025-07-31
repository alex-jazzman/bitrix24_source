/**
 * @module intranet/department-info/src/api
 */
jn.define('intranet/department-info/src/api', (require, exports, module) => {
	const getParentDepartments = async (departmentId) => {
		return BX.ajax.runAction('intranetmobile.department.getParents', {
			data: { departmentId },
		})
			.catch(console.error);
	};

	module.exports = {
		getParentDepartments,
	};
});
