<?php

declare(strict_types=1);

namespace Bitrix\Tasks\V2\Internals\Control\Task\Action\Add;

use Bitrix\Tasks\Control\Favorite;
use Bitrix\Tasks\V2\Internals\Control\Task\Action\Add\Trait\ConfigTrait;

class AddFavorite
{
	use ConfigTrait;

	public function __invoke(array $fields): void
	{
		$taskId = $fields['ID'];

		if (!array_key_exists('PARENT_ID', $fields))
		{
			return;
		}

		$favorite = new Favorite($this->config->getUserId());

		if (!$favorite->isInFavorite((int)$fields['PARENT_ID']))
		{
			return;
		}

		$favorite->add($taskId);
	}
}