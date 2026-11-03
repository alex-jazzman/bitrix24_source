jn.define('selector/providers/tree-providers/nested-department-provider/src/entities/structure-node', (require, exports, module) => {
	const { DepartmentEntity } = require('selector/providers/tree-providers/nested-department-provider/src/entities/department');

	class StructureNodeEntity extends DepartmentEntity
	{
		static getId()
		{
			return 'structure-node';
		}
	}

	module.exports = { StructureNodeEntity };
});
