<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

if (!\Bitrix\Main\Loader::includeModule('rest'))
{
	return;
}

$commandClass = \Bitrix\Rest\Public\Command\Application\AccessPolicy\SetPersonalApplicationCreationAccessCommand::class;
$providerClass = \Bitrix\Rest\Public\Provider\Application\AccessPolicyProvider::class;

if (!class_exists($commandClass) || !class_exists($providerClass))
{
	return;
}

$provider = new $providerClass();
if ($provider->getAccessCodesAllowedToCreatePersonalApp() === [])
{
	(new $commandClass(['UA']))->run();
}
