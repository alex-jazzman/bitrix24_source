<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

global $USER;
if (!is_object($USER))
{
	return [];
}

$timeZone = $USER->GetParam('TIME_ZONE');
$autoTimeZone = trim($USER->GetParam('AUTO_TIME_ZONE') ?: '');
if (\CTimeZone::IsAutoTimeZone($autoTimeZone) && \CTimeZone::getTzCookie() !== null)
{
	$timeZone = \CTimeZone::getTzCookie();
}

return [
	'js' => 'dist/timezone.bundle.js',
	'rel' => [
		'main.core',
	],
	'skip_core' => false,
	'settings' => [
		'timeZone' => $timeZone,
	],
];
