/**
 * @module tab-presets/managed/editors/src/preset-managed/recipient-picker
 */
jn.define('tab-presets/managed/editors/src/preset-managed/recipient-picker', (require, exports, module) => {
	const { assignPreset, getApplyErrorMessage } = require('tab-presets/managed');
	const { NestedDepartmentSelector } = require('selector/widget/entity/tree-selectors/nested-department-selector');
	const { Loc } = require('loc');
	const { Notify } = require('notify');
	const { Haptics } = require('haptics');
	const {
		PresetBottomMenuAnalytics,
		PresetBottomMenuAnalyticsEvent,
		PresetBottomMenuAnalyticsRole,
		PresetBottomMenuAnalyticsType,
	} = require('tab-presets');
	const { RecipientPickerState } = require('tab-presets/managed/editors/src/preset-managed/recipient-picker-state');

	class RecipientPicker
	{
		/**
		 * @param {RecipientPickerProps} props
		 */
		constructor(props)
		{
			this.props = props;
		}

		/**
		 * @param {RecipientPickerProps} props
		 * @return {Promise<unknown>}
		 */
		static open(props)
		{
			return (new RecipientPicker(props)).show();
		}

		/** @return {Promise<unknown>} */
		show()
		{
			const selector = new NestedDepartmentSelector({
				initSelectedIds: RecipientPickerState.getInitialSelectedIds(this.props.selectedRecipients ?? []),
				provider: {
					context: 'MOBILE_TAB_PRESETS_RECIPIENTS',
					options: {
						useLettersForEmptyAvatar: true,
						allowFlatDepartments: true,
						allowSelectRootDepartment: true,
						addMetaUser: false,
						useRestrictedVirtualRoot: true,
						restrictedVirtualRootTitle: Loc.getMessage(
							'TAB_PRESETS_MANAGED_RECIPIENT_RESTRICTED_ROOT_TITLE',
						),
						...RecipientPickerState.getAccessProviderOptions(this.#getAssignmentSelectorOptions()),
					},
				},
				createOptions: {
					enableCreation: false,
				},
				allowMultipleSelection: true,
				closeOnSelect: false,
				events: {
					onClose: (selectedItems = []) => this.#save(selectedItems),
				},
				widgetParams: {
					title: Loc.getMessage('TAB_PRESETS_MANAGED_RECIPIENT_TITLE'),
					backdrop: {
						mediumPositionPercent: 70,
						horizontalSwipeAllowed: false,
					},
					sendButtonName: Loc.getMessage('TAB_PRESETS_MANAGED_EDITOR_DONE'),
				},
				searchOptions: {
					searchPlaceholderWithoutCreation: Loc.getMessage('TAB_PRESETS_MANAGED_RECIPIENT_SEARCH_PLACEHOLDER'),
				},
				selectOptions: {
					singleEntityByType: false,
				},
			});

			return selector.show({}, this.parentWidget);
		}

		/** @return {ManagedPresetAssignmentSelectorOptions} */
		#getAssignmentSelectorOptions()
		{
			return this.props.assignmentSelectorOptions ?? this.props.preset?.assignmentSelectorOptions ?? {};
		}

		/**
		 * @param {ManagedPresetSelectorItem[]} selectedItems
		 */
		#save(selectedItems)
		{
			const recipients = RecipientPickerState.prepareRecipients(selectedItems);

			/** @type {RecipientPickerSelection} */
			const payload = {
				recipients,
				items: RecipientPickerState.prepareDisplayItems(selectedItems),
			};

			if (this.props.onSave)
			{
				this.props.onSave(payload);

				return;
			}

			const presetId = this.#getPresetId();
			if (!presetId || recipients.length === 0)
			{
				return;
			}

			void Notify.showIndicatorLoading();

			assignPreset(presetId, recipients, this.props.preset?.assignmentTabs ?? null)
				.then(() => {
					PresetBottomMenuAnalytics.send({
						event: PresetBottomMenuAnalyticsEvent.ASSIGN_PRESET,
						type: PresetBottomMenuAnalyticsType.CUSTOM_MANAGER,
						role: PresetBottomMenuAnalyticsRole.MANAGER,
						target: PresetBottomMenuAnalytics.getTargetType({ recipients }),
					});
					void Notify.showIndicatorSuccess({ hideAfter: 1000 });
					Haptics.notifySuccess();
				})
				.catch((error) => {
					Haptics.notifyFailure();
					void Notify.showIndicatorError({
						hideAfter: 2000,
						text: getApplyErrorMessage(error),
					});
				})
			;
		}

		/** @return {string} */
		#getPresetId()
		{
			return String(this.props.preset?.key ?? '');
		}

		/** @return {TabPresetLayoutWidget} */
		get parentWidget()
		{
			return this.props.parentWidget;
		}
	}

	module.exports = { RecipientPicker };
});
