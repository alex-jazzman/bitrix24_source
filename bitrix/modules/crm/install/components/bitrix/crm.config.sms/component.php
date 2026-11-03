<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

if (!CModule::IncludeModule('crm'))
{
	ShowError(GetMessage('CRM_MODULE_NOT_INSTALLED'));
	return;
}

if (!CModule::IncludeModule('messageservice'))
{
	ShowError(GetMessage('MESSAGESERVICE_MODULE_NOT_INSTALLED'));
	return;
}

$request = \Bitrix\Main\Application::getInstance()->getContext()->getRequest();
$arResult['isSlider'] = $request->getQuery('IFRAME') === 'Y';
$arResult['page'] = isset($_GET['page']) ? (string)$_GET['page'] : 'sender';

if ($arResult['page'] === 'providers')
{
	if (
		!\Bitrix\Crm\Service\Container::getInstance()->getUserPermissions()->isCrmAdmin()
		|| !\Bitrix\MessageService\Context\User::isAdmin()
	)
	{
		ShowError(GetMessage('CRM_PERMISSION_DENIED'));

		return;
	}

	$arResult['providers'] = [];
	foreach (\Bitrix\Crm\Integration\SmsManager::getConfigurableSenderInfoList() as $sender)
	{
		$manageUrl = new \Bitrix\Main\Web\Uri($sender['manageUrl']);
		if ($arResult['isSlider'])
		{
			$manageUrl->addParams([
				'IFRAME' => 'Y',
				'IFRAME_TYPE' => 'SIDE_SLIDER',
			]);
		}

		$arResult['providers'][] = [
			'id' => $sender['id'],
			'name' => $sender['name'],
			'manageUrl' => $manageUrl->getUri(),
		];
	}
}
else
{
	$arResult['providerId'] = isset($_GET['sender']) ? (string)$_GET['sender'] : null;
}

$this->IncludeComponentTemplate();
