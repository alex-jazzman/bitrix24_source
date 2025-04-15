/**
 * @module selector/providers/tree-providers/nested-department-provider/src/entities/department
 */

jn.define('selector/providers/tree-providers/nested-department-provider/src/entities/department', (require, exports, module) => {
	const { Color } = require('tokens');
	const { Icon } = require('assets/icons');
	const { withCurrentDomain } = require('utils/url');
	const { Navigator } = require('selector/widget/entity/tree-selectors/shared/navigator');

	/**
	 * @class DepartmentEntity
	 */
	class DepartmentEntity
	{
		constructor(options)
		{
			this.options = options;
			this.root = null;
		}

		static getId()
		{
			return 'department';
		}

		setRoot(root)
		{
			this.root = root;
		}

		getEntityForDialog()
		{
			const {
				shouldAddCounters,
				allowFlatDepartments,
				allowSelectRootDepartment,
			} = this.options;

			return {
				id: DepartmentEntity.getId(),
				dynamicLoad: true,
				dynamicSearch: true,
				filters: [],
				options: {
					allowFlatDepartments,
					allowSelectRootDepartment,
					selectMode: 'usersAndDepartments',
					shouldCountSubdepartments: shouldAddCounters(),
					shouldCountUsers: shouldAddCounters(),
				},
				searchable: true,
				substituteEntityId: null,
			};
		}

		prepareItemForDrawing(item, initialEntity)
		{
			const departmentImageStyles = {
				backgroundColor: Color.accentExtraAqua.getValue(),
				image: {
					tintColor: Color.baseWhiteFixed.getValue(),
					contentHeight: 26,
					borderRadiusPx: 6,
				},
				border: {
					color: Color.accentExtraAqua.getValue(),
					width: 2,
				},
			};

			return {
				...item,
				imageUrl: withCurrentDomain(Icon.GROUP.getPath()),
				shortTitle: initialEntity.shortTitle,
				subtitle: initialEntity.subtitle,
				// new styles' set up
				styles: {
					...item.styles,
					image: initialEntity?.styles?.image ?? departmentImageStyles,
					selectedImage: initialEntity?.styles?.selectedImage ?? departmentImageStyles,
				},
				// old styles' set up
				typeIconFrame: item.typeIconFrame ?? 1,
				color: item.typeIconFrame === 2 ? null : Color.accentExtraAqua.getValue(),
			};
		}

		findItem(id)
		{
			return Navigator.findInTree(this.root, (item) => (
				String(item.id) === String(id)
				&& String(item.entityId) === DepartmentEntity.getId()
			));
		}
	}

	module.exports = { DepartmentEntity };
});
