/**
 * @module selector/providers/tree-providers/nested-department-provider
 */
jn.define('selector/providers/tree-providers/nested-department-provider', (require, exports, module) => {
	const { Loc } = require('loc');
	const { CommonSelectorProvider } = require('selector/providers/common');
	const { Type } = require('type');
	const { UserEntity } = require('selector/providers/tree-providers/nested-department-provider/src/entities/user');
	const { MetaUserEntity } = require('selector/providers/tree-providers/nested-department-provider/src/entities/meta-user');
	const { DepartmentEntity } = require('selector/providers/tree-providers/nested-department-provider/src/entities/department');

	const ScopesIds = {
		RECENT: 'recent',
		DEPARTMENT: 'department',
	};

	/**
	 * @class NestedDepartmentProvider
	 */
	class NestedDepartmentProvider extends CommonSelectorProvider
	{
		constructor(context, options = {})
		{
			super(context);
			this.setOptions(options);

			this.recentItems = null;
			this.entities = [
				this.options.addMetaUser && new MetaUserEntity(),
				new UserEntity(),
				new DepartmentEntity({
					shouldAddCounters: () => this.options.getScopeId() === ScopesIds.DEPARTMENT,
					allowFlatDepartments: this.options.allowFlatDepartments,
					allowSelectRootDepartment: this.options.allowSelectRootDepartment,
				}),
			].filter(Boolean);
		}

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
		}

		getOptions()
		{
			return this.options || {};
		}

		loadItems()
		{
			return BX.ajax.runAction('ui.entityselector.load', {
				json: {
					dialog: this.getAjaxDialog(),
				},
				getParameters: {
					context: this.context,
				},
			})
				.then((response) => {
					const { items } = response.data.dialog;
					this.items = items;

					if (Type.isFunction(this.options.onItemsLoadedFromServer))
					{
						this.options.onItemsLoadedFromServer(items);
					}

					this.recentItems = this.mapRecentItemsByIds(response.data.dialog);
				})
				.catch(console.error);
		}

		async loadChildren(department)
		{
			const response = await BX.ajax.runAction('ui.entityselector.getChildren', {
				json: {
					dialog: this.getAjaxDialog(),
					parentItem: { id: department.id, entityId: DepartmentEntity.getId() },
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
				type: child.entityId === DepartmentEntity.getId() ? 'button' : 'selectable',
			}));

			return children;
		}

		mapRecentItemsByIds(dialog)
		{
			const {
				items,
				recentItems: recentItemsIds = [],
				preselectedItems: preselectedItemsIds = [],
			} = dialog;

			const departmentRoot = items.find(({ entityId }) => entityId === DepartmentEntity.getId());
			this.resolveEntity(
				DepartmentEntity.getId(),
			).setRoot(departmentRoot);

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

		loadRecent()
		{
			const onRecentLoaded = () => {
				this.listener.onRecentResult(
					this.recentItems?.map((recentItem) => this.prepareItemForDrawing(recentItem)),
					false,
				);

				if (Type.isFunction(this.options.onRecentLoaded))
				{
					this.options.onRecentLoaded(this.items);
				}
			};

			if (this.recentItems)
			{
				onRecentLoaded();

				return;
			}

			this.loadItems()
				.then(() => {
					onRecentLoaded();
				})
				.catch(console.error);
		}

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

		getEntities()
		{
			return this.entities.map((entity) => entity.getEntityForDialog());
		}

		getRecentItems()
		{
			return this.recentItems;
		}

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
				preparedEntity.type = Application.getApiVersion() < 56 ? 'info' : 'department';
				preparedEntity.id += '/button';
			}
			else if (entity.type === 'selectable')
			{
				preparedEntity.type = null;
			}

			return preparedEntity;
		}

		resolveEntity(entityId)
		{
			return this.entities.find((entity) => entityId === entity.constructor.getId());
		}

		prepareItems(items)
		{
			const preparedItems = items.map((item) => {
				const { subdepartmentsCount, usersCount } = (item.customData || {});

				if (item.type !== 'button' || item.entityId !== DepartmentEntity.getId())
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
