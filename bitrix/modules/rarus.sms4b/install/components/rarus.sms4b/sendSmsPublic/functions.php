<?php //some fuctions definitions
function ShowStructureSection(&$arStructure, &$usersInStructure, $bUpper = false)
{
    if (!empty($arStructure)) {
        foreach ($arStructure as &$department) {
            if ($department['DEPTH_LEVEL'] == 1) {
                $department['PARENT_ID'] = 0;
            }
            $departmentList = herarhy($department, $departmentList);
        }
    }
    ShowHtmlDepartment($departmentList, true);
}

/**
 * @param unknown_type $departmentList
 */
function ShowHtmlDepartment($departmentList, $bUpper = false)
{
    if (!empty($departmentList)) {
        foreach ($departmentList as $department):?>
            <div class="vcsd-user-section<?= $bUpper ? ' vcsd-user-section-upper' : '' ?>"
                 onclick="BxecCS_SwitchSection(document.getElementById('dep_<?= $department['DEPARTMENT']['ID'] ?>_arrow'), '<?= $department['DEPARTMENT']['ID'] ?>', arguments[0] || window.event);"
                 title="<?= GetMessage('EC_OPEN_CLOSE_SECT') ?>">
                <table>
                    <tr>
                        <td>
                            <div style="width: <?= (($department['DEPTH_LEVEL'] - 1) * 15) ?>px"></div>
                        </td>
                        <?
                        if (is_array($department['CHILDREN']) && count($department['CHILDREN']) > 0):?>
                            <td class="vcsd-arrow-cell">
                                <div id="dep_<?= $department['DEPARTMENT']['ID'] ?>_arrow"
                                     class="vcsd-arrow-right"></div>
                            </td>
                        <? else:?>
                            <td class="vcsd-list-cell">
                                <div id="dep_<?= $department['DEPARTMENT']['ID'] ?>_arrow"></div>
                            </td>
                        <?endif; ?>
                        <td><input type="checkbox" value="<?= $department['DEPARTMENT']['ID'] ?>"
                                   id="dep_<?= $department['DEPARTMENT']['ID'] ?>" onclick="BxecCS_CheckGroup(this);"
                                   title='<?= GetMessage('EC_SELECT_SECTION',
                                       ['#SEC_TITLE#' => $department['DEPARTMENT']['NAME']]) ?>'/></td>
                        <td class="vcsd-contact-section"><?= $department['DEPARTMENT']['NAME'] ?></td>
                    </tr>
                </table>
            </div>
            <div style="display: none;" id="<?= $department['DEPARTMENT']['ID'] ?>" class="vcsd-user-contact-block">
                <?
                if ( isset($department['CHILDREN'])
                    && is_array($department['CHILDREN']) && count($department['CHILDREN']) > 0) {
                    ShowHtmlDepartment($department['CHILDREN'], false);
                }
                ?>
            </div>
        <?endforeach;
    }
}

/**
 * @param $department
 * @param $array
 *
 * @return array
 */
function herarhy($department, $array)
{
    if (empty($array)) {
        $array[] = [
            'DEPARTMENT'  => $department,
            'DEPTH_LEVEL' => $department['DEPTH_LEVEL'],
            'CHILDREN'    => []
        ];
    } else {
        end($array);
        $lastKey = key($array);
        if ($array[$lastKey]['DEPTH_LEVEL'] + 1 == $department['DEPTH_LEVEL']) {
            $array[$lastKey]['CHILDREN'][] = [
                'DEPARTMENT'  => $department,
                'DEPTH_LEVEL' => $department['DEPTH_LEVEL'],
                'CHILDREN'    => []
            ];
        } elseif (is_array($array[$lastKey]['CHILDREN']) && count($array[$lastKey]['CHILDREN']) > 0) {
            $last['CHILDREN'] = herarhy($department, $array[$lastKey]['CHILDREN']);
        }
    }
    return $array;
}
