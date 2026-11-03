import { EventEmitter, type BaseEvent } from 'main.core.events';
import { Confetti } from 'ui.confetti';
import { mapState } from 'ui.vue3.pinia';
import { TransformCanvas } from 'ui.canvas';
import { AnalyticsSourceType } from 'humanresources.company-structure.api';
import { TitlePanel } from './components/title-panel/title-panel';
import { Tree } from './components/tree/tree';
import { TransformPanel } from './components/transfrom-panel';
import { DetailPanel } from './components/detail-panel/detail-panel';
import { FirstPopup } from './components/first-popup/first-popup';
import { useChartStore } from 'humanresources.company-structure.chart-store';
import { ChartWizard } from 'humanresources.company-structure.chart-wizard';
import { EntityTypes, getInvitedUserData } from 'humanresources.company-structure.utils';
import { chartAPI } from './api';
import { events, detailPanelWidth } from './consts';
import { OrgChartActions } from './actions';
import { sendData as analyticsSendData } from 'ui.analytics';
import { addCustomEvent, Dom, Event, removeCustomEvent } from 'main.core';

import type { ChartData } from './types';
import './style.css';
import 'ui.design-tokens';

// outlasts the 0.2s transform transition of ui.canvas, so hover is recalculated on the settled layout
const canvasHoverResumeDelay = 250;

// the mini profile card is rendered in document.body, so the wheel over it never reaches the canvas
const miniProfilePopupSelector = '.intranet-user-mini-profile-popup';
// menus of the card (department list, call menu) are popups of their own, outside the card and prefixed by its id
const miniProfileMenuSelector = '[id^="intranet-user-mini-profile-"]';
const miniProfileAnchorSelector = '[bx-tooltip-user-id]';

// a wheel line in pixels, the same step ui.block-diagram uses for its own wheel scrolling
const wheelLineHeight = 40;

