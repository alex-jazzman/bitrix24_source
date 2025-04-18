<?php

namespace Bitrix\Crm\Controller;

use Bitrix\Crm;
use Bitrix\Crm\Order\Order;
use Bitrix\Crm\Service\Container;
use Bitrix\Crm\UI\EntitySelector;
use Bitrix\Main;
use Bitrix\UI\EntitySelector\Dialog;

class Entity extends Main\Engine\Controller
{
	public const ITEMS_LIMIT = 20;

	public function configureActions()
	{
		return [
			'search' => [
				'class' => Crm\Controller\Action\Entity\SearchAction::class,
				'+prefilters' => [new Main\Engine\ActionFilter\CloseSession()]
			],
			'mergeBatch' => ['class' => Crm\Controller\Action\Entity\MergeBatchAction::class],
			'prepareMerge' => ['class' => Crm\Controller\Action\Entity\PrepareMergeAction::class],
			'processMerge' => ['class' => Crm\Controller\Action\Entity\ProcessMergeAction::class],
			'processMergeByMap' => ['class' => Crm\Controller\Action\Entity\ProcessMergeByMapAction::class],
			'prepareDeletion' => [
				'class' => Crm\Controller\Action\Entity\PrepareDeletionAction::class,
			],
			'cancelDeletion' => [
				'class' => Crm\Controller\Action\Entity\CancelDeletionAction::class,
			],
			'processDeletion' => [
				'class' => Crm\Controller\Action\Entity\ProcessDeletionAction::class,
			],
			'fetchPaymentDocuments' => [
				'class' => Crm\Controller\Action\Entity\FetchPaymentDocumentsAction::class,
				'+prefilters' => [new Main\Engine\ActionFilter\Authentication()]
			],
			'renderImageInput' => [
				'class' =>  Crm\Controller\Action\Entity\RenderImageInputAction::class,
			],
			'canChangeCurrency' => [
				'class' => Crm\Controller\Action\Entity\CanChangeCurrencyAction::class,
			],
			'processWhatsAppMessage' => [
				'class' => Crm\Controller\Action\Entity\ProcessWhatsAppMessageAction::class,
			],
			'prepareWhatsAppMessage' => [
				'class' => Crm\Controller\Action\Entity\PrepareWhatsAppMessageAction::class,
			],
		];
	}

	//region LRU
	/**
	 * Add items to LRU items.
	 * @param string $category Category name (it's used for saving user option).
	 * @param string $code Code (it's used for saving user option).
	 * @param array $items Source items.
	 */
	public static function addLastRecentlyUsedItems($category, $code, array $items)
	{
		$values = [];
		foreach($items as $item)
		{
			[$entityTypeId, $entityId, $categoryId, $isMyCompany] = self::expandItem($item);

			if(\CCrmOwnerType::IsDefined($entityTypeId) && $entityId > 0)
			{
				$values[] = self::getItemKey($entityTypeId, $entityId, $categoryId, $isMyCompany);
			}
		}

		$lastRecentlyUsed = self::getRecentlyUsedItems($category, $code, ['RAW_FORMAT' => true]);
		$values = array_unique(
			array_merge(
				$lastRecentlyUsed,
				array_values($values)
			)
		);

		$qty = count($values);
		if($qty > static::ITEMS_LIMIT)
		{
			$values = array_slice($values, $qty - static::ITEMS_LIMIT);
		}

		$newValues = array_diff($values, $lastRecentlyUsed);
		if (!empty($newValues))
		{
			static::saveRecentItemsInSelector($newValues);
		}

		\CUserOptions::SetOption($category, $code, $values);
	}

