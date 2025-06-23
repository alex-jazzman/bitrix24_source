<?php

declare(strict_types=1);

namespace Bitrix\Tasks\V2\Command\Template;

use Bitrix\Main\Error;
use Bitrix\Main\Validation\Rule\Recursive\Validatable;
use Bitrix\Tasks\Control\Exception\TemplateAddException;
use Bitrix\Tasks\V2\Internals\Container;
use Bitrix\Tasks\V2\Result;
use Bitrix\Tasks\V2\Command\AbstractCommand;
use Bitrix\Tasks\V2\Entity;

class AddTemplateCommand extends AbstractCommand
{
	public function __construct(
		#[Validatable]
		public readonly Entity\Template $template,
		public readonly int $createdBy,
	)
	{

	}

	protected function execute(): Result
	{
		try
		{
			$handler = new AddTemplateHandler(Container::getInstance()->getTemplateRepository());

			return (new Result())->setObject($handler($this));
		}
		catch (TemplateAddException $e)
		{
			return (new Result())->addError(new Error('Failed creating template'));
		}
	}
}
