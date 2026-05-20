<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED!==true)
{
	die();
}

$arComponentDescription = array(
	'NAME' => getMessage('LANDING_CMP_VIBE_SETTINGS_NAME'),
	'DESCRIPTION' => getMessage('LANDING_CMP_VIBE_SETTINGS_DESCRIPTION'),
	'SORT' => 10,
	'PATH' => array(
		'ID' => 'landing',
		'NAME' => getMessage('LANDING_CMP_VIBE_SETTINGS_NAMESPACE_NAME')
	)
);