<?php

namespace Bitrix\Im\V2;

use Bitrix\Im\Model\RelationTable;
use Bitrix\Im\V2\Chat\OpenLineLiveChat;
use Bitrix\Im\V2\Entity\User\UserCollection;
use Bitrix\Im\V2\Entity\User\UserPopupItem;
use Bitrix\Im\V2\Rest\PopupData;
use Bitrix\Im\V2\Rest\PopupDataAggregatable;
use Bitrix\Im\V2\Rest\RestConvertible;
use Bitrix\Im\V2\Service\Context;
use Bitrix\Main\ORM\Query\Query;
use Bitrix\Main\UserTable;

/**
 * @implements \IteratorAggregate<int,Relation>
 * @implements Registry<Relation>
 * @method Relation offsetGet($key)
 */
class RelationCollection extends Collection implements RestConvertible, PopupDataAggregatable
{
	public const COMMON_FIELDS = [
		'ID',
		'MESSAGE_TYPE',
		'CHAT_ID',
		'USER_ID',
		'START_ID',
		'LAST_FILE_ID',
		'LAST_ID',
		'LAST_SEND_MESSAGE_ID',
		'UNREAD_ID',
		'NOTIFY_BLOCK',
		'MANAGER',
		'REASON',
		'IS_HIDDEN',
	];

	protected static array $startIdStaticCache = [];

	protected array $relationsByUserId = [];
	protected ?self $activeOnly = null;
	protected ?self $notifyOnly = null;

	public static function getCollectionElementClass(): string
	{
		return Relation::class;
	}

	public static function find(
		array $filter,
		array $order = [],
		?int $limit = null,
		?Context $context = null,
		array $select = self::COMMON_FIELDS
	): self
	{
		$query = RelationTable::query()->setSelect($select);

		if (isset($limit))
		{
			$query->setLimit($limit);
		}

		static::processFilters($query, $filter, $order);

		return new static($query->fetchAll());
	}

	public function toRestFormat(array $option = []): ?array
	{
		$rest = [];
		foreach ($this as $relation)
		{
			$rest[] = $relation->toRestFormat($option);
		}

		return $rest;
	}

	public static function getRestEntityName(): string
	{
		return 'relations';
	}

	public function getPopupData(array $excludedList = []): PopupData
	{
		return new PopupData([new UserPopupItem($this->getUserIds())], $excludedList);
	}

	public static function createFake(array $userIds, Chat $chat): self
	{
		$relations = new static();

		foreach ($userIds as $userId)
		{
			$relation = new Relation();
			$relation
				->setId(0)
				->setUserId($userId)
				->setChatId($chat->getId())
				->setMessageType($chat->getType())
				->setNotifyBlock(false)
				->markAsFake()
			;
			$relations->add($relation);
		}

		return $relations;
	}

	public static function getStartId(int $userId, int $chatId): int
	{
		if (isset(self::$startIdStaticCache[$chatId][$userId]))
		{
			return self::$startIdStaticCache[$chatId][$userId];
		}

		$relation = static::find(['CHAT_ID' => $chatId, 'USER_ID' => $userId], [], 1)->getByUserId($userId, $chatId);

		if ($relation === null)
		{
			return 0;
		}

		return $relation->getStartId() ?? 0;
	}

	public function getByUserId(int $userId, int $chatId): ?Relation
	{
		return $this->relationsByUserId[$chatId][$userId] ?? null;
	}

	public function filterActive(): self
	{
		if (isset($this->activeOnly))
		{
			return $this->activeOnly;
		}

		$this->activeOnly = new static();

		foreach ($this as $relation)
		{
			$isLiveChat = $relation->getChat() instanceof OpenLineLiveChat;
			if ($relation->getUser()->isActive() && ($isLiveChat || !$relation->getUser()->isConnector()))
			{
				$this->activeOnly->add($relation);
			}
		}

		return $this->activeOnly;
	}

	public function filterNotifySubscribed(): self
	{
		if (isset($this->notifyOnly))
		{
			return $this->notifyOnly;
		}

		$this->notifyOnly = new static();

		foreach ($this as $relation)
		{
			if (!($relation->getNotifyBlock() ?? false))
			{
				$this->notifyOnly->add($relation);
			}
		}

		return $this->notifyOnly;
	}

	public function hasUser(int $userId, int $chatId): bool
	{
		return isset($this->relationsByUserId[$chatId][$userId]);
	}

