import { Popup } from 'main.popup';
import { addCustomEvent, GetWindowSize, onCustomEvent, removeCustomEvent } from 'main.core';
import { BookingUtil, Dom, Event, Loc, Runtime, Type } from 'calendar.resourcebooking';

export class PlannerPopup
{
	constructor()
	{
		this.requestSequence = 0;
		this.activeRequestId = 0;
		this.availabilityState = 'unknown';
		this.handleDocumentClick = this.handleClick.bind(this);
		this.handlePopupClose = () => this.close({ animation: false });
		this.handleScaleChanged = this.handlePlannerScaleChanged.bind(this);
	}

	show(params = {})
	{
		if (!params.bindNode)
		{
			return;
		}

		if (this.isShown() && this.plannerId === params.plannerId)
		{
			return;
		}

		if (this.popup)
		{
			this.close({ animation: false });
		}

		this.params = params;
		this.bindNode = params.bindNode;
		this.plannerId = params.plannerId;
		this.config = params.plannerConfig;
		this.currentEntries = [];
		this.currentAccessibility = {};
		this.currentLoadedDataFrom = null;
		this.currentLoadedDataTo = null;

		this.plannerWrap = Dom.create('div', {
			attrs: {
				id: this.plannerId,
				className: 'calendar-planner-wrapper',
			},
		});

		this.popup = new Popup(
			`${this.plannerId}_popup`,
			this.bindNode,
			{
				autoHide: false,
				ariaLabel: Loc.getMessage('USER_TYPE_RESOURCE_PLANNER_ARIA_LABEL'),
				closeByEsc: true,
				offsetTop: -parseInt(this.bindNode.offsetHeight, 10) - 20,
				offsetLeft: this.bindNode.offsetWidth + 38,
				lightShadow: true,
				content: this.plannerWrap,
			},
		);

		this.popup.setAngle({ offset: 100, position: 'left' });
		this.popup.show();
		this.lastPlannerIdShown = this.plannerId;

		const bindPosition = Dom.getPosition(this.bindNode);
		const windowSize = GetWindowSize();

		this.plannerWidth = windowSize.innerWidth - bindPosition.right - 160;
		this.config.width = this.plannerWidth;

		if (this.popup.popupContainer)
		{
			Dom.addClass(this.popup.popupContainer, 'calendar-resbook-planner-popup');
			Dom.addClass(this.popup.popupContainer, 'show');
			Dom.style(this.popup.popupContainer, 'width', `${this.plannerWidth + 40}px`);
			Event.bind(document, 'click', this.handleDocumentClick);
		}

		this.showPlanner();
		this.popup.subscribe('onClose', this.handlePopupClose);
	}

	update(params, refreshParams)
	{
		if (!this.isShown())
		{
			return;
		}

		let updateParams = params;
		if (Type.isPlainObject(this.lastUpdateParams) && Type.isPlainObject(params) && refreshParams !== true)
		{
			updateParams = {
				...this.lastUpdateParams,
				...params,
			};
		}

		if (!Type.isPlainObject(updateParams))
		{
			return;
		}

		updateParams = {
			...updateParams,
			focusSelector: updateParams.focusSelector !== false,
		};
		this.lastUpdateParams = updateParams;

		const plannerConfig = Runtime.clone(this.config, true);
		const dateRange = this.getDateRange(updateParams);
		if (dateRange.updateScaleLimits)
		{
			plannerConfig.scaleDateFrom = dateRange.dateFrom;
			plannerConfig.scaleDateTo = dateRange.dateTo;
		}
		const requestData = {
			codes: this.getUserCodes(updateParams),
			resources: Type.isArray(updateParams.resourceList) ? updateParams.resourceList : [],
			from: BookingUtil.formatDate(null, dateRange.fromTimestamp / 1000),
			to: BookingUtil.formatDate(null, dateRange.toTimestamp / 1000),
			currentEventList: Type.isArray(this.params.currentEventList) ? this.params.currentEventList : [],
		};
		const requestContext = {
			params: updateParams,
			plannerConfig,
			dateFrom: dateRange.dateFrom,
			dateTo: dateRange.dateTo,
		};

		if (this.checkUpdateParams(requestData, requestContext))
		{
			this.requestPlannerData(requestData, requestContext);
		}
		else if (Type.isPlainObject(this.lastRequestData.response))
		{
			this.applyPlannerResponse(this.lastRequestData.response, requestContext);
		}
	}

