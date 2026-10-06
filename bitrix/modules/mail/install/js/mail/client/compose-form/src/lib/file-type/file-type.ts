import { DiskCompact } from 'ui.icon-set.api.vue';

/** Compact icons of the Disk set: the variant the attachment cards render. */
const IconByExtension: Record<string, string> = Object.freeze({
	pdf: DiskCompact.PDF,
	doc: DiskCompact.DOC,
	docx: DiskCompact.DOCX,
	odt: DiskCompact.ODT,
	xls: DiskCompact.XLS,
	xlsx: DiskCompact.XLSX,
	ods: DiskCompact.ODS,
	ppt: DiskCompact.PPT,
	pptx: DiskCompact.PPTX,
	odp: DiskCompact.ODP,
	txt: DiskCompact.TXT,
	zip: DiskCompact.ZIP,
	rar: DiskCompact.RAR,
	'7z': DiskCompact.ARCHIVE,
	gz: DiskCompact.ARCHIVE,
	gzip: DiskCompact.ARCHIVE,
	tar: DiskCompact.ARCHIVE,
	jpg: DiskCompact.IMAGE,
	jpeg: DiskCompact.IMAGE,
	png: DiskCompact.IMAGE,
	gif: DiskCompact.IMAGE,
	bmp: DiskCompact.IMAGE,
	webp: DiskCompact.IMAGE,
	svg: DiskCompact.IMAGE,
	heic: DiskCompact.IMAGE,
	mp4: DiskCompact.VIDEO,
	avi: DiskCompact.VIDEO,
	mov: DiskCompact.VIDEO,
	wmv: DiskCompact.VIDEO,
	webm: DiskCompact.VIDEO,
	mkv: DiskCompact.VIDEO,
	mp3: DiskCompact.AUDIO,
	wav: DiskCompact.AUDIO,
	ogg: DiskCompact.AUDIO,
	m4a: DiskCompact.AUDIO,
	flac: DiskCompact.AUDIO,
});

export const UnknownFileIcon = DiskCompact.EMPTY;

/** Lowercased part after the last dot, so `archive.tar.gz` gives `gz`; a name with no dot gives ''. */
function extension(fileName: string): string
{
	const position = fileName.lastIndexOf('.');

	return position === -1 ? '' : fileName.slice(position + 1).toLowerCase();
}

export function resolveFileTypeIcon(fileName: string): string
{
	return IconByExtension[extension(fileName)] ?? UnknownFileIcon;
}
