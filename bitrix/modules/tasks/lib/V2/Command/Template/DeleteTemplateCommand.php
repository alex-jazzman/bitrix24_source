<?php

declare(strict_types=1);

namespace Bitrix\Tasks\V2\Command\Template;

use Bitrix\Main\Error;
use Bitrix\Tasks\Control\Exception\TemplateNotFoundException;
use Bitrix\Tasks\V2\Internals\Container;
use Bitrix\Tasks\V2\Result;
use Bitrix\Tasks\V2\Command\AbstractCommand;

class DeleteTemplateCommand extends AbstractCommand
{
	public function __construct(
		public readonly int $templateId,
		public readonly int $deletedBy,
	)
	{

	}

	protected function execute(): Result
	{
		try
		{
			$handler = new DeleteTemplateHandler(Container::getInstance()->getTemplateRepository());

			$handler($this);

			return new Result();
		}
		catch (TemplateNotFoundException $taskException)
		{
			return (new Result())->addError(new Error('Failed deleting template.'));
		}
	}
}
