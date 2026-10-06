/**
 * @module disk/opener/unified-link/opener
 */
jn.define('disk/opener/unified-link/opener', (require, exports, module) => {
	const { showInternalAlert } = require('error');
	const { isEmpty } = require('utils/object');
	const { FileType } = require('disk/enum');
	const { withCurrentDomain } = require('utils/url');
	const { requireLazy } = require('require-lazy');
	const { openPortalPage } = require('in-app-url/portal-page');
	const { showErrorToast, showOfflineToast, showToast } = require('toast');
	const { PasswordInputBox } = require('layout/ui/password-input-box');
	const {
		getUnifiedLinkData,
		validateUnifiedLinkPassword,
	} = require('disk/opener/unified-link/rest');
	const { Icon } = require('ui-system/blocks/icon');
	const { Loc } = require('loc');

	const supportedFileTypes = new Set([
		FileType.IMAGE,
		FileType.VIDEO,
		FileType.DOCUMENT,
		FileType.ARCHIVE,
		FileType.SCRIPTS,
		FileType.UNKNOWN,
		FileType.PDF,
		FileType.AUDIO,
		FileType.KNOWN,
		FileType.VECTOR_IMAGE,
		FileType.FLIPCHART,
	]);

	/**
	 * @class UnifiedOpener
	 */
	class UnifiedOpener
	{
		#uniqueCode;
		#props = {};

		/**
		 * @typedef UnifiedOpenerProps
		 * @property props
		 * @property props.uniqueCode {string}
		 * @property props.url {string}
		 * @property [props.parentWidget] {Object}
		 * @property [props.queryParams] {Object}
		 * @property [props.canOpenInDefault] {boolean}
		 *
		 * @param {UnifiedOpenerProps} props
		 */
		constructor(props)
		{
			this.#props = props ?? {};
			this.#uniqueCode = props.uniqueCode ? props.uniqueCode.replace('#__bx_android_click_detect__', '') : null;
		}

		/**
		 * Resolves once the link is either opened or refused with a message of its own;
		 * rejects only on a failure it could not report itself, which the router then reports.
		 */
		async open()
		{
			if (isEmpty(this.#uniqueCode))
			{
				return Promise.reject(new Error('uniqueCode is required'));
			}

			let linkData = null;
			try
			{
				linkData = await this.#getUnifiedLinkData();
			}
			catch (error)
			{
				if (this.#shouldOpenPasswordInputBox(error))
				{
					return this.#openPasswordInputBox();
				}

				if (error?.errors?.some((ajaxError) => Boolean(ajaxError?.code === 'FORBIDDEN')))
				{
					this.#showForbiddenToast();

					return null;
				}

				this.#showNotFoundToast(error);

				return null;
			}

			return this.#openLinkData(linkData);
		}

		#openLinkData(linkData)
		{
			if (isEmpty(linkData) || linkData.status !== 'success')
			{
				console.error('disk/opener/unified-link: unexpected link data', linkData);
				void showInternalAlert();

				return null;
			}

			return this.factoryOpeners(linkData?.data?.object || {});
		}

		async factoryOpeners(fileData)
		{
			const link = fileData.links?.download;
			if (!link || !this.#isSupportedFileType(fileData.typeFile))
			{
				console.error('UnifiedOpener: nothing to open natively -', fileData.typeFile);

				// the app cannot render such a file, and the portal page can
				return this.#openPortalPage();
			}

			const name = fileData.name;
			const fileLink = withCurrentDomain(link);

			switch (fileData.typeFile)
			{
				case FileType.FLIPCHART:
					return this.#openBoard(fileData);
				case FileType.IMAGE:
					return viewer.openImage(fileLink, name);
				case FileType.VIDEO:
					return viewer.openVideo(fileLink);
				case FileType.PDF:
				case FileType.DOCUMENT:
				case FileType.AUDIO:
				case FileType.ARCHIVE:
				case FileType.SCRIPTS:
				case FileType.UNKNOWN:
				case FileType.KNOWN:
				case FileType.VECTOR_IMAGE:
					return viewer.openDocument(fileLink, name);
				default:
					return Application.openUrl(fileLink);
			}
		}

		#getUnifiedLinkData = () => {
			const { version, versionId, attachedId } = this.#getQueryParams();

			return getUnifiedLinkData(this.#uniqueCode, attachedId, version || versionId);
		};

		#validateUnifiedLinkPassword = (password) => {
			const { version, versionId } = this.#getQueryParams();

			return validateUnifiedLinkPassword(this.#uniqueCode, password, version || versionId);
		};

		#shouldOpenPasswordInputBox(error)
		{
			return error?.errors?.some((ajaxError) => ajaxError?.customData?.hasPassword === true);
		}

		#openPasswordInputBox()
		{
			return new Promise((resolve, reject) => {
				let isClosed = false;

				void PasswordInputBox
					.open(
						{
							testId: 'disk-unified-link-password-input-box',
							onClose: () => {
								isClosed = true;
								resolve(null);
							},
							onConfirm: async (password) => {
								const linkData = await this.#validateUnifiedLinkPassword(password)
									.catch((error) => {
										this.#showErrorToast(error);

										throw error;
									})
								;
								if (isClosed)
								{
									return null;
								}

								const result = await this.#openLinkData(linkData);

								if (!isClosed)
								{
									resolve(result);
								}

								return result;
							},
						},
						this.#getParentWidget(),
					)
					.catch((error) => {
						console.error(error);
						void showInternalAlert();
						reject(error);
					})
				;
			});
		}

		#openPortalPage()
		{
			const { url } = this.#props;
			if (!url)
			{
				this.#showNotFoundToast(new Error('nothing to open and no page to fall back to'));

				return null;
			}

			const parentWidget = this.#getParentWidget();

			return openPortalPage(url, { parentWidget });
		}

		/**
		 * A link to a missing file fails inside the engine, and its message is an exception dump,
		 * so the user gets a defined message and the details go to the console. A lost connection
		 * is not a missing file and keeps its own message.
		 */
		#showNotFoundToast(error)
		{
			console.error('disk/opener/unified-link: unable to resolve the link', error);

			if (error?.errors?.some((ajaxError) => ajaxError?.code === 'NETWORK_ERROR'))
			{
				showOfflineToast({}, this.#getParentWidget());

				return;
			}

			showErrorToast(
				{ message: Loc.getMessage('M_DISK_UNIFIED_LINK_OPENER_NOT_FOUND_TOAST') },
				this.#getParentWidget(),
			);
		}

		#showErrorToast(error)
		{
			const message = error?.errors?.find((ajaxError) => Boolean(ajaxError?.message))?.message;

			showErrorToast(
				message ? { message } : {},
				this.#getParentWidget(),
			);
		}

		#showForbiddenToast(error)
		{
			showToast(
				{
					message: Loc.getMessage('M_DISK_UNIFIED_LINK_OPENER_FORBIDDEN_TOAST'),
					icon: Icon.LOCK,
				},
				this.#getParentWidget(),
			);
		}

		#getParentWidget()
		{
			return this.#props.parentWidget;
		}

		#getQueryParams()
		{
			const { queryParams } = this.#props;

			return queryParams ?? {};
		}

		async #openBoard(fileData)
		{
			const { boardOpener } = await requireLazy('disk:opener/board');
			const { queryParams, ...restProps } = this.#props;

			return boardOpener({
				...restProps,
				...queryParams,
				fileData,
			});
		}

		#isSupportedFileType(fileType)
		{
			return supportedFileTypes.has(fileType);
		}
	}

	module.exports = {
		unifiedOpener: (props) => {
			return (new UnifiedOpener(props)).open();
		},
	};
});
