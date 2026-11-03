import { Type, ajax, Event, Loc } from 'main.core';
import { FocusNavigator, InteractivityChecker, LiveAnnouncer } from 'ui.a11y';

import {Grid} from './grid';

const MAX_GROUP_IDS_PER_REQUEST = 100;
const HOVER_HIDDEN_PIN_SELECTOR = '.main-grid-cell-content-action-pin.main-grid-cell-content-action-by-hover';
const supportsCheckVisibility = Type.isFunction(window.Element?.prototype?.checkVisibility);

function isHoverHiddenPinFocusable(element)
{
	if (
		!element.matches(HOVER_HIDDEN_PIN_SELECTOR)
		|| !element.isConnected
		|| element.closest('[inert]')
		|| !element.matches(FocusNavigator.FOCUSABLE_SELECTOR)
		|| InteractivityChecker.hasNegativeTabIndex(element)
		|| InteractivityChecker.isDisabled(element)
	)
	{
		return false;
	}

	if (supportsCheckVisibility)
	{
		return element.checkVisibility({ visibilityProperty: true, opacityProperty: false });
	}

	const hasGeometry = element.offsetWidth > 0 || element.offsetHeight > 0 || element.getClientRects().length > 0;

	return hasGeometry && getComputedStyle(element).visibility === 'visible';
}

export class PullController
{
	static get focusControlSelectors()
	{
		return {
			primaryLink: '.tasks-projects-text',
			pin: '.main-grid-cell-content-action-pin',
			checkbox: '.main-grid-row-checkbox',
			actions: '.main-grid-row-action-button',
			members: '.tasks-projects-user-list-container',
			join: '.tasks-projects-badge-join',
			accept: '.tasks-projects-badge-accept',
			cancel: '.tasks-projects-badge-cancel',
		};
	}

	static get events()
	{
		return {
			add: 'add',
			update: 'update',
			remove: 'remove',
			userAdd: 'userAdd',
			userUpdate: 'userUpdate',
			userRemove: 'userRemove',
			pinChanged: 'pinChanged',
		};
	}

	static get counterEvents()
	{
		return [
			'onAfterTaskAdd',
			'onAfterTaskDelete',
			'onAfterTaskRestore',
			'onAfterTaskView',
			'onAfterTaskMute',
			'onAfterCommentAdd',
			'onAfterCommentDelete',
			'onProjectPermUpdate',
		];
	}

	static get movingProjectEvents()
	{
		return [
			'onAfterTaskAdd',
			'onAfterCommentAdd',
		];
	}

	constructor(options)
	{
		this.signedParameters = options.signedParameters;
		this.isScrumList = options.isScrumList === 'Y';
		this.createProjectUrl = options.createProjectUrl;
		this.scrumLimitSidePanelId = options.scrumLimitSidePanelId;

		this.grid = new Grid(options);

		this.timer = null;
		this.counterData = new Map();
		this.userOptions = options.userOptions;
	}

	getModuleId()
	{
		return 'tasks';
	}

	getMap()
	{
		return {
			project_add: this.onProjectAdd.bind(this),
			project_update: this.onProjectUpdate.bind(this),
			project_remove: this.onProjectRemove.bind(this),
			project_user_add: this.onProjectUserAdd.bind(this),
			project_user_update: this.onProjectUserUpdate.bind(this),
			project_user_remove: this.onProjectUserRemove.bind(this),
			project_user_option_changed: this.onProjectUserOptionChanged.bind(this),
			project_counter: this.onProjectCounter.bind(this),
			project_read_all: this.onProjectCommentsReadAll.bind(this),
			comment_read_all: this.onProjectCommentsReadAll.bind(this),
			scrum_read_all: this.onProjectCommentsReadAll.bind(this)
		};
	}

	onProjectAdd(data)
	{
		const params = {
			event: PullController.events.add,
			moveParams: {
				rowBefore: this.grid.getLastPinnedRowId(),
				rowAfter: this.grid.getFirstRowId(),
			},
		};

		this.checkExistence(data.ID).then(
			response => this.onCheckExistenceSuccess(response, data.ID, params),
			response => console.error(response)
		);

		if (this.isScrumList)
		{
			this.checkScrumLimit()
				.then(
					isLimitExceeded => this.onCheckScrumLimit(isLimitExceeded),
					response => console.error(response)
				)
			;
		}
	}

