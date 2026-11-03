<?php
/**
 * @var CMain $APPLICATION
 * @var CUser $USER
 * @var array $arParams
 * @var array $arResult
 * @var CBitrixComponent $this
 */

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

use Bitrix\BIConnector\Services\ApacheSuperset;
use Bitrix\Main\Application;
use Bitrix\Main\Context;
use Bitrix\Main\Error;
use Bitrix\Main\Localization\Loc;
use Bitrix\Main\Web\Uri;
use Bitrix\UI\Toolbar\Facade\Toolbar;
use Bitrix\BiConnector\Settings;

Loc::loadMessages(Application::getDocumentRoot() . '/bitrix/js/biconnector/settings-panel/config.php');

if (!$USER->CanDoOperation('biconnector_key_manage'))
{
	ShowError(Loc::getMessage('ACCESS_DENIED'));
	return;
}

if (!\Bitrix\Main\Loader::includeModule('biconnector'))
{
	ShowError(Loc::getMessage('CC_BBKE_ERROR_INCLUDE_MODULE'));
	return;
}

$arResult['ERRORS'] = [];
$arResult['CONNECTIONS'] = \Bitrix\BIConnector\Manager::getInstance()->getConnections();

if (empty($arResult['CONNECTIONS']))
{
	$arResult['ERRORS'][] = Loc::getMessage('CC_BBKE_ERROR_NO_CONNECTION');
}

if (!\Bitrix\BIConnector\LimitManager::getInstance()->checkLimit())
{
	$arResult['ERRORS'][] = [
		'MESSAGE' => Loc::getMessage(
			'CC_BBKE_ERROR_LIMIT_EXCEEDED_MSGVER_1',
			[
				'[helpdesk_link]' => '<a class="biconnector-key-edit_link" href="https://helpdesk.bitrix24.ru/open/26703738/" target="_blank">',
				'[/helpdesk_link]' => '</a>',
			]
		),
		'IS_HTML' => true,
	];
}

$submittedFormData = null;
$request = Context::getCurrent()->getRequest();
$isSaveRequest =
	$request->isPost()
	&& check_bitrix_sessid()
	&& $request->getPost('save') === 'Y'
;
$submittedAccessKey = $isSaveRequest ? $request->getPost('ACCESS_KEY') : null;
$isSubmittedAccessKeyValid =
	is_string($submittedAccessKey)
	&& preg_match('/^[A-Za-z0-9]{32}$/D', $submittedAccessKey) === 1
;

$arResult['GRID_ID'] = 'biconnector_key_list';
$arResult['FORM_ID'] = 'biconnector_key_edit';

$keyList = \Bitrix\BIConnector\KeyTable::getList([
	'select' => [
		'ID',
		'CONNECTION',
		'ACCESS_KEY',
		'ACTIVE',
		'APP_ID',
	],
	'filter' => [
		'=ID' => $arParams['ID'],
	],
]);

$converter = \Bitrix\Main\Text\Converter::getHtmlConverter();
if ($aKey = $keyList->fetch($converter))
{
	$APPLICATION->SetTitle(Loc::getMessage('CC_BBKE_TITLE_EDIT'));
	$arResult['FORM_STATE'] = 'edit';
	$arResult['FORM_DATA'] = $aKey;
}
else
{
	$APPLICATION->SetTitle(Loc::getMessage('CC_BBKE_TITLE_CREATE'));
	$arResult['FORM_STATE'] = 'create';
	$arResult['FORM_DATA'] = [
		'ID' => 0,
		'CONNECTION' => key($arResult['CONNECTIONS']),
		'ACCESS_KEY' => $isSubmittedAccessKeyValid
			? $submittedAccessKey
			: \Bitrix\BIConnector\KeyManager::generateAccessKey(),
		'ACTIVE' => 'Y',
		'APP_ID' => 0,
	];
}

$buildKeyUrl = static function (int $keyId) use ($arParams, $request): string
{
	$url = new Uri(str_replace('#ID#', (string)$keyId, $arParams['KEY_EDIT_URL']));
	if (
		$request->getQuery('IFRAME') === 'Y'
		&& $request->getQuery('IFRAME_TYPE') === 'SIDE_SLIDER'
	)
	{
		$url->addParams([
			'IFRAME' => 'Y',
			'IFRAME_TYPE' => 'SIDE_SLIDER',
			'sidePanelAction' => 'close',
		]);
	}

	return $url->getUri();
};

$getSubmittedUsers = static function () use ($request): array
{
	$users = [];
	foreach (explode(',', (string)$request->getPost('USERS')) as $userId)
	{
		$userId = (int)$userId;
		if ($userId > 0)
		{
			$users[] = $userId;
		}
	}

	return $users;
};

if ($isSaveRequest)
{
	$submittedFormData = [
		'ACTIVE' => $request->getPost('ACTIVE') === 'Y' ? 'Y' : 'N',
		'CONNECTION' => (string)($request->getPost('CONNECTION') ?? key($arResult['CONNECTIONS'])),
		'USERS' => $getSubmittedUsers(),
	];
	$data = [
		'ACTIVE' => $submittedFormData['ACTIVE'] === 'Y',
		'CONNECTION' => $submittedFormData['CONNECTION'],
		'USER_ID' => (int)$USER->GetID(),
	];
	if ($request->getPost('USERS') !== null)
	{
		$data['USERS'] = $submittedFormData['USERS'];
	}

	if ($arResult['FORM_STATE'] === 'edit')
	{
		$data['ID'] = (int)$arResult['FORM_DATA']['ID'];
	}
	else
	{
		if (!$isSubmittedAccessKeyValid)
		{
			$arResult['ERRORS'][] = new Error(
				Loc::getMessage('BICONNECTOR_SETTINGS_PANEL_SAVE_ERROR'),
				'INVALID_ACCESS_KEY',
			);
		}
		else
		{
			$data['ID'] = 0;
			$data['ACCESS_KEY'] = $submittedAccessKey;
		}
	}

	if (empty($arResult['ERRORS']))
	{
		$resultSave = \Bitrix\BIConnector\KeyManager::save($data);
	}

	if (isset($resultSave))
	{
		if (!$resultSave->isSuccess())
		{
			$arResult['ERRORS'][] = Loc::getMessage('BICONNECTOR_SETTINGS_PANEL_SAVE_ERROR');
		}
		else
		{
			LocalRedirect($buildKeyUrl((int)$resultSave->getData()['ID']));
		}
	}
}

$arResult['FORM_DATA']['USERS'] = [];
if ($arResult['FORM_DATA']['ID'] > 0)
{
	$userList = \Bitrix\BIConnector\KeyUserTable::getList([
		'select' => ['ID', 'USER_ID'],
		'filter' => [
			'=KEY_ID' => $arResult['FORM_DATA']['ID'],
			'!=KEY.SERVICE_ID' => ApacheSuperset::getServiceId(),
		]
	]);
	while ($user = $userList->fetch())
	{
		$arResult['FORM_DATA']['USERS'][] = $user['USER_ID'];
	}
}

if ($submittedFormData !== null)
{
	$arResult['FORM_DATA']['CONNECTION'] = $submittedFormData['CONNECTION'];
	$arResult['FORM_DATA']['ACTIVE'] = $submittedFormData['ACTIVE'];
	$arResult['FORM_DATA']['USERS'] = $submittedFormData['USERS'];
}

Toolbar::addButton(new Settings\Buttons\Implementation());
Toolbar::deleteFavoriteStar();

$this->includeComponentTemplate();
