/**
 * @module layout/socialnetwork/project-v2/create/src/view/permissions-settings
 */
jn.define('layout/socialnetwork/project-v2/create/src/view/permissions-settings', (require, exports, module) => {
	const { Box } = require('ui-system/layout/box');
	const { Area } = require('ui-system/layout/area');
	const { AreaList } = require('ui-system/layout/area-list');
	const { Loc } = require('loc');
	const { UIMenu } = require('layout/ui/menu');
	const { SettingSelectorList, SettingSelectorListItemDesign } = require('layout/ui/setting-selector-list');
	const { ProjectCreateSectionTitle } = require('layout/socialnetwork/project-v2/create/src/view/components/section-title');
	const { createTestIdGenerator } = require('utils/test');
	const {
		createProjectSettingsCloseGuard,
	} = require('layout/socialnetwork/project-v2/create/src/helpers/project-settings-close-guard');
	const {
		PermissionValueType,
		PermissionBooleanValueType,
		buildRoleMenuItems,
		buildBooleanMenuItems,
	} = require('layout/socialnetwork/permission-menu');
	const PermissionFieldType = {
		ROLE: 'role',
		BOOLEAN: 'boolean',
	};

	const roleMenuKeys = ['OWNER', 'OWNER_AND_MODERATORS', 'ALL'];

	const sectionItems = {
		projectManagement: [
			{
				id: 'initiate-perms',
				fieldId: 'initiatePerms',
				type: PermissionFieldType.ROLE,
				title: 'MOBILE_LAYOUT_PROJECT_V2_CREATE_INITIATE_PERMS_TITLE',
			},
			{
				id: 'message-writers',
				fieldId: 'messageWriters',
				type: PermissionFieldType.ROLE,
				title: 'MOBILE_LAYOUT_PROJECT_V2_CREATE_MESSAGE_WRITERS_TITLE',
			},
			{
				id: 'show-history',
				fieldId: 'showHistory',
				type: PermissionFieldType.BOOLEAN,
				title: 'MOBILE_LAYOUT_PROJECT_V2_CREATE_SHOW_HISTORY_TITLE',
			},
		],
		tasks: [
			{
				id: 'task-view-perms',
				fieldId: 'taskViewPerms',
				type: PermissionFieldType.ROLE,
				title: 'MOBILE_LAYOUT_PROJECT_V2_CREATE_TASK_VIEW_PERMS_TITLE',
			},
			{
				id: 'task-sort-perms',
				fieldId: 'taskSortPerms',
				type: PermissionFieldType.ROLE,
				title: 'MOBILE_LAYOUT_PROJECT_V2_CREATE_TASK_SORT_PERMS_TITLE',
			},
			{
				id: 'task-create-perms',
				fieldId: 'taskCreatePerms',
				type: PermissionFieldType.ROLE,
				title: 'MOBILE_LAYOUT_PROJECT_V2_CREATE_TASK_CREATE_PERMS_TITLE',
			},
			{
				id: 'task-edit-perms',
				fieldId: 'taskEditPerms',
				type: PermissionFieldType.ROLE,
				title: 'MOBILE_LAYOUT_PROJECT_V2_CREATE_TASK_EDIT_PERMS_TITLE',
			},
			{
				id: 'task-delete-perms',
				fieldId: 'taskDeletePerms',
				type: PermissionFieldType.ROLE,
				title: 'MOBILE_LAYOUT_PROJECT_V2_CREATE_TASK_DELETE_PERMS_TITLE',
			},
		],
		knowledgeBase: [
			{
				id: 'knowledge-view-perms',
				fieldId: 'knowledgeViewPerms',
				type: PermissionFieldType.ROLE,
				title: 'MOBILE_LAYOUT_PROJECT_V2_CREATE_KB_VIEW_PERMS_TITLE',
			},
			{
				id: 'knowledge-edit-perms',
				fieldId: 'knowledgeEditPerms',
				type: PermissionFieldType.ROLE,
				title: 'MOBILE_LAYOUT_PROJECT_V2_CREATE_KB_EDIT_PERMS_TITLE',
			},
			{
				id: 'knowledge-settings-perms',
				fieldId: 'knowledgeSettingsPerms',
				type: PermissionFieldType.ROLE,
				title: 'MOBILE_LAYOUT_PROJECT_V2_CREATE_KB_SETTINGS_PERMS_TITLE',
			},
			{
				id: 'knowledge-delete-perms',
				fieldId: 'knowledgeDeletePerms',
				type: PermissionFieldType.ROLE,
				title: 'MOBILE_LAYOUT_PROJECT_V2_CREATE_KB_DELETE_PERMS_TITLE',
			},
		],
	};

	const getVisibleSections = ({
		showChatSettings = true,
		showTaskPermissions = true,
		showKnowledgeBasePermissions = false,
	}) => {
		const projectManagementItems = sectionItems.projectManagement.filter((item) => {
			if (item.fieldId === 'messageWriters' || item.fieldId === 'showHistory')
			{
				return showChatSettings;
			}

			return true;
		});
		const sections = [
			{
				id: 'project-management',
				title: 'MOBILE_LAYOUT_PROJECT_V2_CREATE_PROJECT_MANAGEMENT_SECTION_TITLE',
				items: projectManagementItems,
			},
		];

		if (showTaskPermissions)
		{
			sections.push({
				id: 'tasks',
				title: 'MOBILE_LAYOUT_PROJECT_V2_CREATE_TASKS_SECTION_TITLE',
				items: sectionItems.tasks,
			});
		}

		if (showKnowledgeBasePermissions)
		{
			sections.push({
				id: 'knowledge-base',
				title: 'MOBILE_LAYOUT_PROJECT_V2_CREATE_KB_SECTION_TITLE',
				items: sectionItems.knowledgeBase,
			});
		}

		return sections;
	};

	class ProjectCreatePermissionsSettings extends LayoutComponent
	{
		constructor(props)
		{
			super(props);
			this.getTestId = createTestIdGenerator({
				prefix: 'project-create-permissions',
				context: this,
			});

			this.settingsSelectorItemsRefsMap = new Map();

			this.state = {
				initiatePerms: props.initiatePerms ?? PermissionValueType.ALL,
				messageWriters: props.messageWriters ?? PermissionValueType.ALL,
				showHistory: props.showHistory ?? PermissionBooleanValueType.TRUE,
				taskViewPerms: props.taskViewPerms ?? PermissionValueType.ALL,
				taskSortPerms: props.taskSortPerms ?? PermissionValueType.ALL,
				taskCreatePerms: props.taskCreatePerms ?? PermissionValueType.ALL,
				taskEditPerms: props.taskEditPerms ?? PermissionValueType.ALL,
				taskDeletePerms: props.taskDeletePerms ?? PermissionValueType.ALL,
				knowledgeViewPerms: props.knowledgeViewPerms ?? PermissionValueType.ALL,
				knowledgeEditPerms: props.knowledgeEditPerms ?? PermissionValueType.ALL,
				knowledgeSettingsPerms: props.knowledgeSettingsPerms ?? PermissionValueType.ALL,
				knowledgeDeletePerms: props.knowledgeDeletePerms ?? PermissionValueType.ALL,
			};
			this.initialFields = this.#getFields();
			this.closeGuard = null;
		}

		componentDidMount()
		{
			this.closeGuard = createProjectSettingsCloseGuard({
				layoutWidget: this.props.layoutWidget,
				preventLayoutWidget: this.props.rootLayoutWidget ?? this.props.layoutWidget,
				releasePreventDismiss: false,
				initialFields: this.initialFields,
				getCurrentFields: this.#getFields,
				onSaveAndClose: this.#close,
				onDiscardAndClose: this.#rollbackAndClose,
			});
		}

		render()
		{
			const sections = getVisibleSections({
				showChatSettings: this.props.showChatSettings !== false,
				showTaskPermissions: this.props.showTaskPermissions !== false,
				showKnowledgeBasePermissions: this.props.showKnowledgeBasePermissions === true,
			});

			return Box(
				{
					testId: this.getTestId(),
					resizableByKeyboard: true,
				},
				AreaList(
					{
						testId: this.getTestId('area-list'),
						resizableByKeyboard: true,
						showsVerticalScrollIndicator: true,
					},
					...sections.map((section, index) => Area(
						{
							isFirst: index === 0,
						},
						this.#renderSection(
							section.id,
							Loc.getMessage(section.title),
							section.items,
						),
					)),
				),
			);
		}

		#renderSection = (sectionId, title, items) => View(
			{
				testId: this.getTestId(`${sectionId}-section`),
			},
			ProjectCreateSectionTitle({
				text: title,
				testId: this.getTestId(`${sectionId}-title`),
			}),
			SettingSelectorList({
				testId: this.getTestId(`${sectionId}-list`),
				items: items.map((item) => ({
					id: item.id,
					fieldId: item.fieldId,
					type: item.type,
					title: Loc.getMessage(item.title),
					subtitle: this.#getItemSubtitle(item),
					design: SettingSelectorListItemDesign.OPENER,
				})),
				itemRef: this.#bindSettingsItemRef,
				onItemClick: this.#onSettingsItemClick,
			}),
		);

		#bindSettingsItemRef = (ref, item) => {
			this.settingsSelectorItemsRefsMap.set(item.id, ref);
		};

		#onSettingsItemClick = (item) => {
			const itemConfig = Object.values(sectionItems)
				.flat()
				.find((config) => config.id === item.id);

			if (!itemConfig)
			{
				return;
			}

			const menuItems = itemConfig.type === PermissionFieldType.BOOLEAN
				? this.#getBooleanMenuItems(itemConfig.fieldId)
				: this.#getRoleMenuItems(itemConfig.fieldId);

			const menu = new UIMenu(menuItems);
			menu.show({
				target: this.settingsSelectorItemsRefsMap.get(item.id),
			});
		};

		#getRoleMenuItems = (fieldId) => {
			return buildRoleMenuItems({
				keys: roleMenuKeys,
				currentValue: this.state[fieldId],
				getTitle: (key) => Loc.getMessage(`MOBILE_LAYOUT_PROJECT_V2_CREATE_INITIATE_PERMS_${key}`),
				onSelect: (value) => this.#updateField(fieldId, value),
			});
		};

		#getBooleanMenuItems = (fieldId) => {
			return buildBooleanMenuItems({
				currentValue: this.state[fieldId],
				getTitle: (key) => Loc.getMessage(`MOBILE_LAYOUT_PROJECT_V2_CREATE_BOOLEAN_${key}`),
				onSelect: (value) => this.#updateField(fieldId, value),
			});
		};

		#updateField(fieldId, value)
		{
			this.setState({ [fieldId]: value }, this.#emitChange);
		}

		#emitChange = () => {
			this.props.onChange?.(this.#getFields());
			this.closeGuard?.update();
		};

		#getFields = () => ({
				initiatePerms: this.state.initiatePerms,
				messageWriters: this.state.messageWriters,
				showHistory: this.state.showHistory,
				taskViewPerms: this.state.taskViewPerms,
				taskSortPerms: this.state.taskSortPerms,
				taskCreatePerms: this.state.taskCreatePerms,
				taskEditPerms: this.state.taskEditPerms,
				taskDeletePerms: this.state.taskDeletePerms,
				knowledgeViewPerms: this.state.knowledgeViewPerms,
				knowledgeEditPerms: this.state.knowledgeEditPerms,
				knowledgeSettingsPerms: this.state.knowledgeSettingsPerms,
				knowledgeDeletePerms: this.state.knowledgeDeletePerms,
		});

		#close = () => {
			this.props.layoutWidget?.close();
		};

		#rollbackAndClose = () => {
			this.props.onChange?.(this.initialFields);
			this.props.layoutWidget?.close();
		};

		#getItemSubtitle = (item) => {
			return item.type === PermissionFieldType.BOOLEAN
				? this.#getBooleanSubtitle(this.state[item.fieldId])
				: this.#getRoleSubtitle(this.state[item.fieldId]);
		};

		#getRoleSubtitle(value)
		{
			switch (value)
			{
				case PermissionValueType.OWNER:
					return Loc.getMessage('MOBILE_LAYOUT_PROJECT_V2_CREATE_INITIATE_PERMS_OWNER');
				case PermissionValueType.OWNER_AND_MODERATORS:
					return Loc.getMessage('MOBILE_LAYOUT_PROJECT_V2_CREATE_INITIATE_PERMS_OWNER_AND_MODERATORS');
				case PermissionValueType.ALL:
				default:
					return Loc.getMessage('MOBILE_LAYOUT_PROJECT_V2_CREATE_INITIATE_PERMS_ALL');
			}
		}

		#getBooleanSubtitle(value)
		{
			return value === PermissionBooleanValueType.FALSE
				? Loc.getMessage('MOBILE_LAYOUT_PROJECT_V2_CREATE_BOOLEAN_FALSE')
				: Loc.getMessage('MOBILE_LAYOUT_PROJECT_V2_CREATE_BOOLEAN_TRUE');
		}
	}

	module.exports = {
		ProjectCreatePermissionsSettings: (props) => new ProjectCreatePermissionsSettings(props),
	};
});
