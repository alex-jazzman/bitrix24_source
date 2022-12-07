<?php

namespace Sotbit\RestAPI\Core;

use Bitrix\Main\Localization\Loc;
use Bitrix\Main\Application;
use Sotbit\RestAPI\Localisation as l;

class AdminHelper
{
    public $arCurOptionValues = [];
    private $moduleId;
    private $arTabs;
    private $arGroups;
    private $arOptions;
    private $need_access_tab;
    private $request;

    public function __construct($moduleId, $arTabs, $arGroups, $arOptions, $need_access_tab = false)
    {
        $this->moduleId = $moduleId;
        $this->arTabs = $arTabs;
        $this->arGroups = $arGroups;
        $this->arOptions = $arOptions;
        $this->need_access_tab = $need_access_tab;
        $this->request = Application::getInstance()->getContext()->getRequest();


        if($need_access_tab) {
            $this->arTabs[] = [
                'DIV'   => 'edit_access_tab',
                'TAB'   => l::get("CORE_access_Tab"),
                'ICON'  => '',
                'TITLE' => l::get("CORE_access_title"),
            ];
        }


        if($this->request->get('update') === 'Y' && check_bitrix_sessid()) {
            $this->SaveOptions();
            if($this->need_access_tab) {
                $this->SaveGroupRight();
            }
        }
        $this->GetCurOptionValues();
    }

    private function SaveOptions()
    {
        global $APPLICATION;
        $CONS_RIGHT = $APPLICATION->GetGroupRight($this->moduleId);
        if($CONS_RIGHT <= "R") {
            echo CAdminMessage::ShowMessage(l::get($this->moduleId.'_ERROR_RIGTH'));

            return false;
        }

        foreach($this->arOptions as $opt => $arOptParams) {
            if($arOptParams['TYPE'] !== 'CUSTOM') {
                $val = $this->request->get($opt);

                if($arOptParams['TYPE'] === 'CHECKBOX' && $val !== 'Y') {
                    $val = 'N';
                } elseif(is_array($val)) {
                    $val = serialize($val);
                }

                \COption::SetOptionString($this->moduleId, $opt, $val);
            }
        }
    }

    private function SaveGroupRight()
    {
        CMain::DelGroupRight($this->moduleId);
        $GROUP = $this->request->get('GROUPS');
        $RIGHT = $this->request->get('RIGHTS');


        foreach($GROUP as $k => $v) {
            if($k == 0) {
                \COption::SetOptionString(
                    $this->moduleId,
                    'GROUP_DEFAULT_RIGHT',
                    $RIGHT[0],
                    'Right for groups by default'
                );
            } else {
                CMain::SetGroupRight($this->moduleId, $GROUP[$k], $RIGHT[$k]);
            }
        }
    }

    private function GetCurOptionValues()
    {
        foreach($this->arOptions as $opt => $arOptParams) {
            if($arOptParams['TYPE'] !== 'CUSTOM') {
                $this->arCurOptionValues[$opt] = \COption::GetOptionString(
                    $this->moduleId,
                    $opt,
                    $arOptParams['DEFAULT']
                );
                if($arOptParams['TYPE'] === 'MSELECT') {
                    $this->arCurOptionValues[$opt] = unserialize($this->arCurOptionValues[$opt]);
                }
            }
        }
    }

