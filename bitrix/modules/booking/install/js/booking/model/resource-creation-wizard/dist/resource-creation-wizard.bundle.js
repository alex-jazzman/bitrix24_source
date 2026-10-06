/* eslint-disable */
this.BX = this.BX || {};
this.BX.Booking = this.BX.Booking || {};
(function (exports, main_core, ui_vue3_vuex, booking_const, ui_vue3, booking_core) {
	'use strict';

	function resolveDefaultSenderCode(senders) {
		const aiCall = senders.find(s => s.code === booking_const.Communication.AiCall);
		return aiCall?.canUse ? booking_const.Communication.AiCall : booking_const.Communication.Bitrix24;
	}
	function getResource(resourceId) {
		const store = booking_core.Core.getStore();
		const resource = store.getters['resources/getById'](resourceId);
		return structuredClone(ui_vue3.toRaw(resource));
	}
	function getEmptyResource() {
		return {
			id: null,
			typeId: null,
			name: '',
			description: null,
			avatar: null,
			slotRanges: [],
			counter: null,
			entities: [],
			isMain: true,
			isPrimary: false,
			isDeleted: false,
			isConfirmationNotificationOn: false,
			isCancellationNotificationOn: false,
			isFeedbackNotificationOn: false,
			isInfoNotificationOn: false,
			isDelayedNotificationOn: false,
			isReminderNotificationOn: false,
			templateTypeConfirmation: booking_const.NotificationTemplateType.Animate,
			templateTypeFeedback: booking_const.NotificationTemplateType.Animate,
			templateTypeInfo: booking_const.NotificationTemplateType.Animate,
			templateTypeDelayed: booking_const.NotificationTemplateType.Animate,
			templateTypeReminder: booking_const.NotificationTemplateType.Base,
			createdBy: 0,
			createdAt: 0,
			updatedAt: null,
			skus: [],
			skusYandex: []
		};
	}

	/* eslint-disable no-param-reassign,max-lines-per-function */
	class ResourceCreationWizardModel extends ui_vue3_vuex.BuilderModel {
		getName() {
			return booking_const.Model.ResourceCreationWizard;
		}
		getState() {
			return {
				resourceId: this.getVariable('resourceId', null),
				resourceName: '',
				resourceAvatarFile: null,
				resource: getEmptyResource(),
				templateTypePreselectionContext: null,
				advertisingResourceTypes: [],
				companyScheduleSlots: [],
				fetching: false,
				step: 1,
				isSaving: false,
				invalidResourceName: false,
				invalidResourceType: false,
				invalidIntegrationCalendarUser: false,
				isCompanyScheduleAccess: false,
				companyScheduleUrl: '',
				weekStart: 'Mon',
				globalSchedule: false,
				checkedForAll: {},
				isChannelChoiceAvailable: true,
				isIntegrationCalendarEnabled: false
			};
		}
		getGetters() {
			return {
				/** @function resource-creation-wizard/resourceId */
				resourceId: state => state.resourceId,
				/** @function resource-creation-wizard/getResource */
				getResource: state => state.resource,
				/** @function resource-creation-wizard/getResourceAvatarFile */
				getResourceAvatarFile: state => state.resourceAvatarFile,
				/** @function resource-creation-wizard/templateTypePreselectionContext */
				templateTypePreselectionContext: state => {
					return state.templateTypePreselectionContext;
				},
				/** @function resource-creation-wizard/isSaving */
				isSaving: state => state.isSaving,
				/** @function resource-creation-wizard/getCompanyScheduleSlots */
				getCompanyScheduleSlots: state => state.companyScheduleSlots,
				/** @function resource-creation-wizard/isGlobalSchedule */
				isGlobalSchedule: state => state.globalSchedule,
				startStep: state => {
					return main_core.Type.isNull(state.resourceId) ? 1 : 2;
				},
				finishStep: () => 3,
				invalidIntegrationCalendarUser: state => {
					return state.isIntegrationCalendarEnabled && state.invalidIntegrationCalendarUser;
				},
				invalidChooseTypeCard: state => main_core.Type.isNull(state.resource.typeId),
				invalidSettingsCard: (state, getters) => {
					return state.invalidResourceName || !state.resource.typeId || getters.invalidIntegrationCalendarUser;
				},
				invalidCurrentCard: (state, getters) => {
					if (state.step === 1) {
						return getters.invalidChooseTypeCard;
					}
					if (state.step === 2) {
						return getters.invalidSettingsCard;
					}
					return false;
				},
				/** @function resource-creation-wizard/isCompanyScheduleAccess */
				isCompanyScheduleAccess: state => state.isCompanyScheduleAccess,
				/** @function resource-creation-wizard/showLicenseWarning */
				showLicenseWarning: state => state.showLicenseWarning,
				/** @function resource-creation-wizard/companyScheduleUrl */
				companyScheduleUrl: state => state.companyScheduleUrl,
				/** @function resource-creation-wizard/isAiCommunication */
				isAiCommunication: state => state.resource.senderCode === booking_const.Communication.AiCall,
				/** @function resource-creation-wizard/weekStart */
				weekStart: state => state.weekStart,
				/** @function resource-creation-wizard/isChannelChoiceAvailable */
				isChannelChoiceAvailable: state => state.isChannelChoiceAvailable,
				/** @function resource-creation-wizard/isCheckedForAll */
				isCheckedForAll: state => type => state.checkedForAll[type] ?? true,
				advertisingResourceType: state => {
					const typeId = state.resource.typeId;
					return state.advertisingResourceTypes.find(({
						relatedResourceTypeId
					}) => {
						return relatedResourceTypeId === typeId;
					}) || null;
				},
				entityCalendar: state => {
					return state.resource?.entities?.find(ent => ent.entityType === booking_const.ResourceEntityType.Calendar) || null;
				},
				isIntegrationCalendarEnabled: state => {
					return state.isIntegrationCalendarEnabled;
				},
				skus: state => {
					return state.resource?.skus;
				}
			};
		}
		getActions() {
			return {
				async initState({
					state,
					dispatch
				}) {
					if (main_core.Type.isNull(state.resourceId)) {
						await dispatch('initCreateMaster');
					} else {
						await dispatch('initEditMaster');
					}
				},
				initCreateMaster({
					state,
					commit
				}) {
					commit('init', {
						resourceId: state.resourceId,
						step: 1
					});
					commit('setCurrentResourceName', main_core.Loc.getMessage('BRCW_TITLE'));
				},
				initEditMaster({
					state,
					commit
				}) {
					const resourceId = state.resourceId;
					const resource = getResource(resourceId);
					commit('init', {
						resourceId,
						resource,
						step: 2
					});
					commit('setCurrentResourceName', resource.name);
					commit('setSenderCode', resource.senderCode);
					commit('setIsIntegrationCalendarEnabled', resource.entities?.find(ent => ent.entityType === booking_const.ResourceEntityType.Calendar)?.data?.userIds?.length > 0);
				},
				nextStep({
					state,
					getters,
					commit
				}) {
					if (getters.invalidCurrentCard) {
						return;
					}
					if (state.step < getters.finishStep) {
						commit('updateStep', state.step + 1);
					}
				},
				prevStep({
					state,
					getters,
					commit
				}) {
					if (state.step > getters.startStep) {
						commit('updateStep', state.step - 1);
					}
				},
				setAdvertisingTypes({
					commit
				}, types) {
					const advertisingResourceType = [...types, {
						code: 'none',
						name: main_core.Loc.getMessage('BRCW_CHOOSE_CATEGORY_YOUR_TYPE'),
						relatedResourceTypeId: 0
					}];
					commit('setAdvertisingTypes', advertisingResourceType);
				},
				/** @function resource-creation-wizard/updateResource */
				updateResource({
					commit,
					rootGetters
				}, patch) {
					if (patch.typeId) {
						const resourceType = rootGetters[`${booking_const.Model.ResourceTypes}/getById`](patch.typeId);
						const notificationsData = Object.fromEntries([...Object.values(booking_const.NotificationFieldsMap.NotificationOn), ...Object.values(booking_const.NotificationFieldsMap.TemplateType), ...Object.values(booking_const.NotificationFieldsMap.Settings).flat(), 'senderCode'].map(field => [field, resourceType[field]]));
						if (!notificationsData.senderCode) {
							const senders = rootGetters[`${booking_const.Model.Notifications}/getSenders`];
							notificationsData.senderCode = resolveDefaultSenderCode(senders);
						}
						Object.assign(patch, notificationsData);
					}
					commit('updateResource', patch);
				},
				/** @function resource-creation-wizard/setResourceAvatarFile */
				setResourceAvatarFile({
					commit
				}, file) {
					commit('setResourceAvatarFile', file);
				},
				/** @function resource-creation-wizard/createResourceEntityCalendar */
				createResourceEntityCalendar({
					commit
				}) {
					commit('createResourceEntityCalendar');
				},
				/** @function resource-creation-wizard/updateResourceEntityCalendar */
				updateResourceEntityCalendar({
					commit
				}, calendarPath) {
					commit('updateResourceEntityCalendar', calendarPath);
				},
				/** @function resource-creation-wizard/setCompanyScheduleSlots */
				setCompanyScheduleSlots({
					commit
				}, slots) {
					const defaultTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
					commit('setCompanyScheduleSlots', slots.map(slotRange => ({
						...slotRange,
						weekDays: Object.values(slotRange.weekDays),
						timezone: slotRange.timezone || defaultTimeZone
					})));
				},
				/** @function resource-creation-wizard/setGlobalSchedule */
				setGlobalSchedule({
					commit
				}, checked) {
					commit('setGlobalSchedule', checked);
				},
				/** @function resource-creation-wizard/setCompanyScheduleAccess */
				setCompanyScheduleAccess({
					commit
				}, isCompanyScheduleAccess) {
					commit('setCompanyScheduleAccess', isCompanyScheduleAccess);
				},
				/** @function resource-creation-wizard/setLicenseWarning */
				setLicenseWarning({
					commit
				}, showLicenseWarning) {
					commit('setLicenseWarning', showLicenseWarning);
				},
				/** @function resource-creation-wizard/setCompanyScheduleUrl */
				setCompanyScheduleUrl({
					commit
				}, companyScheduleUrl) {
					commit('setCompanyScheduleUrl', companyScheduleUrl);
				},
				/** @function resource-creation-wizard/setInvalidResourceName */
				setInvalidResourceName({
					commit,
					state
				}, invalid) {
					if (state.invalidResourceName !== invalid) {
						commit('setInvalidResourceName', invalid);
					}
				},
				/** @function resource-creation-wizard/setInvalidResourceType */
				setInvalidResourceType({
					commit,
					state
				}, invalid) {
					if (state.invalidResourceType !== invalid) {
						commit('setInvalidResourceType', invalid);
					}
				},
				/** @function resource-creation-wizard/setWeekStart */
				setWeekStart({
					commit
				}, weekStart) {
					commit('setWeekStart', weekStart);
				},
				/** @function resource-creation-wizard/setCheckedForAll */
				setCheckedForAll({
					commit
				}, {
					type,
					isChecked
				}) {
					commit('setCheckedForAll', {
						type,
						isChecked
					});
				},
				setSlotLengthId({
					commit
				}, {
					slotLengthId
				}) {
					commit('setSlotLengthId', {
						slotLengthId
					});
				},
				/** @function resource-creation-wizard/setIsChannelChoiceAvailable */
				setIsChannelChoiceAvailable({
					commit
				}, isChannelChoiceAvailable) {
					commit('setIsChannelChoiceAvailable', isChannelChoiceAvailable);
				},
				/** @function resource-creation-wizard/setIsIntegrationCalendarEnabled */
				setIsIntegrationCalendarEnabled({
					commit
				}, isIntegrationCalendarEnabled) {
					commit('setIsIntegrationCalendarEnabled', isIntegrationCalendarEnabled);
				},
				/** @function resource-creation-wizard/setInvalidIntegrationCalendarUser */
				setInvalidIntegrationCalendarUser({
					commit
				}, invalidIntegrationCalendarUser) {
					commit('setInvalidIntegrationCalendarUser', invalidIntegrationCalendarUser);
				},
				/** @function resource-creation-wizard/addSku */
				addSku({
					commit
				}, skuId) {
					commit('addSku', skuId);
				},
				/** @function resource-creation-wizard/deleteSku */
				deleteSku({
					commit
				}, skuId) {
					commit('deleteSku', skuId);
				}
			};
		}
		getMutations() {
			return {
				init(state, {
					step,
					resourceId,
					resource = null
				}) {
					state.step = step;
					state.resourceId = resourceId;
					state.resource = main_core.Type.isNull(resourceId) ? getEmptyResource() : resource;
				},
				setCurrentResourceName(state, name) {
					state.resourceName = name;
				},
				setSenderCode(state, senderCode) {
					state.senderCode = senderCode;
				},
				setResourceAvatarFile(state, file) {
					state.resourceAvatarFile = file;
				},
				setTemplateTypePreselectionContext(state, context) {
					state.templateTypePreselectionContext = context;
				},
				setAdvertisingTypes(state, types) {
					state.advertisingResourceTypes = types;
				},
				setCompanyScheduleSlots(state, slots) {
					state.companyScheduleSlots = slots;
				},
				updateStep(state, step) {
					state.step = step;
				},
				updateResource(state, patch) {
					state.resource = {
						...state.resource,
						...patch
					};
				},
				createResourceEntityCalendar(state) {
					const hasCalendarEntity = state.resource?.entities?.some(entity => entity.entityType === booking_const.ResourceEntityType.Calendar);
					if (!hasCalendarEntity) {
						state.resource?.entities?.push({
							entityType: booking_const.ResourceEntityType.Calendar,
							entityId: 0,
							data: {
								userIds: [],
								locationId: null,
								checkAvailability: false,
								reminders: []
							}
						});
					}
				},
				updateResourceEntityCalendar(state, calendarPath) {
					const index = state.resource?.entities.findIndex(ent => ent.entityType === booking_const.ResourceEntityType.Calendar);
					if (index >= 0) {
						const entityCalendar = state.resource.entities[index];
						entityCalendar.data = {
							...entityCalendar.data,
							...calendarPath
						};
					}
				},
				setGlobalSchedule(state, checked) {
					state.globalSchedule = Boolean(checked);
				},
				updateFetching(state, fetching) {
					state.fetching = fetching;
				},
				setSaving(state, isSaving) {
					state.isSaving = isSaving;
				},
				setCompanyScheduleAccess(state, isCompanyScheduleAccess) {
					state.isCompanyScheduleAccess = isCompanyScheduleAccess;
				},
				setLicenseWarning(state, showLicenseWarning) {
					state.showLicenseWarning = showLicenseWarning;
				},
				setCompanyScheduleUrl(state, companyScheduleUrl) {
					state.companyScheduleUrl = companyScheduleUrl;
				},
				setInvalidResourceName(state, invalid) {
					state.invalidResourceName = invalid;
				},
				setInvalidResourceType(state, invalid) {
					state.invalidResourceType = invalid;
				},
				setWeekStart(state, weekStart) {
					state.weekStart = weekStart;
				},
				setCheckedForAll(state, {
					type,
					isChecked
				}) {
					state.checkedForAll[type] = isChecked;
				},
				setSlotLengthId(state, {
					slotLengthId
				}) {
					state.slotLengthId = slotLengthId;
				},
				setIsChannelChoiceAvailable(state, isChannelChoiceAvailable) {
					state.isChannelChoiceAvailable = isChannelChoiceAvailable;
				},
				setIsIntegrationCalendarEnabled(state, isIntegrationCalendarEnabled) {
					state.isIntegrationCalendarEnabled = isIntegrationCalendarEnabled;
				},
				setInvalidIntegrationCalendarUser(state, invalidIntegrationCalendarUser = false) {
					state.invalidIntegrationCalendarUser = invalidIntegrationCalendarUser;
				},
				addSku(state, skuId) {
					const existingSku = state.resource?.skus.some(sku => sku.id === skuId);
					if (!existingSku) {
						state.resource?.skus.push({
							id: skuId
						});
					}
				},
				deleteSku(state, skuId) {
					const index = state.resource?.skus.findIndex(sku => sku.id === skuId);
					if (index !== -1) {
						state.resource?.skus.splice(index, 1);
					}
				}
			};
		}
	}

	exports.ResourceCreationWizardModel = ResourceCreationWizardModel;

})(this.BX.Booking.Model = this.BX.Booking.Model || {}, BX, BX.Vue3.Vuex, BX.Booking.Const, BX.Vue3, BX.Booking);
//# sourceMappingURL=resource-creation-wizard.bundle.js.map
