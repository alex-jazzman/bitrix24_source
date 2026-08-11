<?php

declare(strict_types=1);

namespace Bitrix\Note\Internal\Service\Collaboration;

use Bitrix\Main\Config\Option;
use Bitrix\Main\Engine\UrlManager;
use Bitrix\Main\Result;
use Bitrix\Main\Web\JWT;

class CollabConfigService
{
	private const MODULE_ID = 'note';
	public const OPTION_ENABLED = 'collab_enabled';
	public const OPTION_HOCUSPOCUS_URL = 'collab_hocuspocus_url';
	public const OPTION_TENANT_ID = 'collab_tenant_id';
	public const OPTION_PORTAL_SECRET = 'collab_portal_secret';
	public const OPTION_COLLAB_SECRET = 'collab_collab_secret';
	public const OPTION_REGISTERED = 'collab_registered';
	public const OPTION_COLLAB_HOST = 'collab_host';
	public const OPTION_COLLAB_ALLOW_HTTP = 'collab_allow_http';
	public const DOC_KEY_SEGMENTS_COUNT = 4;

	public function isEnabled(): bool
	{
		return Option::get(self::MODULE_ID, self::OPTION_ENABLED, 'N') === 'Y';
	}

	public function getHocusPocusUrl(): string
	{
		return trim((string)Option::get(self::MODULE_ID, self::OPTION_HOCUSPOCUS_URL, ''));
	}

	public function getTenantId(): string
	{
		return (string)Option::get(self::MODULE_ID, self::OPTION_TENANT_ID, '');
	}

	public function setTenantId(string $tenantId): void
	{
		Option::set(self::MODULE_ID, self::OPTION_TENANT_ID, $tenantId);
	}

	public function getCollabHost(): string
	{
		return rtrim(trim((string)Option::get(self::MODULE_ID, self::OPTION_COLLAB_HOST, '')), '/');
	}

	public function getPortalCallbackBaseUrl(): string
	{
		return UrlManager::getInstance()->getHostUrl() . '/bitrix/tools/note';
	}

	public function getPortalSecret(): string
	{
		return (string)Option::get(self::MODULE_ID, self::OPTION_PORTAL_SECRET, '');
	}

	public function setPortalSecret(string $secret): void
	{
		Option::set(self::MODULE_ID, self::OPTION_PORTAL_SECRET, $secret);
	}

	public function getCollabSecret(): string
	{
		return (string)Option::get(self::MODULE_ID, self::OPTION_COLLAB_SECRET, '');
	}

	public function setCollabSecret(string $secret): void
	{
		Option::set(self::MODULE_ID, self::OPTION_COLLAB_SECRET, $secret);
	}

	public function getPortalSecretBinary(): string
	{
		$b64 = $this->getPortalSecret();
		if ($b64 === '')
		{
			return '';
		}

		return JWT::urlsafeB64Decode($b64);
	}

	public function getCollabSecretBinary(): string
	{
		$b64 = $this->getCollabSecret();
		if ($b64 === '')
		{
			return '';
		}

		return JWT::urlsafeB64Decode($b64);
	}

	public function ensureRegistered(): Result
	{
		$result = new Result();
		if ($this->isRegistered())
		{
			return $result;
		}

		$registrationService = new TenantRegistrationService($this);

		return $registrationService->register();
	}

	private function isRegistered(): bool
	{
		return Option::get(self::MODULE_ID, self::OPTION_REGISTERED, 'N') === 'Y';
	}

	public function setRegistered(bool $registered): void
	{
		Option::set(self::MODULE_ID, self::OPTION_REGISTERED, $registered ? 'Y' : 'N');
	}

	public function isAllowInsecureHttp(): bool
	{
		return Option::get(self::MODULE_ID, self::OPTION_COLLAB_ALLOW_HTTP, 'N') === 'Y';
	}

	public function buildCollaborationContext(
		int $userId,
		int $collectionId,
		int $documentId,
		bool $canEdit,
		string $userName,
	): ?array
	{
		if (!$this->isEnabled())
		{
			return null;
		}

		$hocusPocusUrl = $this->getHocusPocusUrl();
		if (
			$hocusPocusUrl === ''
			|| $userId <= 0
			|| $collectionId <= 0
			|| $documentId <= 0
		)
		{
			return null;
		}

		$registrationResult = $this->ensureRegistered();
		if (!$registrationResult->isSuccess())
		{
			return null;
		}

		$portalSecret = $this->getPortalSecretBinary();
		if ($portalSecret === '')
		{
			return null;
		}

		$docKey = $this->buildDocKey($collectionId, $documentId);
		$role = $canEdit ? 'write' : 'read';

		try
		{
			$now = time();
			$token = JWT::encode(
				[
					'iss' => 'bitrix-portal',
					'sub' => (string)$userId,
					'aud' => 'collab',
					'tenantId' => $this->getTenantId(),
					'docKey' => $docKey,
					'portalApiBaseUrl' => $this->getPortalCallbackBaseUrl(),
					'role' => $role,
					'iat' => $now,
					'exp' => $now + 1800,
				],
				$portalSecret,
				'HS256',
			);
		}
		catch (\Throwable)
		{
			return null;
		}

		return [
			'enabled' => true,
			'url' => $hocusPocusUrl,
			'token' => $token,
			'docKey' => $docKey,
			'readOnly' => !$canEdit,
			'currentUser' => [
				'id' => (string)$userId,
				'name' => $userName,
				'color' => '#' . substr(md5((string)$userId), 0, 6),
			],
		];
	}

	public function buildDocKey(int $collectionId, int $documentId): string
	{
		return $this->getTenantId() . ':note:' . $collectionId . ':' . $documentId;
	}

	public function isCurrentTenant(string $tenantId): bool
	{
		$tenantId = trim($tenantId);
		if ($tenantId === '')
		{
			return false;
		}

		return hash_equals($this->getTenantId(), $tenantId);
	}

}