	public function getUserIds(): array
	{
		$userIds = [];
		foreach ($this as $relation)
		{
			$userIds[$relation->getUserId()] = $relation->getUserId();
		}

		return $userIds;
	}


	public function getUsers(): UserCollection
	{
		return new UserCollection($this->getUserIds());
	}

	protected static function processFilters(Query $query, array $filter, array $order): void
	{
		$orderField = null;
		$relationOrder = [];

		if (isset($filter['CHAT_ID']))
		{
			$query->where('CHAT_ID', (int)$filter['CHAT_ID']);
		}

		if (isset($filter['MANAGER']))
		{
			$query->where('MANAGER', (string)$filter['MANAGER']);
		}

		if (isset($filter['USER_ID']))
		{
			if (is_array($filter['USER_ID']) && !empty($filter['USER_ID']))
			{
				$query->whereIn('USER_ID', $filter['USER_ID']);
			}
			else
			{
				$query->where('USER_ID', (int)$filter['USER_ID']);
			}
		}

		if (isset($filter['!USER_ID']))
		{
			if (is_array($filter['!USER_ID']) && !empty($filter['!USER_ID']))
			{
				$query->whereNotIn('USER_ID', $filter['!USER_ID']);
			}
			else
			{
				$query->whereNot('USER_ID', (int)$filter['!USER_ID']);
			}
		}

		if (isset($filter['MESSAGE_TYPE']))
		{
			$query->where('MESSAGE_TYPE', (string)$filter['MESSAGE_TYPE']);
		}

		foreach (['ID', 'USER_ID', 'LAST_SEND_MESSAGE_ID'] as $allowedFieldToOrder)
		{
			if (isset($order[$allowedFieldToOrder]))
			{
				$orderField = $allowedFieldToOrder;
				$relationOrder[$allowedFieldToOrder] = $order[$allowedFieldToOrder];
				break;
			}
		}

		if (isset($orderField))
		{
			$query->setOrder($relationOrder);
		}

		if (isset($filter['LAST_ID']))
		{
			$operator = '<';
			if (isset($orderField) && $relationOrder[$orderField] === 'ASC')
			{
				$operator = '>';
			}
			$query->where($orderField, $operator, (int)$filter['LAST_ID']);
		}

		if (isset($filter['ACTIVE']))
		{
			$query->where('USER.ACTIVE', $filter['ACTIVE']);
		}

		if (isset($filter['ONLY_INTERNAL_TYPE']) && $filter['ONLY_INTERNAL_TYPE'])
		{
			$query->where(
				Query::filter()
					->logic('or')
					->whereNotIn('USER.EXTERNAL_AUTH_ID', UserTable::getExternalUserTypes())
					->whereNull('USER.EXTERNAL_AUTH_ID')
			);
		}

		if (isset($filter['ONLY_INTRANET']) && $filter['ONLY_INTRANET'])
		{
			if (\Bitrix\Main\Loader::includeModule('extranet'))
			{
				$query->where('USER.IS_INTRANET_USER', true);
			}
		}

		if (isset($filter['REASON']))
		{
			$query->where('REASON', (string)$filter['REASON']);
		}

		if (isset($filter['IS_HIDDEN']))
		{
			$query->where('IS_HIDDEN', $filter['IS_HIDDEN']);
		}
	}

	public function offsetSet($key, $value): void
	{
		/** @var Relation $value */
		parent::offsetSet($key, $value);

		if ($value->getUserId() !== null && $value->getChatId() !== null)
		{
			$this->relationsByUserId[$value->getChatId()][$value->getUserId()] = $value;
			if ($value->getStartId() !== null)
			{
				static::$startIdStaticCache[$value->getChatId()][$value->getUserId()] = $value->getStartId();
			}
		}

		$this->activeOnly = null;
		$this->notifyOnly = null;
	}

	public function offsetUnset(mixed $key)
	{
		/** @var Relation|null $value */
		$value = $this[$key] ?? null;
		if ($value)
		{
			unset($this->relationsByUserId[$value->getChatId()][$value->getUserId()]);
			unset(static::$startIdStaticCache[$value->getChatId()][$value->getUserId()]);
		}
		parent::offsetUnset($key);

		$this->activeOnly = null;
		$this->notifyOnly = null;
	}

	public function onAfterRelationDelete(int $chatId, int $userId): void
	{
		unset($this->relationsByUserId[$chatId][$userId]);
		unset(self::$startIdStaticCache[$chatId][$userId]);
	}
}
