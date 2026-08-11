<?php

declare(strict_types=1);

namespace Bitrix\Note\Public\Command;

use Bitrix\Main\Command\AbstractCommand;
use Bitrix\Main\Result;
use Bitrix\Main\SystemException;
use Bitrix\Note\Internal\Exceptions\DocumentArchivedException;
use Bitrix\Note\Internal\Exceptions\DocumentInRecycleBinException;
use Bitrix\Note\Internal\Model\DocumentTable;
use Bitrix\Note\Internal\Repository\DocumentRepository;
use Bitrix\Note\Internal\Service\Collaboration\DocumentLockService;
use Bitrix\Note\Internal\Service\RecycleBin\RecycleBinFilter;

class SaveYjsStateCommand extends AbstractCommand
{
	private const GENESIS_LOCK_SCOPE = 'genesis';
	private const GENESIS_LOCK_TIMEOUT = 10;

	private readonly int $documentId;
	private readonly int $userId;
	private readonly string $yjsState;
	private readonly DocumentRepository $documentRepository;
	private readonly RecycleBinFilter $recycleBinFilter;
	private readonly DocumentLockService $lockService;

	public function __construct(
		int $documentId,
		int $userId,
		string $yjsState,
		?DocumentRepository $documentRepository = null,
		?RecycleBinFilter $recycleBinFilter = null,
		?DocumentLockService $lockService = null,
	)
	{
		$this->documentId = $documentId;
		$this->userId = $userId;
		$this->yjsState = $yjsState;
		$this->documentRepository = $documentRepository ?? new DocumentRepository();
		$this->recycleBinFilter = $recycleBinFilter ?? new RecycleBinFilter();
		$this->lockService = $lockService ?? new DocumentLockService();
	}

	protected function execute(): Result
	{
		if ($this->recycleBinFilter->isInRecycleBin($this->documentId))
		{
			throw new DocumentInRecycleBinException();
		}

		// Serialize concurrent genesis writers (overwrite-rebuild, legacy MD conversion,
		// first save of a new doc): the first one wins, late clients observe the persisted
		// baseline instead of clobbering it with their own divergent Y.Doc.
		$hasLock = $this->lockService->acquireLock(
			$this->documentId,
			self::GENESIS_LOCK_TIMEOUT,
			self::GENESIS_LOCK_SCOPE,
		);
		// Without the lock there is no serialization guarantee, so a late writer could read a
		// stale null baseline and clobber a concurrent genesis. Abort instead of writing blind.
		if (!$hasLock)
		{
			throw new SystemException('Failed to acquire genesis lock');
		}

		try
		{
			$document = $this->documentRepository->getMetaById($this->documentId, ['ID', 'UPDATED_AT', 'CONTENT_FORMAT', 'IS_ARCHIVED']);
			if ($document === null)
			{
				throw new SystemException('Document not found');
			}

			if ($document->getIsArchived())
			{
				throw new DocumentArchivedException();
			}

			// Uncached read so a concurrent writer's genesis is observed inside the lock.
			$existingState = $this->documentRepository->getYjsState($this->documentId);
			if ($existingState !== null)
			{
				$result = new Result();
				$result->setData(['applied' => false, 'yjsState' => $existingState]);

				return $result;
			}

			$document->setYjsState($this->yjsState);
			$document->setUpdatedBy($this->userId);
			if ($document->getContentFormat() !== DocumentTable::CONTENT_FORMAT_YJS)
			{
				$document->setContentFormat(DocumentTable::CONTENT_FORMAT_YJS);
			}
			$saveResult = $this->documentRepository->save($document);

			if (!$saveResult->isSuccess())
			{
				$result = new Result();
				$result->addErrors($saveResult->getErrors());

				return $result;
			}

			$result = new Result();
			$result->setData(['applied' => true]);

			return $result;
		}
		finally
		{
			$this->lockService->releaseLock($this->documentId, self::GENESIS_LOCK_SCOPE);
		}
	}
}
