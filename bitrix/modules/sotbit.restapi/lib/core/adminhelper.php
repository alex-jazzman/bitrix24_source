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
                } elseif ($arOptParams['TYPE'] === 'UPLOAD_IMAGE') {
                    if(!empty($_FILES[$opt]['tmp_name'])) {
                        $old_file = (int)$this->request->get($opt);
                        $val = $_FILES[$opt];
                        $val['MODULE_ID'] = $this->moduleId;
                        if($old_file) {
                            $val['old_file'] = $old_file;
                        }

                        // resize
                        if($arOptParams['HEIGHT'] !== null || $arOptParams['WIDTH'] !== null) {
                            $resize = [];
                            if($arOptParams['HEIGHT'] && $arOptParams['WIDTH']) {
                                $resize = ['HEIGHT' => $arOptParams['HEIGHT'], 'WIDTH' =>$arOptParams['WIDTH']];
                            } else if(empty($arOptParams['HEIGHT']) && $arOptParams['WIDTH']) {
                                $resize = ['WIDTH' =>$arOptParams['WIDTH']];
                            } else if($arOptParams['HEIGHT'] && empty($arOptParams['WIDTH'])) {
                                $resize = ['HEIGHT' =>$arOptParams['HEIGHT']];
                            }
                            $resize['METHOD'] = 'resample';
                            $val = \CIBlock::ResizePicture($val, $resize);
                        }


                        $val = \CFile::SaveFile($val, $this->moduleId);
                    } elseif($this->request->get($opt.'_del') === 'Y') {
                        \CFile::Delete(\COption::GetOptionInt($this->moduleId, $opt));
                    } else {
                        $val = \COption::GetOptionInt($this->moduleId, $opt);
                    }

                } elseif(is_array($val)) {
                    $val = array_filter($val) ? json_encode($val) : null;
                }

                \COption::SetOptionString($this->moduleId, $opt, $val);
            }
        }
    }

    private function SaveGroupRight()
    {
        \CMain::DelGroupRight($this->moduleId);
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
                \CMain::SetGroupRight($this->moduleId, $GROUP[$k], $RIGHT[$k]);
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
                    $this->arCurOptionValues[$opt] = json_decode($this->arCurOptionValues[$opt]);
                }
            }
        }
    }

    public function ShowHTML()
    {
        $moduleIdHtml = str_replace('.', '_', $this->moduleId);
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
                    $label = '<div class="sotbit_restapi_help">'.$label.' <div class="help">'.$labelHelp.'</div></div>';
                }
                $opt = htmlspecialcharsEx($option);

                switch($arOptParams['TYPE']) {
                    case 'CHECKBOX':
                        $input = '<input type="checkbox" name="'.$opt.'" id="'.$opt.'" value="Y"'.($val === 'Y'
                                ? ' checked' : '').' '.($arOptParams['REFRESH'] === 'Y' ? 'onclick="document.forms[\''
                                .$moduleIdHtml.'\'].submit();"' : '').' />';
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
                            ($arOptParams['REFRESH'] == 'Y' ? "class='typeselect refresh'" : ''),
                            ($arOptParams['REFRESH'] == 'Y' ? true : false),
                            ($arOptParams['REFRESH'] == 'Y' ? $moduleIdHtml : '')
                        );
                        if($arOptParams['REFRESH'] === 'Y') {
                            $input .= '<input type="submit" name="refresh" value="OK" />';
                        }
                        break;
                    case 'MSELECT':
                        $input = SelectBoxMFromArray($opt.'[]', $arOptParams['VALUES'], $val ?? [""]);
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

                    case 'UPLOAD_IMAGE':
                        $input = \CFileInput::Show(
                            $opt, $val,
                            [
                                'PATH'        => 'Y',
                                'FILE_SIZE'   => 'Y',
                                'DIMENSIONS'  => 'Y',
                                'IMAGE_POPUP' => 'Y',
                                'MAX_SIZE'    => [
                                    'W' => $arOptParams['WIDTH'] ?? 200,
                                    'H' => $arOptParams['HEIGHT'] ?? 200,
                                ],
                            ],
                            [
                                "maxCount" => $arOptParams['MAX_COUNT'],
                                'upload'      => true,
                                'medialib'    => true,
                                'file_dialog' => true,
                                'cloud'       => true,
                                'del'         => true,
                                'description' => $arOptParams['DESCRIPTION'] == "Y" ? true : false,
                            ]
                        );

                        /*$input = \Bitrix\Main\UI\FileInput::createInstance([
                            "name"        => $opt,
                            "description" => $arOptParams['DESCRIPTION'] === "Y" ? true : false,
                            "upload"      => true,
//                             "allowUpload" => "I",
                            "medialib"    => true,
                            "fileDialog"  => true,
                            "cloud"       => true,
                            "delete"      => true,
                            "maxCount"    => $arOptParams['MAX_COUNT'],
                        ])->show($_REQUEST[$opt] ? : ($val ? : 0));*/


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
                            .htmlspecialchars($val).'" min="0" name="'.htmlspecialchars($option).'" />';
                        if($arOptParams['REFRESH'] === 'Y') {
                            $input .= '<input type="submit" name="refresh" value="OK" />';
                        }
                        break;
                }
                $notes = '';
                $notes = '';
                if(isset($arOptParams['NOTES'])
                    && $arOptParams['NOTES'] != ''
                ) //$notes =     '<tr width="30%"><td align="center" colspan="2">
                {
                    $notes = '<div class="list-notes-column">'.$arOptParams['NOTES'].'</div>';
                }


                if(!empty($arOptParams['AFTER_TEXT'])) {
                    $input .= ' '.$arOptParams['AFTER_TEXT'];
                }

                $arP[$this->arGroups[$arOptParams['GROUP']]['TAB']][$arOptParams['GROUP']]['OPTIONS'][] = $label != ''
                    ? '<tr class="list-row"><td class="list-label">'.$label.'</td><td class="list-input">'.$input
                    .'</td><td class="list-notes">'.$notes.'</td></tr> '
                    : '<tr><td colspan="3" >'.$input.'</td></tr>'.$notes.' ';
                $arP[$this->arGroups[$arOptParams['GROUP']]['TAB']][$arOptParams['GROUP']]['OPTIONS_SORT'][]
                    = $arOptParams['SORT'];
            }

            $tabControl = new \CAdminTabControl('tabControl', $this->arTabs);
            $tabControl->Begin();
            echo '<form name="'.$moduleIdHtml.'" method="POST" action="'.$APPLICATION->GetCurPage().'?mid='
                .$this->moduleId.'&lang='.LANGUAGE_ID.'" enctype="multipart/form-data">'.bitrix_sessid_post();

            foreach($arP as $tab => $groups) {
                $tabControl->BeginNextTab();

                // show bottom warning in tab
                $selectTab = $tabControl->tabIndex - 1;
                if($selectTab >= 0 && $this->arTabs[$selectTab] && $this->arTabs[$selectTab]['WARNING_TEXT'] !== null) {
                    \CAdminMessage::ShowMessage($this->arTabs[$selectTab]['WARNING_TEXT']);
                }

                foreach($groups as $group_id => $group) {
                    if(is_array($group['OPTIONS_SORT']) && count($group['OPTIONS_SORT']) > 0) {
                        echo '<tr class="heading"><td colspan="3">'.$this->arGroups[$group_id]['TITLE'].'</td></tr>';

                        array_multisort($group['OPTIONS_SORT'], $group['OPTIONS']);
                        foreach($group['OPTIONS'] as $opt) {
                            echo $opt;
                        }
                    }
                }
            }

            if($this->need_access_tab) {
                $tabControl->BeginNextTab();
                $module_id = $this->moduleId;
                require_once($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/main/admin/group_rights.php");
            }

            $tabControl->Buttons();

            // <input type="reset" name="reset" value="'.l::get("CORE_submit_cancel").'" />
            echo '<input 
					type="hidden" 
					value="'.$this->request->get("tabControl_active_tab").'" 
					name="tabControl_active_tab" 
					id="tabControl_active_tab" />
					
					<input type="hidden" name="update" value="Y" />
                    <input type="submit" class="adm-btn-save" name="save" value="'.l::get("CORE_submit_save").'" />
                    
                    </form>';

            bitrix_sessid_post();


            ?>
            <style>
                .list-label, .list-input, .list-notes {
                    padding: 5px 0 5px 20px;
                    height: 4vh;
                }

                .list-row {
                    border: 10px solid #F5F9F9;
                }

                .list-row:nth-child(odd) {
                    background-color: #e0e8ea70;
                }

                .list-label {
                    text-align: left;
                    width: 30%;
                    font-weight: bold;
                }

                .list-input {
                    text-align: left;
                    width: 30%;
                }

                .list-notes {
                    width: 40%;
                }

                .list-notes-column {
                    text-align: left;
                }
            </style>

            <?php


            $tabControl->End();
        }
    }
}

?>