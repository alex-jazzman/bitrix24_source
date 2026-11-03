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
		getUnifiedLinkDataWithRights,
		validateUnifiedLinkPassword,
	} = require('disk/opener/unified-link/rest');
	const { openFolder } = require('disk/opener/folder');
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

	const showUnifiedLinkForbiddenToast = (parentWidget) => {
		showToast(
			{
				message: Loc.getMessage('M_DISK_UNIFIED_LINK_OPENER_FORBIDDEN_TOAST'),
				icon: Icon.LOCK,
			},
			parentWidget,
		);
	};

	/**
	 * @class UnifiedOpener
	 */
	class UnifiedOpener
	{
		#uniqueCode;
		#props = {};
		#isFolderLink = false;
		#isResolveOnly = false;

		/**
		 * @typedef UnifiedOpenerProps
		 * @property props
		 * @property props.uniqueCode {string}
		 * @property props.url {string}
		 * @property [props.parentWidget] {Object}
		 * @property [props.queryParams] {Object}
		 * @property [props.canOpenInDefault] {boolean}
		 * @property [props.isFolderLink] {boolean}
		 * @property [props.isResolveOnly] {boolean}
		 *
		 * @param {UnifiedOpenerProps} props
		 */
		constructor(props)
		{
			const { isFolderLink = false, isResolveOnly = false, ...restProps } = props ?? {};

			this.#props = restProps;
			this.#isFolderLink = isFolderLink;
			this.#isResolveOnly = isResolveOnly;
			// a route hands over the path variable as it was captured, fragment and all, while a
			// unique code never carries one: the app appends its own marker to a tapped href
			this.#uniqueCode = props.uniqueCode ? props.uniqueCode.replace(/#.*$/, '') : null;
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
					showUnifiedLinkForbiddenToast(this.#getParentWidget());

					return null;
				}

				this.#showNotFoundToast(error);

				return null;
			}

			return this.#openLinkData(linkData);
		}

		#openLinkData(linkData)
		{
			if (!this.#isSuccessful(linkData))
			{
				console.error('disk/opener/unified-link: unexpected link data', linkData);
				void showInternalAlert();

				return null;
			}

			const diskObject = this.#extractDiskObject(linkData);

			if (this.#isResolveOnly)
			{
				if (this.#isFolder(diskObject))
				{
					return diskObject;
				}

				void this.factoryOpeners(diskObject);

				return null;
			}

			return this.factoryOpeners(diskObject);
		}

		async factoryOpeners(fileData)
		{
			if (this.#isFolder(fileData))
			{
				if (!this.#isFolderLink)
				{
					console.warn('UnifiedOpener: folder payload came through a file link -', fileData.id);

					return null;
				}

				return this.#openFolder(fileData);
			}

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
			if (this.#isFolderLink)
			{
				return getUnifiedLinkDataWithRights(this.#uniqueCode);
			}

			const { version, versionId, attachedId } = this.#getQueryParams();

			return getUnifiedLinkData(this.#uniqueCode, attachedId, version || versionId);
		};

		#validateUnifiedLinkPassword = async (password) => {
			if (this.#isFolderLink)
			{
				const passwordData = await validateUnifiedLinkPassword(this.#uniqueCode, password);

				// validatePassword returns the object without rights
				return this.#isSuccessful(passwordData)
					? getUnifiedLinkDataWithRights(this.#uniqueCode)
					: passwordData;
			}

			const { version, versionId } = this.#getQueryParams();

			return validateUnifiedLinkPassword(this.#uniqueCode, password, version || versionId);
		};

		#isSuccessful(linkData)
		{
			return !isEmpty(linkData) && linkData.status === 'success';
		}

		#extractDiskObject(linkData)
		{
			return linkData?.data?.diskObject || linkData?.data?.object || {};
		}

		#isFolder(diskObject)
		{
			return Boolean(diskObject.id) && !diskObject.typeFile;
		}

		#openFolder(folder)
		{
			return openFolder(
				folder.id,
				null,
				this.#getParentWidget(),
				null,
				{
					folder,
					uniqueCode: this.#uniqueCode,
				},
			);
		}

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
			if (this.#isNetworkError(error))
			{
				showOfflineToast({}, this.#getParentWidget());

				return;
			}

			const message = error?.errors?.find((ajaxError) => Boolean(ajaxError?.message))?.message;

			showErrorToast(
				message ? { message } : {},
				this.#getParentWidget(),
			);
		}

		#isNetworkError(error)
		{
			return Boolean(error?.errors?.some((ajaxError) => ajaxError?.code === 'NETWORK_ERROR'));
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
		unifiedFolderOpener: (props) => {
			return (new UnifiedOpener({ ...props, isFolderLink: true })).open();
		},
		resolveUnifiedFolder: (props) => {
			return (new UnifiedOpener({ ...props, isFolderLink: true, isResolveOnly: true })).open();
		},
		showUnifiedLinkForbiddenToast,
	};
});
