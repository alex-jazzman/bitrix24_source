<?php
$ithive_resourcesemployee_default_option = [
	'work_hours' => 8,
	'use_projects' => 0,
	'show_title' => 0,
	'remove_closed' => 1,
	'end_date_change_setting' => 4
];
if(\Bitrix\Main\Loader::includeModule('iblock')){
	$ithive_resourcesemployee_default_option['iblock_absence']=\Bitrix\Iblock\IblockTable::getRow(['filter'=>['CODE'=>'absence'], 'select'=>['ID']])['ID'];
}