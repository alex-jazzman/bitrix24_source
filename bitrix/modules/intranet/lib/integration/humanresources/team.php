<?php

namespace Bitrix\Intranet\Integration\HumanResources;

use Bitrix\HumanResources\Item\Collection;
use Bitrix\HumanResources\Type\NodeEntityType;
use Bitrix\Main;

class Team
{
	private bool $available;

	public function __construct()
	{
		$this->available = Main\Loader::includeModule('humanresources');
	}

	public function getAllByUserId(int $userId): ?Collection\NodeCollection
	{
		if (!$this->available)
		{
			return null;
		}

		// @todo temporary, will be redone
		return \Bitrix\HumanResources\Service\Container::getNodeRepository(true)
			->setSelectableNodeEntityTypes([
				NodeEntityType::TEAM,
			])
			->findAllByUserId($userId)
		;
	}
}
