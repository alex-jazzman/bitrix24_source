<?

use Bitrix\Main\Localization\Loc;

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true) die();

Loc::loadMessages(__FILE__);

return array(
    'js' => 'anchors.js',
    'rel' => array(
        'sidepanel'
    ),
    'lang_additional' => array(
        'HMS_CLINIC_LABEL_TEXT' => Loc::getMessage('HMS_CLINIC_LABEL_TEXT'),
        'HMS_OFFICE_LABEL_TEXT' => Loc::getMessage('HMS_OFFICE_LABEL_TEXT'),
        'HMS_DOCTOR_LABEL_TEXT' => Loc::getMessage('HMS_DOCTOR_LABEL_TEXT'),
        'HMS_SCHEDULE_LABEL_TEXT' => Loc::getMessage('HMS_SCHEDULE_LABEL_TEXT'),
        'HMS_SHIFT_WORK_LABEL_TEXT' => Loc::getMessage('HMS_SHIFT_WORK_LABEL_TEXT'),
        'HMS_FILLING_METHOD_LABEL_TEXT' => Loc::getMessage('HMS_FILLING_METHOD_LABEL_TEXT'),
        'HMS_SPECIALIZATION_LABEL_TEXT' => Loc::getMessage('HMS_SPECIALIZATION_LABEL_TEXT'),
        'HMS_APPOINTMENT_LABEL_TEXT' => Loc::getMessage('HMS_APPOINTMENT_LABEL_TEXT'),
        'HMS_TEETH_CHART_LABEL_TEXT' => Loc::getMessage('HMS_TEETH_CHART_LABEL_TEXT'),
        'HMS_VHI_TYPE_LABEL_TEXT' => Loc::getMessage('HMS_VHI_TYPE_LABEL_TEXT'),
        'HMS_VHI_SERVICE_TYPE_LABEL_TEXT' => Loc::getMessage('HMS_VHI_SERVICE_TYPE_LABEL_TEXT'),
    ),
    'skip_core' => false,
);
