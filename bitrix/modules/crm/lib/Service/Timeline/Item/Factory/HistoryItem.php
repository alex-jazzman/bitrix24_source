<?php

namespace Bitrix\Crm\Service\Timeline\Item\Factory;

use Bitrix\Crm\Service\Container;
use Bitrix\Crm\Service\Timeline\Context;
use Bitrix\Crm\Service\Timeline\Item;
use Bitrix\Crm\Service\Timeline\Item\Model;
use Bitrix\Crm\Settings\Crm;
use Bitrix\Crm\Timeline\LogMessageType;
use Bitrix\Crm\Timeline\ProductCompilationType;
use Bitrix\Crm\Timeline\OrderCategoryType;
use Bitrix\Crm\Timeline\TimelineType;
use CCrmOwnerType;

class HistoryItem
{
	/**
	 * Create timeline item for history stream
	 *
	 * @param Context $context
	 * @param array $rawData
	 * @return Item
	 */
	public static function createItem(Context $context, array $rawData): Item
	{
		$assocEntityTypeId = (int)($rawData['ASSOCIATED_ENTITY_TYPE_ID'] ?? 0);
		$typeId = (int)($rawData['TYPE_ID'] ?? 0);
		$typeCategoryId = (int)($rawData['TYPE_CATEGORY_ID'] ?? LogMessageType::UNDEFINED);

		$model = Model::createFromArray($rawData);
		$model->setIsFixed($rawData['IS_FIXED'] === 'Y');

		if ($typeId === TimelineType::ACTIVITY && $assocEntityTypeId === CCrmOwnerType::Activity)
		{
			$activityTypeId = (int)($rawData['ASSOCIATED_ENTITY']['TYPE_ID'] ?? 0);
			$activityProviderId = (string)($rawData['ASSOCIATED_ENTITY']['PROVIDER_ID'] ?? '');

			$item = Container::getInstance()->getTimelineActivityItemFactory()::create($activityTypeId, $activityProviderId, $context, $model);
			if ($item)
			{
				return $item;
			}
		}

		if ($typeId === TimelineType::CREATION)
		{
			return new Item\LogMessage\Creation($context, $model);
		}

		if ($typeId === TimelineType::MODIFICATION)
		{
			return new Item\LogMessage\Modification($context, $model);
		}

		if ($typeId === TimelineType::LINK)
		{
			return new Item\LogMessage\Binding\Link($context, $model);
		}

		if ($typeId === TimelineType::UNLINK)
		{
			return new Item\LogMessage\Binding\Unlink($context, $model);
		}

		if ($typeId === TimelineType::SIGN_DOCUMENT && Item\SignDocument::isActive())
		{
			return new Item\SignDocument($context, $model);
		}

		if ($typeId === TimelineType::SIGN_DOCUMENT_LOG && Item\LogMessage\SignDocument::isActive())
		{
			return new Item\LogMessage\SignDocument($context, $model);
		}

		if ($typeId === TimelineType::LOG_MESSAGE)
		{
			switch ($typeCategoryId)
			{
				case LogMessageType::CALL_INCOMING:
					return new Item\LogMessage\CallIncoming($context, $model);
				case LogMessageType::OPEN_LINE_INCOMING:
					return new Item\LogMessage\OpenLineIncoming($context, $model);
				case LogMessageType::TODO_CREATED:
					return new Item\LogMessage\TodoCreated($context, $model);
				case LogMessageType::PING:
					return new Item\LogMessage\Ping($context, $model);
			}
		}

		if ($typeId === TimelineType::PRODUCT_COMPILATION)
		{
			switch ($typeCategoryId)
			{
				case ProductCompilationType::PRODUCT_LIST:
					return new Item\ProductCompilationSentToCustomer($context, $model);
				case ProductCompilationType::ORDER_EXISTS:
					return new Item\LogMessage\ProductCompilationOrderExists($context, $model);
				case ProductCompilationType::COMPILATION_VIEWED:
					return new Item\LogMessage\ProductCompilationViewed($context, $model);
				case ProductCompilationType::COMPILATION_NOT_VIEWED:
					return new Item\LogMessage\ProductCompilationNotViewed($context, $model);
				case ProductCompilationType::NEW_DEAL_CREATED:
					return new Item\LogMessage\ProductCompilationNewDealCreated($context, $model);
			}
		}

		if ($typeId === TimelineType::DOCUMENT && Crm::isUniversalActivityScenarioEnabled())
		{
			if ($typeCategoryId === TimelineType::MODIFICATION && Item\LogMessage\DocumentViewed::isActive())
			{
				return new Item\LogMessage\DocumentViewed($context, $model);
			}

			if (Item\Document::isActive())
			{
				return new Item\Document($context, $model);
			}

			return new Item\NotAvailable($context, $model);
		}

		if ($typeId === TimelineType::ORDER)
		{
			if ($typeCategoryId === OrderCategoryType::ENCOURAGE_BUY_PRODUCTS)
			{
				return new Item\Order\EncourageBuyProducts($context, $model);
			}
		}

		if (in_array($typeId, [TimelineType::FINAL_SUMMARY, TimelineType::FINAL_SUMMARY_DOCUMENTS], true))
		{
			if ($typeCategoryId === TimelineType::CREATION)
			{
				return new Item\FinalSummary($context, $model);
			}
		}

		if ($typeId === TimelineType::ORDER_CHECK)
		{
			if ($typeCategoryId === TimelineType::MARK)
			{
				return new Item\LogMessage\OrderCheckSent($context, $model);
			}
			else
			{
				if ($model->getAssociatedEntityId())
				{
					if ($model->getHistoryItemModel()->get('PRINTED') === 'Y')
					{
						return new Item\OrderCheckPrinted($context, $model);
					}

					return new Item\OrderCheckNotPrinted($context, $model);
				}
				else
				{
					return new Item\LogMessage\OrderCheckCreationError($context, $model);
				}
			}
		}

		if ($typeId === TimelineType::STORE_DOCUMENT)
		{
			$item = HistoryItemStoreDocument::createItem($context, $model);
			if ($item)
			{
				return $item;
			}
		}

		return new Item\Compatible\HistoryItem(
			$context,
			(new Item\Compatible\Model())
				->setData($rawData)
				->setId((int)$rawData['ID'])
				->setIsFixed($rawData['IS_FIXED'] === 'Y')
		);
	}

	/**
	 * Create empty item for deletion pull event
	 *
	 * @param Context $context
	 * @param int $id
	 * @return Item
	 */
	public static function createEmptyItem(Context $context, int $id): Item
	{
		$model = Model::createFromArray(['ID' => $id]);

		return new class($context, $model) extends Item
		{
			public function jsonSerialize()
			{
				return null;
			}

			public function getSort(): array
			{
				return [];
			}
		};
	}
}
