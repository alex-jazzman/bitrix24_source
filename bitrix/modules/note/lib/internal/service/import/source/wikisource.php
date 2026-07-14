<?php

declare(strict_types=1);

namespace Bitrix\Note\Internal\Service\Import\Source;

use Bitrix\Main\IO;
use Bitrix\Main\Loader;
use Bitrix\Note\Internal\Service\Import\ImportLogger;
use Bitrix\Note\Internal\Service\Import\Source\Wiki\WikiBaseLocator;
use Bitrix\Note\Internal\Service\Import\Source\Wiki\WikiMarkupConverter;
use Bitrix\Note\Internal\Service\Import\Source\Wiki\WikiTreeBuilder;

/**
 * Import source that reads legacy `wiki` bases locally from iblock — no HTTP, no
 * external service. Access is decided per explicit $userId, so the source works
 * the same in the preflight transport and the background stepper agent.
 *
 * Collection ids and page/category external ids follow DTO-02 (see WikiId).
 * Page bodies are converted to markdown at read time, emitting markers resolved
 * by WikiMentionTransformer / WikiMdTransformer.
 */
class WikiSource implements SourceInterface
{
	private readonly WikiBaseLocator $locator;

	/** @var int[]|null Cached ids of wiki iblocks the user may read (attachment allowlist). */
	private ?array $accessibleIblockIds = null;

	public function __construct(private readonly int $userId)
	{
		$this->locator = new WikiBaseLocator($userId);
	}

	public function checkConnection(): SourceResult
	{
		if (!Loader::includeModule('wiki'))
		{
			return new SourceResult(false, error: 'Module wiki is not installed');
		}

		return new SourceResult(true, ['instanceName' => 'Wiki']);
	}

	public function getCollections(): SourceResult
	{
		if (!Loader::includeModule('wiki'))
		{
			return new SourceResult(false, error: 'Module wiki is not installed');
		}

		return new SourceResult(true, ['collections' => $this->locator->listCollections()]);
	}

	public function getDocumentTree(string $collectionId): SourceResult
	{
		if (!Loader::includeModule('wiki'))
		{
			return new SourceResult(false);
		}

		$context = $this->locator->resolveContext($collectionId);
		if ($context === null)
		{
			return new SourceResult(false);
		}

		$builder = new WikiTreeBuilder($context);

		return new SourceResult(true, ['documents' => $builder->buildTree()]);
	}

	public function getDocumentsPage(string $collectionId, int $offset, int $limit): SourceResult
	{
		if (!Loader::includeModule('wiki'))
		{
			return new SourceResult(false);
		}

		$context = $this->locator->resolveContext($collectionId);
		if ($context === null)
		{
			return new SourceResult(false);
		}

		$builder = new WikiTreeBuilder($context);
		$window = array_slice($builder->buildFillList(), $offset, $limit);

		$pageItems = array_filter($window, static fn (array $i): bool => $i['kind'] === 'page');
		$bodies = $this->loadBodies((int)$context['iblockId'], array_column($pageItems, 'elementId'));

		$converter = new WikiMarkupConverter($builder->getCollectionId());
		$documents = [];
		foreach ($window as $item)
		{
			$text = '';
			if ($item['kind'] === 'page')
			{
				$body = $bodies[(int)$item['elementId']] ?? null;
				if ($body !== null)
				{
					$type = mb_strtolower((string)$body['type']) === 'html' ? 'html' : 'text';
					$text = $converter->convert((string)$body['detailText'], $type, $body['fileIds']);
				}
			}

			$documents[] = [
				'id' => $item['externalId'],
				'title' => $item['title'],
				'text' => $text,
			];
		}

		return new SourceResult(true, [
			'documents' => $documents,
			'pagination' => [],
		]);
	}

	public function getCollectionAccess(string $collectionId): SourceResult
	{
		if (!Loader::includeModule('wiki'))
		{
			return new SourceResult(false, error: 'Module wiki is not installed');
		}

		return new SourceResult(true, $this->locator->getCollectionAccess($collectionId));
	}

	public function downloadAttachment(string $attachmentId): SourceResult
	{
		$fileId = (int)$attachmentId;
		if ($fileId <= 0)
		{
			return new SourceResult(false, error: "wiki attachment: invalid file id '{$attachmentId}'");
		}

		// Defense-in-depth ownership check: a b_file row alone does not prove the
		// user may read the file. Independently of the marker neutralization in
		// WikiMarkupConverter, only copy a file that is actually an IMAGES
		// attachment of a page inside a wiki base this user can read — so a
		// regression upstream cannot become an arbitrary-file read across the
		// portal.
		if (!$this->isImportableWikiFile($fileId))
		{
			$error = "wiki attachment: file id={$fileId} is not an attachment of a wiki base accessible to user {$this->userId}";
			ImportLogger::logError($error);

			return new SourceResult(false, error: $error);
		}

		$file = \CFile::GetFileArray($fileId);
		if (!is_array($file))
		{
			$error = "wiki attachment: b_file record {$fileId} not found";
			ImportLogger::logError($error);

			return new SourceResult(false, error: $error);
		}

		// Wiki is an internal source: the attachment already lives in b_file, so we
		// duplicate it inside Bitrix instead of the external HTTP-download path that
		// OutlineSource uses. MakeFileArray resolves both local and cloud storage to a
		// readable path (cloud is fetched via OnMakeFileArray); CFile::SaveFile then
		// stores an independent note-owned duplicate of the bytes under MODULE_ID=note
		// in upload/note/editor — the original wiki file is left untouched — and
		// returns the ready file id. No throwaway tmp / manual directory handling needed.
		$made = \CFile::MakeFileArray($fileId);
		if (!is_array($made) || empty($made['tmp_name']) || !IO\File::isFileExists($made['tmp_name']))
		{
			$error = sprintf(
				'wiki attachment: cannot read source file id=%d, name=%s, subdir=%s, handler=%s',
				$fileId,
				(string)($file['FILE_NAME'] ?? ''),
				(string)($file['SUBDIR'] ?? ''),
				(string)($file['HANDLER_ID'] ?? ''),
			);
			ImportLogger::logError($error);

			return new SourceResult(false, error: $error);
		}

		$made['MODULE_ID'] = 'note';
		$noteFileId = (int)\CFile::SaveFile($made, 'note/editor');
		if ($noteFileId <= 0)
		{
			$error = "wiki attachment: failed to store note copy of file id={$fileId}";
			ImportLogger::logError($error);

			return new SourceResult(false, error: $error);
		}

		return new SourceResult(true, [
			'fileId' => $noteFileId,
			'fileName' => (string)($file['ORIGINAL_NAME'] ?? $file['FILE_NAME'] ?? ('file_' . $fileId)),
			'contentType' => (string)($file['CONTENT_TYPE'] ?? 'application/octet-stream'),
			'size' => (int)($file['FILE_SIZE'] ?? 0),
		]);
	}

