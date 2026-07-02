<?php

declare(strict_types=1);

namespace Bitrix\Note\Internal\Service;

use Bitrix\Note\Internal\Util\IdNormalizer;

class DocumentFileService
{
	private const NOTE_MODULE_ID = 'note';
	private const NOTE_FILE_SUBDIR_PREFIX = 'note/editor';

	public function extractFileIds(array $markdown): array
	{
		$ids = [];
		$this->collectFileIds($markdown, $ids);

		return IdNormalizer::normalize($ids);
	}

	public function getValidatedNoteFile(int $fileId): ?array
	{
		if ($fileId <= 0)
		{
			return null;
		}

		$fileData = \CFile::GetFileArray($fileId);
		if (!is_array($fileData))
		{
			return null;
		}

		if (!$this->isNoteFileData($fileData))
		{
			return null;
		}

		return $fileData;
	}

	public function getValidatedNoteFileIds(array $fileIds): array
	{
		$normalizedFileIds = IdNormalizer::normalize($fileIds);
		if (empty($normalizedFileIds))
		{
			return [];
		}

		$validFileIds = [];
		$rows = \CFile::GetList(arFilter: ['@ID' => $normalizedFileIds]);
		while ($row = $rows->Fetch())
		{
			if (!is_array($row))
			{
				continue;
			}

			$fileId = (int)($row['ID'] ?? 0);
			if ($fileId <= 0)
			{
				continue;
			}

			if (!$this->isNoteFileData($row))
			{
				continue;
			}

			$validFileIds[$fileId] = true;
		}

		return array_values(array_filter(
			$normalizedFileIds,
			static fn(int $fileId): bool => isset($validFileIds[$fileId]),
		));
	}

	public function isNoteOwnedFile(int $fileId): bool
	{
		return $this->getValidatedNoteFile($fileId) !== null;
	}

	private function isNoteFileData(array $fileData): bool
	{
		$moduleId = strtolower((string)($fileData['MODULE_ID'] ?? ''));

		return $moduleId === self::NOTE_MODULE_ID;
	}

	private function collectFileIds(array $node, array &$ids): void
	{
		$attrs = $node['attrs'] ?? null;
		if (is_array($attrs) && isset($attrs['fileId']))
		{
			$ids[] = (int)$attrs['fileId'];
		}

		$content = $node['content'] ?? null;
		if (!is_array($content))
		{
			return;
		}

		foreach ($content as $child)
		{
			if (is_array($child))
			{
				$this->collectFileIds($child, $ids);
			}
		}
	}
}
