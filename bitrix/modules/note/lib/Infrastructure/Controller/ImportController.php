<?php

declare(strict_types=1);

namespace Bitrix\Note\Infrastructure\Controller;

use Bitrix\Main\Config\Option;
use Bitrix\Main\Error;
use Bitrix\Main\Engine\Controller;
use Bitrix\Main\Localization\Loc;
use Bitrix\Main\SystemException;
use Bitrix\Main\Web\Uri;
use Bitrix\Note\Infrastructure\Agent\Import\ImportAgent;
use Bitrix\Note\Internal\Access\AccessController;
use Bitrix\Note\Internal\Access\ActionDictionary;
use Bitrix\Note\Internal\Access\PortalAdmin;
use Bitrix\Note\Internal\Repository\ImportMapRepository;
use Bitrix\Note\Internal\Repository\ImportSessionRepository;
use Bitrix\Note\Internal\Service\Import\Source\OutlineSource;
use Bitrix\Note\Internal\Service\Import\Source\SourceInterface;
use Bitrix\Note\Public\Command\Import\CancelImportCommand;
use Bitrix\Note\Public\Command\Import\StartImportCommand;

class ImportController extends Controller
{
	protected function getDefaultPreFilters(): array
	{
		return array_merge(
			parent::getDefaultPreFilters(),
			[
				new ActionFilter\NoteAccess(),
			],
		);
	}

	public function getActiveSessionAction(): ?array
	{
		if (!$this->assertImportAccess())
		{
			return null;
		}

		$userId = (int)$this->getCurrentUser()->getId();
		$repository = new ImportSessionRepository();
		$existing = $repository->getByUser($userId);

		if ($existing === null)
		{
			return ['active' => false];
		}

		$sessionId = (int)$existing['ID'];
		$progress = $this->readStepperProgress($sessionId);

		return [
			'active' => true,
			'sessionId' => $sessionId,
			'progress' => $progress,
		];
	}

	public function acknowledgeFinishAction(int $sessionId): ?bool
	{
		if (!$this->assertImportAccess())
		{
			return null;
		}

		$session = $this->loadSession($sessionId);
		if ($session === null)
		{
			return null;
		}

		if ($session['STATUS'] === 'in_progress')
		{
			$this->addError(new Error(
				Loc::getMessage('NOTE_IMPORT_IN_PROGRESS'),
				'IMPORT_IN_PROGRESS',
			));

			return null;
		}

		Option::delete('main.stepper.note', ['name' => ImportAgent::class . "({$sessionId})"]);
		(new ImportSessionRepository())->delete($sessionId);

		return true;
	}

	public function checkConnectionAction(string $sourceType, string $url, string $token): ?array
	{
		if (!$this->assertImportAccess())
		{
			return null;
		}

		$userId = (int)$this->getCurrentUser()->getId();
		$existing = (new ImportSessionRepository())->getByUser($userId);
		if ($existing !== null && $existing['STATUS'] === 'in_progress')
		{
			$this->addError(new Error(
				Loc::getMessage('NOTE_IMPORT_IN_PROGRESS'),
				'IMPORT_IN_PROGRESS',
			));

			return null;
		}

		$source = $this->createSource($sourceType, $url, $token);
		$result = $source->checkConnection();

		if (!$result->success)
		{
			$this->addError(new Error(
				$result->error ?? Loc::getMessage('NOTE_IMPORT_CONNECTION_FAILED'),
				$result->errorField === 'token' ? 'IMPORT_INVALID_TOKEN' : 'IMPORT_INVALID_URL',
			));

			return null;
		}

		return [
			'instanceName' => $result->data['instanceName'] ?? '',
		];
	}

