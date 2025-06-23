import { EntityTypes } from 'humanresources.company-structure.utils';
import { mapState, mapWritableState } from 'ui.vue3.pinia';
import { useChartStore } from 'humanresources.company-structure.chart-store';
import { getMemberRoles, MemberRolesType } from 'humanresources.company-structure.api';
import { PermissionActions, PermissionChecker } from 'humanresources.company-structure.permission-checker';
import { AnalyticsSourceType } from 'humanresources.company-structure.api';
import { UsersTabActionMenu } from 'humanresources.company-structure.org-chart';
import { HeadListDataTestIds, EmployeeListDataTestIds } from './consts';
import { EmptyTabAddButton } from './empty-tab-add-button';
import { UserListItem } from './item/item';
import { EmptyState } from '../base-components/empty-state/empty-state';
import { TabList } from '../base-components/list/list';
import { SearchInput } from '../base-components/search/search-input';
import { DepartmentAPI } from '../../api';
import { DepartmentContentActions } from '../../actions';
import type { TabListDataTestIds } from '../base-components/list/types';

import 'ui.buttons';
import './styles/tab.css';

type DepartmentUsersStatus = {
	departmentId: number;
	loaded: boolean;
};

// @vue/component
export const UsersTab = {
	name: 'usersTab',

	components: {
		SearchInput,
		EmptyState,
		TabList,
		EmptyTabAddButton,
		UserListItem,
	},

	emits: ['showDetailLoader', 'hideDetailLoader'],

	data(): Object
	{
		return {
			searchQuery: '',
			selectedUserId: null,
			needToScroll: false,
		};
	},

	computed: {
		memberRoles(): MemberRolesType
		{
			return getMemberRoles(this.entityType);
		},
		heads(): Array
		{
			return this.departments.get(this.focusedNode).heads ?? [];
		},
		headCount(): number
		{
			return this.heads.length ?? 0;
		},
		departmentId(): number
		{
			return this.focusedNode;
		},
		formattedHeads(): Array
		{
			return this.heads.map((head) => ({
				...head,
				subtitle: head.workPosition,
				badgeText: this.getBadgeText(head.role),
			})).sort((a, b) => {
				const roleOrder = {
					[this.memberRoles.head]: 1,
					[this.memberRoles.deputyHead]: 2,
				};

				const roleA = roleOrder[a.role] || 3;
				const roleB = roleOrder[b.role] || 3;

				return roleA - roleB;
			});
		},
		filteredHeads(): Array
		{
			return this.formattedHeads.filter(
				(head) => head.name.toLowerCase().includes(this.searchQuery.toLowerCase())
					|| head.workPosition?.toLowerCase().includes(this.searchQuery.toLowerCase()),
			);
		},
		employeeCount(): number
		{
			const memberCount = this.departments.get(this.focusedNode).userCount ?? 0;

			return memberCount - (this.headCount ?? 0);
		},
		formattedEmployees(): Array
		{
			return this.employees.map((employee) => ({
				...employee,
				subtitle: employee.workPosition,
			})).reverse();
		},
		filteredEmployees(): Array
		{
			return this.formattedEmployees.filter(
				(employee) => employee.name.toLowerCase().includes(this.searchQuery.toLowerCase())
					|| employee.workPosition?.toLowerCase().includes(this.searchQuery.toLowerCase()),
			);
		},
		memberCount(): number
		{
			return this.departments.get(this.focusedNode).userCount ?? 0;
		},
		...mapState(useChartStore, ['focusedNode', 'departments', 'searchedUserId']),
		...mapWritableState(useChartStore, ['searchedUserId']),
		employees(): Array
		{
			return this.departments.get(this.focusedNode)?.employees ?? [];
		},
		showSearchBar(): boolean
		{
			return this.memberCount > 0;
		},
		showSearchEmptyState(): boolean
		{
			return this.filteredHeads.length === 0 && this.filteredEmployees.length === 0;
		},
		canAddUsers(): boolean
		{
			const permissionChecker = PermissionChecker.getInstance();
			if (!permissionChecker)
			{
				return false;
			}

			const nodeId = this.focusedNode;
			const permission = this.isTeamEntity
				? PermissionActions.teamAddMember
				: PermissionActions.employeeAddToDepartment
			;

			return permissionChecker.hasPermission(permission, nodeId);
		},
		headListEmptyStateTitle(): string
		{
			if (this.canAddUsers)
			{
				return this.isTeamEntity
					? this.loc('HUMANRESOURCES_COMPANY_STRUCTURE_DEPARTMENT_CONTENT_TAB_USERS_TEAM_HEAD_EMPTY_LIST_ITEM_TITLE')
					: this.loc('HUMANRESOURCES_COMPANY_STRUCTURE_DEPARTMENT_CONTENT_TAB_USERS_HEAD_EMPTY_LIST_ITEM_TITLE');
			}

			return this.isTeamEntity
				? this.loc('HUMANRESOURCES_COMPANY_STRUCTURE_DEPARTMENT_CONTENT_TAB_USERS_TEAM_HEAD_EMPTY_LIST_ITEM_TITLE_WITHOUT_ADD_PERMISSION')
				: this.loc('HUMANRESOURCES_COMPANY_STRUCTURE_DEPARTMENT_CONTENT_TAB_USERS_HEAD_EMPTY_LIST_ITEM_TITLE_WITHOUT_ADD_PERMISSION');
		},
		employeesListEmptyStateTitle(): string
		{
			if (this.canAddUsers)
			{
				return this.isTeamEntity
					? this.loc('HUMANRESOURCES_COMPANY_STRUCTURE_DEPARTMENT_CONTENT_TAB_USERS_TEAM_EMPLOYEE_EMPTY_LIST_ITEM_TITLE')
					: this.loc('HUMANRESOURCES_COMPANY_STRUCTURE_DEPARTMENT_CONTENT_TAB_USERS_EMPLOYEE_EMPTY_LIST_ITEM_TITLE');
			}

			return this.isTeamEntity
				? this.loc('HUMANRESOURCES_COMPANY_STRUCTURE_DEPARTMENT_CONTENT_TAB_USERS_TEAM_EMPLOYEE_EMPTY_LIST_ITEM_TITLE_WITHOUT_ADD_PERMISSION')
				: this.loc('HUMANRESOURCES_COMPANY_STRUCTURE_DEPARTMENT_CONTENT_TAB_USERS_EMPLOYEE_EMPTY_LIST_ITEM_TITLE_WITHOUT_ADD_PERMISSION');
		},
		shouldUpdateList(): boolean
		{
			return this.departments.get(this.focusedNode).employeeListOptions?.shouldUpdateList ?? true;
		},
		departmentUsersStatus(): DepartmentUsersStatus
		{
			const department = this.departments.get(this.focusedNode);
			if (department?.heads && department.employees)
			{
				return { departmentId: this.focusedNode, loaded: true };
			}

			return { departmentId: this.focusedNode, loaded: false };
		},
		headMenu(): UsersTabActionMenu
		{
			return new UsersTabActionMenu(
				this.focusedNode,
				AnalyticsSourceType.DETAIL,
				'head',
				this.entityType,
			);
		},
		employeeMenu(): UsersTabActionMenu
		{
			return new UsersTabActionMenu(
				this.focusedNode,
				AnalyticsSourceType.DETAIL,
				'employee',
				this.entityType,
			);
		},
		isEmployeeListOptionsSet(): boolean
		{
			const department = this.departments.get(this.focusedNode) || {};

			return department.employeeListOptions && Object.keys(department.employeeListOptions).length > 0;
		},
		employeeTitle(): string
		{
			return this.isTeamEntity
				? this.loc('HUMANRESOURCES_COMPANY_STRUCTURE_DEPARTMENT_CONTENT_TAB_USERS_TEAM_EMPLOYEE_LIST_TITLE')
				: this.loc('HUMANRESOURCES_COMPANY_STRUCTURE_DEPARTMENT_CONTENT_TAB_USERS_EMPLOYEE_LIST_TITLE');
		},
		entityType(): string
		{
			return this.departments.get(this.focusedNode)?.entityType;
		},
		isTeamEntity(): boolean
		{
			return this.entityType === EntityTypes.team;
		},
		emptyStateTitle(): string
		{
			return this.isTeamEntity
				? this.loc('HUMANRESOURCES_COMPANY_STRUCTURE_DEPARTMENT_CONTENT_EMPTY_EMPLOYEES_TEAM_ADD_USER_TITLE')
				: this.loc('HUMANRESOURCES_COMPANY_STRUCTURE_DEPARTMENT_CONTENT_EMPTY_EMPLOYEES_ADD_USER_TITLE');
		},
		emptyStateDescription(): string
		{
			if (this.canAddUsers)
			{
				return this.isTeamEntity
					? this.loc('HUMANRESOURCES_COMPANY_STRUCTURE_DEPARTMENT_CONTENT_EMPTY_EMPLOYEES_TEAM_ADD_USER_SUBTITLE')
					: this.loc('HUMANRESOURCES_COMPANY_STRUCTURE_DEPARTMENT_CONTENT_EMPTY_EMPLOYEES_ADD_USER_SUBTITLE');
			}

			// text is in progress
			return this.isTeamEntity
				? ''
				: this.loc('HUMANRESOURCES_COMPANY_STRUCTURE_DEPARTMENT_CONTENT_EMPTY_EMPLOYEES_ADD_USER_SUBTITLE');
		},
	},

	watch: {
		focusedNode(newId: number): void
		{
			const department = this.departments.get(newId) || {};
			if (!this.isEmployeeListOptionsSet)
			{
				const employeeListOptions = {
					page: 0,
					shouldUpdateList: true,
					isListUpdated: false,
				};
				DepartmentContentActions.updateEmployeeListOptions(newId, employeeListOptions);
				this.departments.set(newId, department);
			}

			if (
				department.employeeListOptions.page === 0
				&& department.employeeListOptions.isListUpdated === false
				&& department.employeeListOptions.shouldUpdateList === true
			)
			{
				this.loadEmployeesAction();
			}

			this.isDescriptionExpanded = false;
			this.searchQuery = '';

			if (this.searchedUserId)
			{
				this.needToFocusUserId = this.searchedUserId;
				this.$nextTick(() => {
					this.scrollToUser();
				});
			}
		},
		searchedUserId: {
			handler(userId: number): void
			{
				if (!userId)
				{
					return;
				}

				this.needToFocusUserId = userId;
				if (this.isListUpdated)
				{
					this.needToScroll = true;
				}
				else
				{
					this.$nextTick(() => {
						this.scrollToUser();
					});
				}
			},
			immediate: true,
		},
		async searchQuery(newQuery: string): Promise<void>
		{
			await this.searchMembers(newQuery);
		},
		departmentUsersStatus(usersStatus: DepartmentUsersStatus, prevUsersStatus: DepartmentUsersStatus): void
		{
			const { departmentId, loaded } = usersStatus;
			const { departmentId: prevDepartmentId, loaded: prevLoaded } = prevUsersStatus;
			if (departmentId === prevDepartmentId && loaded === prevLoaded)
			{
				return;
			}

			if (loaded)
			{
				this.$emit('hideDetailLoader');
			}
			else
			{
				this.$emit('showDetailLoader');
				this.loadEmployeesAction();
			}
		},
	},

	created(): void
	{
		this.loadEmployeesAction();
		this.clearSearchTimeout = null;
	},

	mounted(): void
	{
		this.tabContainer = this.$refs['tab-container'];
	},

	methods: {
		loc(phraseCode, replacements = {}): string
		{
			return this.$Bitrix.Loc.getMessage(phraseCode, replacements);
		},
		getBadgeText(role): ?string
		{
			if (role === this.memberRoles.head)
			{
				return this.loc('HUMANRESOURCES_COMPANY_STRUCTURE_DEPARTMENT_CONTENT_EMPLOYEES_HEAD_BADGE');
			}

			if (role === this.memberRoles.deputyHead)
			{
				return this.loc('HUMANRESOURCES_COMPANY_STRUCTURE_DEPARTMENT_CONTENT_EMPLOYEES_DEPUTY_HEAD_BADGE');
			}

			return null;
		},
		updateList(event): void
		{
			const employeesList = event.target;
			const scrollPosition = employeesList.scrollTop + employeesList.clientHeight;

			if (employeesList.scrollHeight - scrollPosition < 40)
			{
				this.loadEmployeesAction();
			}
		},
		async loadEmployeesAction(): void
		{
			const nodeId = this.focusedNode;

			if (!this.departments.get(nodeId))
			{
				return;
			}

			const employeeListOptions = this.departments.get(nodeId).employeeListOptions ?? {};

			employeeListOptions.page = employeeListOptions.page ?? 0;
			employeeListOptions.shouldUpdateList = employeeListOptions.shouldUpdateList ?? true;
			employeeListOptions.isListUpdated = employeeListOptions.isListUpdated ?? false;
			DepartmentContentActions.updateEmployeeListOptions(nodeId, employeeListOptions);
			if (employeeListOptions.isListUpdated || !employeeListOptions.shouldUpdateList)
			{
				return;
			}

			if (
				!employeeListOptions.isListUpdated
				&& employeeListOptions.page === 0
				&& employeeListOptions.shouldUpdateList === true
			)
			{
				this.$emit('showDetailLoader');
			}

			employeeListOptions.isListUpdated = true;
			employeeListOptions.page += 1;
			DepartmentContentActions.updateEmployeeListOptions(nodeId, employeeListOptions);

			let loadedEmployees = await DepartmentAPI.getPagedEmployees(nodeId, employeeListOptions.page, 25);

			if (!loadedEmployees)
			{
				employeeListOptions.shouldUpdateList = false;
				employeeListOptions.isListUpdated = false;
				DepartmentContentActions.updateEmployeeListOptions(nodeId, employeeListOptions);

				return;
			}

			loadedEmployees = loadedEmployees.map((user) => {
				return { ...user, role: this.memberRoles.employee };
			});

			const employees = this.departments.get(nodeId)?.employees ?? [];
			const employeeIds = new Set(employees.map((employee) => employee.id));

			const newEmployees = loadedEmployees.reverse().filter((employee) => !employeeIds.has(employee.id));
			employees.unshift(...newEmployees);
			employeeListOptions.shouldUpdateList = newEmployees.length === 25;
			employeeListOptions.isListUpdated = false;

			DepartmentContentActions.updateEmployeeListOptions(nodeId, employeeListOptions);
			DepartmentContentActions.updateEmployees(nodeId, employees);
			if (this.departmentUsersStatus.loaded)
			{
				this.$emit('hideDetailLoader');
			}

			if (this.needToScroll)
			{
				this.scrollToUser();
			}
		},
		async scrollToUser(): void
		{
			const userId = this.needToFocusUserId;
			this.needToFocusUserId = null;
			this.needToScroll = false;
			const selectors = `.hr-department-detail-content__user-container[data-id="hr-department-detail-content__user-${userId}-item"]`;
			let element = this.tabContainer.querySelector(selectors);

			if (!element)
			{
				let user = null;
				try
				{
					user = await DepartmentAPI.getUserInfo(this.focusedNode, userId);
				}
				catch
				{ /* empty */ }

				const department = this.departments.get(this.focusedNode);
				if (!user || !department)
				{
					return;
				}

				if (user.role === this.memberRoles.head || user.role === this.memberRoles.deputyHead)
				{
					department.heads = department.heads ?? [];
					if (!department.heads.some((head) => head.id === user.id))
					{
						return;
					}
				}
				else
				{
					department.employees = department.employees ?? [];
					if (!department.employees.some((employee) => employee.id === user.id))
					{
						department.employees.push(user);
					}
				}

				// eslint-disable-next-line vue/valid-next-tick
				await this.$nextTick(() => {
					element = this.tabContainer.querySelector(selectors);
				});
			}

			if (!element)
			{
				return;
			}

			element.scrollIntoView({ behavior: 'smooth', block: 'center' });
			setTimeout(() => {
				this.selectedUserId = userId;
			}, 750);

			if (this.clearSearchTimeout)
			{
				clearTimeout(this.clearSearchTimeout);
			}

			this.clearSearchTimeout = setTimeout(() => {
				if (this.searchedUserId === userId)
				{
					this.selectedUserId = null;
					this.searchedUserId = null;
				}
			}, 4000);
		},
		async searchMembers(query)
		{
			if (query.length === 0)
			{
				return;
			}

			this.findQueryResult = this.findQueryResult || {};
			this.findQueryResult[this.focusedNode] = this.findQueryResult[this.focusedNode] || {
				success: [],
				failure: [],
			};

			const nodeResults = this.findQueryResult[this.focusedNode];

			if (nodeResults.failure.some((failedQuery) => query.startsWith(failedQuery)))
			{
				return;
			}

			if (nodeResults.success.includes(query) || nodeResults.failure.includes(query))
			{
				return;
			}

			const founded = await DepartmentAPI.findMemberByQuery(this.focusedNode, query);

			if (founded.length === 0)
			{
				nodeResults.failure.push(query);

				return;
			}

			const department = this.departments.get(this.focusedNode);
			const newMembers = founded.filter((found) => !department.heads.some((head) => head.id === found.id)
				&& !department.employees.some((employee) => employee.id === found.id));

			department.employees.push(...newMembers);
			nodeResults.success.push(query);
		},
		searchUser(searchQuery: string): void
		{
			this.searchQuery = searchQuery;
		},
		onHeadListActionMenuItemClick(actionId: string): void
		{
			this.headMenu.onActionMenuItemClick(actionId);
		},
		onEmployeeListActionMenuItemClick(actionId: string): void
		{
			this.employeeMenu.onActionMenuItemClick(actionId);
		},
		getHeadListDataTestIds(): TabListDataTestIds
		{
			return HeadListDataTestIds;
		},
		getEmployeeListDataTestIds(): TabListDataTestIds
		{
			return EmployeeListDataTestIds;
		},
	},

	template: `
		<div class="hr-department-detail-content__tab-container --users" ref="tab-container">
			<template v-if="memberCount > 0">
				<SearchInput
					v-if="showSearchBar"
					:placeholder="loc('HUMANRESOURCES_COMPANY_STRUCTURE_DEPARTMENT_CONTENT_TAB_USERS_SEARCH_PLACEHOLDER')"
					:value="searchQuery"
					@inputChange="searchUser"
					dataTestId="hr-department-detail-content_users-tab__users-search-input"
				/>
				<div
					v-if="!showSearchEmptyState"
					v-on="shouldUpdateList ? { scroll: updateList } : {}"
					class="hr-department-detail-content__lists-container"
				>
					<TabList
						id='hr-department-detail-content_chats-tab__chat-list'
						:title="loc('HUMANRESOURCES_COMPANY_STRUCTURE_DEPARTMENT_CONTENT_TAB_USERS_HEAD_LIST_TITLE')"
						:count="headCount"
						:menuItems="headMenu.items"
						:listItems="filteredHeads"
						:emptyItemTitle="headListEmptyStateTitle"
						emptyItemImageClass="hr-department-detail-content__empty-user-list-item-image"
						:hideEmptyItem="searchQuery.length > 0"
						:withAddPermission="canAddUsers"
						@tabListAction="onHeadListActionMenuItemClick"
						:dataTestIds="getHeadListDataTestIds()"
					>
						<template v-slot="{ item }">
							<UserListItem
								:user="item"
								:selectedUserId="selectedUserId"
								:entityType="entityType"
							/>
						</template>
					</TabList>
					<TabList
						id='hr-department-detail-content_chats-tab__channel-list'
						:title="employeeTitle"
						:count="employeeCount"
						:menuItems="employeeMenu.items"
						:listItems="filteredEmployees"
						:emptyItemTitle="employeesListEmptyStateTitle"
						emptyItemImageClass="hr-department-detail-content__empty-user-list-item-image"
						:hideEmptyItem="searchQuery.length > 0"
						:withAddPermission="canAddUsers"
						@tabListAction="onEmployeeListActionMenuItemClick"
						:dataTestIds="getEmployeeListDataTestIds()"
					>
						<template v-slot="{ item }">
							<UserListItem
								:user="item"
								:selectedUserId="selectedUserId"
								:entityType="entityType"
							/>
						</template>
					</TabList>
				</div>
				<EmptyState v-else
					imageClass="hr-department-detail-content__empty-tab-user-not-found-icon"
					:title="loc('HUMANRESOURCES_COMPANY_STRUCTURE_DEPARTMENT_CONTENT_EMPTY_SEARCHED_EMPLOYEES_TITLE')"
					:description ="loc('HUMANRESOURCES_COMPANY_STRUCTURE_DEPARTMENT_CONTENT_EMPTY_SEARCHED_EMPLOYEES_SUBTITLE')"
				/>
			</template>
			<EmptyState v-else
				:imageClass="canAddUsers 
					? 'hr-department-detail-content__empty-tab-add-user-icon' 
					: 'hr-department-detail-content__empty-tab-cant-add-user-icon'"
				:title="emptyStateTitle"
				:description ="emptyStateDescription"
			>
				<template v-slot:content>
					<EmptyTabAddButton v-if="canAddUsers" :departmentId="departmentId" :entityType="entityType"/>
				</template>
			</EmptyState>
		</div>
	`,
};
