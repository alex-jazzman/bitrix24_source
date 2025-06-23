<?php

declare(strict_types=1);

namespace Bitrix\Tasks\V2\Controller;

use Bitrix\Main\Engine\AutoWire\ExactParameter;
use Bitrix\Main\Engine\CurrentUser;
use Bitrix\Main\Engine\JsonController;
use Bitrix\Tasks\V2\Access\Service\TaskRightService;
use Bitrix\Tasks\V2\Controller\Filter\IsEnabledFilter;
use Bitrix\Tasks\V2\Controller\Trait\AttributeAccessTrait;
use Bitrix\Tasks\V2\Controller\Trait\AttributeAutowireTrait;
use Bitrix\Tasks\V2\Controller\Trait\AttributePrefilterTrait;
use Bitrix\Tasks\V2\Entity\EntityInterface;
use Bitrix\Tasks\V2\Internals\Context\Context;
use Bitrix\Tasks\V2\Internals\Context\ContextTrait;
use Bitrix\Tasks\V2\Entity;
use Bitrix\Tasks\V2\Internals\Repository\DiskFileRepositoryInterface;
use Bitrix\Tasks\V2\Internals\Repository\CheckListRepositoryInterface;
use Bitrix\Tasks\V2\Internals\Repository\FlowRepositoryInterface;
use Bitrix\Tasks\V2\Internals\Repository\GroupRepositoryInterface;
use Bitrix\Tasks\V2\Internals\Repository\StageRepositoryInterface;
use Bitrix\Tasks\V2\Internals\Repository\TaskLogRepositoryInterface;
use Bitrix\Tasks\V2\Internals\Repository\TaskRepositoryInterface;
use Bitrix\Tasks\V2\Internals\Repository\TemplateRepositoryInterface;
use Bitrix\Tasks\V2\Internals\Repository\UserRepositoryInterface;
use Bitrix\Tasks\V2\Internals\Service\Link\LinkService;
use Bitrix\Tasks\V2\Provider\TaskProvider;
use Bitrix\Tasks\V2\Provider\TaskResultProvider;

abstract class BaseController extends JsonController
{
	use AttributeAccessTrait;
	use ContextTrait;
	use AttributePrefilterTrait;
	use AttributeAutowireTrait;

	public function getAutoWiredParameters(): array
	{
		return [
			new ExactParameter(
				Entity\Task::class,
				'task',
				function (string $className, array $task): ?EntityInterface
				{
					return $this->getWithAccess($this, 'task', Entity\Task::mapFromArray($task));
				}
			),
			new ExactParameter(
				Entity\Template::class,
				'template',
				function (string $className, array $template): ?EntityInterface
				{
					return $this->getWithAccess($this, 'template', Entity\Template::mapFromArray($template));
				}
			),
			new ExactParameter(
				Entity\Group::class,
				'group',
				function (string $className, array $group)
				{
					return $this->getWithAccess($this, 'group', Entity\Group::mapFromArray($group));
				}
			),
			new ExactParameter(
				Entity\Flow::class,
				'flow',
				function (string $className, array $flow)
				{
					return $this->getWithAccess($this, 'flow', Entity\Flow::mapFromArray($flow));
				}
			),
			new ExactParameter(
				Entity\Result::class,
				'result',
				function (string $className, array $result)
				{
					return $this->getWithAccess($this, 'result', Entity\Result::mapFromArray($result));
				}
			),
			$this->getInjectionParameter(TaskRepositoryInterface::class),
			$this->getInjectionParameter(TemplateRepositoryInterface::class),
			$this->getInjectionParameter(StageRepositoryInterface::class),
			$this->getInjectionParameter(CheckListRepositoryInterface::class),
			$this->getInjectionParameter(TaskLogRepositoryInterface::class),
			$this->getInjectionParameter(TaskProvider::class),
			$this->getInjectionParameter(GroupRepositoryInterface::class),
			$this->getInjectionParameter(FlowRepositoryInterface::class),
			$this->getInjectionParameter(UserRepositoryInterface::class),
			$this->getInjectionParameter(DiskFileRepositoryInterface::class),
			$this->getInjectionParameter(TaskResultProvider::class),
			$this->getInjectionParameter(LinkService::class),
			$this->getInjectionParameter(TaskRightService::class),
		];
	}

	public function configureActions(): array
	{
		return $this->configureActionsViaAttributes($this);
	}

	public function getDefaultPreFilters(): array
	{
		return array_merge(parent::getDefaultPreFilters(), [new IsEnabledFilter()]);
	}

	protected function init(): void
	{
		$this->setContext(
			context: (new Context((int)CurrentUser::get()->getId())),
		);

		parent::init();
	}
}