// @vue/component
export const Chart = {
	components: {
		TransformCanvas,
		Tree,
		TransformPanel,
		ChartWizard,
		FirstPopup,
		DetailPanel,
		TitlePanel,
	},

	data(): ChartData
	{
		return {
			canvas: {
				shown: false,
				moved: false,
				transforming: false,
				modelTransform: {
					x: 0,
					y: 0,
					zoom: 0.3,
				},
			},
			wizard: {
				shown: false,
				isEditMode: false,
				showEntitySelector: true,
				entity: '',
				nodeId: 0,
				source: '',
			},
			detailPanel: {
				collapsed: true,
				preventSwitch: false,
			},
			// so we block all controls until transition isn't completed
			isTransitionCompleted: false,
			isDragInProgress: false,
			analyticsQueue: [],
			isAnalyticsBusy: false,
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
		...mapState(useChartStore, ['departments', 'currentDepartments']),
	},

	async created(): Promise<void>
	{
		const slider = BX.SidePanel.Instance.getTopSlider();
		slider?.showLoader();
		const [departmentsData, currentDepartments, userId] = await Promise.all([
			chartAPI.getDepartmentsData(),
			chartAPI.getCurrentDepartments(),
			chartAPI.getUserId(),
		]);
		slider?.closeLoader();
		const departments = departmentsData.structure;
		const structureMap = Object.entries(departmentsData.map).reduce((map, [id, value]) => {
			map.set(Number(id), { id: Number(id), ...value });

			return map;
		}, new Map());
		const multipleUsers = departmentsData.multipleMembers ?? [];
		const parsedDepartments = chartAPI.createTreeDataStore(departments);
		const availableDepartments = currentDepartments.filter((item) => parsedDepartments.has(item));
		OrgChartActions.applyData(parsedDepartments, availableDepartments, userId, structureMap, multipleUsers);
		this.rootOffset = 100;
		this.transformCanvas();
		this.canvas.shown = true;
		this.showConfetti = false;
		EventEmitter.subscribe(events.HR_DEPARTMENT_SLIDER_ON_MESSAGE, this.handleInviteSliderMessage);
		BX.PULL.subscribe({
			type: BX.PullClient.SubscriptionType.Server,
			moduleId: 'humanresources',
			command: 'linkChatsToNodes',
			callback: (data) => this.clearChatLists(data),
		});
		EventEmitter.subscribe(events.HR_ENTITY_SHOW_WIZARD, this.showWizardEventHandler);
		EventEmitter.subscribe(events.HR_ENTITY_REMOVE, this.removeDepartmentEventHandler);
		EventEmitter.subscribe(events.HR_ORG_CHART_TRANSFORM_CANVAS, this.onCanvasTransformWhenDragging);
		EventEmitter.subscribe(events.HR_ORG_CHART_LOCATE_TO_DEPARTMENT, this.onLocate);
		EventEmitter.subscribe(events.HR_ENTITY_TOGGLE_ELEMENTS, this.onToggleEntityDrag);
		EventEmitter.subscribe(events.HR_USER_DRAG_START, this.onUserDragStart);
		EventEmitter.subscribe(events.HR_USER_DRAG_END, this.onUserDragEnd);

		this.handleAnalyticsAjaxSuccess = this.handleAnalyticsAjaxSuccess.bind(this);
		addCustomEvent('OnAjaxSuccess', this.handleAnalyticsAjaxSuccess);
	},

	mounted(): void
	{
		this.miniProfileAnchor = null;
		this.miniProfileWheelPopup = null;
		Event.bind(document, 'mouseover', this.onDocumentMouseOver);
	},

	unmounted(): void
	{
		Event.unbind(document, 'mouseover', this.onDocumentMouseOver);
		this.unbindMiniProfileWheel();

		EventEmitter.unsubscribe(events.HR_DEPARTMENT_SLIDER_ON_MESSAGE, this.handleInviteSliderMessage);
		EventEmitter.unsubscribe(events.HR_ENTITY_SHOW_WIZARD, this.showWizardEventHandler);
		EventEmitter.unsubscribe(events.HR_ENTITY_REMOVE, this.removeDepartmentEventHandler);
		EventEmitter.unsubscribe(events.HR_ORG_CHART_TRANSFORM_CANVAS, this.onCanvasTransformWhenDragging);
		EventEmitter.unsubscribe(events.HR_ORG_CHART_LOCATE_TO_DEPARTMENT, this.onLocate);
		EventEmitter.unsubscribe(events.HR_ENTITY_TOGGLE_ELEMENTS, this.onToggleEntityDrag);
		EventEmitter.unsubscribe(events.HR_USER_DRAG_START, this.onUserDragStart);
		EventEmitter.unsubscribe(events.HR_USER_DRAG_END, this.onUserDragEnd);

		clearTimeout(this.hoverResumeTimeout);
		removeCustomEvent('OnAjaxSuccess', this.handleAnalyticsAjaxSuccess);
	},

	methods:
	{
		onMoveTo({ x, y, nodeId }: { x: Number; y: Number; nodeId: Number; }): void
		{
			const { x: prevX, y: prevY, zoom } = this.canvas.modelTransform;
			const detailPanelWidthZoomed = detailPanelWidth * zoom;
			const newX = x - detailPanelWidthZoomed / 2;
			const newY = nodeId === this.rootId ? this.rootOffset : y / zoom;
			const samePoint = Math.round(newX) === Math.round(prevX) && Math.round(y) === Math.round(prevY);
			this.detailPanel = {
				...this.detailPanel,
				collapsed: false,
			};
			if (samePoint)
			{
				return;
			}

			this.canvas = {
				...this.canvas,
				moved: true,
				modelTransform: { ...this.canvas.modelTransform, x: newX / zoom, y: newY, zoom: 1 },
			};
			this.onUpdateTransform();
		},
		onLocate({ data }: BaseEvent): void
		{
			if (data.nodeId)
			{
				this.$refs.tree.locateToDepartment(data.nodeId);

				return;
			}

			this.$refs.tree.locateToCurrentDepartment();
		},
		showWizardEventHandler({ data }: BaseEvent): void
		{
			this.onShowWizard(data);
		},
		sendAnalyticsSequentially(data)
		{
			this.analyticsQueue.push(data);
			this.processAnalyticsQueue();
		},
		processAnalyticsQueue()
		{
			if (this.isAnalyticsBusy || this.analyticsQueue.length === 0)
			{
				return;
			}

			this.isAnalyticsBusy = true;
			const dataToSend = this.analyticsQueue[0];

			analyticsSendData(dataToSend);
		},

		handleAnalyticsAjaxSuccess()
		{
			if (!this.isAnalyticsBusy)
			{
				return;
			}

			this.analyticsQueue.shift();
			this.isAnalyticsBusy = false;

			this.processAnalyticsQueue();
		},
		onShowWizard({
			nodeId = 0,
			isEditMode = false,
			type,
			showEntitySelector = true,
			source = '',
			entityType,
			refToFocus,
		}: {
			nodeId: number;
			isEditMode: boolean,
			type: string,
			showEntitySelector: boolean,
			source: string,
			entityType: string,
			refToFocus: any
		} = {}): void
		{
			this.wizard = {
				...this.wizard,
				shown: true,
				isEditMode,
				showEntitySelector,
				entity: type,
				nodeId,
				source,
				entityType,
				refToFocus,
			};
		},
		onModifyTree({ id, showConfetti }): void
		{
			this.showConfetti = showConfetti ?? false;
			const { tree } = this.$refs;
			tree.locateToDepartment(id);
		},
		onWizardClose(): void
		{
			this.wizard.shown = false;
		},
		removeDepartmentEventHandler({ data }: BaseEvent): void
		{
			this.onRemoveDepartment(data.nodeId, data.entityType);
		},
		onRemoveDepartment(nodeId: number, entityType: string): void
		{
			const { tree } = this.$refs;
			tree.tryRemoveDepartment(nodeId, entityType);
		},
		async onTransitionEnd(): Promise<void>
		{
			if (this.canvas.moved)
			{
				this.isTransitionCompleted = true;
			}

			this.canvas.moved = false;
			if (!this.showConfetti)
			{
				return;
			}

			this.isTransitionCompleted = false;
			const promise = Confetti.fire({
				particleCount: 300,
				startVelocity: 10,
				spread: 400,
				ticks: 100,
				origin: { y: 0.4, x: 0.37 },
			});
			this.showConfetti = false;
			await promise;
			this.isTransitionCompleted = true;
		},
		onControlDetail({ showEmployees, preventSwitch }): void
		{
			this.detailPanel = {
				...this.detailPanel,
				preventSwitch,
			};
			if (!showEmployees)
			{
				return;
			}

			this.detailPanel = {
				...this.detailPanel,
				collapsed: false,
			};
		},
		transformCanvas(): void
		{
			const { zoom } = this.canvas.modelTransform;
			const { offsetWidth, offsetHeight } = this.$el;
			const [currentDepartment] = this.currentDepartments;
			const y = currentDepartment === this.rootId ? this.rootOffset : offsetHeight / 2 - (offsetHeight * zoom) / 2;
			this.canvas.modelTransform = {
				...this.canvas.modelTransform,
				x: offsetWidth / 2 - (offsetWidth * zoom) / 2,
				y,
			};
		},
		onUpdateTransform(): void
		{
			EventEmitter.emit(events.INTRANET_USER_MINIPROFILE_CLOSE);
			EventEmitter.emit(events.HR_DEPARTMENT_MENU_CLOSE);
			this.suspendCanvasHover();
		},
		// the canvas moves by transform, so the browser keeps the hover of the node that has already left the cursor
		suspendCanvasHover(): void
		{
			if (this.isDragInProgress)
			{
				return;
			}

			this.canvas.transforming = true;
			clearTimeout(this.hoverResumeTimeout);
			this.hoverResumeTimeout = setTimeout(() => {
				this.canvas.transforming = false;
			}, canvasHoverResumeDelay);
		},
		onToggleEntityDrag({ data }: BaseEvent): void
		{
			this.isDragInProgress = !data.shouldShowElements;
		},
		onUserDragStart(): void
		{
			this.isDragInProgress = true;
			// the drop target is looked up by the cursor, so the tree layer needs its hit testing back at once
			clearTimeout(this.hoverResumeTimeout);
			this.canvas.transforming = false;
		},
		onUserDragEnd(): void
		{
			this.isDragInProgress = false;
		},
		handleInviteSliderMessage(event: BaseEvent): void
		{
			const [messageEvent] = event.getData();
			const eventId = messageEvent.getEventId();
			if (eventId !== 'BX.Intranet.Invitation:onAdd')
			{
				return;
			}

			const { users } = messageEvent.getData();
			users.forEach((user) => {
				const invitedUserData = getInvitedUserData(user);
				OrgChartActions.inviteUser(invitedUserData);
			});
		},
		clearChatLists(data): void
		{
			const nodeIds = Object.keys(data).map((key) => Number(key));
			OrgChartActions.clearNodesChatLists(nodeIds);
		},
		onKeyDown(event: KeyboardEvent): void
		{
			if (!this.isTransitionCompleted)
			{
				event.preventDefault();
			}
		},
		onCanvasTransformWhenDragging({ data }: BaseEvent): void
		{
			const { directionX, directionY, speed } = data;
			if (directionX !== 0)
			{
				this.canvas.modelTransform.x += -directionX * speed;
			}

			if (directionY !== 0)
			{
				this.canvas.modelTransform.y += -directionY * speed;
			}
		},
		onDocumentMouseOver(event: MouseEvent): void
		{
			const popup = event.target.closest(miniProfilePopupSelector);
			if (popup)
			{
				this.bindMiniProfileWheel(popup);

				return;
			}

			this.unbindMiniProfileWheel();
			if (event.target.closest(miniProfileMenuSelector))
			{
				// the card stays open behind its own menu, so the anchor stays ours until the cursor leaves them both
				return;
			}

			if (this.$el.contains(event.target))
			{
				this.miniProfileAnchor = event.target.closest(miniProfileAnchorSelector) ?? this.miniProfileAnchor;

				return;
			}

			// a card of a foreign anchor opens only after the cursor has passed that anchor outside the chart
			this.miniProfileAnchor = null;
		},
		bindMiniProfileWheel(popup: HTMLElement): void
		{
			if (this.miniProfileWheelPopup === popup && popup.isConnected)
			{
				return;
			}

			this.unbindMiniProfileWheel();
			if (!this.miniProfileAnchor?.isConnected || !this.$el.contains(this.miniProfileAnchor))
			{
				return;
			}

			this.miniProfileWheelPopup = popup;
			Event.bind(popup, 'wheel', this.onMiniProfileWheel, { passive: false });
		},
		unbindMiniProfileWheel(): void
		{
			if (!this.miniProfileWheelPopup)
			{
				return;
			}

			Event.unbind(this.miniProfileWheelPopup, 'wheel', this.onMiniProfileWheel, { passive: false });
			this.miniProfileWheelPopup = null;
		},
		onMiniProfileWheel(event: WheelEvent): void
		{
			if (event.ctrlKey)
			{
				// the canvas owns the zoom: cursor focus, its own limits and trackpad detection
				this.$refs.canvas?.onWheel(event);

				return;
			}

			if (this.findScrollableTarget(event.target, event.deltaY, this.miniProfileWheelPopup))
			{
				return;
			}

			const anchorList = this.findScrollableTarget(this.miniProfileAnchor, event.deltaY, this.$el);
			if (anchorList)
			{
				anchorList.scrollTop += this.toScrollPixels(event, anchorList);
			}
			else
			{
				this.panCanvas(event);
			}

			event.preventDefault();
		},
		// repeats what ui.canvas does on panning, which never sees this wheel event: it moves and drops the hover.
		// the raw delta is kept here as well, so panning over the card goes as fast as panning over the canvas
		panCanvas({ deltaX, deltaY, shiftKey }: WheelEvent): void
		{
			const { modelTransform } = this.canvas;
			modelTransform.x -= shiftKey ? deltaY : deltaX;
			modelTransform.y -= shiftKey ? deltaX : deltaY;
			this.suspendCanvasHover();
		},
		// scrollTop is always in pixels, while some mice report the wheel in lines or pages
		toScrollPixels({ deltaY, deltaMode }: WheelEvent, element: HTMLElement): number
		{
			if (deltaMode === WheelEvent.DOM_DELTA_LINE)
			{
				return deltaY * wheelLineHeight;
			}

			if (deltaMode === WheelEvent.DOM_DELTA_PAGE)
			{
				return deltaY * element.clientHeight;
			}

			return deltaY;
		},
		findScrollableTarget(element: ?HTMLElement, deltaY: number, root: HTMLElement): ?HTMLElement
		{
			let node = element;
			while (node)
			{
				if (this.canScrollBy(node, deltaY))
				{
					return node;
				}

				node = node === root ? null : node.parentElement;
			}

			return null;
		},
		canScrollBy(element: HTMLElement, deltaY: number): boolean
		{
			const overflow = Dom.style(element, 'overflowY');
			if (deltaY === 0 || (overflow !== 'auto' && overflow !== 'scroll'))
			{
				return false;
			}

			return deltaY > 0
				? element.scrollTop < element.scrollHeight - element.clientHeight - 1
				: element.scrollTop > 0;
		},
	},

	template: `
		<div
			class="humanresources-chart"
			:class="{ '--locked': !isTransitionCompleted, '--canvas-transforming': canvas.transforming }"
			@keydown="onKeyDown"
		>
			<TitlePanel @showWizard="onShowWizard"></TitlePanel>
			<TransformCanvas
				ref="canvas"
				v-if="canvas.shown"
				v-slot="{transform}"
				v-model="canvas.modelTransform"
				@update:modelValue="onUpdateTransform"
				:class="{ '--moved': canvas.moved }"
				@transitionend="onTransitionEnd"
			>
				<Tree
					:canvasTransform="transform"
					ref="tree"
					@moveTo="onMoveTo"
					@showWizard="onShowWizard"
					@controlDetail="onControlDetail"
				></Tree>
			</TransformCanvas>
			<DetailPanel
				@showWizard="onShowWizard"
				@removeDepartment="onRemoveDepartment"
				v-model="detailPanel.collapsed"
				:preventPanelSwitch="detailPanel.preventSwitch"
			></DetailPanel>
			<TransformPanel
				v-model="canvas.modelTransform"
			></TransformPanel>
			<ChartWizard
				v-if="wizard.shown"
				:nodeId="wizard.nodeId"
				:isEditMode="wizard.isEditMode"
				:showEntitySelector="wizard.showEntitySelector"
				:entity="wizard.entity"
				:entityType="wizard.entityType"
				:source="wizard.source"
				:refToFocus="wizard.refToFocus"
				@modifyTree="onModifyTree"
				@close="onWizardClose"
			></ChartWizard>
			<FirstPopup></FirstPopup>
			<div class="humanresources-chart__back"></div>
		</div>
	`,
};
