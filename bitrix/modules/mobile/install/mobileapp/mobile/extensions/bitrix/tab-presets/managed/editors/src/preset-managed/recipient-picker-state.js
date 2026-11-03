/**
 * @module tab-presets/managed/editors/src/preset-managed/recipient-picker-state
 */
jn.define('tab-presets/managed/editors/src/preset-managed/recipient-picker-state', (require, exports, module) => {
	/** @type {Readonly<{ DEPARTMENT: 'department', USER: 'user' }>} */
	const RecipientEntityId = Object.freeze({
		DEPARTMENT: 'department',
		USER: 'user',
	});

	/** @type {Readonly<{ FLAT: 'flat', RECURSIVE: 'recursive' }>} */
	const DepartmentScope = Object.freeze({
		FLAT: 'flat',
		RECURSIVE: 'recursive',
	});

	/** @type {RecipientPickerStateApi} */
	const RecipientPickerState = {
		getAccessProviderOptions: (options = {}) => {
			const departmentIds = Array.isArray(options.departmentIds) ? options.departmentIds : null;
			/** @type {RecipientAccessProviderOptions} */
			const providerOptions = {};

			if (departmentIds)
			{
				providerOptions.allowedDepartmentIds = departmentIds;
				providerOptions.disableUserSearch = true;
			}

			return providerOptions;
		},

		prepareRecipients: (selectedItems = []) => {
			return selectedItems
				.map((item) => RecipientPickerState.prepareRecipient(item))
				.filter(({ type, id }) => type !== null && id > 0)
			;
		},

		prepareRecipient: (item) => {
			const type = RecipientPickerState.getRecipientType(item);
			/** @type {ManagedPresetPreparedRecipient} */
			const recipient = {
				type,
				id: RecipientPickerState.getRecipientId(item),
			};

			if (type === RecipientEntityId.DEPARTMENT)
			{
				recipient.scope = RecipientPickerState.getDepartmentScope(item);
			}

			return recipient;
		},

		prepareDisplayItems: (selectedItems = []) => {
			return selectedItems
				.map((item) => ({
					key: RecipientPickerState.getRecipientKey(item),
					type: RecipientPickerState.getRecipientType(item),
					id: RecipientPickerState.getRecipientId(item),
					scope: RecipientPickerState.getRecipientType(item) === RecipientEntityId.DEPARTMENT
						? RecipientPickerState.getDepartmentScope(item)
						: null,
					selectorId: RecipientPickerState.getSelectorId(item),
					title: RecipientPickerState.getDisplayTitle(item),
					subtitle: item?.subtitle ?? '',
					imageUrl: item?.imageUrl ?? '',
				}))
				.filter(({ type, id, title }) => type !== null && id > 0 && title !== '')
			;
		},

		getDisplayTitle: (item) => {
			return item?.shortTitle ?? item?.title ?? '';
		},

		getInitialSelectedIds: (selectedRecipients = []) => {
			return selectedRecipients.map((item) => [item.type, RecipientPickerState.getInitialSelectorId(item)]);
		},

		getRecipientType: (item) => {
			const entityId = item?.entityId ?? item?.type ?? '';
			if (entityId === RecipientEntityId.USER)
			{
				return RecipientEntityId.USER;
			}

			if (entityId === RecipientEntityId.DEPARTMENT)
			{
				return RecipientEntityId.DEPARTMENT;
			}

			return null;
		},

		getRecipientId: (item) => {
			if (RecipientPickerState.getRecipientType(item) === RecipientEntityId.DEPARTMENT)
			{
				const accessCodeId = RecipientPickerState.getDepartmentIdFromAccessCode(item);
				if (accessCodeId > 0)
				{
					return accessCodeId;
				}
			}

			const rawId = item?.id ?? '';
			const id = String(rawId).split('/').pop();

			return Number(id.replace(':F', ''));
		},

		getDepartmentScope: (item) => {
			return RecipientPickerState.isFlatDepartmentItem(item)
				? DepartmentScope.FLAT
				: DepartmentScope.RECURSIVE
			;
		},

		isFlatDepartmentItem: (item) => {
			return String(item?.id ?? '').endsWith(':F');
		},

		getRecipientKey: (item) => {
			const type = RecipientPickerState.getRecipientType(item);
			const id = RecipientPickerState.getRecipientId(item);
			const scope = type === RecipientEntityId.DEPARTMENT
				? RecipientPickerState.getDepartmentScope(item)
				: ''
			;

			return `${type}:${id}:${scope}`;
		},

		getSelectorId: (item) => {
			const id = RecipientPickerState.getRecipientId(item);
			if (
				RecipientPickerState.getRecipientType(item) === RecipientEntityId.DEPARTMENT
				&& RecipientPickerState.isFlatDepartmentItem(item)
			)
			{
				return `${id}:F`;
			}

			return id;
		},

		getInitialSelectorId: (item) => {
			if (item.selectorId)
			{
				return item.selectorId;
			}

			if (item.type === RecipientEntityId.DEPARTMENT && item.scope === DepartmentScope.FLAT)
			{
				return `${item.id}:F`;
			}

			return item.id;
		},

		getDepartmentIdFromAccessCode: (item) => {
			const accessCode = item?.customData?.sourceEntity?.customData?.accessCode
				?? item?.customData?.accessCode
				?? ''
			;
			const match = String(accessCode).match(/^(?:SNDR|SND|SN)(\d+)/);

			return match ? Number(match[1]) : 0;
		},
	};

	module.exports = {
		RecipientPickerState,
		RecipientEntityId,
		DepartmentScope,
	};
});
