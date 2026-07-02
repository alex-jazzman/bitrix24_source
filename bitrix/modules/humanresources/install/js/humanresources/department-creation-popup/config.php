<?php

use Bitrix\HumanResources\Service\Container;
use Bitrix\HumanResources\Type\MemberEntityType;
use Bitrix\HumanResources\Type\NodeEntityType;
use Bitrix\Main\Engine\CurrentUser;

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

$settings = [
	'currentUserDepartmentId' => null,
];

$currentUserId = (int)CurrentUser::get()->getId();

if ($currentUserId > 0)
{
	try
	{
		$nodeMember = Container::getNodeMemberRepository()->findFirstByEntityIdAndEntityTypeAndNodeTypeAndActive(
			$currentUserId,
			MemberEntityType::USER,
			NodeEntityType::DEPARTMENT,
			true,
		);
		$settings['currentUserDepartmentId'] = $nodeMember?->nodeId;
	}
	catch (\Throwable)
	{
	}
}

return [
	'css' => 'dist/department-creation-popup.bundle.css',
	'js' => 'dist/department-creation-popup.bundle.js',
	'rel' => [
		'main.core',
		'humanresources.company-structure.api',
		'ui.notification',
		'ui.buttons',
		'ui.entity-selector',
		'ui.system.dialog',
		'ui.system.input',
	],
	'skip_core' => false,
	'settings' => $settings,
];
