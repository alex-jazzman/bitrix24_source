<?php

if(!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED !== true) die();

use Bitrix\Intranet\Internal\Repository\User\PublicTextUserRepository;

$values = array_filter(
	$arResult['value'],
	static function($value)
	{
		return ($value > 0);
	}
);

if(empty($values))
{
	$result = '';
}
else
{
	$results = [];

	$users = (new PublicTextUserRepository())->getByIds($values);

	foreach($users as $user)
	{
		$userName = \CUser::FormatName(
			\CSite::GetNameFormat(),
			$user,
			true,
			false
		);
		$results[$user['ID']] = $userName;
	}

	$result = implode(', ', array_values($results));
}

$arResult['value'] = $result;
