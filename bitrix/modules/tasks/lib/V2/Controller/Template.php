<?php

declare(strict_types=1);

namespace Bitrix\Tasks\V2\Controller;


use Bitrix\Main\Type\Contract\Arrayable;
use Bitrix\Tasks\V2\Command\Template\AddTemplateCommand;
use Bitrix\Tasks\V2\Command\Template\DeleteTemplateCommand;
use Bitrix\Tasks\V2\Command\Template\UpdateTemplateCommand;
use Bitrix\Tasks\V2\Entity;
use Bitrix\Tasks\V2\Access\Template\Permission;
use Bitrix\Tasks\V2\Internals\Repository\TemplateRepositoryInterface;

class Template extends BaseController
{
	/**
	 * @ajaxAction tasks.V2.Template.get
	 */
	#[Prefilter\CloseSession]
	public function getAction(
		#[Permission\Read] Entity\Template $template,
		TemplateRepositoryInterface $templateRepository,
	): ?Arrayable
	{
		return $templateRepository->getById($template->getId());
	}

	/**
	 * @restMethod tasks.V2.Template.add
	 */
	public function addAction(#[Permission\Add] Entity\Template $template): ?Arrayable
	{
		$result = (new AddTemplateCommand(template: $template, createdBy: $this->getContext()->getUserId()))->run();

		if (!$result->isSuccess())
		{
			$this->addErrors($result->getErrors());

			return null;
		}

		return $result->getObject();
	}

	/**
	 * @restMethod tasks.V2.Template.update
	 */
	public function updateAction(#[Permission\Update] Entity\Template $template): ?Arrayable
	{
		$result = (new UpdateTemplateCommand(template: $template, updatedBy: $this->getContext()->getUserId()))->run();

		if (!$result->isSuccess())
		{
			$this->addErrors($result->getErrors());

			return null;
		}

		return $result->getObject();
	}

	/**
	 * @restMethod tasks.V2.Template.delete
	 */
	public function deleteAction(#[Permission\Delete] Entity\Template $template): ?Arrayable
	{
		$result = (new DeleteTemplateCommand(templateId: $template->getId(), deletedBy: $this->getContext()->getUserId()))->run();

		if (!$result->isSuccess())
		{
			$this->addErrors($result->getErrors());

			return null;
		}

		return $result->getObject();
	}
}
