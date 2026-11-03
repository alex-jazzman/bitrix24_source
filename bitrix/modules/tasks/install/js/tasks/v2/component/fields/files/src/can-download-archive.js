// Returns true when a download-archive action is available for a file list.
export function canDownloadArchive(filesCount: number, archiveLink: ?string): boolean
{
	return filesCount > 1 && Boolean(archiveLink);
}