	public function checkOverlapAction(string $sourceType, array $collectionIds): ?array
	{
		if (!$this->assertImportAccess())
		{
			return null;
		}

		$mapRepository = new ImportMapRepository();
		$mappings = $mapRepository->bulkLookup($sourceType, $collectionIds);

		$existing = [];
		foreach ($mappings as $externalId => $mapping)
		{
			if ($mapping['collectionId'] !== null)
			{
				$existing[] = $externalId;
			}
		}

		return ['existingCollectionIds' => $existing];
	}

	public function getCollectionsAction(string $sourceType, string $url, string $token): ?array
	{
		if (!$this->assertImportAccess())
		{
			return null;
		}

		$source = $this->createSource($sourceType, $url, $token);
		$result = $source->getCollections();

		if (!$result->success)
		{
			$this->addError(new Error($result->error ?? Loc::getMessage('NOTE_IMPORT_COLLECTIONS_FAILED')));

			return null;
		}

		return ['collections' => $result->data['collections'] ?? []];
	}

	public function getDocumentTreeAction(string $sourceType, string $url, string $token, string $collectionId): ?array
	{
		if (!$this->assertImportAccess())
		{
			return null;
		}

		$source = $this->createSource($sourceType, $url, $token);
		$result = $source->getDocumentTree($collectionId);

		if (!$result->success)
		{
			$this->addError(new Error($result->error ?? Loc::getMessage('NOTE_IMPORT_TREE_FAILED')));

			return null;
		}

		return ['documents' => $result->data['documents'] ?? []];
	}

	public function startAction(
		string $sourceType,
		string $url,
		string $token,
		array $collectionIds,
		bool $overwrite = false,
	): ?array
	{
		if (!$this->assertImportAccess())
		{
			return null;
		}

		$userId = (int)$this->getCurrentUser()->getId();

		try
		{
			$this->validateSourceUrl($url);
			$result = (new StartImportCommand(
				$sourceType,
				$url,
				$token,
				$collectionIds,
				$userId,
				overwrite: $overwrite,
			))->run();
		}
		catch (\Throwable $e)
		{
			$this->addError(new Error($e->getMessage()));

			return null;
		}

		if (!$result->isSuccess())
		{
			foreach ($result->getErrors() as $error)
			{
				$this->addError($error);
			}

			return null;
		}

		$sessionId = (int)$result->getData()['sessionId'];

		return [
			'sessionId' => $sessionId,
			'progress' => $this->readStepperProgress($sessionId),
		];
	}

	public function getStatusAction(int $sessionId): ?array
	{
		if (!$this->assertImportAccess())
		{
			return null;
		}

		$session = $this->loadSession($sessionId);
		if ($session === null)
		{
			return null;
		}

		$stepperProgress = $this->readStepperProgress($sessionId);
		if ($stepperProgress !== null)
		{
			return ['progress' => $stepperProgress];
		}

		return [
			'progress' => [
				'status' => $session['STATUS'],
				'total' => 0,
				'done' => 0,
				'error' => 0,
			],
		];
	}

	public function cancelAction(int $sessionId): ?bool
	{
		if (!$this->assertImportAccess())
		{
			return null;
		}

		$session = $this->loadSession($sessionId);
		if ($session === null)
		{
			return null;
		}

		try
		{
			$result = (new CancelImportCommand($sessionId))->run();
		}
		catch (\Throwable $e)
		{
			$this->addError(new Error($e->getMessage()));

			return null;
		}

		if (!$result->isSuccess())
		{
			foreach ($result->getErrors() as $error)
			{
				$this->addError($error);
			}

			return null;
		}

		return true;
	}

	private function loadSession(int $sessionId): ?array
	{
		$repository = new ImportSessionRepository();
		$session = $repository->getById($sessionId);

		if ($session === null)
		{
			$this->addError(new Error(Loc::getMessage('NOTE_IMPORT_SESSION_NOT_FOUND')));

			return null;
		}

		$currentUserId = (int)$this->getCurrentUser()->getId();
		if ((int)$session['CREATED_BY'] !== $currentUserId && !PortalAdmin::isCurrentUserAdmin())
		{
			$this->addError(new Error(Loc::getMessage('NOTE_IMPORT_ACCESS_DENIED')));

			return null;
		}

		return $session;
	}

