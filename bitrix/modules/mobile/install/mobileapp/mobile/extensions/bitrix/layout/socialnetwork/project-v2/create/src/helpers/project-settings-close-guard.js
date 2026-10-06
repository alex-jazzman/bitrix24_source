/**
 * @module layout/socialnetwork/project-v2/create/src/helpers/project-settings-close-guard
 */
jn.define('layout/socialnetwork/project-v2/create/src/helpers/project-settings-close-guard', (require, exports, module) => {
	const { Alert, ButtonType } = require('alert');
	const { Haptics } = require('haptics');
	const { Loc } = require('loc');

	const clone = (value) => {
		if (value === undefined || value === null)
		{
			return value;
		}

		return JSON.parse(JSON.stringify(value));
	};

	const getFieldsKey = (fields, normalize = null) => {
		const normalizedFields = normalize ? normalize(fields) : fields;

		return JSON.stringify(clone(normalizedFields));
	};

	class ProjectSettingsCloseGuard
	{
		constructor({
			layoutWidget,
			preventLayoutWidget = layoutWidget,
			releasePreventDismiss = true,
			initialFields,
			getCurrentFields,
			normalizeFields = null,
			onSaveAndClose,
			onDiscardAndClose,
			title = Loc.getMessage('MOBILE_LAYOUT_PROJECT_V2_CREATE_CLOSE_ALERT_TITLE'),
			description = Loc.getMessage('MOBILE_LAYOUT_PROJECT_V2_CREATE_CLOSE_ALERT_DESCRIPTION'),
		})
		{
			this.layoutWidget = layoutWidget;
			this.preventLayoutWidget = preventLayoutWidget;
			this.releasePreventDismiss = releasePreventDismiss;
			this.getCurrentFields = getCurrentFields;
			this.normalizeFields = normalizeFields;
			this.onSaveAndClose = onSaveAndClose;
			this.onDiscardAndClose = onDiscardAndClose;
			this.title = title;
			this.description = description;
			this.initialFieldsKey = getFieldsKey(initialFields, normalizeFields);
			this.isActive = true;
			this.isConfirmShown = false;
		}

		mount()
		{
			this.update();
			this.layoutWidget?.on('preventDismiss', this.handleCloseRequest);
			this.layoutWidget?.on('onViewRemoved', this.disable);

			return this;
		}

		update = () => {
			if (!this.isActive)
			{
				return;
			}

			this.setPreventDismiss(this.hasChanges());
		};

		allowClose = () => {
			if (!this.isActive)
			{
				return;
			}

			this.setPreventDismiss(false);
		};

		handleCloseRequest = () => {
			if (!this.isActive)
			{
				return;
			}

			if (!this.hasChanges())
			{
				this.disable();
				this.layoutWidget?.close();

				return;
			}

			this.showConfirm();
		};

		disable = () => {
			if (!this.isActive)
			{
				return;
			}

			this.isActive = false;
			this.isConfirmShown = false;
			this.setPreventDismiss(false);
		};

		setPreventDismiss(shouldPrevent)
		{
			if (!shouldPrevent && !this.releasePreventDismiss)
			{
				return;
			}

			this.preventLayoutWidget?.preventBottomSheetDismiss(shouldPrevent);
		}

		hasChanges()
		{
			return getFieldsKey(this.getCurrentFields?.(), this.normalizeFields) !== this.initialFieldsKey;
		}

		showConfirm()
		{
			if (this.isConfirmShown)
			{
				return;
			}

			this.isConfirmShown = true;
			Haptics.impactLight();

			Alert.confirm(
				this.title,
				this.description,
				[
					{
						type: ButtonType.DEFAULT,
						text: Loc.getMessage('MOBILE_LAYOUT_PROJECT_V2_CREATE_CLOSE_ALERT_SAVE_AND_CLOSE'),
						onPress: this.handleSaveAndClose,
					},
					{
						type: ButtonType.DESTRUCTIVE,
						text: Loc.getMessage('MOBILE_LAYOUT_PROJECT_V2_CREATE_CLOSE_ALERT_DISCARD'),
						onPress: this.handleDiscardAndClose,
					},
					{
						type: ButtonType.CANCEL,
						text: Loc.getMessage('MOBILE_LAYOUT_PROJECT_V2_CREATE_CLOSE_ALERT_CONTINUE'),
						onPress: () => {
							this.isConfirmShown = false;
						},
					},
				],
			);
		}

		handleSaveAndClose = async () => {
			this.setPreventDismiss(false);

			let result = true;
			try
			{
				result = await this.onSaveAndClose?.();
			}
			catch (error)
			{
				console.error(error);
			}

			if (result === false)
			{
				this.isConfirmShown = false;
				this.update();

				return;
			}

			this.disable();
		};

		handleDiscardAndClose = async () => {
			this.disable();
			await this.onDiscardAndClose?.();
		};
	}

	const createProjectSettingsCloseGuard = (props) => {
		return new ProjectSettingsCloseGuard(props).mount();
	};

	module.exports = {
		createProjectSettingsCloseGuard,
		getProjectSettingsFieldsKey: getFieldsKey,
	};
});
