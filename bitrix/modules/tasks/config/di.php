<?php

use Bitrix\Tasks\Deadline\Internals\Repository\Cache\Managed\CacheDeadlineUserOptionRepository;
use Bitrix\Tasks\Deadline\Internals\Repository\DeadlineUserOptionRepositoryInterface;
use Bitrix\Tasks\Onboarding\Promo\Repository\Cache\CacheInviteToMobileRepository;
use Bitrix\Tasks\Onboarding\Promo\Repository\InviteToMobileRepositoryInterface;
use Bitrix\Tasks\V2\Internals\Consistency\ConfigConsistencyResolver;
use Bitrix\Tasks\V2\Internals\Consistency\ConsistencyResolverInterface;
use Bitrix\Tasks\V2\Internals\Repository\CheckListRepository;
use Bitrix\Tasks\V2\Internals\Repository\CheckListRepositoryInterface;
use Bitrix\Tasks\V2\Internals\Repository\DiskFileRepositoryInterface;
use Bitrix\Tasks\V2\Internals\Repository\ElapsedTimeRepository;
use Bitrix\Tasks\V2\Internals\Repository\ElapsedTimeRepositoryInterface;
use Bitrix\Tasks\V2\Internals\Repository\FavoriteTaskRepository;
use Bitrix\Tasks\V2\Internals\Repository\FavoriteTaskRepositoryInterface;
use Bitrix\Tasks\V2\Internals\Repository\FileRepositoryInterface;
use Bitrix\Tasks\V2\Internals\Repository\InMemoryDiskFileRepository;
use Bitrix\Tasks\V2\Internals\Repository\InMemoryFileRepository;
use Bitrix\Tasks\V2\Internals\Repository\InMemoryFlowRepository;
use Bitrix\Tasks\V2\Internals\Repository\FlowRepositoryInterface;
use Bitrix\Tasks\V2\Internals\Repository\GroupRepositoryInterface;
use Bitrix\Tasks\V2\Internals\Repository\ChatRepositoryInterface;
use Bitrix\Tasks\V2\Internals\Repository\InMemoryChatRepository;
use Bitrix\Tasks\V2\Internals\Repository\InMemoryGroupRepository;
use Bitrix\Tasks\V2\Internals\Repository\InMemoryStageRepository;
use Bitrix\Tasks\V2\Internals\Repository\InMemoryUserOptionRepository;
use Bitrix\Tasks\V2\Internals\Repository\InMemoryTaskRepository;
use Bitrix\Tasks\V2\Internals\Repository\InMemoryUserRepository;
use Bitrix\Tasks\V2\Internals\Repository\TimerRepositoryInterface;
use Bitrix\Tasks\V2\Internals\Repository\PlannerRepository;
use Bitrix\Tasks\V2\Internals\Repository\PlannerRepositoryInterface;
use Bitrix\Tasks\V2\Internals\Repository\StageRepositoryInterface;
use Bitrix\Tasks\V2\Internals\Repository\TaskLogRepositoryInterface;
use Bitrix\Tasks\V2\Internals\Repository\TaskLogRepository;
use Bitrix\Tasks\V2\Internals\Repository\TaskMemberRepository;
use Bitrix\Tasks\V2\Internals\Repository\TaskMemberRepositoryInterface;
use Bitrix\Tasks\V2\Internals\Repository\TaskRepositoryInterface;
use Bitrix\Tasks\V2\Internals\Repository\TemplateRepositoryInterface;
use Bitrix\Tasks\V2\Internals\Repository\InMemoryTemplateRepository;
use Bitrix\Tasks\V2\Internals\Repository\TimerRepository;
use Bitrix\Tasks\V2\Internals\Repository\UserOptionRepositoryInterface;
use Bitrix\Tasks\V2\Internals\Repository\UserRepositoryInterface;
use Bitrix\Tasks\V2\Internals\Repository\ViewRepository;
use Bitrix\Tasks\V2\Internals\Repository\ViewRepositoryInterface;
use Bitrix\Tasks\V2\Internals\Service\Esg\EgressInterface;
use Bitrix\Tasks\V2\Internals\Service\Esg\EgressController;
use Bitrix\Tasks\V2\Internals\Repository\TaskResultRepositoryInterface;
use Bitrix\Tasks\V2\Internals\Repository\TaskResultRepository;

return [
	'value' => [
		FileRepositoryInterface::class => InMemoryFileRepository::class,
		GroupRepositoryInterface::class => InMemoryGroupRepository::class,
		TaskRepositoryInterface::class => InMemoryTaskRepository::class,
		StageRepositoryInterface::class => InMemoryStageRepository::class,
		TemplateRepositoryInterface::class => InMemoryTemplateRepository::class,
		FlowRepositoryInterface::class => InMemoryFlowRepository::class,
		CheckListRepositoryInterface::class => CheckListRepository::class,
		UserRepositoryInterface::class => InMemoryUserRepository::class,
		EgressInterface::class => EgressController::class,
		ChatRepositoryInterface::class => InMemoryChatRepository::class,
		DiskFileRepositoryInterface::class => InMemoryDiskFileRepository::class,
		TaskResultRepositoryInterface::class => TaskResultRepository::class,
		TaskLogRepositoryInterface::class => TaskLogRepository::class,
		ConsistencyResolverInterface::class => ConfigConsistencyResolver::class,
		FavoriteTaskRepositoryInterface::class => FavoriteTaskRepository::class,
		TaskMemberRepositoryInterface::class => TaskMemberRepository::class,
		UserOptionRepositoryInterface::class => InMemoryUserOptionRepository::class,
		DeadlineUserOptionRepositoryInterface::class => CacheDeadlineUserOptionRepository::class,
		TimerRepositoryInterface::class => TimerRepository::class,
		PlannerRepositoryInterface::class => PlannerRepository::class,
		ElapsedTimeRepositoryInterface::class => ElapsedTimeRepository::class,
		InviteToMobileRepositoryInterface::class => CacheInviteToMobileRepository::class,
		ViewRepositoryInterface::class => ViewRepository::class,
	],
];