<?php

declare(strict_types=1);

namespace Bitrix\Tasks\V2\Command\Task\Favorite;

use Bitrix\Main\Error;
use Bitrix\Main\Validation\Rule\PositiveNumber;
use Bitrix\Tasks\V2\Command\AbstractCommand;
use Bitrix\Tasks\V2\Internals\Container;
use Bitrix\Tasks\V2\Internals\Exception\Task\TaskFavoriteException;
use Bitrix\Tasks\V2\Result;

class ToggleFavoriteCommand extends AbstractCommand
{
	public function __construct(
		#[PositiveNumber]
		public readonly int $taskId,
		#[PositiveNumber]
		public readonly int $userId,
		public readonly bool $notifyLivefeed = true,
	)
	{

	}

	protected function execute(): Result
	{
		$favoriteTaskRepository = Container::getInstance()->getFavoriteTaskRepository();
		$favoriteService = Container::getInstance()->getFavoriteService();

		$handler = new ToggleFavoriteHandler(
			$favoriteTaskRepository,
			$favoriteService
		);

		$result = new Result();

		try
		{
			$isFavorite = $handler($this);

			return $result->setData(['isFavorite' => $isFavorite]);
		}
		catch (TaskFavoriteException $e)
		{
			return $result->addError(Error::createFromThrowable($e));
		}
	}
}