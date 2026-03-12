<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

if (!\Bitrix\Main\Loader::includeModule('im'))
{
	return;
}

$result = [
	'userChatOptions' => CIMChat::GetChatOptions(),
];
if (\Bitrix\Main\Loader::includeModule('call'))
{
	$result['call_server_max_users'] = \Bitrix\Call\Call::getMaxCallServerParticipants();
}

return $result;
