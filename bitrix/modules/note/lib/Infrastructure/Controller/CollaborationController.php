<?php

declare(strict_types=1);

namespace Bitrix\Note\Infrastructure\Controller;

use Bitrix\Main\Error;
use Bitrix\Main\Engine\Controller;
use Bitrix\Main\Localization\Loc;
use Bitrix\Note\Internal\Access\Service\CollectionAccessService;
use Bitrix\Note\Internal\Repository\DocumentRepository;
use Bitrix\Main\Web\JWT;
use Bitrix\Note\Internal\Service\Collaboration\CollabConfigService;

class CollaborationController extends Controller
{
	private ?DocumentRepository $documentRepository = null;
	private ?CollabConfigService $configService = null;

	protected function getDefaultPreFilters(): array
	{
		return array_merge(parent::getDefaultPreFilters(), [
			new ActionFilter\NoteAccess(),
		]);
	}

	public function getTokenAction(int $documentId): ?array
	{
		$document = $this->getDocumentRepository()->getById($documentId);
		if ($document === null)
		{
			$this->addError(new Error(Loc::getMessage('NOTE_COLLABORATION_DOCUMENT_NOT_FOUND')));

			return null;
		}

		$canWrite = $this->hasCollectionLevel($document->getCollectionId(), CollectionAccessService::LEVEL_EDIT);
		$canRead = $canWrite || $this->hasCollectionLevel($document->getCollectionId(), CollectionAccessService::LEVEL_VIEW);
		if (!$canRead)
		{
			$this->denyAccess();

			return null;
		}

		$config = $this->getConfigService();
		if (!$config->isEnabled())
		{
			$this->addError(new Error(Loc::getMessage('NOTE_COLLABORATION_NOT_ENABLED')));

			return null;
		}

		$hocusPocusUrl = $config->getHocusPocusUrl();
		if ($hocusPocusUrl === '')
		{
			$this->addError(new Error(Loc::getMessage('NOTE_COLLABORATION_URL_NOT_CONFIGURED')));

			return null;
		}

		$registrationResult = $config->ensureRegistered();
		if (!$registrationResult->isSuccess())
		{
			$this->addErrors($registrationResult->getErrors());

			return null;
		}

		$docKey = $config->buildDocKey($document->getCollectionId(), $documentId);
		$userId = (int)$this->getCurrentUser()->getId();
		$role = $canWrite ? 'write' : 'read';

		$portalSecret = $config->getPortalSecretBinary();
		if ($portalSecret === '')
		{
			$this->addError(new Error('Collaboration not configured'));

			return null;
		}

		$now = time();
		$token = JWT::encode(
			[
				'iss' => 'bitrix-portal',
				'sub' => (string)$userId,
				'aud' => 'collab',
				'tenantId' => $config->getTenantId(),
				'docKey' => $docKey,
				'portalApiBaseUrl' => $config->getPortalCallbackBaseUrl(),
				'role' => $role,
				'iat' => $now,
				'exp' => $now + 1800,
			],
			$portalSecret,
			'HS256',
		);

		return [
			'token' => $token,
			'url' => $hocusPocusUrl,
			'docKey' => $docKey,
		];
	}

	private function getDocumentRepository(): DocumentRepository
	{
		$this->documentRepository ??= new DocumentRepository();

		return $this->documentRepository;
	}

	private function getConfigService(): CollabConfigService
	{
		$this->configService ??= new CollabConfigService();

		return $this->configService;
	}

	private function hasCollectionLevel(int $collectionId, int $requiredLevel): bool
	{
		return CollectionAccessService::currentUserHasLevel($collectionId, $requiredLevel);
	}

	private function denyAccess(): void
	{
		$this->addError(new Error(Loc::getMessage('NOTE_ACCESS_DENIED')));
	}
}
