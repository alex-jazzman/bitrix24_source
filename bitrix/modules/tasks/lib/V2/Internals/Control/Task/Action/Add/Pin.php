<?php

declare(strict_types=1);


namespace Bitrix\Tasks\V2\Internals\Control\Task\Action\Add;

use Bitrix\Tasks\V2\Internals\Control\Task\Action\Add\Trait\ConfigTrait;
use Bitrix\Tasks\V2\Internals\Control\Task\Trait\PinTrait;

class Pin
{
	use ConfigTrait;
	use PinTrait;

	public function __invoke(array $fullTaskData): void
	{
		$this->pin($fullTaskData);
	}
}