<?php

declare(strict_types=1);

namespace Bitrix\Tasks\V2\Entity;

use Bitrix\Tasks\V2\Entity\CheckList\CheckListItem;

class CheckList extends AbstractEntityCollection
{
	protected static function getEntityClass(): string
	{
		return CheckListItem::class;
	}
}