	/**
	 * True when $fileId is an IMAGES attachment of some page in a wiki base the
	 * importing user may read. The IMAGES property (type F) is the only link
	 * between a wiki page and its files, so a reverse lookup over the user's
	 * accessible wiki iblocks is the authoritative ownership test.
	 *
	 * Note: a group wiki shares one socnet iblock across all groups, so this
	 * cannot tell apart two groups inside that iblock — a file from another group
	 * in the same iblock would pass. That residual case is already covered by the
	 * converter marker neutralization (such an id never reaches here); the purpose
	 * of this layer is to reject files that live outside any accessible wiki
	 * iblock entirely (disk, im, crm, other users' uploads).
	 */
	private function isImportableWikiFile(int $fileId): bool
	{
		if (!Loader::includeModule('iblock'))
		{
			return false;
		}

		foreach ($this->getAccessibleIblockIds() as $iblockId)
		{
			$rs = \CIBlockElement::GetList(
				[],
				[
					'IBLOCK_ID' => $iblockId,
					'PROPERTY_IMAGES' => $fileId,
					'CHECK_PERMISSIONS' => 'N',
				],
				false,
				['nTopCount' => 1],
				['ID'],
			);
			if ($rs->Fetch())
			{
				return true;
			}
		}

		return false;
	}

	/**
	 * @return int[]
	 */
	private function getAccessibleIblockIds(): array
	{
		if ($this->accessibleIblockIds === null)
		{
			$this->accessibleIblockIds = $this->locator->listAccessibleIblockIds();
		}

		return $this->accessibleIblockIds;
	}

	/**
	 * Loads page bodies for one window: DETAIL_TEXT/type plus IMAGES file ids.
	 *
	 * @param int[] $elementIds
	 * @return array<int, array{detailText:string, type:string, fileIds:int[]}>
	 */
	private function loadBodies(int $iblockId, array $elementIds): array
	{
		$elementIds = array_values(array_filter(array_map('intval', $elementIds)));
		if (empty($elementIds))
		{
			return [];
		}

		// Load IMAGES for the whole window in one query instead of one per page
		// (the converter resolves files by name/id, so image order is irrelevant).
		$imageIdsByElement = $this->loadImageIds($iblockId, $elementIds);

		$bodies = [];
		$rs = \CIBlockElement::GetList(
			['ID' => 'ASC'],
			['IBLOCK_ID' => $iblockId, 'ID' => $elementIds, 'CHECK_PERMISSIONS' => 'N'],
			false,
			false,
			['ID', 'NAME', 'DETAIL_TEXT', 'DETAIL_TEXT_TYPE'],
		);
		while ($element = $rs->GetNext())
		{
			$id = (int)$element['ID'];
			$bodies[$id] = [
				'detailText' => (string)($element['~DETAIL_TEXT'] ?? $element['DETAIL_TEXT'] ?? ''),
				'type' => (string)($element['DETAIL_TEXT_TYPE'] ?? 'text'),
				'fileIds' => $imageIdsByElement[$id] ?? [],
			];
		}

		return $bodies;
	}

	/**
	 * Batch-loads IMAGES file ids for a set of elements in a single query.
	 *
	 * @param int[] $elementIds
	 * @return array<int, int[]> elementId => fileIds
	 */
	private function loadImageIds(int $iblockId, array $elementIds): array
	{
		if (empty($elementIds))
		{
			return [];
		}

		$idsByElement = [];
		$rs = \CIBlockElement::GetList(
			['ID' => 'ASC'],
			[
				'IBLOCK_ID' => $iblockId,
				'ID' => $elementIds,
				'!PROPERTY_IMAGES' => false,
				'CHECK_PERMISSIONS' => 'N',
			],
			false,
			false,
			['ID', 'PROPERTY_IMAGES'],
		);
		while ($row = $rs->Fetch())
		{
			$value = $row['PROPERTY_IMAGES_VALUE'] ?? null;
			if (is_numeric($value))
			{
				$idsByElement[(int)$row['ID']][] = (int)$value;
			}
		}

		return $idsByElement;
	}
}
