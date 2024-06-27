<? if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true) die();

use Bitrix\Main\Localization\Loc;

Loc::loadMessages(__FILE__);

return array(
    'css' => array(
        'entity-editor-fields.css'
    ),
    'js' => array(
        'entity-editor-fields.js'
    ),
    'rel' => array(
        'crm.entity-editor',
        'crm.entity-editor.field.requisite',
        'ui.entity-editor',
        'ui.entity-selector',
        'sidepanel'
    ),
    'skip_core' => false,
    'lang_additional' => array(
        'clientLightDisableCompany' => Loc::getMessage('CLIENT_LIGHT_DISABLE_COMPANY'),
        'clientLightDisableContact' => Loc::getMessage('CLIENT_LIGHT_DISABLE_CONTACT'),
        'clientLightEnableContact' => Loc::getMessage('CLIENT_LIGHT_ENABLE_CONTACT'),
        'clientLightEnableCompany' => Loc::getMessage('CLIENT_LIGHT_ENABLE_COMPANY'),
        'clientLightDisableAddress' => Loc::getMessage('CLIENT_LIGHT_DISABLE_ADDRESS'),
        'clientLightEnableAddress' => Loc::getMessage('CLIENT_LIGHT_ENABLE_ADDRESS'),
        'clientLightDisableRequisites' => Loc::getMessage('CLIENT_LIGHT_DISABLE_REQUISITES'),
        'clientLightEnableRequisites' => Loc::getMessage('CLIENT_LIGHT_ENABLE_REQUISITES'),
        'clientLightDisplayContactAtFirst' => Loc::getMessage('CLIENT_LIGHT_DISPLAY_CONTACT_AT_FIRST'),
        'clientLightDisplayCompanyAtFirst' => Loc::getMessage('CLIENT_LIGHT_DISPLAY_COMPANY_AT_FIRST'),
        'clientLightDisableQuickEdit' => Loc::getMessage('CLIENT_LIGHT_DISABLE_QUICK_EDIT'),
        'clientLightEnableQuickEdit' => Loc::getMessage('CLIENT_LIGHT_ENABLE_QUICK_EDIT'),
        'clientLightIsEmpty' => Loc::getMessage('CLIENT_LIGHT_IS_EMPTY'),
        'clientLightAddParticipant' => Loc::getMessage('CLIENT_LIGHT_ADD_PARTICIPANT'),
        'clientLightAddParticipant' => Loc::getMessage('CLIENT_LIGHT_ADD_PARTICIPANT'),
        'clientLightCompanySearchPlaceholder' => Loc::getMessage('CLIENT_LIGHT_COMPANY_SEARCH_PLACEHOLDER'),
        'clientLightContactSearchPlaceholder' => Loc::getMessage('CLIENT_LIGHT_CONTACT_SEARCH_PLACEHOLDER'),
        'CRM_EDITOR_PHONE' => Loc::getMessage('CRM_EDITOR_PHONE'),
        'CRM_EDITOR_EMAIL' => Loc::getMessage('CRM_EDITOR_EMAIL'),
        'CRM_EDITOR_ADDRESS' => Loc::getMessage('CRM_EDITOR_ADDRESS'),
        'CRM_EDITOR_REQUISITES' => Loc::getMessage('CRM_EDITOR_REQUISITES'),
    )
);
