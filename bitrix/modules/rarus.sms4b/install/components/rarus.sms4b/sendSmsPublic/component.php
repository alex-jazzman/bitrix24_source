<?php
if(!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED!==true) die();

use \Rarus\Sms4b\Address;
use \Rarus\Sms4b\Config;
use \Rarus\Sms4b\Sendings;
use \Rarus\Sms4b\Sendings\Source;
use Rarus\Sms4b\Sendings\Exceptions\Sms4bValidationError;

//connect file with functions
require_once 'functions.php';

if (isset($_REQUEST['ajaxRequest']) && $_REQUEST['ajaxRequest'] == 'Y')
{
    $APPLICATION->RestartBuffer();
    if (check_bitrix_sessid())
    	include($_SERVER['DOCUMENT_ROOT'].$this->GetPath(). '/eventHandler.php');
    else
    	echo '<!--BX_EC_DUBLICATE_ACTION_REQUEST'.bitrix_sessid().'-->'; 
    die();
}

//for ajax initialize
$arResult['PATH_FOR_ASYNC_REQUESTS'] = htmlspecialcharsback(POST_FORM_ACTION_URI);

//checking if we need to set title
if ($arParams['SET_TITLE'] == 'Y')
{
    $APPLICATION->SetTitle(GetMessage('TITLE'));
}

//can send everybody or only to personal
$arResult['CAN_SEND_ALL']  = $arParams['ALLOW_SEND_ANY_NUM'];

