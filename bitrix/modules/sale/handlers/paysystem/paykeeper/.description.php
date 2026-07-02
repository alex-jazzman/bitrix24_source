<?php
use \Bitrix\Main\Localization\Loc;
Loc::loadMessages(__FILE__);
$status_list = array();
$dbStatuses = CSaleStatus::GetList();
while ($status_item = $dbStatuses->Fetch()) {
    $status_list[$status_item['ID']] = $status_item['NAME'];
}
$data = array(
    'NAME' => 'PayKeeper',
    'SORT' => 100,
    'CODES' => array(

        // settings
        'PAYKEEPER_FORM_URL' => array(
            'NAME' => Loc::getMessage('SALE_HPS_PAYKEEPER_FORM_URL'),
            'DESCRIPTION' => Loc::getMessage('SALE_HPS_PAYKEEPER_FORM_URL_DESCR'),
            'GROUP' => Loc::getMessage('SALE_HPS_PAYKEEPER_SETTINGS'),
            'SORT' => 100
        ),
        'PAYKEEPER_LK_LOGIN' => array(
            'NAME' => Loc::getMessage('SALE_HPS_PAYKEEPER_LK_LOGIN'),
            'DESCRIPTION' => Loc::getMessage('SALE_HPS_PAYKEEPER_LK_LOGIN_DESCR'),
            'GROUP' => Loc::getMessage('SALE_HPS_PAYKEEPER_SETTINGS'),
            'SORT' => 110
        ),
        'PAYKEEPER_LK_PASSWORD' => array(
            'NAME' => Loc::getMessage('SALE_HPS_PAYKEEPER_LK_PASSWORD'),
            'DESCRIPTION' => Loc::getMessage('SALE_HPS_PAYKEEPER_LK_PASSWORD_DESCR'),
            'GROUP' => Loc::getMessage('SALE_HPS_PAYKEEPER_SETTINGS'),
            'SORT' => 120
        ),
        'PAYKEEPER_SECRET' => array(
            'NAME' => Loc::getMessage('SALE_HPS_PAYKEEPER_SECRET'),
            'GROUP' => Loc::getMessage('SALE_HPS_PAYKEEPER_SETTINGS'),
            'SORT' => 130
        ),

        // settings_payment
        'PAYKEEPER_FORM_REDIRECT' => array(
            'NAME' => Loc::getMessage('SALE_HPS_PAYKEEPER_FORM_REDIRECT'),
            'GROUP' => Loc::getMessage('SALE_HPS_PAYKEEPER_SETTINGS_PAYMENT'),
            'SORT' => 200,
            'INPUT' => array(
                'TYPE' => 'Y/N',
                'VALUES' => array('Y', 'N'),
                'VALUE' => 'Y'
            ),
            'DEFAULT' => array(
                'PROVIDER_VALUE' => 'Y',
                'PROVIDER_KEY' => 'INPUT'
            )
        ),
        'PAYKEEPER_STATUS_AFTER_PAYMENT' => array(
            'NAME' => Loc::getMessage('SALE_HPS_PAYKEEPER_STATUS_AFTER_PAYMENT'),
            'GROUP' => Loc::getMessage('SALE_HPS_PAYKEEPER_SETTINGS_PAYMENT'),
            'SORT' => 210,
            'INPUT' => array(
                'TYPE' => 'ENUM',
                'OPTIONS' => $status_list
            ),
            'DEFAULT' => array(
                'PROVIDER_VALUE' => 'P',
                'PROVIDER_KEY' => 'INPUT'
            )
        ),
        'PAYKEEPER_SBP' => array(
            'NAME' => Loc::getMessage('SALE_HPS_PAYKEEPER_SBP'),
            'DESCRIPTION' => Loc::getMessage('SALE_HPS_PAYKEEPER_SBP_DESC'),
            'GROUP' => Loc::getMessage('SALE_HPS_PAYKEEPER_SETTINGS_PAYMENT'),
            'SORT' => 220,
            'INPUT' => array(
                'TYPE' => 'Y/N',
                'VALUES' => array('Y', 'N'),
                'VALUE' => 'N'
            ),
            'DEFAULT' => array(
                'PROVIDER_VALUE' => 'N',
                'PROVIDER_KEY' => 'INPUT'
            )
        ),
        'PAYKEEPER_PSTYPE' => array(
            'NAME' => Loc::getMessage('SALE_HPS_PAYKEEPER_PSTYPE'),
            'GROUP' => Loc::getMessage('SALE_HPS_PAYKEEPER_SETTINGS_PAYMENT'),
            'SORT' => 230
        ),
        'PAYKEEPER_REDIRECT_TO_ORDER' => array(
            'NAME' => Loc::getMessage('SALE_HPS_PAYKEEPER_REDIRECT_TO_ORDER'),
            'GROUP' => Loc::getMessage('SALE_HPS_PAYKEEPER_SETTINGS_PAYMENT'),
            'SORT' => 240,
            'INPUT' => array(
                'TYPE' => 'Y/N',
                'VALUES' => array('Y', 'N'),
                'VALUE' => 'N'
            ),
            'DEFAULT' => array(
                'PROVIDER_VALUE' => 'N',
                'PROVIDER_KEY' => 'INPUT'
            )
        ),
        'PAYKEEPER_ORDER_PAGE' => array(
            'NAME' => Loc::getMessage('SALE_HPS_PAYKEEPER_ORDER_PAGE'),
            'DESCRIPTION' => Loc::getMessage('SALE_HPS_PAYKEEPER_ORDER_PAGE_DESC'),
            'GROUP' => Loc::getMessage('SALE_HPS_PAYKEEPER_SETTINGS_PAYMENT'),
            'SORT' => 250
        ),
        'PAYKEEPER_TRU_CODE_USE' => array(
            'NAME' => Loc::getMessage('SALE_HPS_PAYKEEPER_TRU_CODE_USE'),
            'GROUP' => Loc::getMessage('SALE_HPS_PAYKEEPER_SETTINGS_PAYMENT'),
            'SORT' => 260,
            'INPUT' => array(
                'TYPE' => 'Y/N',
                'VALUES' => array('Y', 'N'),
                'VALUE' => 'N'
            ),
            'DEFAULT' => array(
                'PROVIDER_VALUE' => 'N',
                'PROVIDER_KEY' => 'INPUT'
            )
        ),
        'PAYKEEPER_TRU_CODE_NAME' => array(
            'NAME' => Loc::getMessage('SALE_HPS_PAYKEEPER_TRU_CODE_NAME'),
            'GROUP' => Loc::getMessage('SALE_HPS_PAYKEEPER_SETTINGS_PAYMENT'),
            'SORT' => 270
        ),
        'PAYKEEPER_DISCOUNT' => array(
            'NAME' => Loc::getMessage('SALE_HPS_PAYKEEPER_DISCOUNT_NAME'),
            'SORT' => 280,
            'GROUP' => Loc::getMessage('SALE_HPS_PAYKEEPER_SETTINGS_PAYMENT'),
            'INPUT' => array(
                'TYPE' => 'Y/N'
            ),
            'DEFAULT' => array(
                'PROVIDER_VALUE' => 'N',
                'PROVIDER_KEY' => 'INPUT'
            )
        ),
        'PAYKEEPER_SHIPMENT' => array(
            'NAME' => Loc::getMessage('SALE_HPS_PAYKEEPER_SHIPMENT_NAME'),
            'DESCRIPTION' => Loc::getMessage('SALE_HPS_PAYKEEPER_SHIPMENT_DESCR'),
            'SORT' => 285,
            'GROUP' => Loc::getMessage('SALE_HPS_PAYKEEPER_SETTINGS_PAYMENT'),
            'INPUT' => array(
                'TYPE' => 'Y/N'
            ),
            'DEFAULT' => array(
                'PROVIDER_VALUE' => 'N',
                'PROVIDER_KEY' => 'INPUT'
            )
        ),
        'PAYKEEPER_ORDER_CONTACTS' => array(
            'NAME' => Loc::getMessage('SALE_HPS_PAYKEEPER_ORDER_CONTACTS_NAME'),
            'DESCRIPTION' => Loc::getMessage('SALE_HPS_PAYKEEPER_ORDER_CONTACTS_DESCR'),
            'SORT' => 290,
            'GROUP' => Loc::getMessage('SALE_HPS_PAYKEEPER_SETTINGS_PAYMENT'),
            'INPUT' => array(
                'TYPE' => 'Y/N'
            ),
            'DEFAULT' => array(
                'PROVIDER_VALUE' => 'N',
                'PROVIDER_KEY' => 'INPUT'
            )
        ),
        'PAYKEEPER_LOGGING' => array(
            "NAME" => Loc::getMessage('SALE_HPS_PAYKEEPER_LOGGING_NAME'),
            'SORT' => 295,
            'GROUP' => Loc::getMessage('SALE_HPS_PAYKEEPER_SETTINGS_PAYMENT'),
            'INPUT' => array(
                'TYPE' => 'Y/N'
            ),
            'DEFAULT' => array(
                "PROVIDER_VALUE" => 'Y',
                "PROVIDER_KEY" => 'INPUT'
            )
        ),

        // settings_first_check
        'PAYKEEPER_CART' => array(
            'NAME' => Loc::getMessage('SALE_HPS_PAYKEEPER_CART_NAME'),
            'DESCRIPTION' => Loc::getMessage('SALE_HPS_PAYKEEPER_CART_DESCR'),
            'SORT' => 300,
            'GROUP' => Loc::getMessage('SALE_HPS_PAYKEEPER_SETTINGS_FIRST_CHECK'),
            'INPUT' => array(
                'TYPE' => 'Y/N'
            ),
            'DEFAULT' => array(
                'PROVIDER_VALUE' => 'Y',
                'PROVIDER_KEY' => 'INPUT'
            )
        ),
        'PAYKEEPER_VAT' => array(
            'NAME' => Loc::getMessage('SALE_HPS_PAYKEEPER_VAT_NAME'),
            'SORT' => 305,
            'GROUP' => Loc::getMessage('SALE_HPS_PAYKEEPER_SETTINGS_FIRST_CHECK'),
            'TYPE' => 'SELECT',
            'INPUT' => array(
                'TYPE' => 'ENUM',
                'OPTIONS' => array(
                    '1' => Loc::getMessage('SALE_HPS_PAYKEEPER_VAT_1'),
                    '2' => Loc::getMessage('SALE_HPS_PAYKEEPER_VAT_2'),
                    '7' => Loc::getMessage('SALE_HPS_PAYKEEPER_VAT_7'),
                    '8' => Loc::getMessage('SALE_HPS_PAYKEEPER_VAT_8'),
                    '3' => Loc::getMessage('SALE_HPS_PAYKEEPER_VAT_3'),
                    '4' => Loc::getMessage('SALE_HPS_PAYKEEPER_VAT_4'),
                    '9' => Loc::getMessage('SALE_HPS_PAYKEEPER_VAT_9'),
                    '10' => Loc::getMessage('SALE_HPS_PAYKEEPER_VAT_10'),
                    '5' => Loc::getMessage('SALE_HPS_PAYKEEPER_VAT_5'),
                    '6' => Loc::getMessage('SALE_HPS_PAYKEEPER_VAT_6'),
                )
            ),
            'DEFAULT' => array(
                'PROVIDER_VALUE' => '1',
                'PROVIDER_KEY' => 'INPUT'
            )
        ),
        'PAYKEEPER_VAT_PRIORITY' => array(
            'NAME' => Loc::getMessage('SALE_HPS_PAYKEEPER_VAT_PRIORITY_NAME'),
            'DESCRIPTION' => Loc::getMessage('SALE_HPS_PAYKEEPER_VAT_PRIORITY_DESCR'),
            'SORT' => 307,
            'GROUP' => Loc::getMessage('SALE_HPS_PAYKEEPER_SETTINGS_FIRST_CHECK'),
            'INPUT' => array(
                'TYPE' => 'Y/N'
            ),
            'DEFAULT' => array(
                'PROVIDER_VALUE' => 'N',
                'PROVIDER_KEY' => 'INPUT'
            )
        ),
        'PAYKEEPER_BASKET_ITEM_TYPE' => array(
            'NAME' => Loc::getMessage('SALE_HPS_PAYKEEPER_BASKET_ITEM_TYPE_NAME'),
            'SORT' => 310,
            'GROUP' => Loc::getMessage('SALE_HPS_PAYKEEPER_SETTINGS_FIRST_CHECK'),
            'TYPE' => 'SELECT',
            'INPUT' => array(
                'TYPE' => 'ENUM',
                'OPTIONS' => array(
                    '1' => Loc::getMessage('SALE_HPS_PAYKEEPER_ITEM_TYPE_1'),
                    '2' => Loc::getMessage('SALE_HPS_PAYKEEPER_ITEM_TYPE_2'),
                    '3' => Loc::getMessage('SALE_HPS_PAYKEEPER_ITEM_TYPE_3'),
                    '4' => Loc::getMessage('SALE_HPS_PAYKEEPER_ITEM_TYPE_4'),
                    '5' => Loc::getMessage('SALE_HPS_PAYKEEPER_ITEM_TYPE_5'),
                    '6' => Loc::getMessage('SALE_HPS_PAYKEEPER_ITEM_TYPE_6'),
                    '7' => Loc::getMessage('SALE_HPS_PAYKEEPER_ITEM_TYPE_7'),
                )
            ),
            'DEFAULT' => array(
                'PROVIDER_VALUE' => '1',
                'PROVIDER_KEY' => 'INPUT'
            )
        ),
        'PAYKEEPER_BASKET_PAYMENT_TYPE' => array(
            'NAME' => Loc::getMessage('SALE_HPS_PAYKEEPER_BASKET_PAYMENT_TYPE_NAME'),
            'SORT' => 320,
            'GROUP' => Loc::getMessage('SALE_HPS_PAYKEEPER_SETTINGS_FIRST_CHECK'),
            'TYPE' => 'SELECT',
            'INPUT' => array(
                'TYPE' => 'ENUM',
                'OPTIONS' => array(
                    '1' => Loc::getMessage('SALE_HPS_PAYKEEPER_PAYMENT_TYPE_1'),
                    '2' => Loc::getMessage('SALE_HPS_PAYKEEPER_PAYMENT_TYPE_2'),
                    '3' => Loc::getMessage('SALE_HPS_PAYKEEPER_PAYMENT_TYPE_3'),
                    '4' => Loc::getMessage('SALE_HPS_PAYKEEPER_PAYMENT_TYPE_4'),
                )
            ),
            'DEFAULT' => array(
                'PROVIDER_VALUE' => '1',
                'PROVIDER_KEY' => 'INPUT'
            )
        ),
        'PAYKEEPER_VAT_DELIVERY' => array(
            'NAME' => Loc::getMessage('SALE_HPS_PAYKEEPER_VAT_DELIVERY_NAME'),
            'SORT' => 323,
            'GROUP' => Loc::getMessage('SALE_HPS_PAYKEEPER_SETTINGS_FIRST_CHECK'),
            'TYPE' => 'SELECT',
            'INPUT' => array(
                'TYPE' => 'ENUM',
                'OPTIONS' => array(
                    '1' => Loc::getMessage('SALE_HPS_PAYKEEPER_VAT_1'),
                    '2' => Loc::getMessage('SALE_HPS_PAYKEEPER_VAT_2'),
                    '7' => Loc::getMessage('SALE_HPS_PAYKEEPER_VAT_7'),
                    '8' => Loc::getMessage('SALE_HPS_PAYKEEPER_VAT_8'),
                    '3' => Loc::getMessage('SALE_HPS_PAYKEEPER_VAT_3'),
                    '4' => Loc::getMessage('SALE_HPS_PAYKEEPER_VAT_4'),
                    '9' => Loc::getMessage('SALE_HPS_PAYKEEPER_VAT_9'),
                    '10' => Loc::getMessage('SALE_HPS_PAYKEEPER_VAT_10'),
                    '5' => Loc::getMessage('SALE_HPS_PAYKEEPER_VAT_5'),
                    '6' => Loc::getMessage('SALE_HPS_PAYKEEPER_VAT_6'),
                )
            ),
            'DEFAULT' => array(
                'PROVIDER_VALUE' => '1',
                'PROVIDER_KEY' => 'INPUT'
            )
        ),
        'PAYKEEPER_VAT_DELIVERY_PRIORITY' => array(
            'NAME' => Loc::getMessage('SALE_HPS_PAYKEEPER_VAT_DELIVERY_PRIORITY_NAME'),
            'DESCRIPTION' => Loc::getMessage('SALE_HPS_PAYKEEPER_VAT_DELIVERY_PRIORITY_DESCR'),
            'SORT' => 327,
            'GROUP' => Loc::getMessage('SALE_HPS_PAYKEEPER_SETTINGS_FIRST_CHECK'),
            'INPUT' => array(
                'TYPE' => 'Y/N'
            ),
            'DEFAULT' => array(
                'PROVIDER_VALUE' => 'N',
                'PROVIDER_KEY' => 'INPUT'
            )
        ),
        'PAYKEEPER_DELIVERY_ITEM_TYPE' => array(
            'NAME' => Loc::getMessage('SALE_HPS_PAYKEEPER_DELIVERY_ITEM_TYPE_NAME'),
            'SORT' => 330,
            'GROUP' => Loc::getMessage('SALE_HPS_PAYKEEPER_SETTINGS_FIRST_CHECK'),
            'TYPE' => 'SELECT',
            'INPUT' => array(
                'TYPE' => 'ENUM',
                'OPTIONS' => array(
                    '1' => Loc::getMessage('SALE_HPS_PAYKEEPER_ITEM_TYPE_1'),
                    '2' => Loc::getMessage('SALE_HPS_PAYKEEPER_ITEM_TYPE_2'),
                    '3' => Loc::getMessage('SALE_HPS_PAYKEEPER_ITEM_TYPE_3'),
                    '4' => Loc::getMessage('SALE_HPS_PAYKEEPER_ITEM_TYPE_4'),
                    '5' => Loc::getMessage('SALE_HPS_PAYKEEPER_ITEM_TYPE_5'),
                    '6' => Loc::getMessage('SALE_HPS_PAYKEEPER_ITEM_TYPE_6'),
                    '7' => Loc::getMessage('SALE_HPS_PAYKEEPER_ITEM_TYPE_7'),
                )
            ),
            'DEFAULT' => array(
                'PROVIDER_VALUE' => '2',
                'PROVIDER_KEY' => 'INPUT'
            )
        ),
        'PAYKEEPER_DELIVERY_PAYMENT_TYPE' => array(
            'NAME' => Loc::getMessage('SALE_HPS_PAYKEEPER_DELIVERY_PAYMENT_TYPE_NAME'),
            'SORT' => 340,
            'GROUP' => Loc::getMessage('SALE_HPS_PAYKEEPER_SETTINGS_FIRST_CHECK'),
            'TYPE' => 'SELECT',
            'INPUT' => array(
                'TYPE' => 'ENUM',
                'OPTIONS' => array(
                    '1' => Loc::getMessage('SALE_HPS_PAYKEEPER_PAYMENT_TYPE_1'),
                    '2' => Loc::getMessage('SALE_HPS_PAYKEEPER_PAYMENT_TYPE_2'),
                    '3' => Loc::getMessage('SALE_HPS_PAYKEEPER_PAYMENT_TYPE_3'),
                    '4' => Loc::getMessage('SALE_HPS_PAYKEEPER_PAYMENT_TYPE_4'),
                )
            ),
            'DEFAULT' => array(
                'PROVIDER_VALUE' => '1',
                'PROVIDER_KEY' => 'INPUT'
            )
        ),
        'PAYKEEPER_BASKET_MEASURE' => array(
            'NAME' => Loc::getMessage('SALE_HPS_PAYKEEPER_BASKET_MEASURE_NAME'),
            'SORT' => 350,
            'GROUP' => Loc::getMessage('SALE_HPS_PAYKEEPER_SETTINGS_FIRST_CHECK'),
            'TYPE' => 'SELECT',
            'INPUT' => array(
                'TYPE' => 'ENUM',
                'OPTIONS' => array(
                    '1' => Loc::getMessage('SALE_HPS_PAYKEEPER_MEASURE_1'),
                    '2' => Loc::getMessage('SALE_HPS_PAYKEEPER_MEASURE_2'),
                    '3' => Loc::getMessage('SALE_HPS_PAYKEEPER_MEASURE_3'),
                    '7' => Loc::getMessage('SALE_HPS_PAYKEEPER_MEASURE_7'),
                    '12' => Loc::getMessage('SALE_HPS_PAYKEEPER_MEASURE_12'),
                )
            ),
            'DEFAULT' => array(
                'PROVIDER_VALUE' => '1',
                'PROVIDER_KEY' => 'INPUT'
            )
        ),
        'PAYKEEPER_CONVERT_FULL_RATES' => array(
            'NAME' => Loc::getMessage('SALE_HPS_PAYKEEPER_CONVERT_FULL_RATES'),
            'GROUP' => Loc::getMessage('SALE_HPS_PAYKEEPER_SETTINGS_FIRST_CHECK'),
            'SORT' => 360,
            'INPUT' => array(
                'TYPE' => 'Y/N',
                'VALUES' => array('Y', 'N'),
                'VALUE' => 'N'
            ),
            'DEFAULT' => array(
                'PROVIDER_VALUE' => 'N',
                'PROVIDER_KEY' => 'INPUT'
            )
        ),
        'PAYKEEPER_USE_FIXED_NAME_DELIVERY' => array(
            'NAME' => Loc::getMessage('SALE_HPS_PAYKEEPER_USE_FIXED_NAME_DELIVERY'),
            'GROUP' => Loc::getMessage('SALE_HPS_PAYKEEPER_SETTINGS_FIRST_CHECK'),
            'SORT' => 370,
            'INPUT' => array(
                'TYPE' => 'Y/N',
                'VALUES' => array('Y', 'N'),
                'VALUE' => 'N'
            ),
            'DEFAULT' => array(
                'PROVIDER_VALUE' => 'N',
                'PROVIDER_KEY' => 'INPUT'
            )
        ),
        'PAYKEEPER_FIXED_NAME_DELIVERY' => array(
            'NAME' => Loc::getMessage('SALE_HPS_PAYKEEPER_FIXED_NAME_DELIVERY'),
            'GROUP' => Loc::getMessage('SALE_HPS_PAYKEEPER_SETTINGS_FIRST_CHECK'),
            'SORT' => 380
        ),

        // settings_second_check
        'PAYKEEPER_PRINT_FINAL_RECEIPT' => array(
            'NAME' => Loc::getMessage('SALE_HPS_PAYKEEPER_PRINT_FINAL_RECEIPT'),
            'GROUP' => Loc::getMessage('SALE_HPS_PAYKEEPER_SETTINGS_SECOND_CHECK'),
            'SORT' => 400,
            'INPUT' => array(
                'TYPE' => 'Y/N',
                "VALUES" => array('Y', 'N'),
                'VALUE' => 'N'
            ),
            'DEFAULT' => array(
                'PROVIDER_VALUE' => 'N',
                'PROVIDER_KEY' => 'INPUT'
            )
        ),
        'PAYKEEPER_PRINT_AFTER_STATUS' => array(
            'NAME' => Loc::getMessage('SALE_HPS_PAYKEEPER_PRINT_AFTER_STATUS'),
            'GROUP' => Loc::getMessage('SALE_HPS_PAYKEEPER_SETTINGS_SECOND_CHECK'),
            'SORT' => 420,
            'INPUT' => array(
                'TYPE' => 'ENUM',
                'OPTIONS' => $status_list
            ),
            'DEFAULT' => array(
                'PROVIDER_VALUE' => 'F',
                'PROVIDER_KEY' => 'INPUT'
            )
        ),

        // settings_hold_funds
        'PAYKEEPER_HOLD_FUNDS_ENABLE' => array(
            'NAME' => Loc::getMessage('SALE_HPS_PAYKEEPER_ENABLE_EVENT'),
            'DESCRIPTION' => Loc::getMessage('SALE_HPS_PAYKEEPER_ENABLE_EVENT_DESC'),
            'GROUP' => Loc::getMessage('SALE_HPS_PAYKEEPER_SETTINGS_HOLD_FUNDS'),
            'SORT' => 500,
            'INPUT' => array(
                'TYPE' => 'Y/N',
                "VALUES" => array('Y', 'N'),
                'VALUE' => 'N'
            ),
            'DEFAULT' => array(
                'PROVIDER_VALUE' => 'N',
                'PROVIDER_KEY' => 'INPUT'
            )
        ),
        'PAYKEEPER_HOLD_FUNDS_AFTER_STATUS' => array(
            'NAME' => Loc::getMessage('SALE_HPS_PAYKEEPER_HOLD_AFTER_STATUS'),
            'GROUP' => Loc::getMessage('SALE_HPS_PAYKEEPER_SETTINGS_HOLD_FUNDS'),
            'SORT' => 510,
            'INPUT' => array(
                'TYPE' => 'ENUM',
                'OPTIONS' => $status_list
            ),
            'DEFAULT' => array(
                'PROVIDER_VALUE' => 'P',
                'PROVIDER_KEY' => 'INPUT'
            )
        ),
        'PAYKEEPER_HOLD_DEBIT_AFTER_STATUS' => array(
            'NAME' => Loc::getMessage('SALE_HPS_PAYKEEPER_DEBIT_AFTER_STATUS'),
            'GROUP' => Loc::getMessage('SALE_HPS_PAYKEEPER_SETTINGS_HOLD_FUNDS'),
            'SORT' => 520,
            'INPUT' => array(
                'TYPE' => 'ENUM',
                'OPTIONS' => $status_list
            ),
            'DEFAULT' => array(
                'PROVIDER_VALUE' => 'F',
                'PROVIDER_KEY' => 'INPUT'
            )
        ),
        'PAYKEEPER_HOLD_CANCEL_AFTER_STATUS' => array(
            'NAME' => Loc::getMessage('SALE_HPS_PAYKEEPER_CANCEL_AUTH_AFTER_STATUS'),
            'GROUP' => Loc::getMessage('SALE_HPS_PAYKEEPER_SETTINGS_HOLD_FUNDS'),
            'SORT' => 530,
            'INPUT' => array(
                'TYPE' => 'ENUM',
                'OPTIONS' => $status_list
            ),
            'DEFAULT' => array(
                'PROVIDER_VALUE' => 'N',
                'PROVIDER_KEY' => 'INPUT'
            )
        ),

        // settings_order
        'PAYKEEPER_ORDER_NUMBER' => array(
            'NAME' => Loc::getMessage('SALE_HPS_PAYKEEPER_ORDER_NUMBER_NAME'),
            'DESCRIPTION' => Loc::getMessage('SALE_HPS_PAYKEEPER_ORDER_NUMBER_DESCR'),
            'SORT' => 600,
            'GROUP' => Loc::getMessage('SALE_HPS_PAYKEEPER_SETTINGS_ORDER'),
            'DEFAULT' => array(
                'PROVIDER_KEY' => 'ORDER',
                'PROVIDER_VALUE' => 'ID'
            )
        ),
        'PAYKEEPER_ORDER_AMOUNT' => array(
            'NAME' => Loc::getMessage('SALE_HPS_PAYKEEPER_ORDER_AMOUNT_NAME'),
            'SORT' => 620,
            'GROUP' => Loc::getMessage('SALE_HPS_PAYKEEPER_SETTINGS_ORDER'),
            'DEFAULT' => array(
                'PROVIDER_KEY' => 'PAYMENT',
                'PROVIDER_VALUE' => 'SUM'
            )
        ),
    )
);