	onProjectUpdate(data)
	{
		const params = {
			event: PullController.events.update,
		};

		this.checkExistence(data.ID).then(
			response => this.onCheckExistenceSuccess(response, data.ID, params),
			response => console.error(response)
		);
	}

	onProjectRemove(data)
	{
		this.removeRow(data.ID);

		if (this.isScrumList)
		{
			this.checkScrumLimit()
				.then(
					isLimitExceeded => this.onCheckScrumLimit(isLimitExceeded),
					response => console.error(response)
				)
			;
		}
	}

	onProjectUserAdd(data)
	{
		const params = {
			event: PullController.events.userAdd,
		};

		this.checkExistence(data.GROUP_ID).then(
			response => this.onCheckExistenceSuccess(response, data.GROUP_ID, params),
			response => console.error(response)
		);
	}

	onProjectUserUpdate(data)
	{
		const params = {
			event: PullController.events.userUpdate,
		};

		this.checkExistence(data.GROUP_ID).then(
			response => this.onCheckExistenceSuccess(response, data.GROUP_ID, params),
			response => console.error(response)
		);
	}

	onProjectUserRemove(data)
	{
		const params = {
			event: PullController.events.userRemove,
		};

		this.checkExistence(data.GROUP_ID).then(
			response => this.onCheckExistenceSuccess(response, data.GROUP_ID, params),
			response => console.error(response)
		);
	}

	onProjectUserOptionChanged(data)
	{
		switch (data.OPTION)
		{
			case this.userOptions.pinned:
				this.onProjectPinChanged(data);
				break;

			default:
				break;
		}
	}

	onProjectPinChanged(data)
	{
		const params = {
			event: PullController.events.pinChanged,
		};

		this.moveToDirectPlace(data.PROJECT_ID, null, params);
	}

	onProjectCounter(data)
	{
		const groupId = data.GROUP_ID;
		const event = data.EVENT;

		if (!PullController.counterEvents.includes(event))
		{
			return;
		}

		if (!this.timer)
		{
			this.timer = setTimeout(() => {
				this.freeCounterQueue();
			}, 1000);
		}

		if (PullController.movingProjectEvents.includes(event) || !this.counterData.has(groupId))
		{
			this.counterData.set(groupId, event);
		}
	}

	freeCounterQueue()
	{
		this.counterData.forEach((event, groupId) => {
			const params = {
				event,
				highlightParams: {
					skip: true,
				},
			};
			if (PullController.movingProjectEvents.includes(event))
			{
				params.moveParams = {
					rowBefore: (this.grid.getIsPinned(groupId) ? 0 : this.grid.getLastPinnedRowId()),
					rowAfter: this.grid.getFirstRowId(),
				};
				params.highlightParams = {
					skip: false,
				};
			}
			this.checkExistence(groupId).then(
				response => this.onCheckExistenceSuccess(response, groupId, params),
				response => console.error(response)
			);
		});
		this.counterData.clear();
		this.timer = null;
	}

	onProjectCommentsReadAll(data)
	{
		const groupId = data.GROUP_ID;

		if (groupId)
		{
			if (this.grid.isRowExist(groupId))
			{
				this.updateCounter([groupId]);
			}
		}
		else
		{
			this.updateCounter(this.grid.getItems());
		}
	}

	checkExistence(groupId)
	{
		return new Promise((resolve, reject) => {
			BX.ajax.runComponentAction('bitrix:tasks.projects', 'checkExistence', {
				mode: 'class',
				data: {
					groupIds: [groupId],
				},
				signedParameters: this.signedParameters,
			}).then(
				response => resolve(response),
				response => reject(response)
			);
		});
	}

	checkScrumLimit(): Promise
	{
		return new Promise((resolve, reject) => {
			ajax.runAction(
				'bitrix:tasks.scrum.info.checkScrumLimit',
				{
					data: {},
					signedParameters: this.signedParameters,
				}
			)
				.then(
					response => resolve(response.data),
					response => reject(response)
				)
			;
		});
	}

	onCheckExistenceSuccess(response, groupId, params)
	{
		if (Type.isUndefined(response.data[groupId]))
		{
			return;
		}

		if (response.data[groupId] === false)
		{
			this.removeRow(groupId);
			return;
		}

		const group = response.data[groupId];

		if (this.grid.isRowExist(groupId))
		{
			this.grid.isActivityRealtimeMode()
				? this.updateRow(groupId, group, params)
				: this.moveToDirectPlace(groupId, group, params)
			;
		}
		else if (
			this.grid.isActivityRealtimeMode()
			&& (PullController.movingProjectEvents.includes(params.event) || params.event === PullController.events.add)
		)
		{
			this.updateItem(groupId, group, params);
		}
		else
		{
			this.moveToDirectPlace(groupId, group, params);
		}
	}