//connect modules 
if (!CModule::IncludeModule('rarus.sms4b') || !CModule::IncludeModule('iblock'))
{
	ShowError(GetMessage('MODULE_INSTALLATION'));
	return;
}
else
{
	
	if (!$_REQUEST['TO_OFFICER']  && !$_REQUEST['TO_DEPARTMENT'] && !$_REQUEST['SIMPLE_SEND'])
	{
	    unset($_SESSION['checking_f5']);
	}
	
	if (isset($_REQUEST['checking_f5']) && $_REQUEST['checking_f5'] == $_SESSION['checking_f5'])
	{
   		ShowError(GetMessage('RESEND_ABORTED'));
   		echo '<a href = "' .$APPLICATION->GetCurPage(). '">' .GetMessage('BACK_TO_FORM'). '</a>';
   		return;
	}
	
	if ($_REQUEST['TO_OFFICER'] || $_REQUEST['TO_DEPARTMENT'] || $_REQUEST['SIMPLE_SEND'])
	{
		$_SESSION['checking_f5'] = $_REQUEST['checking_f5'];
	}
	
	$sms4b = new Csms4b();
    $address = new Address\Service();
    $config = new Config\Service();

	try {
        $arResult['ADDRESSES'] = $address->getAllAddresses();
        $arResult['ADDRESSES_BY_DEFAULT'] = $config->getDefaultSender(SITE_ID);
    } catch (\Throwable $t) {
        $errors[] = GetMessage('SMS4B_MAIN_MOD_OPTIONS');
    }


    //выбираем все
	$usersInStructure = [];
	$arFilter = ['ACTIVE' => 'Y'];
	$obUser = new CUser();
	$dbUsers = $obUser->GetList(($sort_by = 'last_name'), ($sort_dir = 'asc'), $arFilter, ['SELECT' => ['UF_*']]);
	while ($arUser = $dbUsers->GetNext())
	{			
			$telephones = [];
			
			if ($arUser['PERSONAL_MOBILE'] !== '')
			{
				$telephones[] = $arUser['PERSONAL_MOBILE'];
			}
	}
	
	//making selection for departments, that have depth level 1
	//others will be loaded by AJAX
	$arFilter = ['IBLOCK_CODE' => 'departments', 'ACTIVE' => 'Y', 'CNT_ACTIVE' => 'Y'];
	$cdbDepartments = CIBlockSection::GetList(['left_margin' => 'asc', 'SORT' => 'ASC'], $arFilter, true);
	
	while($section = $cdbDepartments->NavNext(true, 'f_'))
	{
		$sections[] = $section;
	}
	
	$arResult['SECTIONS'] = $sections;
	
	if (strlen($_REQUEST['TO_OFFICER']) > 0 || strlen($_REQUEST['TO_DEPARTMENT']) > 0 || strlen($_REQUEST['SIMPLE_SEND']))
	{
		$errors = [];
		
		if (strlen($_REQUEST['destination']) > 0)
		{
			$destination = $_REQUEST['destination'];
			$destination = preg_replace('/<.+>/', '', $destination);
			
			//здесь у нас уже нормальный массив с номерами
			$formPhones = $sms4b->parse_numbers($destination);

            $arResult['allNumbersCount'] = 0;
            //сначала получим сколько у нас всего номеров
            if (!is_array($destination)) {
                $destination_numbers = str_replace([',', "\n"], ';', $destination);
                $arrayNumbers = explode(';', $destination_numbers);
                TrimArr($arrayNumbers);
                $arResult['allNumbersCount'] = count($arrayNumbers);
            } else {
                TrimArr($destination);
                $arResult['allNumbersCount'] = count($destination);
            }

            $arResult['DOUBLED_NUMBERS'] = intval($arResult['allNumbersCount']) - count($formPhones);
		}
		else
		{
			$errors[] = GetMessage('NO_NUMBERS_FOR_SEND');
		}
		
		
		if (strlen($_REQUEST['message']) < 1)
		{
			$errors[] = GetMessage('NO_MESSAGE_TEXT');
		}
		else
		{
		    $message = $_REQUEST['message'];
		}
		
		//checking begin of the send
		if (!isset($_REQUEST['BEGIN_SEND_AT']) || $_REQUEST['BEGIN_SEND_AT'] === '' )
		{
			$startUp = null;
		}
		else
		{
            try {
                $startUp = new \DateTime( $_REQUEST['BEGIN_SEND_AT']);
            } catch (\Throwable $t) {
                $errors[] = GetMessage('BAD_DATE_FORMAT');
            }
		}
			
		//checking actual date for send
		if (!isset($_REQUEST['DATE_ACTUAL']) || $_REQUEST['DATE_ACTUAL'] === '')
		{
			$dateActual = null;
		}
		else
		{
            try {
                $dateActual = new \DateTime($_REQUEST['DATE_ACTUAL']);
            } catch (\Throwable $t) {
                $errors[]  = GetMessage('BAD_DATE_FORMAT_FOR_ACTUAL_DATE');
            }
		}
		
		//checking period
        if (!isset($_REQUEST['DATE_FROM_NS'], $_REQUEST['DATE_TO_NS'])
            || $_REQUEST['DATE_FROM_NS'] === '' || $_REQUEST['DATE_TO_NS'] === '') {
            $period = '';
        } else {
            $period = $_REQUEST['DATE_TO_NS'] . $_REQUEST['DATE_FROM_NS'];
        }
		
		if (count($errors) === 0)
		{
			//processing component parameter
			if ($arResult['CAN_SEND_ALL'] === 'Y')
			{
				$usersPhones = $sms4b->parse_numbers($telephones);
				
				$destination = [];
				$trig = false;
				
				foreach ($formPhones as $arIndex)
				{
					if (!in_array($arIndex, $usersPhones))
					{
						if (!$trig)
						{
							$errors[] = GetMessage('SENDING_DENIED');
							$trig = true;
						}
					}
					else
					{
						$destination[] = $arIndex;
					}
				}
			}
			else
			{
				$destination = $formPhones;
			}
            $arPhoneMessages = [];
            foreach ($destination as $phone) {
                $arPhoneMessages[$phone] = $message;
            }
			
			if ($_REQUEST['SENDER'] && !empty($_REQUEST['SENDER']))
			{
				$sender = htmlspecialchars($_REQUEST['SENDER']);
			}
			else
			{
				$sender = '';
			}
            $translit = $_REQUEST['TRANSLIT'] === 'Y';

            if(strlen($_REQUEST['TO_OFFICER']) > 0 || strlen($_REQUEST['TO_DEPARTMENT']) > 0) {
                $source = Source\Source::createSourceInstance(Source\PublicComponent::USER);
            } else {
                $source = Source\Source::createSourceInstance(Source\PublicComponent::PHONE_TEXT);
            }
            try {
                $senderService = new Sendings\Sender();
                $senderService->formSendSms($arPhoneMessages, $sender, $translit, $source, $startUp, $dateActual,
                    $period);
            } catch (Sms4bValidationError $error) {
                $errors[] = $error->getMessage();
            } catch (\Throwable $t) {
                $errors[] = GetMessage('SMS4B_MAIN_MOD_OPTIONS');
            }

			$arResult['GOOD_SEND'] = 'Y';
			$arResult['WAS_SEND'] = (empty($result['WAS_SEND']) ? '0' : $result['WAS_SEND']);
			$arResult['NOT_SEND'] = (empty($result['NOT_SEND']) ? '0' : $result['NOT_SEND']);
		}
	
		$arResult['ERRORS'] = $errors;
	}	
}

$this->IncludeComponentTemplate();
