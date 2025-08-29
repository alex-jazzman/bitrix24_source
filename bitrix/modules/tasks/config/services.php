<?php

use Bitrix\Tasks\Control\Log\TaskLogService;
use Bitrix\Tasks\Flow\Control\Command\AddCommandHandler;
use Bitrix\Tasks\Flow\Control\Command\DeleteCommandHandler;
use Bitrix\Tasks\Flow\Control\Command\UpdateCommandHandler;
use Bitrix\Tasks\Flow\Control\FlowService;
use Bitrix\Tasks\Flow\Efficiency\EfficiencyService;
use Bitrix\Tasks\Flow\Integration\AI\Control\AdviceService;
use Bitrix\Tasks\Flow\Integration\AI\Control\CollectedDataService;
use Bitrix\Tasks\Flow\Integration\Socialnetwork\GroupService;
use Bitrix\Tasks\Flow\Kanban\BizProcService;
use Bitrix\Tasks\Flow\Kanban\KanbanService;
use Bitrix\Tasks\Flow\Provider\FlowMemberFacade;
use Bitrix\Tasks\Flow\Template\Access\Permission\TemplatePermissionService;
use Bitrix\Tasks\Internals\Registry\TaskRegistry;
use Bitrix\Tasks\Internals\UserOption\Service\AutoMuteService;
use Bitrix\Tasks\Replication\Replicator\RegularTemplateTaskReplicator;
use Bitrix\Tasks\V2\Internal\Access\Factory\ControllerFactory;
use Bitrix\Tasks\V2\Internal\Access\Factory\ControllerFactoryInterface;
use Bitrix\Tasks\V2\Internal\Service\Link\LinkBuilderFactory;

return [
	'value' => [
		// region flow
		'tasks.flow.member.facade' => [
			'className' => FlowMemberFacade::class,
		],
		'tasks.flow.command.addCommandHandler' => [
			'className' => AddCommandHandler::class,
		],
		'tasks.flow.command.updateCommandHandler' => [
			'className' => UpdateCommandHandler::class,
		],
		'tasks.flow.command.deleteCommandHandler' => [
			'className' => DeleteCommandHandler::class,
		],
		'tasks.flow.socialnetwork.project.service' => [
			'className' => GroupService::class,
		],
		'tasks.flow.kanban.service' => [
			'className' => KanbanService::class,
		],
		'tasks.flow.kanban.bizproc.service' => [
			'className' => BizProcService::class,
		],
		'tasks.flow.template.permission.service' => [
			'className' => TemplatePermissionService::class,
		],
		'tasks.flow.notification.service' => [
			'className' => \Bitrix\Tasks\Flow\Notification\NotificationService::class,
		],
		'tasks.flow.service' => [
			'className' => FlowService::class,
		],

		'tasks.flow.efficiency.service' => [
			'className' => EfficiencyService::class,
		],

		// region flow copilot
		'tasks.flow.copilot.collected.data.service' => [
			'className' => CollectedDataService::class,
		],

		'tasks.flow.copilot.advice.service' => [
			'className' => AdviceService::class,
		],
		// endregion
		// endregion

		// region task log
		'tasks.control.log.task.service' => [
			'className' => TaskLogService::class,
		],
		// endregion

		// region replicator
		'tasks.regular.replicator' => [
			'className' => RegularTemplateTaskReplicator::class,
		],
		// endregion

		// region task option
		'tasks.user.option.automute.service' => [
			'className' => AutoMuteService::class,
		],
		// endregion

		// region task access
		'tasks.access.controller.factory' => [
			'constructor' => static fn(): ControllerFactoryInterface => ControllerFactory::getInstance(),
		],
		// endregion
		// region task registry
		'tasks.task.registry' => [
			'constructor' => static fn(): TaskRegistry => TaskRegistry::getInstance(),
		],
		// endregion
	],
];