	private function readStepperProgress(int $sessionId): ?array
	{
		$optionKey = ImportAgent::class . "({$sessionId})";
		$raw = Option::get('main.stepper.note', $optionKey);

		if ($raw === '')
		{
			return null;
		}

		$data = unserialize($raw, ['allowed_classes' => false]);
		if (!is_array($data))
		{
			return null;
		}

		$collectionNames = $data['collectionNames'] ?? [];
		$collectionIds = $data['collectionIds'] ?? [];
		$collectionIndex = (int)($data['collectionIndex'] ?? 0);
		$currentExternalId = $collectionIds[$collectionIndex] ?? null;
		$currentCollectionName = ($currentExternalId !== null)
			? ($collectionNames[$currentExternalId] ?? '')
			: '';

		$status = $data['status'] ?? 'in_progress';
		$isFinished = ($status !== 'in_progress');

		$step = $data['step'] ?? 'createCollection';
		// During phase 1 (createStructure), doneCount stays at 0; expose structureIndex
		// instead so the progress bar reflects how much of the tree has been laid out.
		$currentDone = ($step === 'createStructure')
			? (int)($data['structureIndex'] ?? 0)
			: (int)($data['doneCount'] ?? 0);
		$currentError = (int)($data['errorCount'] ?? 0);
		$currentTotalAttachments = (int)($data['totalAttachments'] ?? 0);
		$currentDoneAttachments = (int)($data['doneAttachments'] ?? 0);

		$globalDone = (int)($data['globalDoneCount'] ?? 0);
		$globalError = (int)($data['globalErrorCount'] ?? 0);
		$globalTotalAttachments = (int)($data['globalTotalAttachments'] ?? 0);
		$globalDoneAttachments = (int)($data['globalDoneAttachments'] ?? 0);

		return [
			'status' => $status,
			'step' => $step,
			'total' => (int)($data['totalItems'] ?? 0),
			'done' => $isFinished ? $globalDone : $currentDone,
			'error' => $isFinished ? $globalError : $currentError,
			'totalAttachments' => $isFinished ? $globalTotalAttachments : $currentTotalAttachments,
			'doneAttachments' => $isFinished ? $globalDoneAttachments : $currentDoneAttachments,
			'collectionName' => $currentCollectionName,
			'collectionIndex' => $collectionIndex,
			'collectionCount' => count($collectionIds),
			'collectionIds' => $collectionIds,
			'sourceUrl' => $data['sourceUrl'] ?? null,
			'errorDetails' => $data['errorDetails'] ?? [],
		];
	}

	private function assertImportAccess(): bool
	{
		if (AccessController::getCurrent()->check(ActionDictionary::ACTION_NOTE_IMPORT))
		{
			return true;
		}

		$this->addError(new Error(Loc::getMessage('NOTE_IMPORT_ACCESS_DENIED')));

		return false;
	}

	private function createSource(string $sourceType, string $url, string $token): SourceInterface
	{
		$this->validateSourceUrl($url);

		return match ($sourceType)
		{
			'outline' => new OutlineSource($url, $token),
			default => throw new SystemException('Unsupported source type: ' . $sourceType),
		};
	}

	private function validateSourceUrl(string $url): void
	{
		$uri = new Uri($url);
		$scheme = mb_strtolower($uri->getScheme());

		if ($scheme !== 'https' && $scheme !== 'http')
		{
			throw new SystemException(Loc::getMessage('NOTE_IMPORT_ERROR_URL_SCHEME'));
		}

		$host = $uri->getHost();
		if ($host === '')
		{
			throw new SystemException(Loc::getMessage('NOTE_IMPORT_ERROR_URL_HOST'));
		}
	}
}