    public function ShowHTML()
    {
        global $APPLICATION;

        $arP = [];

        foreach($this->arGroups as $group_id => $group_params) {
            $arP[$group_params['TAB']][$group_id] = [];
        }

        if(is_array($this->arOptions)) {
            foreach($this->arOptions as $option => $arOptParams) {
                $val = $this->arCurOptionValues[$option];

                if($arOptParams['SORT'] < 0 || !isset($arOptParams['SORT'])) {
                    $arOptParams['SORT'] = 0;
                }

                $label = (isset($arOptParams['TITLE']) && $arOptParams['TITLE'] != '') ? $arOptParams['TITLE'] : '';
                $labelHelp = (isset($arOptParams['HELP']) && $arOptParams['HELP'] != '') ? $arOptParams['HELP'] : '';
                if($labelHelp) {
                    $label = '<span class="sotbit_restapi_help" data-help="'.$labelHelp.'">'.$label.'</span>';
                }
                $opt = htmlspecialcharsEx($option);

                switch($arOptParams['TYPE']) {
                    case 'CHECKBOX':
                        $input = '<input type="checkbox" name="'.$opt.'" id="'.$opt.'" value="Y"'.($val === 'Y'
                                ? ' checked' : '').' '.($arOptParams['REFRESH'] === 'Y' ? 'onclick="document.forms[\''
                                .$this->moduleId.'\'].submit();"' : '').' />';
                        break;
                    case 'TEXT':
                        if(!isset($arOptParams['COLS'])) {
                            $arOptParams['COLS'] = 25;
                        }
                        if(!isset($arOptParams['ROWS'])) {
                            $arOptParams['ROWS'] = 5;
                        }
                        $input = '<textarea rows="'.$type[1].'" cols="'.$arOptParams['COLS'].'" rows="'
                            .$arOptParams['ROWS'].'" name="'.$opt.'">'.htmlspecialcharsEx($val).'</textarea>';
                        if($arOptParams['REFRESH'] === 'Y') {
                            $input .= '<input type="submit" name="refresh" value="OK" />';
                        }
                        break;
                    case 'SELECT':
                        $input = SelectBoxFromArray(
                            $opt,
                            $arOptParams['VALUES'],
                            $val,
                            '',
                            '',
                            ($arOptParams['REFRESH'] == 'Y' ? true : false),
                            ($arOptParams['REFRESH'] == 'Y' ? $this->moduleId : '')
                        );
                        if($arOptParams['REFRESH'] === 'Y') {
                            $input .= '<input type="submit" name="refresh" value="OK" />';
                        }
                        break;
                    case 'MSELECT':
                        $input = SelectBoxMFromArray($opt.'[]', $arOptParams['VALUES'], $val);
                        if($arOptParams['REFRESH'] === 'Y') {
                            $input .= '<input type="submit" name="refresh" value="OK" />';
                        }
                        break;
                    case 'COLORPICKER':
                        if(!isset($arOptParams['FIELD_SIZE'])) {
                            $arOptParams['FIELD_SIZE'] = 25;
                        }
                        ob_start();
                        echo '<input id="__CP_PARAM_'.$opt.'" name="'.$opt.'" size="'.$arOptParams['FIELD_SIZE']
                            .'" value="'.htmlspecialcharsEx($val).'" type="text" style="float: left;" '
                            .($arOptParams['FIELD_READONLY'] == 'Y' ? 'readonly' : '').' />
                                <script>
                                    function onSelect_'.$opt.'(color, objColorPicker)
                                    {
                                        var oInput = BX("__CP_PARAM_'.$opt.'");
                                        oInput.value = color;
                                    }
                                </script>';
                        $APPLICATION->IncludeComponent(
                            'bitrix:main.colorpicker',
                            '',
                            [
                                'SHOW_BUTTON' => 'Y',
                                'ID'          => $opt,
                                'NAME'        => l::get("CORE_choice_color"),
                                'ONSELECT'    => 'onSelect_'.$opt,
                            ],
                            false
                        );
                        $input = ob_get_clean();
                        if($arOptParams['REFRESH'] === 'Y') {
                            $input .= '<input type="submit" name="refresh" value="OK" />';
                        }
                        break;
                    case 'FILE':
                        if(!isset($arOptParams['FIELD_SIZE'])) {
                            $arOptParams['FIELD_SIZE'] = 25;
                        }
                        if(!isset($arOptParams['BUTTON_TEXT'])) {
                            $arOptParams['BUTTON_TEXT'] = '...';
                        }
                        \CAdminFileDialog::ShowScript(
                            [
                                'event'            => 'BX_FD_'.$opt,
                                'arResultDest'     => ['FUNCTION_NAME' => 'BX_FD_ONRESULT_'.$opt],
                                'arPath'           => [],
                                'select'           => 'F',
                                'operation'        => 'O',
                                'showUploadTab'    => true,
                                'showAddToMenuTab' => false,
                                'fileFilter'       => '',
                                'allowAllFiles'    => true,
                                'SaveConfig'       => true,
                            ]
                        );
                        $input = '<input id="__FD_PARAM_'.$opt.'" name="'.$opt.'" size="'.$arOptParams['FIELD_SIZE']
                            .'" value="'.htmlspecialcharsEx($val).'" type="text" style="float: left;" '
                            .($arOptParams['FIELD_READONLY'] == 'Y' ? 'readonly' : '').' />
                                    <input value="'.$arOptParams['BUTTON_TEXT'].'" type="button" onclick="window.BX_FD_'
                            .$opt.'();" />
                                    <script>
                                        setTimeout(function(){
                                            if (BX("bx_fd_input_'.strtolower($opt).'"))
                                                BX("bx_fd_input_'.strtolower($opt).'").onclick = window.BX_FD_'.$opt.';
                                        }, 200);
                                        window.BX_FD_ONRESULT_'.$opt.' = function(filename, filepath)
                                        {
                                            var oInput = BX("__FD_PARAM_'.$opt.'");
                                            if (typeof filename == "object")
                                                oInput.value = filename.src;
                                            else
                                                oInput.value = (filepath + "/" + filename).replace(/\/\//ig, \'/\');
                                        }
                                    </script>';
                        if($arOptParams['REFRESH'] === 'Y') {
                            $input .= '<input type="submit" name="refresh" value="OK" />';
                        }
                        break;
                    case 'CUSTOM':
                        $input = $arOptParams['VALUE'];
                        break;
                    default:
                        if(!isset($arOptParams['SIZE'])) {
                            $arOptParams['SIZE'] = 25;
                        }
                        if(!isset($arOptParams['MAXLENGTH'])) {
                            $arOptParams['MAXLENGTH'] = 255;
                        }
                        $input = '<input type="'.($arOptParams['TYPE'] === 'INT' ? 'number' : 'text').'" size="'
                            .$arOptParams['SIZE'].'" maxlength="'.$arOptParams['MAXLENGTH'].'" value="'
                            .htmlspecialchars($val).'" name="'.htmlspecialchars($option).'" />';
                        if($arOptParams['REFRESH'] === 'Y') {
                            $input .= '<input type="submit" name="refresh" value="OK" />';
                        }
                        break;
                }
                $notes = '';
                if(isset($arOptParams['NOTES']) && $arOptParams['NOTES'] != '') {
                    $notes = '<tr><td align="center" colspan="2">           
                                        <div align="center" class="adm-info-message-wrap">
                                            <div class="adm-info-message">
                                                '.$arOptParams['NOTES'].'                
                                            </div>
                                        </div>
                                    </td></tr>';
                }


                if(!empty($arOptParams['AFTER_TEXT'])) {
                    $input .= ' '.$arOptParams['AFTER_TEXT'];
                }

                $arP[$this->arGroups[$arOptParams['GROUP']]['TAB']][$arOptParams['GROUP']]['OPTIONS'][] = $label != ''
                    ? '<tr><td width="50%">'.$label.'</td><td width="50%">'.$input.'</td></tr>'.$notes.' '
                    : '<tr><td colspan="2" >'.$input.'</td></tr>'.$notes.' ';
                $arP[$this->arGroups[$arOptParams['GROUP']]['TAB']][$arOptParams['GROUP']]['OPTIONS_SORT'][]
                    = $arOptParams['SORT'];
            }

            $tabControl = new \CAdminTabControl('tabControl', $this->arTabs);
            $tabControl->Begin();
            echo '<form name="'.$this->moduleId.'" method="POST" action="'.$APPLICATION->GetCurPage().'?mid='
                .$this->moduleId.'&lang='.LANGUAGE_ID.'" enctype="multipart/form-data">'.bitrix_sessid_post();

            foreach($arP as $tab => $groups) {
                $tabControl->BeginNextTab();

                foreach($groups as $group_id => $group) {
                    if(sizeof($group['OPTIONS_SORT']) > 0) {
                        echo '<tr class="heading"><td colspan="2">'.$this->arGroups[$group_id]['TITLE'].'</td></tr>';

                        array_multisort($group['OPTIONS_SORT'], $group['OPTIONS']);
                        foreach($group['OPTIONS'] as $opt) {
                            echo $opt;
                        }
                    }
                }
            }

            if($this->need_access_tab) {
                $tabControl->BeginNextTab();
                $moduleId = $this->moduleId;
                require_once($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/main/admin/group_rights.php");
            }

            $tabControl->Buttons();

            echo '<input type="hidden" name="update" value="Y" />
                    <input type="submit" name="save" value="'.l::get("CORE_submit_save").'" />
                    <input type="reset" name="reset" value="'.l::get("CORE_submit_cancel").'" />
                    </form>';

            bitrix_sessid_post();
            $tabControl->End();
        }
    }
}

?>