/**
 * @module disk/opener/unified-link/opener
 */
jn.define('disk/opener/unified-link/opener', (require, exports, module) => {
	const { showInternalAlert } = require('error');
	const { isEmpty } = require('utils/object');
	const { FileType } = require('disk/enum');
	const { withCurrentDomain } = require('utils/url');
	const { getUnifiedLinkData } = require('disk/opener/unified-link/rest');

	const supportedFileTypes = new Set([FileType.FLIPCHART, FileType.DOCUMENT]);

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
			this.#uniqueCode = props.uniqueCode || null;
		}

		async open()
		{
			if (isEmpty(this.#uniqueCode))
			{
				return Promise.reject(new Error('uniqueCode is required'));
			}

			const linkData = await this.#getUnifiedLinkData().catch(console.error);

			if (isEmpty(linkData) || linkData.status !== 'success')
			{
				void showInternalAlert();

				return Promise.reject(new Error('Failed to retrieve unified link data'));
			}

			return this.factoryOpeners(linkData?.data?.object || {});
		}

		async factoryOpeners(fileData)
		{
			if (!this.#isSupportedFileType(fileData.typeFile))
			{
				console.warn('UnifiedOpener: Unsupported file type - ', fileData.typeFile);

				return null;
			}

			const link = fileData.links?.download;
			if (!link)
			{
				return null;
			}

			const name = fileData.name;
			const fileLink = withCurrentDomain(link);

			switch (fileData.typeFile)
			{
				case FileType.FLIPCHART:
					return this.#openBoard(fileData);
				case FileType.PDF:
				case FileType.DOCUMENT:
					return viewer.openDocument(fileLink, name);
				case FileType.IMAGE:
					return viewer.openImage(fileLink, name);
				case FileType.VIDEO:
					return viewer.openVideo(fileLink);
				default:
					return Application.openUrl(fileLink);
			}
		}

		#getUnifiedLinkData = () => {
			const { version, versionId, attachedId } = this.#getQueryParams();

			return getUnifiedLinkData(this.#uniqueCode, attachedId, version || versionId);
		};

		#getQueryParams()
		{
			const { queryParams } = this.#props;

			return queryParams;
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