	onCheckScrumLimit(isLimitExceeded: boolean)
	{
		this.projectAddButton = document.getElementById('projectAddButton');
		if (!Type.isDomNode(this.projectAddButton))
		{
			return;
		}

		if (isLimitExceeded)
		{
			this.projectAddButton.href = `javascript:BX.UI.InfoHelper.show('${this.scrumLimitSidePanelId
				}', {isLimit: true, limitAnalyticsLabels: {module: 'tasks', source: 'scrumList'}})`
			;
		}
		else
		{
			this.projectAddButton.href = this.createProjectUrl;
		}
	}

	updateItem(rowId, rowData, params)
	{
		if (!this.grid.hasItem(rowId))
		{
			this.grid.addItem(rowId);
			this.addRow(rowId, rowData, params);
		}
		else
		{
			this.updateRow(rowId, rowData, params);
		}
	}

	addRow(rowId, rowData, params)
	{
		if (this.grid.isRowExist(rowId))
		{
			return;
		}

		BX.ajax.runComponentAction('bitrix:tasks.projects', 'prepareGridRows', {
			mode: 'class',
			data: {
				groupIds: [rowId],
				data: (rowData ? {[rowId]: rowData} : null),
			},
			signedParameters: this.signedParameters,
		})
			.then((response) => {
				if (!Type.isUndefined(response.data[rowId]))
				{
					this.grid.addRow(rowId, response.data[rowId], params);
				}
			})
		;
	}

	updateRow(rowId, rowData, params)
	{
		if (!this.grid.isRowExist(rowId))
		{
			return;
		}

		BX.ajax.runComponentAction('bitrix:tasks.projects', 'prepareGridRows', {
			mode: 'class',
			data: {
				groupIds: [rowId],
				data: (rowData ? {[rowId]: rowData} : null),
			},
			signedParameters: this.signedParameters,
		})
			.then((response) => {
				if (!Type.isUndefined(response.data[rowId]))
				{
					const focusState = this.captureRowFocus(rowId);
					this.grid.updateRow(rowId, response.data[rowId], params);
					this.restoreUpdatedRowFocus(rowId, focusState);
				}
			})
		;
	}

	removeRow(rowId)
	{
		if (!this.grid.isRowExist(rowId))
		{
			this.grid.removeItem(rowId);

			return;
		}

		const focusSession = this.startRemovalFocusSession();
		this.grid.removeRow(
			rowId,
			() => this.finishRemoval(rowId, focusSession),
		);
	}

	finishRemoval(rowId, focusSession)
	{
		const activeRowDisappeared = this.restoreRemovedRowFocus(focusSession);
		if (this.grid.isRowExist(rowId))
		{
			this.grid.addItem(rowId);
		}
		else
		{
			this.grid.removeItem(rowId);
		}

		this.finishRemovalFocusSession(focusSession);

		if (activeRowDisappeared)
		{
			this.announceRemovedRow();
		}
	}

	captureRowFocus(rowId)
	{
		if (!this.grid.isRowExist(rowId))
		{
			return null;
		}

		const rowNode = this.grid.getRowNodeById(rowId);
		const activeElement = FocusNavigator.getActiveElement();
		if (!Type.isElementNode(activeElement) || !rowNode.contains(activeElement))
		{
			return null;
		}

		const controlType = Object.keys(PullController.focusControlSelectors).find((type) => {
			return activeElement.matches(PullController.focusControlSelectors[type]);
		});

		return {
			controlType,
			rowNode,
		};
	}

	captureGridFocus(activeElement = FocusNavigator.getActiveElement())
	{
		if (!Type.isElementNode(activeElement))
		{
			return null;
		}

		const focusedRow = this.grid.getRows().find((row) => row.getNode().contains(activeElement));
		if (!focusedRow)
		{
			return null;
		}

		const rowId = focusedRow.getId();
		const rowNode = focusedRow.getNode();
		const controlType = Object.keys(PullController.focusControlSelectors).find((type) => {
			return activeElement.matches(PullController.focusControlSelectors[type]);
		});

		return {
			rowId,
			rowNode,
			controlType,
			nearbyRowIds: this.getVisibleRowIdsByDistance(rowId),
		};
	}

