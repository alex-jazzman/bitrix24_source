import { BatchFileStatus, type BatchFileItem, type BatchFileStatusType } from './types';

export const TotalProgressMode = {
	/** The batch holds no file the window is working on. */
	none: 'none',
	/** Files are going to the portal, and every one of them reports its own percent. */
	uploading: 'uploading',
	/** The batch is on the server, which answers as a whole: no honest percent exists. */
	committing: 'committing',
	done: 'done',
	/** Every file has its outcome, and at least one of them failed. */
	partial: 'partial',
} as const;

export type TotalProgressModeType = typeof TotalProgressMode[keyof typeof TotalProgressMode];

export type TotalProgress = {
	mode: TotalProgressModeType,
	/** Whole percent of the upload: 100 in every mode where the upload is already over. */
	percent: number,
};

// A file of an unknown size cannot be weighted, so a batch holding one counts files instead.
const COUNT_WEIGHT = 1;
// the upload of the file is still going on
const RUNNING_STATUSES: Set<BatchFileStatusType> = new Set([
	BatchFileStatus.pending,
	BatchFileStatus.uploading,
]);

/**
 * The state of the batch as a whole.
 *
 * The upload is weighted by the size of the files: a batch of a 1 MB and a 9 MB file is a tenth
 * done once the small one is through, not a half. Creating the documents takes a single request
 * the server answers as a whole, so that phase has no percent to tell - it reports its own mode
 * instead, and the view runs an indeterminate indicator on it.
 */
export function getTotalProgress(items: BatchFileItem[]): TotalProgress
{
	// a rejected file never entered the upload: the notice of the window names it instead
	const batch = items.filter((item: BatchFileItem) => item.status !== BatchFileStatus.rejected);
	if (batch.length === 0)
	{
		return { mode: TotalProgressMode.none, percent: 0 };
	}

	const useSizes = batch.every((item: BatchFileItem) => item.size > 0);
	let weightTotal = 0;
	let weightUploaded = 0;
	let hasCommitting = false;
	let hasRunning = false;
	let hasFailed = false;

	batch.forEach((item: BatchFileItem) => {
		const weight = useSizes ? item.size : COUNT_WEIGHT;
		weightTotal += weight;
		weightUploaded += weight * getUploadedFraction(item);

		hasCommitting = hasCommitting || item.status === BatchFileStatus.committing;
		hasRunning = hasRunning || RUNNING_STATUSES.has(item.status);
		hasFailed = hasFailed || item.status === BatchFileStatus.error;
	});

	return {
		mode: resolveMode(hasCommitting, hasRunning, hasFailed),
		percent: Math.round((weightUploaded / weightTotal) * 100),
	};
}

/**
 * The upload of a file is over the moment the file has an outcome, whatever the outcome is: a
 * failed file holds nothing back, so the bar must not stop short of the end because of it.
 */
function getUploadedFraction(item: BatchFileItem): number
{
	if (!RUNNING_STATUSES.has(item.status))
	{
		return 1;
	}

	return Math.min(Math.max(item.progress, 0), 100) / 100;
}

function resolveMode(hasCommitting: boolean, hasRunning: boolean, hasFailed: boolean): TotalProgressModeType
{
	// A file added while a commit is in flight uploads next to it, and the counter of the window
	// already names the creation: the phase of the batch is the one without a percent.
	if (hasCommitting)
	{
		return TotalProgressMode.committing;
	}

	if (hasRunning)
	{
		return TotalProgressMode.uploading;
	}

	return hasFailed ? TotalProgressMode.partial : TotalProgressMode.done;
}