	getDateRange(params)
	{
		let fromTimestamp = null;
		let toTimestamp = null;
		let dateFrom = null;
		let dateTo = null;
		let updateScaleLimits = false;

		if (params.from && params.to)
		{
			dateFrom = BookingUtil.parseDate(params.from);
			dateTo = BookingUtil.parseDate(params.to);
			fromTimestamp = dateFrom.getTime();
			toTimestamp = dateTo.getTime();
		}
		else if (params.selector.fullDay)
		{
			fromTimestamp = params.selector.from.getTime() - BookingUtil.getDayLength() * 12;
			toTimestamp = params.selector.from.getTime() + BookingUtil.getDayLength() * 14;
		}
		else
		{
			fromTimestamp = params.selector.from.getTime() - BookingUtil.getDayLength() * 3;
			toTimestamp = params.selector.from.getTime() + BookingUtil.getDayLength() * 5;
		}

		if (!dateFrom || !dateTo)
		{
			dateFrom = new Date(fromTimestamp);
			dateTo = new Date(toTimestamp);
			updateScaleLimits = true;
		}

		return { fromTimestamp, toTimestamp, dateFrom, dateTo, updateScaleLimits };
	}

	getUserCodes(params)
	{
		const codes = [];
		const codeIndex = {};
		const addCode = (userId) => {
			const code = `U${userId}`;
			if (!codeIndex[code])
			{
				codes.push(code);
				codeIndex[code] = true;
			}
		};

		if (Type.isArray(params.userList))
		{
			params.userList.forEach((user) => addCode(user.id));
		}

		if (Type.isArray(params.selectedUsers))
		{
			params.selectedUsers.forEach((userId) => addCode(userId));
		}

		return codes;
	}

	requestPlannerData(requestData, requestContext)
	{
		const requestId = ++this.requestSequence;
		const requestRecord = this.lastRequestData;
		requestRecord.requestContext = requestContext;
		this.activeRequestId = requestId;
		requestRecord.requesting = true;
		delete requestRecord.response;

		this.setAvailabilityState('loading');
		this.showPlannerLoader();

		return BX.ajax.runAction('calendar.api.resourcebookingajax.getplannerdata', {
			data: {
				codes: requestData.codes,
				resources: requestData.resources,
				from: requestData.from,
				to: requestData.to,
				currentEventList: requestData.currentEventList,
			},
		}).then(
			(response) => {
				if (!this.isActiveRequest(requestId))
				{
					requestRecord.requesting = false;

					return response;
				}

				requestRecord.requesting = false;
				this.hidePlannerLoader();

				if (
					!response
					|| !Type.isPlainObject(response.data)
					|| !Type.isArray(response.data.entries)
				)
				{
					this.setAvailabilityState('error');

					return response;
				}

				requestRecord.response = response;
				this.applyPlannerResponse(response, requestRecord.requestContext);

				return response;
			},
			(error) => {
				if (!this.isActiveRequest(requestId))
				{
					requestRecord.requesting = false;

					return error;
				}

				requestRecord.requesting = false;
				this.hidePlannerLoader();
				this.setAvailabilityState('error');

				return error;
			},
		);
	}

	isActiveRequest(requestId)
	{
		return requestId === this.activeRequestId && this.isShown();
	}

	checkUpdateParams(requestData, requestContext)
	{
		const samePlanner = this.lastRequestPlannerId === this.plannerId;
		const sameRequest = samePlanner
			&& this.lastRequestData
			&& requestData.from === this.lastRequestData.from
			&& requestData.to === this.lastRequestData.to
			&& this.areSetsEqual(requestData.codes, this.lastRequestData.codes, (code) => String(code))
			&& this.areSetsEqual(
				requestData.resources,
				this.lastRequestData.resources,
				(resource) => `${resource.type}:${resource.id}`,
			)
			&& this.areSetsEqual(
				requestData.currentEventList,
				this.lastRequestData.currentEventList,
				(eventId) => String(eventId),
			)
		;

		if (!sameRequest || (!this.lastRequestData.requesting && !this.lastRequestData.response))
		{
			this.lastRequestData = {
				...requestData,
				requestContext,
			};
			this.lastRequestPlannerId = this.plannerId;

			return true;
		}

		this.lastRequestData.requestContext = requestContext;

		return false;
	}