	startRemovalFocusSession()
	{
		const container = this.grid.getContainer();
		if (!Type.isElementNode(container))
		{
			return null;
		}

		const ownerDocument = container.ownerDocument;
		const ownerWindow = ownerDocument.defaultView;
		const captureOptions = { capture: true };
		const focusSession = {
			isActive: true,
			focusState: this.captureGridFocus(),
			stop: null,
		};
		let trackingTimeout = null;

		const clearFocusState = () => {
			focusSession.focusState = null;
		};

		const onFocusOut = (event) => {
			const departedRowNode = focusSession.focusState?.rowNode;
			if (!departedRowNode?.contains(event.target))
			{
				return;
			}

			const nextTarget = event.relatedTarget;
			if (Type.isElementNode(nextTarget))
			{
				focusSession.focusState = this.captureGridFocus(nextTarget);
			}
			else if (nextTarget === null)
			{
				queueMicrotask(() => {
					if (
						focusSession.isActive
						&& focusSession.focusState?.rowNode === departedRowNode
						&& departedRowNode.isConnected
						&& ownerDocument.activeElement === ownerDocument.body
					)
					{
						clearFocusState();
					}
				});
			}
		};

		const onFocusIn = (event) => {
			focusSession.focusState = this.captureGridFocus(event.target);
		};

		const onOutsideInteraction = (event) => {
			if (
				!Type.isDomNode(event.target)
				|| !focusSession.focusState?.rowNode.contains(event.target)
			)
			{
				clearFocusState();
			}
		};

		const onWindowBlur = () => clearFocusState();

		focusSession.stop = () => {
			if (!focusSession.isActive)
			{
				return;
			}

			focusSession.isActive = false;
			Event.unbind(ownerDocument, 'focusout', onFocusOut, captureOptions);
			Event.unbind(ownerDocument, 'focusin', onFocusIn, captureOptions);
			Event.unbind(ownerDocument, 'pointerdown', onOutsideInteraction, captureOptions);
			if (ownerWindow)
			{
				Event.unbind(ownerWindow, 'blur', onWindowBlur);
			}
			clearTimeout(trackingTimeout);
		};

		Event.bind(ownerDocument, 'focusout', onFocusOut, captureOptions);
		Event.bind(ownerDocument, 'focusin', onFocusIn, captureOptions);
		Event.bind(ownerDocument, 'pointerdown', onOutsideInteraction, captureOptions);
		if (ownerWindow)
		{
			Event.bind(ownerWindow, 'blur', onWindowBlur);
		}
		trackingTimeout = setTimeout(() => focusSession.stop(), 60000);

		return focusSession;
	}

	finishRemovalFocusSession(focusSession)
	{
		if (!focusSession)
		{
			return;
		}

		focusSession.stop();
	}

	getVisibleRowIdsByDistance(rowId)
	{
		const visibleRows = this.grid.getRows().filter((row) => row.isShown());
		const rowIndex = visibleRows.findIndex((row) => String(row.getId()) === String(rowId));
		if (rowIndex < 0)
		{
			return { next: [], previous: [] };
		}

		return {
			next: visibleRows.slice(rowIndex + 1).map((row) => row.getId()),
			previous: visibleRows.slice(0, rowIndex).reverse().map((row) => row.getId()),
		};
	}

	restoreUpdatedRowFocus(rowId, focusState)
	{
		if (!focusState || !this.grid.isRowExist(rowId))
		{
			return;
		}

		const rowNode = this.grid.getRowNodeById(rowId);
		const equivalentControl = focusState.controlType
			? rowNode.querySelector(PullController.focusControlSelectors[focusState.controlType])
			: null
		;

		if (this.focusFirst([equivalentControl], { allowHoverHiddenPin: true }))
		{
			return;
		}

		this.focusFirst([rowNode.querySelector(PullController.focusControlSelectors.primaryLink)]);
	}