	private static function saveRecentItemsInSelector(array $rawItems): void
	{
		$items = [];
		$entities = [];

		foreach ($rawItems as $rawItem)
		{
			[$entityTypeId, $entityId] = explode(':', $rawItem);
			$entityTypeId = (int)$entityTypeId;
			$entityId = (int)$entityId;

			if (\CCrmOwnerType::IsDefined($entityTypeId) && $entityId > 0)
			{
				$entityName = \CCrmOwnerType::ResolveName($entityTypeId);

				$entities[$entityName] = ['id' => $entityName];
				$items[] = [
					'entityId' => $entityName,
					'id' => $entityId,
				];
			}
		}

		if (!empty($entities) && !empty($items))
		{
			$dialog = new Dialog([
				'context' => EntitySelector::CONTEXT,
				'entities' => array_values($entities),
			]);
			$dialog->saveRecentItems($items);
		}
	}

	/**
	 * Get LRU items.
	 *
	 * @param string $category Category name (it's used for saving user option).
	 * @param string $code Code (it's used for saving user option).
	 * @param array|null $options Options.
	 *
	 * @return array|bool
	 */
	public static function getRecentlyUsedItems($category, $code, array $options = null)
	{
		if (!is_array($options))
		{
			$options = [];
		}

		$values = \CUserOptions::GetOption($category, $code, []);
		if (!is_array($values))
		{
			$values = [];
		}

		if (isset($options['RAW_FORMAT']) && $options['RAW_FORMAT'] === true)
		{
			return $values;
		}

		$actualEntityTypeId = isset($options['EXPAND_ENTITY_TYPE_ID'])
			? (int)$options['EXPAND_ENTITY_TYPE_ID']
			: 0;
		$actualCategoryId = isset($options['EXPAND_CATEGORY_ID'])
			? (int)$options['EXPAND_CATEGORY_ID']
			: 0;
		$checkIsMyCompany = isset($options['CHECK_IS_MY_COMPANY']) && $options['CHECK_IS_MY_COMPANY'];

		$items = [];

		$permissions = Container::getInstance()->getUserPermissions();
		foreach ($values as $value)
		{
			if (!is_string($value))
			{
				continue;
			}

			$parts = explode(':', $value);
			if (count($parts) <= 1)
			{
				continue;
			}

			$storedEntityTypeId = (int)$parts[0];
			$storedCategoryId = isset($parts[2]) ? (int)$parts[2] : 0;
			$entityId = (int)$parts[1];
			$isMyCompany = isset($parts[3]) ? (int)$parts[3] : 0;

			if (
				$actualEntityTypeId !== $storedEntityTypeId
				|| $actualCategoryId !== $storedCategoryId
			)
			{
				continue;
			}

			if (!$permissions->item()->canRead($storedEntityTypeId, $entityId))
			{
				continue;
			}

			if ($checkIsMyCompany && !$isMyCompany)
			{
				continue;
			}

			$items[] = [
				'ENTITY_TYPE_ID' => $storedEntityTypeId,
				'ENTITY_ID' => $entityId,
				'CATEGORY_ID' => $storedCategoryId,
				'IS_MY_COMPANY' => $isMyCompany,
			];
		}

		$currentItems = $items;
		$qty = count($items);
		if ($qty < static::ITEMS_LIMIT && isset($options['EXPAND_ENTITY_TYPE_ID']))
		{

			self::expandItems(
				$items,
				(int)$options['EXPAND_ENTITY_TYPE_ID'],
				$actualCategoryId,
				static::ITEMS_LIMIT - $qty,
				$checkIsMyCompany,
			);

			$currentItemsHashes = array_map(fn ($item) => self::itemToStringKey($item), $currentItems);

			$newlyItems = array_filter($items, static function (array $item) use ($currentItemsHashes) {
				$itemHash = self::itemToStringKey($item);

				return !in_array($itemHash, $currentItemsHashes, true);
			});

			if (!empty($newlyItems))
			{
				self::addLastRecentlyUsedItems($category, $code, $items);
			}
		}

		return $items;
	}

	private static function itemToStringKey(array $item): string
	{
		[$entityTypeId, $entityId, $categoryId, $isMyCompany] = self::expandItem($item);

		return self::getItemKey($entityTypeId, $entityId, $categoryId, $isMyCompany);
	}

