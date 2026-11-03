<?php

declare(strict_types=1);

namespace Bitrix\Vibecodeconnector\Internal\Integration\HumanResources;

use Bitrix\HumanResources\Enum\DepthLevel;
use Bitrix\HumanResources\Public\Service\Container;
use Bitrix\Main\Loader;
use Bitrix\Main\UserTable;
use Bitrix\Vibecodeconnector\Internal\Integration\Main\AudienceCodeSet;

class StructureGate
{
	private const USER_CHUNK_SIZE = 2000;

	/** @var array<string, int[]> */
	private array $resolvedNodeIds = [];

	public function isAvailable(): bool
	{
		return Loader::includeModule('humanresources');
	}

	/**
	 * @param int[] $userIds
	 *
	 * @return int[]
	 */
	public function filterMembers(array $userIds, AudienceCodeSet $codes): array
	{
		$userIds = array_values(array_filter(
			array_unique(array_map('intval', $userIds)),
			static fn (int $userId): bool => $userId > 0,
		));
		if ($userIds === [] || $codes->namesNoStructure() || !$this->isAvailable())
		{
			return [];
		}

		$nodeIds = $this->resolveNodeIds($codes);
		if ($nodeIds === [])
		{
			return [];
		}

		$members = [];
		foreach (array_chunk($userIds, self::USER_CHUNK_SIZE) as $chunk)
		{
			$members += array_fill_keys(
				Container::getNodeMemberService()->findAllByEntityIds(
					entityIds: $chunk,
					nodeIds: $nodeIds,
					withVirtualUsers: false,
				)->getUniqueEntityIds(),
				true,
			);
		}

		return array_values(array_filter(
			$userIds,
			static fn (int $userId): bool => isset($members[$userId]),
		));
	}

	/**
	 * @return int[]
	 */
	public function enumerateMembers(AudienceCodeSet $codes, int $limit, int $afterUserId = 0): array
	{
		if ($limit <= 0 || $codes->namesNoStructure() || !$this->isAvailable())
		{
			return [];
		}

		$nodeIds = $this->resolveNodeIds($codes);
		if ($nodeIds === [])
		{
			return [];
		}

		return $this->fetchMemberIdsKeysetPage($nodeIds, $limit, max(0, $afterUserId));
	}

	/**
	 * @param int[] $nodeIds
	 *
	 * @return int[]
	 */
	private function fetchMemberIdsKeysetPage(array $nodeIds, int $limit, int $afterUserId): array
	{
		$query = UserTable::query()
			->setSelect(['ID'])
			->setDistinct()
			->where('ID', '>', $afterUserId)
			->where('REAL_USER', 'expr', true)
			->setOrder(['ID' => 'ASC'])
			->setLimit($limit)
		;
		$rows = Container::getNodeMemberService()
			->injectUserNodeSubquery($query, nodeIds: $nodeIds)
			->fetchAll()
		;

		$userIds = array_values(array_unique(array_map(
			static fn (array $row): int => (int)$row['ID'],
			$rows,
		)));
		sort($userIds, SORT_NUMERIC);

		return $userIds;
	}

	/**
	 * @return int[]
	 */
	private function resolveNodeIds(AudienceCodeSet $codes): array
	{
		$cacheKey = $this->nodeCacheKey($codes);
		if (array_key_exists($cacheKey, $this->resolvedNodeIds))
		{
			return $this->resolvedNodeIds[$cacheKey];
		}

		$nodeService = Container::getNodeService();

		$named = $nodeService->getNodeIdsByAccessCodes($codes->departmentCodes);
		$recursive = $nodeService->getNodeIdsByAccessCodes($codes->recursiveDepartmentCodes);

		$descendants = $recursive === [] ? [] : $nodeService->findChildrenByNodeIds(
			nodeIds: array_values(array_unique($recursive)),
			depthLevel: DepthLevel::FULL,
		)->getIds();

		$candidates = array_values(array_unique(array_merge($named, $descendants)));

		return $this->resolvedNodeIds[$cacheKey] = $candidates === []
			? []
			: $nodeService->findAllByIds($candidates)->getIds()
		;
	}

	private function nodeCacheKey(AudienceCodeSet $codes): string
	{
		$departmentCodes = $codes->departmentCodes;
		$recursiveDepartmentCodes = $codes->recursiveDepartmentCodes;
		sort($departmentCodes);
		sort($recursiveDepartmentCodes);

		return implode(',', $departmentCodes) . '|' . implode(',', $recursiveDepartmentCodes);
	}
}