	areSetsEqual(leftItems, rightItems, getKey)
	{
		const createIndex = (items) => {
			const index = Object.create(null);
			(Type.isArray(items) ? items : []).forEach((item) => {
				index[getKey(item)] = true;
			});

			return index;
		};
		const leftIndex = createIndex(leftItems);
		const rightIndex = createIndex(rightItems);
		const leftKeys = Object.keys(leftIndex);
		const rightKeys = Object.keys(rightIndex);

		return leftKeys.length === rightKeys.length
			&& leftKeys.every((key) => rightIndex[key])
		;
	}

	applyPlannerResponse(response, requestContext)
	{
		const responseData = response.data;
		const entries = (Type.isArray(responseData.entries) ? responseData.entries : []).map((entry) => ({
			...entry,
			selected: this.isEntrySelected(entry, requestContext.params),
		}));

		this.currentEntries = entries;
		this.currentAccessibility = responseData.accessibility || {};
		this.currentLoadedDataFrom = requestContext.dateFrom;
		this.currentLoadedDataTo = requestContext.dateTo;
		this.setAvailabilityState(
			responseData.plannerLimitExceeded === true ? 'limit-exceeded' : 'available',
			responseData,
		);

		if (!this.isShown())
		{
			return;
		}

		const params = requestContext.params;
		onCustomEvent('OnCalendarPlannerDoUpdate', [{
			plannerId: this.plannerId,
			config: requestContext.plannerConfig,
			focusSelector: params.focusSelector,
			selector: {
				from: params.selector.from,
				to: params.selector.to,
				fullDay: params.selector.fullDay,
				animation: params.focusSelector,
				updateScaleLimits: params.focusSelector,
			},
			data: {
				entries,
				accessibility: this.currentAccessibility,
			},
			loadedDataFrom: requestContext.dateFrom,
			loadedDataTo: requestContext.dateTo,
			show: false,
		}]);
	}

	isEntrySelected(entry, params)
	{
		const selectedUsers = Type.isArray(params.selectedUsers) ? params.selectedUsers : [];
		const selectedResources = Type.isArray(params.selectedResources) ? params.selectedResources : [];

		if (entry.type === 'user')
		{
			return selectedUsers.some((userId) => parseInt(entry.id, 10) === parseInt(userId, 10));
		}

		return selectedResources.some((resource) => {
			return entry.type === resource.type && parseInt(entry.id, 10) === parseInt(resource.id, 10);
		});
	}

	setAvailabilityState(state, responseData = {})
	{
		this.availabilityState = state;

		if (this.params && Type.isFunction(this.params.availabilityStateChangeCallback))
		{
			this.params.availabilityStateChangeCallback({
				plannerId: this.plannerId,
				state,
				maxPlannerUsers: responseData.maxPlannerUsers,
				plannerPeopleCount: responseData.plannerPeopleCount,
			});
		}
	}

	showPlanner()
	{
		this.planner = new window.CalendarPlanner(
			this.params.plannerConfig,
			{
				config: this.config,
				data: {
					accessibility: this.currentAccessibility || {},
					entries: this.currentEntries,
				},
				selector: {
					from: this.params.selector.from,
					to: this.params.selector.to,
					fullDay: this.params.selector.fullDay,
					updateScaleLimits: true,
					updateScaleType: false,
					focus: true,
					RRULE: false,
					animation: false,
				},
				loadedDataFrom: this.currentLoadedDataFrom,
				loadedDataTo: this.currentLoadedDataTo,
				focusSelector: true,
				plannerId: this.plannerId,
				show: true,
			},
		);

		this.bindPlannerEvents();
		this.syncPlannerSelectorStatus();
		if (this.availabilityState === 'loading')
		{
			this.showPlannerLoader();
		}
	}

