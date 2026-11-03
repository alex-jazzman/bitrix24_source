export { UploadManager } from './upload-manager';
export type { ResolvedValidationError } from './upload-manager';
export { makeChunks, getMaxParallelLoads } from './utils/chunks';
export { FileValidationError, validateFileList, matchExtension, matchSize, matchCount } from './validator/file-validator';
export { resolveFileUploadPolicy, getPolicyByChatType, DEFAULT_FILE_UPLOAD_POLICY } from './policy/policy-resolver';

export type { MultiUploadingResult } from './types/uploading';
export type { FileUploadPolicy, ValidationError } from './validator/file-validator';
