/**
 * @module selector/providers/tree-providers/nested-department-provider
 */
jn.define('selector/providers/tree-providers/nested-department-provider', (require, exports, module) => {
	const { Loc } = require('loc');
	const { CommonSelectorProvider } = require('selector/providers/common');
	const { UserEntity } = require('selector/providers/tree-providers/nested-department-provider/src/entities/user');
	const { MetaUserEntity } = require('selector/providers/tree-providers/nested-department-provider/src/entities/meta-user');
	const { DepartmentEntity } = require('selector/providers/tree-providers/nested-department-provider/src/entities/department');
	const { ProjectEntity } = require('selector/providers/tree-providers/nested-department-provider/src/entities/project');
	const { StructureNodeEntity } = require('selector/providers/tree-providers/nested-department-provider/src/entities/structure-node');

	const ScopesIds = {
		RECENT: 'recent',
		DEPARTMENT: 'department',
		PROJECT: 'project',
	};
	const DEPARTMENT_TAB_ID = 'departments';
	const RESTRICTED_VIRTUAL_ROOT_ID = 'restricted-virtual-root';
	const SUBORDINATE_DEPARTMENTS_ROOT = 'subordinate-departments-root';

	class NestedDepartmentProvider extends CommonSelectorProvider
	{
		/**
		 * @param {string} context
		 * @param {NestedDepartmentProviderOptions} options
		 */
		constructor(context, options = {})
		{
			super(context);
			this.setOptions(options);

			this.recentItems = null;
			this.restrictedVirtualRoot = null;
			this.entities = this.createEntities(options.enabledTabs);
		}

		/** @return {string} */
		getDepartmentEntityId()
		{
			return this.options.onlyManagedHierarchy ? StructureNodeEntity.getId() : DepartmentEntity.getId();
		}

		/**
		 * @param {Record<string, NestedDepartmentScope>} enabledTabs
		 * @return {Array<NestedDepartmentProviderEntity>}
		 */
		createEntities(enabledTabs)
		{
			return Object.keys(enabledTabs).flatMap((tabId) => {
				switch (tabId)
				{
					case ScopesIds.RECENT:
						return [
							this.options.addMetaUser && new MetaUserEntity(),
							this.createUserEntity(),
						].filter(Boolean);
					case ScopesIds.DEPARTMENT:
					{
						const EntityClass = this.options.onlyManagedHierarchy
							? StructureNodeEntity
							: DepartmentEntity;

						return [
							this.createUserEntity(),
							new EntityClass({
								shouldAddCounters: () => this.options.getScopeId() === ScopesIds.DEPARTMENT,
								allowFlatDepartments: this.options.allowFlatDepartments,
								allowSelectRootDepartment: this.options.allowSelectRootDepartment,
								allowedDepartmentIds: this.options.allowedDepartmentIds,
								userOptions: this.options.userOptions,
								onlyManagedHierarchy: this.options.onlyManagedHierarchy,
							}),
						];
					}
					case ScopesIds.PROJECT:
						return new ProjectEntity();
					default:
						return null;
				}
			}).filter(Boolean);
		}

		/** @return {UserEntity} */
		createUserEntity()
		{
			return new UserEntity({
				disableSearch: this.options.disableUserSearch,
				...(this.options.onlyManagedHierarchy ? { fillDialog: false } : {}),
				userOptions: this.options.userOptions,
			});
		}

		/**
		 * @param {NestedDepartmentProviderOptions} options
		 * @return {void}
		 */
		setOptions(options)
		{
			const preparedOptions = options || {};
			preparedOptions.entities = preparedOptions.entities || [];

			if (!Array.isArray(preparedOptions.entities))
			{
				preparedOptions.entities = Object.keys(preparedOptions.entities)
					.map((entityId) => ({
						...preparedOptions.entities[entityId],
						id: entityId,
					}));
			}

			this.options = preparedOptions;
			this.options.useLettersForEmptyAvatar = Boolean(preparedOptions.useLettersForEmptyAvatar);

			this.options.allowFlatDepartments ??= true;
			this.options.allowSelectRootDepartment ??= true;
			this.options.onlyManagedHierarchy ??= false;
			this.options.unselectableDepartmentButtons ??= false;
		}

		/** @return {NestedDepartmentProviderOptions} */
		getOptions()
		{
			return this.options || {};
		}

		/** @return {Promise<NestedDepartmentLoadResponse>} */
		fetchItemsFromServer()
		{
			return BX.ajax.runAction('ui.entityselector.load', {
				json: {
					dialog: this.getAjaxDialog(),
				},
				getParameters: {
					context: this.context,
				},
			});
		}

		/**
		 * @param {NestedDepartmentSelectorItem} department
		 * @return {Promise<Array<NestedDepartmentSelectorItem>>}
		 */
		async loadChildren(department)
		{
			if (this.isRestrictedVirtualRoot(department))
			{
				return this.getRestrictedVirtualRootChildren();
			}

			const response = await BX.ajax.runAction('ui.entityselector.getChildren', {
				json: {
					dialog: this.getAjaxDialog(),
					parentItem: { id: department.id, entityId: this.getDepartmentEntityId() },
				},
				getParameters: {
					context: this.context,
				},
			}).catch(console.error);

			let children = response.data?.dialog?.items;

			if (!children)
			{
				return [];
			}

			children = children.map((child) => ({
				...child,
				type: child.entityId === this.getDepartmentEntityId() ? 'button' : 'selectable',
			}));

			return children;
		}

		/** @return {NestedDepartmentSelectorItem|null} */
		getRestrictedVirtualRoot()
		{
			return this.restrictedVirtualRoot;
		}

		/**
		 * @param {Array<NestedDepartmentSelectorItem>} items
		 * @return {NestedDepartmentSelectorItem|null|undefined}
		 */
		getDepartmentRoot(items, departmentEntityId = this.getDepartmentEntityId())
		{
			if (this.getRestrictedVirtualRoot())
			{
				return this.getRestrictedVirtualRoot();
			}

			const rootDepartments = items.filter(({ entityId }) => entityId === departmentEntityId);
			if (this.options.onlyManagedHierarchy && rootDepartments.length > 1)
			{
				return {
					id: SUBORDINATE_DEPARTMENTS_ROOT,
					entityId: departmentEntityId,
					children: rootDepartments,
				};
			}

			return rootDepartments[0];
		}

		/** @return {Array<NestedDepartmentSelectorItem>} */
		getRestrictedVirtualRootChildren()
		{
			return (this.restrictedVirtualRoot?.children ?? []).map((child) => ({
				...child,
				type: child.entityId === this.getDepartmentEntityId() ? 'button' : child.type,
			}));
		}

		/**
		 * @param {NestedDepartmentSelectorItem|null|undefined} item
		 * @return {boolean}
		 */
		isRestrictedVirtualRoot(item)
		{
			return item?.customData?.isRestrictedVirtualRoot === true;
		}

		/**
		 * @param {Array<NestedDepartmentSelectorItem>} items
		 * @return {void}
		 */
		initRestrictedVirtualRoot(items)
		{
			this.restrictedVirtualRoot = null;
			if (this.options.useRestrictedVirtualRoot !== true)
			{
				return;
			}

			const departmentEntityId = this.getDepartmentEntityId();
			const departmentItems = items.filter(({ entityId }) => entityId === departmentEntityId);
			if (departmentItems.length === 0)
			{
				return;
			}

			this.restrictedVirtualRoot = {
				id: RESTRICTED_VIRTUAL_ROOT_ID,
				entityId: departmentEntityId,
				title: this.options.restrictedVirtualRootTitle || '',
				tabs: DEPARTMENT_TAB_ID,
				children: departmentItems,
				customData: {
					isRestrictedVirtualRoot: true,
				},
				nodeOptions: {
					dynamic: false,
					open: true,
				},
			};
		}

		/**
		 * @param {NestedDepartmentDialogData} dialog
		 * @return {Array<NestedDepartmentSelectorItem>}
		 */
		initRecentItems(dialog)
		{
			const {
				items,
				recentItems: recentItemsIds = [],
				preselectedItems: preselectedItemsIds = [],
			} = dialog;

			const departmentEntityId = this.getDepartmentEntityId();
			const departmentEntity = this.resolveEntity(departmentEntityId);

			if (departmentEntity)
			{
				departmentEntity.setRoot(this.getDepartmentRoot(items, departmentEntityId));
			}

			let metaUser = false;

			const recentItems = [...preselectedItemsIds, ...recentItemsIds]
				.map(([entity, id]) => {
					const item = this.resolveEntity(entity)?.findItem(id, items);

					if (entity === MetaUserEntity.getId())
					{
						metaUser = item;

						return null;
					}

					return item;
				})
				.filter(Boolean);

			if (metaUser)
			{
				recentItems.unshift(metaUser);
			}

			return recentItems;
		}

		/** @return {Promise<void>} */
		async loadRecent()
		{
			if (this.recentItems)
			{
				this.onRecentLoaded();

				return;
			}

			const { data: { dialog } } = await this.fetchItemsFromServer().catch(console.error);
			this.initRestrictedVirtualRoot(dialog.items);
			this.options.onItemsLoadedFromServer?.(dialog.items);
			this.recentItems = this.initRecentItems(dialog);
			this.items = dialog.items;
			this.onRecentLoaded();
		}

		/** @return {void} */
		onRecentLoaded()
		{
			this.listener.onRecentResult(
				this.recentItems?.map((recentItem) => this.prepareItemForDrawing(recentItem)),
				false,
			);

			this.options.onInitialItemsLoad?.(this.items);
		}

		/** @return {Promise<Array<NestedDepartmentSelectorItem>>} */
		async loadGroups()
		{
			const params = {
				id: 'mobile',
				context: this.context,
				entities: [
					{
						dynamicLoad: true,
						dynamicSearch: true,
						filters: [],
						id: ProjectEntity.getId(),
						searchable: true,
					},
				],
				recentItemsLimit: this.options.recentItemsLimit,
			};

			try
			{
				const response = await BX.ajax.runAction('ui.entityselector.load', {
					json: {
						dialog: params,
					},
					getParameters: {
						context: this.context,
					},
				});

				const { items } = response.data.dialog;

				return items;
			}
			catch (error)
			{
				console.error(error);

				return [];
			}
		}

		/** @return {NestedDepartmentAjaxDialog} */
		getAjaxDialog()
		{
			return {
				id: 'mobile',
				context: this.context,
				preselectedItems: this.preselectedItems,
				entities: this.getEntities(),
				recentItemsLimit: this.options.recentItemsLimit,
			};
		}

		/** @return {Array<NestedDepartmentEntityDialog>} */
		getEntities()
		{
			return this.entities
				.filter((entity) => (
					!this.options.onlyManagedHierarchy
					|| entity.constructor.getId() === StructureNodeEntity.getId()
					|| entity.constructor.getId() === UserEntity.getId()
				))
				.map((entity) => entity.getEntityForDialog())
			;
		}

		/** @return {Array<NestedDepartmentSelectorItem>|null} */
		getRecentItems()
		{
			return this.recentItems;
		}

		/**
		 * @param {NestedDepartmentSelectorItem} entity
		 * @return {NestedDepartmentSelectorItem}
		 */
		prepareItemForDrawing(entity)
		{
			let preparedEntity = super.prepareItemForDrawing(entity);

			preparedEntity.params.customData = {
				...preparedEntity.params.customData,
				sourceEntity: entity,
			};

			preparedEntity.styles ??= {};

			preparedEntity = this.resolveEntity(entity.entityId)?.prepareItemForDrawing(preparedEntity, entity);

			if (entity.type === 'button')
			{
				preparedEntity.type = 'department';
				preparedEntity.id += '/button';

				if (this.options.unselectableDepartmentButtons)
				{
					preparedEntity.unselectable = true;
				}
			}
			else if (entity.type === 'selectable')
			{
				preparedEntity.type = null;
			}

			return preparedEntity;
		}

		/**
		 * @param {string} entityId
		 * @return {NestedDepartmentProviderEntity|undefined}
		 */
		resolveEntity(entityId)
		{
			return this.entities.find((entity) => entityId === entity.constructor.getId());
		}

		/**
		 * @param {Array<NestedDepartmentSelectorItem>} items
		 * @return {Array<NestedDepartmentSelectorItem>}
		 */
		prepareItems(items)
		{
			const preparedItems = items.map((item) => {
				const { subdepartmentsCount, usersCount } = (item.customData || {});

				if (item.type !== 'button' || item.entityId !== this.getDepartmentEntityId())
				{
					return item;
				}

				const usersCountStr = usersCount
					? Loc.getMessagePlural(
						'NESTED_DEPARTMENT_PROVIDER_USERS_COUNT',
						usersCount,
						{
							'#COUNT#': usersCount,
						},
					)
					: '';
				const subdepartmentsCountStr = subdepartmentsCount
					? Loc.getMessagePlural(
						'NESTED_DEPARTMENT_PROVIDER_SUBDEPARTMENTS_COUNT',
						subdepartmentsCount,
						{
							'#COUNT#': subdepartmentsCount,
						},
					)
					: '';
				const delimiter = usersCountStr === '' || subdepartmentsCountStr === '' ? '' : ' | ';

				return {
					...item,
					subtitle: `${usersCountStr}${delimiter}${subdepartmentsCountStr}`,
				};
			});

			return super.prepareItems(preparedItems);
		}
	}

	module.exports = { NestedDepartmentProvider, ScopesIds };
});
