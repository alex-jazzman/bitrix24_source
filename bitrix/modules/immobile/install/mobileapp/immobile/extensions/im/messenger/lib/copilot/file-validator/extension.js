/**
 * @module im/messenger/lib/copilot/file-validator
 */
jn.define('im/messenger/lib/copilot/file-validator', (require, exports, module) => {
	const { Type } = require('type');
	const { Loc } = require('im/messenger/loc');

	const VIDEO_EXTENSIONS = ['mp4', 'mov', 'm4v', '3gp', 'webm', 'avi', 'mkv', 'wmv'];

	// Mirrors the server-side codes: im/lib/V2/Integration/AI/CopilotError.php.
	const FileValidationErrors = {
		invalidFileFormat: 'INVALID_FILE_FORMAT',
		fileTooLarge: 'FILE_TOO_LARGE',
		tooManyFiles: 'TOO_MANY_FILES',
		fileMetadataUnavailable: 'FILE_METADATA_UNAVAILABLE',
		// Client-only code, does not exist on the server.
		duplicateFile: 'DUPLICATE_FILE',
	};

	/**
	 * @param {AttachFile} file
	 * @return {string}
	 */
	function getFileName(file)
	{
		return Type.isStringFilled(file?.name) ? file.name : '';
	}

	/**
	 * @desc Reads file size defensively. Device files expose it only after Filesystem.getFile,
	 * disk files may carry it in dataAttributes. Returns null when the size is not known yet.
	 * @param {AttachFile} file
	 * @return {?number}
	 */
	function getFileSize(file)
	{
		if (Type.isNumber(file?.size))
		{
			return file.size;
		}

		const attributes = file?.dataAttributes;
		if (attributes)
		{
			const candidates = [attributes.SIZE, attributes.size, attributes.sizeInt];
			for (const candidate of candidates)
			{
				if (Type.isNumber(candidate))
				{
					return candidate;
				}

				if (Type.isStringFilled(candidate) && !Number.isNaN(Number(candidate)))
				{
					return Number(candidate);
				}
			}
		}

		return null;
	}

	/**
	 * @param {string} fileName
	 * @return {string}
	 */
	function extractExtension(fileName)
	{
		if (!Type.isStringFilled(fileName))
		{
			return '';
		}

		const dotPosition = fileName.lastIndexOf('.');
		if (dotPosition === -1 || dotPosition === fileName.length - 1)
		{
			return '';
		}

		return fileName.slice(dotPosition + 1).toLowerCase();
	}

	/**
	 * @param {string} fileName
	 * @param {Array<string>} allowedExtensions
	 * @return {boolean}
	 */
	function matchExtension(fileName, allowedExtensions)
	{
		const extension = extractExtension(fileName);
		if (extension === '')
		{
			return false;
		}

		return Type.isArrayFilled(allowedExtensions) && allowedExtensions.includes(extension);
	}

	/**
	 * @desc Format policy for a picked file (mirrors the native validation): a camera capture
	 * bypasses the extension check — capture availability is already gated by
	 * allowPhotoCapture/allowVideoCapture — and an empty allowlist means no format restriction.
	 * @param {AttachFile} file
	 * @param {Array<string>} allowedExtensions
	 * @return {boolean}
	 */
	function matchFormat(file, allowedExtensions)
	{
		if (!Type.isArrayFilled(allowedExtensions) || file?.fromCamera === true)
		{
			return true;
		}

		return matchExtension(getFileName(file), allowedExtensions);
	}

	/**
	 * @param {number} size
	 * @param {number} maxFileSize
	 * @return {boolean}
	 */
	function matchSize(size, maxFileSize)
	{
		return size <= maxFileSize;
	}

	/**
	 * @param {number} currentCount
	 * @param {number} addingCount
	 * @param {number} maxFilesPerMessage
	 * @return {boolean}
	 */
	function matchCount(currentCount, addingCount, maxFilesPerMessage)
	{
		return (currentCount + addingCount) <= maxFilesPerMessage;
	}

	/**
	 * @desc Device files (gallery, document picker) have no dataAttributes, disk files do.
	 * @param {AttachFile} file
	 * @return {boolean}
	 */
	function isDeviceFile(file)
	{
		return !file?.dataAttributes;
	}

	/**
	 * @desc Pure attach-time selection: all known sizes are resolved by the caller beforehand
	 * (the validator does no I/O), so unsupported files never occupy attach slots. Order per file:
	 * duplicates, then format, then size, then the per-message count limit. A file with an
	 * unknown size counts as a size violation: it cannot be proven to fit the limit.
	 * @param {Array<AttachFile>} files
	 * @param {Array<?number>} sizes resolved size of files[i], null when unknown
	 * @param {CopilotFileUploadPolicy} policy
	 * @return {AttachFileSelectionResult}
	 */
	function selectAttachFiles(files, sizes, policy)
	{
		const result = {
			selected: [],
			invalidFormatCount: 0,
			tooLargeCount: 0,
			duplicateCount: 0,
			overflowCount: 0,
		};

		if (!Type.isArrayFilled(files))
		{
			return result;
		}

		if (!Type.isPlainObject(policy))
		{
			result.selected = [...files];

			return result;
		}

		const { allowedExtensions, maxFileSize, maxFilesPerMessage } = policy;
		const sizeList = Type.isArray(sizes) ? sizes : [];
		const seenKeys = new Set();

		files.forEach((file, index) => {
			const name = getFileName(file);
			const size = Type.isNumber(sizeList[index]) ? sizeList[index] : null;

			const key = `${name}:${Type.isNumber(size) ? size : ''}`;
			if (seenKeys.has(key))
			{
				result.duplicateCount += 1;

				return;
			}
			seenKeys.add(key);

			if (!matchFormat(file, allowedExtensions))
			{
				result.invalidFormatCount += 1;

				return;
			}

			if (!Type.isNumber(size) || !matchSize(size, maxFileSize))
			{
				result.tooLargeCount += 1;

				return;
			}

			if (!matchCount(result.selected.length, 1, maxFilesPerMessage))
			{
				result.overflowCount += 1;

				return;
			}

			result.selected.push(file);
		});

		return result;
	}

	/**
	 * @desc Attach-time policy: iOS gallery returns HEIC originals, but the native uploader recodes
	 * photos larger than 1080x1080 to jpg before commit. So when the policy allows jpg, HEIC is
	 * accepted at attach as a future jpg; rare non-recoded HEIC is still rejected by the
	 * server-side policy on commit.
	 * @param {CopilotFileUploadPolicy} policy
	 * @return {CopilotFileUploadPolicy}
	 */
	function getEffectivePolicy(policy)
	{
		const effectivePolicy = { ...policy };
		if (policy?.allowedExtensions?.includes('jpg'))
		{
			effectivePolicy.allowedExtensions = [...policy.allowedExtensions, 'heic', 'heif'];
		}

		return effectivePolicy;
	}

	/**
	 * @desc Camera photos are serialized as jpg by the native layer, so photo capture is
	 * available exactly when jpg passes the policy. An empty allowlist means no format
	 * restriction (CONTRACT-file-picker-bridge).
	 * @param {Array<string>} allowedExtensions
	 * @return {boolean}
	 */
	function isPhotoCaptureAllowed(allowedExtensions)
	{
		return !Type.isArrayFilled(allowedExtensions) || allowedExtensions.includes('jpg');
	}

	/**
	 * @desc Video capture is available when the policy allows at least one video format.
	 * An empty allowlist means no format restriction (CONTRACT-file-picker-bridge).
	 * @param {Array<string>} allowedExtensions
	 * @return {boolean}
	 */
	function isVideoCaptureAllowed(allowedExtensions)
	{
		if (!Type.isArrayFilled(allowedExtensions))
		{
			return true;
		}

		return allowedExtensions.some((extension) => VIDEO_EXTENSIONS.includes(extension));
	}

	/**
	 * @desc Short restriction hint for the attach picker, e.g. "До 5 Мб, до 10 файлов".
	 * @param {CopilotFileUploadPolicy} policy
	 * @return {string}
	 */
	function getAttachPickerHint(policy)
	{
		const maxFileSize = Type.isNumber(policy?.maxFileSize) ? policy.maxFileSize : 0;
		const sizeMb = Math.max(1, Math.round(maxFileSize / (1024 * 1024)));
		const maxCount = Type.isNumber(policy?.maxFilesPerMessage) ? policy.maxFilesPerMessage : 0;

		return Loc.getMessagePlural(
			'IMMOBILE_MESSENGER_COPILOT_FILE_VALIDATOR_PICKER_HINT',
			maxCount,
			{
				'#SIZE_MB#': sizeMb,
				'#COUNT#': maxCount,
			},
		);
	}

	/**
	 * @desc "pdf", "docx" -> "PDF и DOCX": uppercased, comma-separated, the last item
	 * joined by a localized conjunction.
	 * @param {Array<string>} allowedExtensions
	 * @return {string}
	 */
	function formatAllowedExtensions(allowedExtensions)
	{
		if (!Type.isArrayFilled(allowedExtensions))
		{
			return '';
		}

		const names = allowedExtensions.map((extension) => extension.toUpperCase());
		if (names.length === 1)
		{
			return names[0];
		}

		const lastName = names.pop();

		return Loc.getMessage(
			'IMMOBILE_MESSENGER_COPILOT_FILE_VALIDATOR_FORMAT_LIST_AND',
			{
				'#HEAD#': names.join(', '),
				'#TAIL#': lastName,
			},
		);
	}

	/**
	 * @param {CopilotFileUploadPolicy} policy
	 * @return {{ title: string, text: string }}
	 */
	function getFormatErrorContent(policy)
	{
		return {
			title: Loc.getMessage('IMMOBILE_MESSENGER_COPILOT_FILE_VALIDATOR_FORMAT_NOTIFICATION_TITLE'),
			text: Loc.getMessage(
				'IMMOBILE_MESSENGER_COPILOT_FILE_VALIDATOR_FORMAT_NOTIFICATION_TEXT',
				{ '#FORMATS#': formatAllowedExtensions(policy?.allowedExtensions) },
			),
		};
	}

	/**
	 * @param {CopilotFileUploadPolicy} policy
	 * @return {{ title: string, text: string }}
	 */
	function getSizeErrorContent(policy)
	{
		const maxFileSize = Type.isNumber(policy?.maxFileSize) ? policy.maxFileSize : 0;
		const sizeMb = Math.max(1, Math.round(maxFileSize / (1024 * 1024)));

		return {
			title: Loc.getMessage('IMMOBILE_MESSENGER_COPILOT_FILE_VALIDATOR_SIZE_NOTIFICATION_TITLE'),
			text: Loc.getMessage(
				'IMMOBILE_MESSENGER_COPILOT_FILE_VALIDATOR_SIZE_NOTIFICATION_TEXT',
				{ '#SIZE_MB#': sizeMb },
			),
		};
	}

	/**
	 * @param {CopilotFileUploadPolicy} policy
	 * @return {{ title: string, text: string }}
	 */
	function getCountErrorContent(policy)
	{
		const maxCount = Type.isNumber(policy?.maxFilesPerMessage) ? policy.maxFilesPerMessage : 0;

		return {
			title: Loc.getMessage('IMMOBILE_MESSENGER_COPILOT_FILE_VALIDATOR_COUNT_NOTIFICATION_TITLE'),
			text: Loc.getMessagePlural(
				'IMMOBILE_MESSENGER_COPILOT_FILE_VALIDATOR_COUNT_NOTIFICATION_TEXT',
				maxCount,
				{ '#COUNT#': maxCount },
			),
		};
	}

	/**
	 * @desc Error texts for the native picker validation toast (CONTRACT-file-picker-bridge):
	 * the native layer has no locale strings of its own and shows only what JS supplies here.
	 * @param {CopilotFileUploadPolicy} policy
	 * @return {PickerErrorMessages}
	 */
	function getPickerErrorMessages(policy)
	{
		const format = getFormatErrorContent(policy);
		const size = getSizeErrorContent(policy);
		const count = getCountErrorContent(policy);

		return {
			format: { title: format.title, subtitle: format.text },
			size: { title: size.title, subtitle: size.text },
			count: { title: count.title, subtitle: count.text },
		};
	}

	/**
	 * @desc Resolves the single in-app notification for an attach selection: only the first
	 * violation by priority (format, size, count, duplicate) is reported. With the picker
	 * restrictions in place an invalid pick is an edge case, so one notification is enough.
	 * @param {AttachFileSelectionResult} selection
	 * @param {CopilotFileUploadPolicy} policy
	 * @return {?AttachSelectionNotification}
	 */
	function getAttachSelectionNotification(selection, policy)
	{
		if (selection?.invalidFormatCount > 0)
		{
			return {
				code: FileValidationErrors.invalidFileFormat,
				...getFormatErrorContent(policy),
			};
		}

		if (selection?.tooLargeCount > 0)
		{
			return {
				code: FileValidationErrors.fileTooLarge,
				...getSizeErrorContent(policy),
			};
		}

		if (selection?.overflowCount > 0)
		{
			return {
				code: FileValidationErrors.tooManyFiles,
				...getCountErrorContent(policy),
			};
		}

		if (selection?.duplicateCount > 0)
		{
			return {
				code: FileValidationErrors.duplicateFile,
				title: Loc.getMessage('IMMOBILE_MESSENGER_COPILOT_FILE_VALIDATOR_DUPLICATE_FILE'),
				text: null,
			};
		}

		return null;
	}

	/**
	 * @desc Text shown when the user tries to send while some attach files are still being
	 * checked or have failed validation.
	 * @return {string}
	 */
	function getSendBlockedText()
	{
		return Loc.getMessage('IMMOBILE_MESSENGER_COPILOT_FILE_VALIDATOR_SEND_BLOCKED');
	}

	module.exports = {
		FileValidationErrors,
		getFileName,
		getFileSize,
		isDeviceFile,
		matchExtension,
		matchFormat,
		matchSize,
		matchCount,
		selectAttachFiles,
		getEffectivePolicy,
		isPhotoCaptureAllowed,
		isVideoCaptureAllowed,
		getAttachPickerHint,
		getPickerErrorMessages,
		getAttachSelectionNotification,
		getSendBlockedText,
	};
});
