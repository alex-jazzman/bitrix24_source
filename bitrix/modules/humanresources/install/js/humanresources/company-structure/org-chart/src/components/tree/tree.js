import { Runtime } from 'main.core';
import { EntityTypes } from 'humanresources.company-structure.utils';
import { MessageBox, MessageBoxButtons } from 'ui.dialogs.messagebox';
import { UI } from 'ui.notification';
import { ButtonColor } from 'ui.buttons';
import { UrlProvidedParamsService } from '../../classes/url-provided-params-service';
import { TreeNode } from './tree-node/tree-node';
import { Connectors } from './connectors';
import { useChartStore } from 'humanresources.company-structure.chart-store';
import { mapState } from 'ui.vue3.pinia';
import { EventEmitter, type BaseEvent } from 'main.core.events';
import { events } from '../../consts';
import { chartAPI } from '../../api';
import { sendData as analyticsSendData } from 'ui.analytics';
import { OrgChartActions } from '../../actions';
import type { MountedDepartment, TreeData } from '../../types';
import './style.css';

// @vue/component
export const Tree = {
	name: 'companyTree',

	components: { TreeNode, Connectors },

	provide(): { [key: string]: Function }
	{
		return {
			getTreeBounds: () => this.getTreeBounds(),
		};
	},

	props: {
		canvasZoom: {
			type: Number,
			required: true,
		},
	},

	emits: ['moveTo', 'showWizard', 'controlDetail'],

	data(): TreeData
	{
		return {
			expandedNodes: [],
			isLocatedDepartmentVisible: false,
		};
	},

	computed:
	{
		rootId(): number
		{
			const { id: rootId } = [...this.departments.values()].find((department) => {
				return department.parentId === 0;
			});

			return rootId;
		},
		connectors(): Connectors
		{
			return this.$refs.connectors;
		},
		...mapState(useChartStore, ['currentDepartments', 'userId', 'focusedNode', 'departments']),
	},

	created(): void
	{
		this.treeNodes = new Map();
		this.subscribeOnEvents();
		this.loadHeads([this.rootId]);
	},

	mounted(): void
	{
		const departmentToFocus = this.getDepartmentIdForInitialFocus();
		this.currentDepartmentsLocated = [departmentToFocus];

		if (departmentToFocus !== this.rootId)
		{
			this.expandDepartmentParents(departmentToFocus);
			this.focus(departmentToFocus, { expandAfterFocus: true });

			return;
		}

		this.expandLowerDepartments();
		this.focus(departmentToFocus);
	},

	beforeUnmount(): void
	{
		this.unsubscribeFromEvents();
	},

	methods:
	{
		getDepartmentIdForInitialFocus(): ?number
		{
			const providedFocusNodeId = UrlProvidedParamsService.getParams().focusNodeId;
			if (providedFocusNodeId)
			{
				const node = this.departments.get(providedFocusNodeId);
				if (node)
				{
					return providedFocusNodeId;
				}
			}

			for (const currentDepartmentId: number of this.currentDepartments)
			{
				const node = this.departments.get(currentDepartmentId);

				if (node.entityType === EntityTypes.department)
				{
					return currentDepartmentId;
				}
			}

			return this.rootId;
		},
		loc(phraseCode: string, replacements: {[p: string]: string} = {}): string
		{
			return this.$Bitrix.Loc.getMessage(phraseCode, replacements);
		},
		getTreeBounds(): DOMRect
		{
			return this.$el.getBoundingClientRect();
		},
		onConnectDepartment({ data }: MountedDepartment): void
		{
			const { id, html } = data;
			this.treeNodes.set(id, html);
			const departmentIdToFocus = this.getDepartmentIdForInitialFocus();
			if (id === departmentIdToFocus) // zoom to  department when loading
			{
				const movingDelay = 1800;
				Runtime.debounce(() => {
					this.moveTo(departmentIdToFocus);
				}, movingDelay)();
			}
		},
		onDisconnectDepartment({ data }: MountedDepartment): void
		{
			const { id } = data;
			const department = this.departments.get(id);
			delete department.prevParentId;
			if (!department.parentId)
			{
				OrgChartActions.removeDepartment(id);
			}
		},
		onDragDepartment({ data }: BaseEvent): void
		{
			const { draggedId } = data;
			const department = this.departments.get(draggedId);
			const { parentId } = department;
			const parentDepartment = this.departments.get(parentId);
			parentDepartment.children.forEach((childId) => {
				if (this.expandedNodes.includes(childId))
				{
					this.collapse(childId);
				}
			});
		},
		onToggleConnectors({ data }: BaseEvent): void
		{
			const { draggedId, shouldShow } = data;
			const department = this.departments.get(draggedId);
			const { parentId } = department;
			this.connectors.toggleConnectorsVisibility(parentId, shouldShow, this.expandedNodes);
		},
		async onDropDepartment({ data }: BaseEvent): Promise<void>
		{
			const { draggedId, targetId, affectedItems, direction } = data;
			const promise = OrgChartActions.orderDepartments(draggedId, targetId, direction, affectedItems.length);
			const fullDepartmentWidth = 302;
			const draggedShift = affectedItems.length * direction * fullDepartmentWidth;
			this.connectors.adaptConnectorsAfterReorder([draggedId], draggedShift, true);
			const affectedShift = -direction * fullDepartmentWidth;
			this.connectors.adaptConnectorsAfterReorder(affectedItems, affectedShift, true);
			const ordered = await promise;
			if (!ordered)
			{
				this.connectors.adaptConnectorsAfterReorder([draggedId], -draggedShift, true);
				this.connectors.adaptConnectorsAfterReorder(affectedItems, -affectedShift, true);
			}
		},
		onPublicFocusNode({ data }: BaseEvent): void
		{
			const { nodeId } = data;

			const node = this.departments.get(nodeId);
			if (!node)
			{
				return;
			}

			void this.locateToDepartment(nodeId);
		},
		collapse(nodeId: number): void
		{
			this.expandedNodes = this.expandedNodes.filter((expandedId) => expandedId !== nodeId);
			this.connectors.toggleConnectorsVisibility(nodeId, false, this.expandedNodes);
			this.connectors.toggleConnectorHighlighting(nodeId, false);
		},
		collapseRecursively(nodeId: number): void
		{
			const deepCollapse = (id: number) => {
				this.collapse(id);
				const node = this.departments.get(id);
				node.children?.forEach((childId) => {
					if (this.expandedNodes.includes(childId))
					{
						deepCollapse(childId);
					}
				});
			};
			const { parentId } = this.departments.get(nodeId);
			const expandedNode = this.expandedNodes.find((id) => {
				const node = this.departments.get(id);

				return node.parentId === parentId;
			});
			if (expandedNode)
			{
				deepCollapse(expandedNode);
			}
		},
		expand(departmentId: number): void
		{
			this.collapseRecursively(departmentId);
			this.expandedNodes = [...this.expandedNodes, departmentId];
			this.connectors.toggleConnectorsVisibility(departmentId, true, this.expandedNodes);
			this.connectors.toggleConnectorHighlighting(departmentId, true);
			const department = this.departments.get(departmentId);
			const childrenWithoutHeads = department.children.filter((childId) => {
				return !this.departments.get(childId).heads;
			});
			if (childrenWithoutHeads.length > 0)
			{
				this.loadHeads(childrenWithoutHeads);
			}

			analyticsSendData({ tool: 'structure', category: 'structure', event: 'expand_department' });
		},
		focus(nodeId: number, options: Object = {}): void
		{
			const { expandAfterFocus = false, showEmployees = false, subdivisionsSelected = false } = options;
			const hasChildren = this.departments.get(nodeId).children?.length > 0;

			let shouldExpand = expandAfterFocus || !this.expandedNodes.includes(nodeId);
			if (showEmployees)
			{
				shouldExpand = this.expandedNodes.includes(nodeId);
			}

			if (subdivisionsSelected || !hasChildren)
			{
				this.collapseRecursively(nodeId);
			}

			if (hasChildren && shouldExpand)
			{
				this.expand(nodeId);
			}

			if (this.focusedNode && !this.expandedNodes.includes(this.focusedNode))
			{
				this.connectors.toggleConnectorHighlighting(this.focusedNode, false);
			}

			OrgChartActions.focusDepartment(nodeId);
			this.connectors.toggleConnectorHighlighting(this.focusedNode, true);
		},
		onFocusDepartment({ data }: { nodeId: number }): void
		{
			const { nodeId, showEmployees, subdivisionsSelected } = data;
			this.focus(nodeId, { showEmployees, subdivisionsSelected });
			this.$emit('controlDetail', {
				showEmployees,
				preventSwitch: subdivisionsSelected,
			});
		},
		tryRemoveDepartment(nodeId: number, entityType: string): void
		{
			const localizationMap = {
				team: {
					title: this.loc('HUMANRESOURCES_COMPANY_STRUCTURE_CONFIRM_REMOVE_TEAM_TITLE'),
					message: this.loc('HUMANRESOURCES_COMPANY_STRUCTURE_CONFIRM_REMOVE_TEAM_MESSAGE'),
					success: this.loc('HUMANRESOURCES_COMPANY_STRUCTURE_CONFIRM_REMOVE_TEAM_REMOVED'),
					error: this.loc('HUMANRESOURCES_COMPANY_STRUCTURE_CONFIRM_REMOVE_TEAM_ERROR'),
				},
				default: {
					title: this.loc('HUMANRESOURCES_COMPANY_STRUCTURE_CONFIRM_REMOVE_DEPARTMENT_TITLE'),
					message: this.loc('HUMANRESOURCES_COMPANY_STRUCTURE_CONFIRM_REMOVE_DEPARTMENT_MESSAGE'),
					success: this.loc('HUMANRESOURCES_COMPANY_STRUCTURE_CONFIRM_REMOVE_DEPARTMENT_REMOVED'),
					error: this.loc('HUMANRESOURCES_COMPANY_STRUCTURE_CONFIRM_REMOVE_DEPARTMENT_ERROR'),
				},
			};
			const mapIndex = entityType === EntityTypes.team ? 'team' : 'default';
			const messageBox = MessageBox.create({
				title: localizationMap[mapIndex].title,
				message: localizationMap[mapIndex].message,
				buttons: MessageBoxButtons.OK_CANCEL,
				onOk: async (dialog: MessageBox) => {
					try
					{
						await this.removeDepartment(nodeId);
						UI.Notification.Center.notify({
							content: localizationMap[mapIndex].success,
							autoHideDelay: 2000,
						});
						dialog.close();
					}
					catch
					{
						UI.Notification.Center.notify({
							content: localizationMap[mapIndex].error,
							autoHideDelay: 2000,
						});
					}
				},
				onCancel: (dialog: MessageBox) => dialog.close(),
				minWidth: 250,
				maxWidth: 320,
				minHeight: 175,
				okCaption: this.loc('HUMANRESOURCES_COMPANY_STRUCTURE_CONFIRM_REMOVE_DEPARTMENT_OK_CAPTION'),
				popupOptions: { className: 'humanresources-tree__message-box', overlay: { opacity: 40 } },
			});
			const okButton = messageBox.getOkButton();
			const cancelButton = messageBox.getCancelButton();
			okButton.setRound(true);
			cancelButton.setRound(true);
			okButton.setColor(ButtonColor.DANGER);
			cancelButton.setColor(ButtonColor.LIGHT_BORDER);
			messageBox.show();
		},
		async removeDepartment(nodeId: number): Promise<void>
		{
			await chartAPI.removeDepartment(nodeId);
			const removableDepartment = this.departments.get(nodeId);
			const { parentId, children: removableDepartmentChildren = [] } = removableDepartment;
			if (removableDepartmentChildren.length > 0)
			{
				this.collapse(nodeId);
			}

			OrgChartActions.moveSubordinatesToParent(nodeId);
			await this.$nextTick();
			OrgChartActions.markDepartmentAsRemoved(nodeId);
			this.focus(parentId, { expandAfterFocus: true });
			this.moveTo(parentId);
		},
		expandDepartmentParents(nodeId: number): void
		{
			let { parentId } = this.departments.get(nodeId);
			while (parentId)
			{
				if (!this.expandedNodes.includes(parentId))
				{
					this.expand(parentId);
				}

				parentId = this.departments.get(parentId).parentId;
			}
		},
		expandLowerDepartments(): void
		{
			let expandLevel = 0;
			const expandRecursively = (departmentId: number) => {
				const { children = [] } = this.departments.get(departmentId);
				if (expandLevel === 4 || children.length === 0)
				{
					return;
				}

				this.expand(departmentId);
				expandLevel += 1;
				const middleBound = Math.trunc(children.length / 2);
				const childId = children[middleBound];
				if (this.departments.get(childId).children?.length > 0)
				{
					expandRecursively(childId);

					return;
				}

				for (let i = middleBound - 1; i >= 0; i--)
				{
					if (traverseSibling(children[i]))
					{
						return;
					}
				}

				for (let i = middleBound + 1; i < children.length; i++)
				{
					if (traverseSibling(children[i]))
					{
						return;
					}
				}
			};

			const traverseSibling = (siblingId: number) => {
				const { children: currentChildren = [] } = this.departments.get(siblingId);

				if (currentChildren.length > 0)
				{
					expandRecursively(siblingId);

					return true;
				}

				return false;
			};
			expandRecursively(this.rootId);
		},
		async locateToCurrentDepartment(): Promise<void>
		{
			// currentDepartmentsLocated manipulation needed to cycle through current departments
			if (this.currentDepartmentsLocated.length === this.currentDepartments.length)
			{
				this.currentDepartmentsLocated = [];
			}
			const currentDepartment = this.currentDepartments.find((item) => !this.currentDepartmentsLocated.includes(item));
			if (!currentDepartment)
			{
				return;
			}

			this.currentDepartmentsLocated.push(currentDepartment);
			await this.locateToDepartment(currentDepartment);
			OrgChartActions.searchUserInDepartment(this.userId);
		},
		async locateToDepartment(nodeId: number): Promise<void>
		{
			this.isLocatedDepartmentVisible = false;
			this.expandDepartmentParents(nodeId);
			this.focus(nodeId, { expandAfterFocus: true });
			// $nextTick makes sure that this.getTreeBounds() returns correct value when nodeId is not visible
			await this.$nextTick();
			this.isLocatedDepartmentVisible = true;
			await this.moveTo(nodeId);
		},
		async moveTo(nodeId: number): Promise<void>
		{
			await this.$nextTick();
			const treeRect = this.getTreeBounds();
			const centerX = treeRect.x + treeRect.width / 2;
			const centerY = treeRect.y + treeRect.height / 2;
			const treeNode = this.treeNodes.get(nodeId);
			const treeNodeRect = treeNode.getBoundingClientRect();
			this.$emit('moveTo', {
				x: centerX - treeNodeRect.x - treeNodeRect.width / 2,
				y: centerY - treeNodeRect.y - treeNodeRect.height / 2,
				nodeId,
			});
		},
		loadHeads(departmentIds: number[]): void
		{
			const store = useChartStore();
			store.loadHeads(departmentIds);
		},
		subscribeOnEvents(): void
		{
			this.events = {
				[events.HR_DEPARTMENT_CONNECT]: this.onConnectDepartment,
				[events.HR_DEPARTMENT_DISCONNECT]: this.onDisconnectDepartment,
				[events.HR_DEPARTMENT_FOCUS]: this.onFocusDepartment,
				[events.HR_DRAG_DEPARTMENT]: this.onDragDepartment,
				[events.HR_DROP_DEPARTMENT]: this.onDropDepartment,
				[events.HR_DEPARTMENT_TOGGLE_CONNECTORS]: this.onToggleConnectors,
				[events.HR_PUBLIC_FOCUS_NODE]: this.onPublicFocusNode,
			};
			Object.entries(this.events).forEach(([event, handle]) => {
				EventEmitter.subscribe(event, handle);
			});
		},
		unsubscribeFromEvents(): void
		{
			Object.entries(this.events).forEach(([event, handle]) => {
				EventEmitter.unsubscribe(event, handle);
			});
		},
	},

	template: `
		<div
			class="humanresources-tree"
			v-if="departments.size > 0"
		>
			<TreeNode
				class="--root"
				:key="rootId"
				:nodeId="rootId"
				:expandedNodes="[...expandedNodes]"
				:canvasZoom="canvasZoom"
				:currentDepartments="currentDepartments"
			></TreeNode>
			<Connectors
				ref="connectors"
				:isLocatedDepartmentVisible="isLocatedDepartmentVisible"
				:treeNodes="treeNodes"
			></Connectors>
		</div>
	`,
};
