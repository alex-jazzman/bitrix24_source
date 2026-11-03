/**
 * @module selector/providers/tree-providers/nested-department-provider/src/entities/department
 */

jn.define('selector/providers/tree-providers/nested-department-provider/src/entities/department', (require, exports, module) => {
	const { Color } = require('tokens');
	const { Icon } = require('assets/icons');
	const { BaseEntity } = require('selector/providers/tree-providers/nested-department-provider/src/entities/base-entity');
	const { Navigator } = require('selector/widget/entity/tree-selectors/shared/navigator');

	class DepartmentEntity extends BaseEntity
	{
		/**
		 * @param {NestedDepartmentEntityOptions} options
		 */
		constructor(options)
		{
			super();
			/** @type {NestedDepartmentEntityOptions} */
			this.options = options;
			/** @type {NestedDepartmentSelectorItem|null} */
			this.root = null;
		}

		/**
		 * @return {string}
		 */
		static getId()
		{
			return 'department';
		}

		/**
		 * @param {NestedDepartmentSelectorItem|null} root
		 * @return {void}
		 */
		setRoot(root)
		{
			this.root = root;
		}

		/**
		 * @return {NestedDepartmentDialogDepartmentOptions}
		 */
		getEntityOptions()
		{
			const {
				shouldAddCounters,
				allowFlatDepartments,
				allowSelectRootDepartment,
				allowedDepartmentIds,
				userOptions,
				onlyManagedHierarchy,
			} = this.options;

			return {
				allowFlatDepartments,
				allowSelectRootDepartment,
				allowedDepartmentIds,
				userOptions,
				onlyManagedHierarchy,
				selectMode: 'usersAndDepartments',
				shouldCountSubdepartments: shouldAddCounters(),
				shouldCountUsers: shouldAddCounters(),
			};
		}

		/**
		 * @param {NestedDepartmentSelectorItem} item
		 * @param {NestedDepartmentSelectorItem} initialEntity
		 * @return {NestedDepartmentSelectorItem}
		 */
		prepareItemForDrawing(item, initialEntity)
		{
			const departmentImageStyles = {
				backgroundColor: Color.accentExtraAqua.toHex(),
				image: {
					tintColor: Color.baseWhiteFixed.toHex(),
					contentHeight: 26,
					borderRadiusPx: 6,
				},
				border: {
					color: Color.accentExtraAqua.toHex(),
					width: 2,
				},
			};

			return this.prepareCommonStyles({
				item,
				initialEntity,
				imageStyles: departmentImageStyles,
				imageUrl: Icon.GROUP.getPath(),
			});
		}

		/**
		 * @param {NestedDepartmentEntityId} id
		 * @param {Array<NestedDepartmentSelectorItem>} items
		 * @return {NestedDepartmentSelectorItem|null|undefined}
		 */
		findItem(id, items)
		{
			return Navigator.findInTree(this.root, (item) => this.isEqualById(item, id));
		}
	}

	module.exports = { DepartmentEntity };
});
