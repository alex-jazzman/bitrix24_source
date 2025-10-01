<?php
$call_default_option = [
	'call_server_large_room' => 1000,
	'call_balancer_url' => '',
	'turn_server_self' => 'N',
	'turn_server_login' => 'bitrix',
	'turn_server_password' => 'bitrix',
	'turn_server_max_users' => 4,
];

$call_default_option['turn_server'] = match (\Bitrix\Main\Application::getInstance()->getLicense()->getRegion())
{
	'ru','by','kz','am','az','ge','kg','uz' => 'turn.bitrix24.tech',
	default => 'turn.calls.bitrix24.com'
};


if (file_exists($_SERVER["DOCUMENT_ROOT"]."/bitrix/php_interface/call_options.php"))
{
	$additionalOptions = include($_SERVER["DOCUMENT_ROOT"]."/bitrix/php_interface/call_options.php");
	if (is_array($additionalOptions))
	{
		$call_default_option = array_merge($call_default_option, $additionalOptions);
	}
}