	syncPlannerSelectorStatus()
	{
		if (
			Type.isBoolean(this.planner?.selectorIsFree)
			&& Type.isFunction(this.params.checkSelectorStatusCallback)
		)
		{
			this.params.checkSelectorStatusCallback({
				plannerId: this.plannerId,
				status: this.planner.selectorIsFree ? 'free' : 'busy',
			});
		}
	}

	bindPlannerEvents()
	{
		this.unbindPlannerEvents();
		this.plannerEventHandlers = [];
		const events = [
			['OnCalendarPlannerSelectorChanged', this.params.selectorOnChangeCallback],
			['OnCalendarPlannerSelectedEntriesOnChange', this.params.selectEntriesOnChangeCallback],
			['OnCalendarPlannerSelectorStatusOnChange', this.params.checkSelectorStatusCallback],
			['OnCalendarPlannerScaleChanged', this.handleScaleChanged],
		];

		events.forEach(([eventName, handler]) => {
			if (Type.isFunction(handler))
			{
				addCustomEvent(eventName, handler);
				this.plannerEventHandlers.push([eventName, handler]);
			}
		});
	}

	unbindPlannerEvents()
	{
		if (!Type.isArray(this.plannerEventHandlers))
		{
			return;
		}

		this.plannerEventHandlers.forEach(([eventName, handler]) => {
			removeCustomEvent(eventName, handler);
		});
		this.plannerEventHandlers = [];
	}

	handlePlannerScaleChanged(params)
	{
		if (!this.isShown())
		{
			return;
		}

		this.update({
			from: params.from,
			to: params.to,
			focusSelector: params.focusSelector === true,
		});
	}

	showPlannerLoader()
	{
		if (this.planner && this.planner.outerWrap)
		{
			this.hidePlannerLoader();
			this.loader = BookingUtil.getLoader(150);
			Dom.append(this.loader, this.planner.outerWrap);
		}
	}

	hidePlannerLoader()
	{
		if (this.loader)
		{
			Dom.remove(this.loader);
			this.loader = null;
		}
	}

	close(params = {})
	{
		clearTimeout(this.closeAnimationTimer);
		const availabilityWasLoading = this.availabilityState === 'loading';
		this.activeRequestId = ++this.requestSequence;
		if (this.lastRequestData && this.lastRequestData.requesting)
		{
			this.lastRequestData.requesting = false;
			delete this.lastRequestData.response;
		}
		this.hidePlannerLoader();
		this.unbindPlannerEvents();
		Event.unbind(document, 'click', this.handleDocumentClick);

		if (availabilityWasLoading)
		{
			this.setAvailabilityState('unknown');
		}

		if (!this.popup)
		{
			return;
		}

		if (params.animation)
		{
			this.lastPlannerIdShown = null;
			Dom.removeClass(this.popup.popupContainer, 'show');
			this.closeAnimationTimer = setTimeout(() => this.close({ animation: false }), 300);

			return;
		}

		if (this.planner)
		{
			onCustomEvent('OnCalendarPlannerDoUninstall', [{ plannerId: this.plannerId }]);
		}
		this.popup.unsubscribe('onClose', this.handlePopupClose);
		this.popup.destroy();
		this.planner = null;
		this.popup = null;
		this.lastPlannerIdShown = null;
	}

	isShown()
	{
		return this.lastPlannerIdShown === this.plannerId
			&& this.popup
			&& this.popup.isShown()
		;
	}

	getPlannerId()
	{
		if (Type.isUndefined(this.plannerId))
		{
			this.plannerId = `calendar-planner-${Math.round(Math.random() * 100_000)}`;
		}

		return this.plannerId;
	}

	handleClick(event)
	{
		const target = event.target || event.srcElement;
		if (
			this.isShown()
			&& !this.isTargetInside(this.bindNode, target)
			&& !this.isTargetInside(document.getElementById('BXSocNetLogDestination'), target)
			&& !this.isTargetInside(this.popup.popupContainer, target)
			&& !Dom.hasClass(target, 'calendar-resourcebook-content-block-control-delete')
			&& !document.querySelector('div.popup-window-resource-select')
		)
		{
			this.close({ animation: true });
		}
	}

	isTargetInside(container, target)
	{
		return Type.isDomNode(container) && Type.isDomNode(target) && container.contains(target);
	}
}
