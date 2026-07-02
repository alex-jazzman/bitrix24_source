<?php

declare(strict_types=1);

namespace Bitrix\Note\Public\Command;

use Bitrix\Main\Command\AbstractCommand;
use Bitrix\Main\Result;
use Bitrix\Main\SystemException;
use Bitrix\Note\Internal\Repository\DocumentUpdateRepository;
use Bitrix\Note\Internal\Service\Collaboration\PushNotificationService;

class SavePatchCommand extends AbstractCommand
{
	private readonly int $documentId;
	private readonly int $userId;
	private readonly string $patch;
	private readonly ?string $cursor;
	private readonly DocumentUpdateRepository $updateRepository;
	private readonly PushNotificationService $pushService;

	public function __construct(
		int $documentId,
		int $userId,
		string $patch,
		?string $cursor = null,
		?DocumentUpdateRepository $updateRepository = null,
		?PushNotificationService $pushService = null,
	)
	{
		$this->documentId = $documentId;
		$this->userId = $userId;
		$this->patch = $patch;
		$this->cursor = $cursor;
		$this->updateRepository = $updateRepository ?? new DocumentUpdateRepository();
		$this->pushService = $pushService ?? new PushNotificationService();
	}

	protected function execute(): Result
	{
		$addResult = $this->updateRepository->add($this->documentId, $this->userId, $this->patch);
		if (!$addResult->isSuccess())
		{
			$result = new Result();
			$result->addErrors($addResult->getErrors());

			return $result;
		}

		$this->pushService->sendDocumentPatch($this->documentId, $this->userId, $this->patch, $this->cursor);

		return new Result();
	}
}
