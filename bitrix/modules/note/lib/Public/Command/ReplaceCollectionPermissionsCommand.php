<?php

declare(strict_types=1);

namespace Bitrix\Note\Public\Command;

use Bitrix\Main\Command\AbstractCommand;
use Bitrix\Main\Result;
use Bitrix\Note\Internal\Access\Service\CollectionAccessService;
use Bitrix\Note\Internal\Service\Collaboration\PushNotificationService;

/**
 * Generic public command to fully replace the ACL of a collection.
 *
 * Delegates to {@see CollectionAccessService::replaceCollectionPermissions()},
 * which owns the transaction and the "at least one moderator" invariant
 * (error code `NOTE_COLLECTION_NO_MODERATOR`). This command carries no
 * domain-specific knowledge: it accepts a flat permission list of
 * `['subjectCode' => string, 'level' => 'view'|'manage'|'moderate'|'none'|int]`
 * and forwards it as-is.
 */
class ReplaceCollectionPermissionsCommand extends AbstractCommand
{
	private readonly int $collectionId;
	private readonly array $permissions;
	private readonly int $actorId;
	private readonly string|int $policyLevel;
	private readonly ?PushNotificationService $pushService;

	/**
	 * @param array<int, array{subjectCode: string, level: string|int}> $permissions
	 */
	public function __construct(
		int $collectionId,
		array $permissions,
		int $actorId,
		string|int $policyLevel = CollectionAccessService::LEVEL_CODE_NONE,
		?PushNotificationService $pushService = null,
	)
	{
		$this->collectionId = $collectionId;
		$this->permissions = $permissions;
		$this->actorId = $actorId;
		$this->policyLevel = $policyLevel;
		$this->pushService = $pushService;
	}

	protected function execute(): Result
	{
		return CollectionAccessService::replaceCollectionPermissions(
			$this->collectionId,
			$this->permissions,
			$this->actorId,
			$this->policyLevel,
			$this->pushService,
		);
	}
}
