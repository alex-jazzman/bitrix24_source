/**
 * @module disk/dialogs/create-folder
 */
jn.define('disk/dialogs/create-folder', (require, exports, module) => {
	const { Loc } = require('loc');
	const { Alert, confirmClosing } = require('alert');
	const { Indent } = require('tokens');

	const { StringInput, InputDesign, InputMode } = require('ui-system/form/inputs/string');

	const { BaseDialog } = require('disk/dialogs/base');
	const NON_UNIQUE_NAME_ERROR_CODE = 'DISK_OBJ_22000';

	class CreateFolderDialog extends BaseDialog
	{
		constructor(props)
		{
			super(props);

			this.nameFieldRef = null;
			this.isConfirmShown = false;

			this.state = {
				name: '',
				pending: false,
			};
		}

		getTestId(suffix)
		{
			return `create-folder-dialog-${suffix}`;
		}

		isButtonDisabled()
		{
			return !this.#isValidName();
		}

		getButtonText()
		{
			return Loc.getMessage('M_DISK_CREATE_FOLDER_DIALOG_CREATE_BUTTON');
		}

		componentDidMount()
		{
			super.componentDidMount();
			this.#focusOnNameField();
		}

		componentWillUnmount()
		{
			super.componentWillUnmount();

			this.#disableCloseGuard();
		}

		setLayoutWidget(layoutWidget)
		{
			super.setLayoutWidget(layoutWidget);

			this.layoutWidget?.on('preventDismiss', this.#handleCloseRequest);
			this.layoutWidget?.on('onViewRemoved', this.#disableCloseGuard);
			this.#updatePreventDismiss();
		}

		#focusOnNameField = () => {
			void this.nameFieldRef?.focus();
		};

		#bindNameFieldRef = (ref) => {
			this.nameFieldRef = ref;
		};

		#onChangeName = (name) => {
			this.setState({ name }, this.#updatePreventDismiss);
		};

		#isValidName = () => {
			return this.state.name.length > 0;
		};

		#hasChanges = () => {
			return this.state.name.length > 0;
		};

		#updatePreventDismiss = () => {
			this.layoutWidget?.preventBottomSheetDismiss(this.#hasChanges());
		};

		#disableCloseGuard = () => {
			this.isConfirmShown = false;
			this.layoutWidget?.preventBottomSheetDismiss(false);
		};

		#closeWithoutConfirm = () => {
			this.#disableCloseGuard();
			this.layoutWidget?.close();
		};

		#showClosingConfirm = () => {
			if (this.isConfirmShown)
			{
				return;
			}

			this.isConfirmShown = true;

			confirmClosing({
				hasSaveAndClose: this.#isValidName(),
				onSave: this.save,
				onClose: this.#closeWithoutConfirm,
				onCancel: () => {
					this.isConfirmShown = false;
					this.#updatePreventDismiss();
				},
			});
		};

		#handleCloseRequest = () => {
			if (!this.#hasChanges())
			{
				this.#closeWithoutConfirm();

				return;
			}

			this.#showClosingConfirm();
		};

		close = () => {
			this.#handleCloseRequest();
		};

		save = () => {
			if (this.state.pending || !this.#isValidName())
			{
				return;
			}

			this.isConfirmShown = false;

			this.setState({
				pending: true,
			});

			const data = {
				id: this.props.parentFolderId,
				name: this.state.name,
			};

			BX.ajax.runAction('disk.api.folder.addSubFolder', { data })
				.then((response) => {
					this.#closeWithoutConfirm();
					this.props.onCreate?.(response?.data?.folder);
				})
				.catch((err) => {
					console.error(err);
					const nonUniqueNameError = err?.errors?.find(
						(error) => error?.code === NON_UNIQUE_NAME_ERROR_CODE,
					);

					Alert.alert(
						nonUniqueNameError?.message
							|| Loc.getMessage('M_DISK_CREATE_FOLDER_DIALOG_ERROR_TITLE'),
						nonUniqueNameError
							? ''
							: Loc.getMessage('M_DISK_CREATE_FOLDER_DIALOG_ERROR_TEXT'),
						() => this.setState({ pending: false }, this.#updatePreventDismiss),
						Loc.getMessage('M_DISK_CREATE_FOLDER_DIALOG_ERROR_OK'),
					);
				});
		};

		/**
		 * @param {Object} data
		 * @param {string} data.parentFolderId
		 * @param {Function} [data.onCreate]
		 * @param {LayoutWidget} parentWidget
		 */
		static async open(data, parentWidget)
		{
			super.open(data, parentWidget);
		}

		renderContent()
		{
			return View(
				{
					style: {
						flexDirection: 'row',
						flexWrap: 'wrap',
						justifyContent: 'center',
						paddingHorizontal: Indent.M.toNumber(),
					},
				},
				this.renderNameInput(),
			);
		}

		renderNameInput()
		{
			return StringInput({
				forwardRef: this.#bindNameFieldRef,
				testId: this.getTestId('name-field'),
				value: this.state.name,
				placeholder: Loc.getMessage('M_DISK_CREATE_FOLDER_DIALOG_NAME_PLACEHOLDER'),
				onChange: this.#onChangeName,
				design: InputDesign.GREY,
				mode: InputMode.STROKE,
				focused: true,
			});
		}
	}

	module.exports = { CreateFolderDialog };
});