	restoreRemovedRowFocus(focusSession)
	{
		const focusState = focusSession?.focusState;
		const ownerDocument = focusState?.rowNode.ownerDocument;
		if (
			!focusState
			|| !focusSession?.isActive
			|| ownerDocument.activeElement !== ownerDocument.body
		)
		{
			return false;
		}

		const activeRowDisappeared = !this.grid.isRowExist(focusState.rowId);
		if (!activeRowDisappeared)
		{
			const rowNode = this.grid.getRowNodeById(focusState.rowId);
			const equivalentControl = focusState.controlType
				? rowNode.querySelector(PullController.focusControlSelectors[focusState.controlType])
				: null
			;
			if (
				this.focusFirst([equivalentControl], { allowHoverHiddenPin: true })
				|| this.focusFirst([rowNode.querySelector(PullController.focusControlSelectors.primaryLink)])
			)
			{
				return false;
			}
		}

		const rowCandidates = [];
		const maxDistance = Math.max(
			focusState.nearbyRowIds.next.length,
			focusState.nearbyRowIds.previous.length,
		);
		for (let distance = 0; distance < maxDistance; distance++)
		{
			rowCandidates.push(
				this.getVisibleRowPrimaryLink(focusState.nearbyRowIds.next[distance]),
				this.getVisibleRowPrimaryLink(focusState.nearbyRowIds.previous[distance]),
			);
		}

		const focusRestored = this.focusFirst([
			...rowCandidates,
			this.grid.getHeaderSelectAllCheckbox(),
			() => {
				const container = this.grid.getContainer();
				if (!Type.isElementNode(container))
				{
					return null;
				}

				container.tabIndex = -1;

				return container;
			},
		]);

		return activeRowDisappeared && focusRestored;
	}

	announceRemovedRow()
	{
		const messageCode = this.isScrumList
			? 'TASKS_PROJECTS_SCRUM_A11Y_ROW_REMOVED'
			: 'TASKS_PROJECTS_A11Y_ROW_REMOVED'
		;
		const message = Loc.getMessage(messageCode);
		if (message)
		{
			LiveAnnouncer.announce(message);
		}
	}

	getVisibleRowPrimaryLink(rowId)
	{
		if (!rowId || !this.grid.isRowExist(rowId))
		{
			return null;
		}

		const row = this.grid.getRowById(rowId);
		if (!row.isShown())
		{
			return null;
		}

		return row.getNode().querySelector(PullController.focusControlSelectors.primaryLink);
	}

	focusFirst(candidates, options = {})
	{
		const { allowHoverHiddenPin = false } = options;
		for (const candidate of candidates)
		{
			const element = Type.isFunction(candidate) ? candidate() : candidate;
			if (
				!Type.isElementNode(element)
				|| (
					!InteractivityChecker.isFocusable(element)
					&& !(allowHoverHiddenPin && isHoverHiddenPinFocusable(element))
				)
			)
			{
				continue;
			}

			FocusNavigator.restoreFocus(element, { preventScroll: true });
			if (
				element.ownerDocument.activeElement === element
				&& (
					InteractivityChecker.isFocusable(element)
					|| (allowHoverHiddenPin && isHoverHiddenPinFocusable(element))
				)
			)
			{
				return true;
			}
		}

		return false;
	}

	moveToDirectPlace(groupId, data, params)
	{
		params = params || {};

		BX.ajax.runComponentAction('bitrix:tasks.projects', 'findProjectPlace', {
			mode: 'class',
			data: {
				groupId,
				currentPage: this.grid.getCurrentPage(),
			},
			signedParameters: this.signedParameters,
		}).then((response) => {
			if (response.data === null)
			{
				return;
			}

			const {projectBefore, projectAfter} = response.data;

			if (projectBefore === false && projectAfter === false)
			{
				this.removeRow(groupId);
			}
			else
			{
				if (
					(projectBefore && this.grid.isRowExist(projectBefore))
					|| (projectAfter && this.grid.isRowExist(projectAfter))
				)
				{
					params.moveParams = {
						rowBefore: projectBefore,
						rowAfter: projectAfter,
					};
				}
				else
				{
					params.moveParams = {
						skip: true,
					};
				}
				this.updateItem(groupId, data, params);
			}
		});
	}

	updateCounter(rowIds)
	{
		for (let offset = 0; offset < rowIds.length; offset += MAX_GROUP_IDS_PER_REQUEST)
		{
			BX.ajax.runComponentAction('bitrix:tasks.projects', 'prepareGridRows', {
				mode: 'class',
				data: {
					groupIds: rowIds.slice(offset, offset + MAX_GROUP_IDS_PER_REQUEST),
					data: null,
				},
				signedParameters: this.signedParameters,
			}).then((response) => {
				const projects = response.data;
				if (projects)
				{
					Object.keys(projects).forEach((projectId) => {
						if (this.grid.isRowExist(projectId))
						{
							this.grid.getRowById(projectId).setCounters(projects[projectId].counters);
						}
					});
				}
			});
		}
	}
}
