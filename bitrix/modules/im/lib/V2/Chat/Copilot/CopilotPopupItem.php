<?php

namespace Bitrix\Im\V2\Chat\Copilot;

use Bitrix\Im\V2\Integration\AI\AIHelper;
use Bitrix\Im\V2\Integration\AI\RoleManager;
use Bitrix\Im\V2\Rest\PopupDataItem;

class CopilotPopupItem implements PopupDataItem
{
	/**
	 * @var string[]
	 */
	private array $roleCodes;
	private array $messages = [];
	private array $chats = [];
	private Entity $entity;

	public function __construct(array $copilotRoles, Entity $entity)
	{
		$this->entity = $entity;
		$this->roleCodes = array_unique($copilotRoles);

		if ($entity === Entity::Chats)
		{
			$this->chats = $copilotRoles;
		}
		if ($entity === Entity::Messages)
		{
			$this->messages = $copilotRoles;
		}
	}

	public function merge(PopupDataItem $item): self
	{
		if ($item instanceof self)
		{
			$this->roleCodes = array_unique(array_merge($this->roleCodes, $item->roleCodes));

			if ($item->entity === Entity::Chats)
			{
				$this->chats += $item->chats;
			}
			if ($item->entity === Entity::Messages)
			{
				$this->messages += $item->messages;
			}
		}

		return $this;
	}

	public static function getRestEntityName(): string
	{
		return 'copilot';
	}

	public function toRestFormat(array $option = []): ?array
	{
		if (empty($this->roleCodes))
		{
			return null;
		}

		return [
			'chats' => !empty($this->chats) ? self::convertArrayData($this->chats, Entity::Chats) : null,
			'messages' => !empty($this->messages)
				? self::convertArrayData($this->messages, Entity::Messages)
				: null,
			'aiProvider' => AIHelper::getProviderName(),
			'roles' => (new RoleManager())->getRoles(array_values($this->roleCodes)),
		];
	}

	public static function convertArrayData(array $data, Entity $entity): array
	{
		$result = [];

		foreach ($data as $id => $item)
		{
			if ($entity === Entity::Chats)
			{
				$result[] = ['dialogId' => $id, 'role' => $item];
			}
			elseif ($entity === Entity::Messages)
			{
				$result[] = ['id' => $id, 'role' => $item];
			}
		}

		return $result;
	}
}
