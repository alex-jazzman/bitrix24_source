<?php

use Bitrix\Timeman\V2\Internal\DI\Container;
use Bitrix\Timeman\V2\Internal\Repository\FileRepository;
use Bitrix\Timeman\V2\Internal\Repository\FileRepositoryInterface;
use Bitrix\Timeman\V2\Internal\Repository\InMemoryUserRepository;
use Bitrix\Timeman\V2\Internal\Repository\UserRepositoryInterface;
use Bitrix\Timeman\V2\Internal\Service\UserService;
use Bitrix\Timeman\V2\Internal\Service\UserServiceInterface;

return [
	'value' => [
		UserRepositoryInterface::class => [
			'className' => InMemoryUserRepository::class,
		],
		FileRepositoryInterface::class => [
			'className' => FileRepository::class,
		],
		UserServiceInterface::class => [
			'className' => UserService::class,
		],
		Container::class => [
			'constructor' => static fn (): Container => Container::getInstance(),
		],
	],
];
