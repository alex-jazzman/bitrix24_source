<?php

declare(strict_types=1);

namespace Bitrix\Note\Internal\Service\Import;

use Bitrix\Main\IO\File;
use Bitrix\Main\IO\Path;
use Bitrix\Note\Internal\Repository\DocumentFileLinkRepository;

class ImportFileService
{
	private DocumentFileLinkRepository $fileLinkRepository;

	public function __construct(?DocumentFileLinkRepository $fileLinkRepository = null)
	{
		$this->fileLinkRepository = $fileLinkRepository ?? new DocumentFileLinkRepository();
	}

	/**
	 * Resolves one downloadAttachment() result into a note-owned file id.
	 *
	 * Internal sources (wiki) duplicate the file inside Bitrix and hand back a
	 * ready `fileId`; external sources (Outline) hand back a `tmpPath` that we
	 * persist here via CFile::SaveFile. The import steps stay source-agnostic.
	 *
	 * @param array<string, mixed> $data SourceResult::$data from downloadAttachment().
	 */
	public function persistAttachment(array $data): ?int
	{
		$preSavedFileId = $data['fileId'] ?? null;
		if ($preSavedFileId !== null)
		{
			return (int)$preSavedFileId > 0 ? (int)$preSavedFileId : null;
		}

		$tmpPath = (string)($data['tmpPath'] ?? '');
		if ($tmpPath === '')
		{
			return null;
		}

		return $this->saveAttachment(
			$tmpPath,
			(string)($data['fileName'] ?? ''),
			(string)($data['contentType'] ?? 'application/octet-stream'),
			(int)($data['size'] ?? 0),
		);
	}

	public function saveAttachment(string $tmpPath, string $fileName, string $mimeType, int $size): ?int
	{
		if ($size <= 0)
		{
			return null;
		}

		$fileName = self::ensureFileExtension($fileName, $mimeType);
		$tmpFile = new File($tmpPath);

		if (!$tmpFile->isExists() || !$tmpFile->isReadable())
		{
			self::logError("Tmp file missing before SaveFile: name={$fileName}, size={$size}, tmpPath={$tmpPath}");

			return null;
		}

		$actualTmpSize = $tmpFile->getSize();
		if ($actualTmpSize !== $size)
		{
			self::logError("Tmp file size mismatch: name={$fileName}, expected={$size}, actual={$actualTmpSize}, tmpPath={$tmpPath}");
			self::deleteTmp($tmpFile);

			return null;
		}

		$fileArray = [
			'name' => $fileName,
			'tmp_name' => $tmpPath,
			'size' => $size,
			'type' => $mimeType,
			'MODULE_ID' => 'note',
		];

		$fileId = \CFile::SaveFile($fileArray, 'note/editor');

		if (!($fileId > 0))
		{
			$tmpStillExists = $tmpFile->isExists();
			self::logError("CFile::SaveFile returned " . var_export($fileId, true)
				. ": name={$fileName}, size={$size}, type={$mimeType}"
				. ", tmpExists=" . ($tmpStillExists ? 'yes' : 'no'));
		}

		self::deleteTmp($tmpFile);

		return ($fileId > 0) ? $fileId : null;
	}

	private static function deleteTmp(File $tmpFile): void
	{
		if ($tmpFile->isExists())
		{
			$tmpFile->delete();
		}
	}

	private static function ensureFileExtension(string $fileName, string $mimeType): string
	{
		$ext = Path::getExtension($fileName);
		if ($ext !== '')
		{
			return $fileName;
		}

		$mimeToExt = [
			'image/jpeg' => 'jpg',
			'image/png' => 'png',
			'image/gif' => 'gif',
			'image/webp' => 'webp',
			'image/svg+xml' => 'svg',
			'application/pdf' => 'pdf',
			'video/mp4' => 'mp4',
			'video/webm' => 'webm',
		];

		$guessedExt = $mimeToExt[$mimeType] ?? null;
		if ($guessedExt !== null)
		{
			return $fileName . '.' . $guessedExt;
		}

		return $fileName;
	}

	private static function logError(string $message): void
	{
		\CEventLog::Add([
			'SEVERITY' => \CEventLog::SEVERITY_ERROR,
			'AUDIT_TYPE_ID' => 'IMPORT_ERROR',
			'MODULE_ID' => 'note',
			'DESCRIPTION' => $message,
		]);
	}

	public function linkFileToDocument(int $documentId, int $fileId, int $userId): void
	{
		$this->fileLinkRepository->link($documentId, $fileId, $userId);
	}
}
