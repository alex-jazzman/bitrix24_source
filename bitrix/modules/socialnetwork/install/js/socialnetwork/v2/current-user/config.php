<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

use Bitrix\Main\Engine\CurrentUser;
use Bitrix\Socialnetwork\V2\Internal\DI\Container;

$currentUser = CurrentUser::get();
$userId = (int)$currentUser->getId();
$currentUserSettings = [
	'id' => $userId,
	'name' => $currentUser->getFormattedName(),
	'image' => null,
];

try
{
	$user = Container::getInstance()->getUserService()->getUsers([$userId])->findOneById($userId);
	if ($user !== null)
	{
		$currentUserSettings = [
			'id' => $userId,
			'name' => $user->name ?? $currentUserSettings['name'],
			'image' => $user->image === null ? null : ['src' => $user->image->src],
		];
	}
}
catch (\Throwable)
{
}

return [
	'js' => './dist/current-user.bundle.js',
	'rel' => [
		'main.core',
	],
	'skip_core' => false,
	'settings' => $currentUserSettings,
];
