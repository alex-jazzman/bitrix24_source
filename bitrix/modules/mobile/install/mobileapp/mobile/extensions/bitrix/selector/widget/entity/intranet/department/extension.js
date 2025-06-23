/**
 * @module selector/widget/entity/intranet/department
 */
jn.define('selector/widget/entity/intranet/department', (require, exports, module) => {
	const { Loc } = require('loc');
	const { mergeImmutable, clone } = require('utils/object');
	const { BaseSelectorEntity } = require('selector/widget/entity');
	const { isModuleInstalled } = require('module');

	/**
	 * @class DepartmentSelector
	 */
	class DepartmentSelector extends BaseSelectorEntity
	{
		/**
		 * @returns {Object}
		 */
		static get selectModes()
		{
			return {
				MODE_DEPARTMENTS_ONLY: 'departmentsOnly',
				MODE_USERS_ONLY: 'usersOnly',
				MODE_USERS_AND_DEPARTMENTS: 'usersAndDepartments',
			};
		}

		/**
		 * @returns {string}
		 */
		static getEntityId()
		{
			return 'structure-node';
		}

		/**
		 * @returns {string}
		 */
		static getContext()
		{
			return 'mobile-department';
		}

		/**
		 * @returns {string}
		 */
		static getStartTypingText()
		{
			return Loc.getMessage('SELECTOR_COMPONENT_START_TYPING_TO_SEARCH_DEPARTMENT');
		}

		/**
		 * @returns {string}
		 */
		static getTitle()
		{
			return Loc.getMessage('SELECTOR_COMPONENT_PICK_DEPARTMENT');
		}

		/**
		 * @param {Object} providerOptions
		 * @param {Array} entityIds
		 * @returns {Array}
		 */
		static getEntitiesOptions(providerOptions, entityIds)
		{
			return [
				{
					id: entityIds[0],
					options: mergeImmutable(this.getDefaultProviderOption(), providerOptions),
					searchable: true,
					dynamicLoad: true,
					dynamicSearch: true,
				},
			];
		}

		/**
		 * @param {Object} providerOptions
		 * @param {Object} createOptions
		 * @returns {boolean}
		 */
		static isCreationEnabled(providerOptions, createOptions)
		{
			return false;
		}

		static canCreateWithEmptySearch()
		{
			return false;
		}

		static getCreateText()
		{
			return Loc.getMessage('SELECTOR_COMPONENT_CREATE_DEPARTMENT');
		}

		static getCreatingText()
		{
			return Loc.getMessage('SELECTOR_COMPONENT_CREATE_DEPARTMENT');
		}

		static getCreateEntityHandler(providerOptions, createOptions)
		{
			return async (text, allowMultipleSelection) => {
				if (!isModuleInstalled('intranet'))
				{
					return Promise.reject(new Error('Module "intranet" is not installed'));
				}

				const { CreateDepartment } = require('intranet/create-department');
				const { shouldCheckNeedToBeMemberOfNewDepartment, getParentLayout } = createOptions;

				return new Promise((resolve, reject) => {
					CreateDepartment.open({
						parentWidget: getParentLayout?.() ?? null,
						showToastAfterCreation: false,
						showToastAfterCreationError: false,
						shouldCheckNeedToBeMemberOfNewDepartment,
						onSave: (department) => {
							if (department)
							{
								resolve(department);
							}
							else
							{
								reject();
							}
						},
						onError: reject,
						onClose: reject,
					});
				});
			};
		}

		/**
		 * @returns {Object}
		 */
		static getDefaultProviderOption()
		{
			return {
				selectMode: this.selectModes.MODE_DEPARTMENTS_ONLY,
				allowOnlyUserDepartments: false,
				allowFlatDepartments: true,
				allowSelectRootDepartment: true,
				fillRecentTab: true,
				fillDepartmentsTab: false,
				depthLevel: 2,
			};
		}

		static make(props)
		{
			const originalProps = clone(props);
			const selectorInstance = super.make(props);
			void DepartmentSelector.loadPermissions(selectorInstance, originalProps);

			return selectorInstance;
		}

		static async loadPermissions(selectorInstance, originalProps)
		{
			if (isModuleInstalled('intranet'))
			{
				const { fetchDepartmentPermissions } = require('intranet/create-department');
				await fetchDepartmentPermissions((response) => {
					if (!response || response?.status === 'error')
					{
						return;
					}

					const permissions = response.data;
					if (originalProps?.createOptions?.enableCreation !== false && permissions.canCreateNewDepartment)
					{
						selectorInstance.enableCreation(DepartmentSelector.getCreateEntityHandler(
							selectorInstance.provider.options.entities[0].options,
							selectorInstance.createOptions,
						));
					}
					else
					{
						selectorInstance.disableCreation();
					}
				});
			}
		}
	}

	module.exports = { DepartmentSelector };
});