	/**
	 * Expand source items by recently created items of specified entity type.
	 *
	 * @param array $items Source items.
	 * @param int $entityTypeId Entity Type ID.
	 * @param int $categoryId Entity Type ID.
	 * @param int $limit Limit of new items.
	 */
	protected static function expandItems(
		array &$items,
		int $entityTypeId,
		int $categoryId,
		int $limit = self::ITEMS_LIMIT,
		bool $isMyCompany = false,
	): void
	{
		$map = [];
		foreach ($items as $item)
		{
			[$storedEntityTypeId, $storedEntityId, $storedCategoryId, $isMyCompany] = self::expandItem($item);

			if (
				 $storedEntityId <= 0
				|| $entityTypeId !== $storedEntityTypeId
				|| $categoryId !== $storedCategoryId
				|| !\CCrmOwnerType::IsDefined($storedEntityTypeId)
			)
			{
				continue;
			}

			$map[self::getItemKey($storedEntityTypeId, $storedEntityId, $storedCategoryId, $isMyCompany)] = $item;
		}

		$entityIDs = null;
		if($entityTypeId === \CCrmOwnerType::Lead)
		{
			$entityIDs = \CCrmLead::GetTopIDs($limit, 'DESC');
		}
		elseif($entityTypeId === \CCrmOwnerType::Contact)
		{
			$entityIDs = \CCrmContact::GetTopIDsInCategory($categoryId, $limit, 'DESC');
		}
		elseif($entityTypeId === \CCrmOwnerType::Company)
		{
			if ($isMyCompany)
			{
				$entityIDs = \CCrmCompany::GetTopIDsOfMyCompanies($limit, 'DESC');
			}
			else
			{
				$entityIDs = \CCrmCompany::GetTopIDsInCategory($categoryId, $limit, 'DESC');
			}
		}
		elseif($entityTypeId === \CCrmOwnerType::Deal)
		{
			$entityIDs = \CCrmDeal::GetTopIDs($limit, 'DESC');
		}
		elseif($entityTypeId === \CCrmOwnerType::Order)
		{
			$orders = Order::getList([
				'select' => ['ID'],
				'limit' => $limit
			])->fetchCollection();

			$entityIDs = $orders->getIdList();
		}
		elseif(\CCrmOwnerType::isUseFactoryBasedApproach($entityTypeId))
		{
			$factory = Container::getInstance()->getFactory($entityTypeId);
			if ($factory)
			{
				$list = $factory->getItemsFilteredByPermissions([
					'order' => ['ID' => 'DESC'],
					'limit' => $limit
				]);

				foreach ($list as $item)
				{
					$entityIDs[] = $item->getId();
				}
			}
		}

		if(!is_array($entityIDs))
		{
			return;
		}

		foreach($entityIDs as $entityId)
		{
			$key = self::getItemKey($entityTypeId, $entityId, $categoryId, (int)$isMyCompany);
			if(isset($map[$key]))
			{
				continue;
			}

			$map[$key] = [
				'ENTITY_TYPE_ID' => $entityTypeId,
				'ENTITY_ID' => (int)$entityId,
				'CATEGORY_ID' => $categoryId,
				'IS_MY_COMPANY' => (int)$isMyCompany,
			];
		}

		$items = array_values($map);
	}

	private static function getItemKey(
		string|int $entityTypeId,
		string|int $entityId,
		string|int $categoryId,
		int $isMyCompany = 0
	): string
	{
		return "{$entityTypeId}:{$entityId}:{$categoryId}:{$isMyCompany}";
	}

	private static function expandItem(mixed $item): array
	{
		$entityTypeId = isset($item['ENTITY_TYPE_ID']) ? (int)$item['ENTITY_TYPE_ID'] : 0;
		$entityId = isset($item['ENTITY_ID']) ? (int)$item['ENTITY_ID'] : 0;
		$categoryId = isset($item['CATEGORY_ID']) ? (int)$item['CATEGORY_ID'] : 0;
		$isMyCompany = isset($item['IS_MY_COMPANY']) && $item['IS_MY_COMPANY'];

		return [$entityTypeId, $entityId, $categoryId, $isMyCompany];
	}
	//endregion
}
