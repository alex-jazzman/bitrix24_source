/* eslint-disable */
type FileUploadPolicy = {
	allowedExtensions: string[];
	maxFileSize: number;
	maxFilesPerMessage: number;
};

type AddFilesToPreviewParams = {
	files: File[];
	dialogId: string;
	messageId?: number | null;
	sendAsFile?: boolean;
	compositionCount?: number | null;
};

type AddFilesToPreviewResult = {
	sessionId: string;
	addedCount: number;
	overLimitCount: number;
	errors: ResolvedValidationError[];
};

type ResolvedValidationError = {
	code: ValueOf<typeof BX.Messenger.v2.Lib.FileValidationError>;
	text: string;
};

type ValueOf<T> = T[keyof T];

type AddDiskFilesParams = {
	files: DiskFileRaw[];
	dialogId: string;
	messageId?: number | null;
};

type DiskFileRaw = {
	id: string;
	name: string;
	sizeInt: string | number;
	size?: string | number;
};

type AddDiskFilesResult = MultiUploadingResult & {
	errors: ResolvedValidationError[];
	overLimitCount: number;
};

type MultiUploadingResult = {
	uploadingId: string;
	uploaderIds: Array<string>;
	sourceFilesCount: number;
	loadAllComplete: Promise<any>;
	uploadAllComplete: Promise<any>;
};

type UploadParams = {
	files: Array<File | Blob | Object>;
	dialogId: string;
	autoUpload?: boolean;
	sendAsFile?: boolean;
	maxFilesCount?: number;
	fileParams?: BX.Messenger.v2.Service.FileParams;
};

type MakeChunksOptions<T> = {
	files: Array<T>;
	chunkSize?: number;
	maxFilesCount?: number;
};

type FileLike = {
	name: string;
	size: number;
};

type ValidationResult<T> = {
	valid: T[];
	errors: ValidationError[];
	annotated: AnnotatedFile<T>[];
};

type ValidationError = {
	file: FileLike;
	code: ValueOf<typeof BX.Messenger.v2.Lib.FileValidationError>;
};

type AnnotatedFile<T> = {
	file: T;
	code: ValueOf<typeof BX.Messenger.v2.Lib.FileValidationError> | null;
};

declare namespace BX.Messenger.v2.Lib {
	/**
	 * Single entry point for "user attaches files to a chat".
	 * Owns policy validation, error annotation and file-set routing;
	 * delegates chunking to utils/chunks and the actual upload to UploadingService.
	 */
	class UploadManager {
		getPolicy(dialogId: string): FileUploadPolicy | null;
		getAcceptAttribute(dialogId: string): string | null;
		/**
		 * Adds files to the preview session of the scope, validating them against the batch already composed.
		 * A messageId addresses the attachments of that message being edited, its absence - the draft.
		 */
		addFilesToPreview(params: AddFilesToPreviewParams): Promise<AddFilesToPreviewResult>;
		/**
		 * Adds files picked from disk to the batch of the scope, addressed the way addFilesToPreview is. The
		 * batch of an edit holds both sources at once, so there the pick joins what was composed before.
		 */
		addDiskFiles(params: AddDiskFilesParams): Promise<AddDiskFilesResult>;
		/**
		 * Raw chunked upload without policy validation.
		 * Use for re-uploading already-validated files (e.g. send from preview popup).
		 */
		upload(params: UploadParams): Promise<MultiUploadingResult>;
	}

	const FileValidationError: {
		readonly INVALID_FILE_FORMAT: "INVALID_FILE_FORMAT";
		readonly FILE_TOO_LARGE: "FILE_TOO_LARGE";
		readonly TOO_MANY_FILES: "TOO_MANY_FILES";
		readonly DUPLICATE_FILE: "DUPLICATE_FILE";
	};

	function makeChunks<T>(options: MakeChunksOptions<T>): Array<Array<T>>;

	function getMaxParallelLoads<T>(chunks: Array<Array<T>>): number;

	function validateFileList<T extends FileLike>(files: T[], existing: FileLike[], policy: FileUploadPolicy | null): ValidationResult<T>;

	function matchExtension(fileName: string, allowedExtensions: string[]): boolean;

	function matchSize(size: number, maxFileSize: number): boolean;

	function matchCount(currentCount: number, addingCount: number, maxFilesPerMessage: number): boolean;

	function resolveFileUploadPolicy(dialogId: string): FileUploadPolicy | null;

	/**
	 * Single source of truth for upload policies, keyed by chat type.
	 * Add a case per chat type as new policies appear.
	 */
	function getPolicyByChatType(chatType: BX.Messenger.v2.Const.ChatTypeItem | null): FileUploadPolicy | null;

	/**
	 * Default (non-copilot) chats currently impose no client-side format/size policy;
	 * count limits live in utils/chunks. This is the extension point for a future
	 * explicit default policy — plug a real policy here when one is needed.
	 */
	const DEFAULT_FILE_UPLOAD_POLICY: FileUploadPolicy | null;
}
