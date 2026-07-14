<?php

declare(strict_types=1);

namespace Bitrix\Note\Internal\Integration\UI\EntitySelector;

use Bitrix\Main\Engine\CurrentUser;
use Bitrix\Note\Internal\Access\PortalAdmin;
use Bitrix\Note\Internal\Access\Service\CollectionAccessService;
use Bitrix\Note\Internal\Model\CollectionTable;
use Bitrix\UI\EntitySelector\BaseProvider;
use Bitrix\UI\EntitySelector\Dialog;
use Bitrix\UI\EntitySelector\Item;
use Bitrix\UI\EntitySelector\SearchQuery;

final class CollectionProvider extends BaseProvider
{
	public const ENTITY_ID = 'note-collection';

	private const RECENT_LIMIT = 50;
	private const SEARCH_LIMIT = 50;
	private const MIN_QUERY_LENGTH = 1;

	public function __construct(array $options = [])
	{
		parent::__construct();

		$this->options = $options;
	}

	public function isAvailable(): bool
	{
		$userId = (int)CurrentUser::get()->getId();

		return $userId > 0;
	}

	public function getItems(array $ids): array
	{
		$ids = array_values(array_filter(array_map('intval', $ids), static fn(int $id) => $id > 0));
		if (empty($ids))
		{
			return [];
		}

		$allowedIds = $this->filterByManageAccess($ids);
		if (empty($allowedIds))
		{
			return [];
		}

		$rows = CollectionTable::query()
			->setSelect(['ID', 'NAME'])
			->whereIn('ID', $allowedIds)
			->where('IS_ARCHIVED', 'N')
			->setOrder(['NAME' => 'ASC'])
			->exec()
		;

		$items = [];
		while ($row = $rows->fetch())
		{
			$items[] = $this->makeItem((int)$row['ID'], (string)$row['NAME']);
		}

		return $items;
	}

	public function getPreselectedItems(array $ids): array
	{
		return $this->getItems($ids);
	}

	public function fillDialog(Dialog $dialog): void
	{
		$dialog->loadPreselectedItems();

		$query = CollectionTable::query()
			->setSelect(['ID', 'NAME'])
			->where('IS_ARCHIVED', 'N')
			->setOrder(['UPDATED_AT' => 'DESC', 'ID' => 'DESC'])
			->setLimit(self::RECENT_LIMIT)
		;

		if (!$this->isAdmin())
		{
			$collectionIds = $this->getManageAccessibleCollectionIds();
			if (empty($collectionIds))
			{
				return;
			}
			$query->whereIn('ID', $collectionIds);
		}

		$rows = $query->exec();
		while ($row = $rows->fetch())
		{
			$dialog->addRecentItem($this->makeItem((int)$row['ID'], (string)$row['NAME']));
		}
	}

	public function doSearch(SearchQuery $searchQuery, Dialog $dialog): void
	{
		$queryText = trim($searchQuery->getQuery());
		if (mb_strlen($queryText) < self::MIN_QUERY_LENGTH)
		{
			return;
		}

		// Left-anchored LIKE so the index can be used.
		$query = CollectionTable::query()
			->setSelect(['ID', 'NAME'])
			->where('IS_ARCHIVED', 'N')
			->whereLike('NAME', $queryText . '%')
			->setOrder(['NAME' => 'ASC'])
			->setLimit(self::SEARCH_LIMIT)
		;

		if (!$this->isAdmin())
		{
			$collectionIds = $this->getManageAccessibleCollectionIds();
			if (empty($collectionIds))
			{
				return;
			}
			$query->whereIn('ID', $collectionIds);
		}

		$rows = $query->exec();
		$count = 0;
		while ($row = $rows->fetch())
		{
			$dialog->addItem($this->makeItem((int)$row['ID'], (string)$row['NAME']));
			$count++;
		}

		if ($count >= self::SEARCH_LIMIT)
		{
			$searchQuery->setCacheable(false);
		}
	}

	private function makeItem(int $id, string $title): Item
	{
		return new Item([
			'id' => $id,
			'entityId' => self::ENTITY_ID,
			'title' => $title,
		]);
	}

	private function isAdmin(): bool
	{
		return PortalAdmin::isCurrentUserAdmin();
	}

	/**
	 * @param int[] $ids
	 * @return int[]
	 */
	private function filterByManageAccess(array $ids): array
	{
		if ($this->isAdmin())
		{
			return $ids;
		}

		$userId = (int)CurrentUser::get()->getId();
		if ($userId <= 0)
		{
			return [];
		}

		$accessCodes = CollectionAccessService::buildUserAccessCodes($userId);
		if (empty($accessCodes))
		{
			return [];
		}

		$levels = CollectionAccessService::batchGetUserLevels($ids, $accessCodes);

		$allowed = [];
		foreach ($levels as $cid => $level)
		{
			if ((int)$level >= CollectionAccessService::LEVEL_MANAGE)
			{
				$allowed[] = (int)$cid;
			}
		}

		return $allowed;
	}

	/**
	 * Non-admin only — admin paths skip this and query CollectionTable directly with a LIMIT.
	 *
	 * @return int[]
	 */
	private function getManageAccessibleCollectionIds(): array
	{
		$userId = (int)CurrentUser::get()->getId();
		if ($userId <= 0)
		{
			return [];
		}

		$accessCodes = CollectionAccessService::buildUserAccessCodes($userId);
		if (empty($accessCodes))
		{
			return [];
		}

		$levels = CollectionAccessService::getAllUserLevels($accessCodes);
		$effective = $levels['effective'] ?? [];

		$ids = [];
		foreach ($effective as $cid => $level)
		{
			if ((int)$level >= CollectionAccessService::LEVEL_MANAGE)
			{
				$ids[] = (int)$cid;
			}
		}

		return $ids;
	}
}
