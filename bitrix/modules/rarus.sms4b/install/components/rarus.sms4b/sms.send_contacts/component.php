<?php
if(!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED!==true) die();

$arResult['contacts_company'] = COption::GetOptionString('rarus.sms4b', 'contacts_company');
$arResult['the_button_label'] = COption::GetOptionString('rarus.sms4b', 'the_button_label');

$this->IncludeComponentTemplate();
