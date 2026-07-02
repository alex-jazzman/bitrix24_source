<?php
/**
 * @global CUser $USER
 * @global CMain $APPLICATION
 */
use Bitrix\Main;
use Bitrix\Main\Localization\Loc;

require_once __DIR__ . '/../include/prolog_admin_before.php';

if (!$USER->CanDoOperation('edit_other_settings') && !$USER->CanDoOperation('view_other_settings'))
{
	$APPLICATION->AuthForm(Loc::getMessage('ACCESS_DENIED'));
}

$isAdmin = $USER->CanDoOperation('edit_other_settings');

$tableID = 'tbl_main_mail_sender';
$sorting = new CAdminSorting($tableID, 'ID', 'DESC');
$adminList = new CAdminList($tableID, $sorting);

/** @var Main\HttpRequest $request */
$request = Main\Context::getCurrent()->getRequest();

$arFilterFields = [
	'find',
	'find_type',
	'find_name',
	'find_id',
	'find_email',
	'find_public',
];

$filter = $adminList->InitFilter($arFilterFields);
$senderFilter = [];

if ($filter['find_id'] != '')
{
	$senderFilter['=ID'] = $filter['find_id'];
}
if (($filter['find'] != '' && $filter['find_type'] == 'name') || $filter['find_name'] != '')
{
	$senderFilter['%NAME'] = ($filter['find'] != '' && $filter['find_type'] == 'name' ? $filter['find'] : $filter['find_name']);
}
if (($filter['find'] != '' && $filter['find_type'] == 'email') || $filter['find_email'] != '')
{
	$senderFilter['%EMAIL'] = ($filter['find'] != '' && $filter['find_type'] == 'email' ? $filter['find'] : $filter['find_email']);
}
if ($filter['find_public'] != '')
{
	$senderFilter['=IS_PUBLIC'] = $filter['find_public'];
}

if ($adminList->EditAction() && $isAdmin)
{
	foreach ($_POST['FIELDS'] as $ID => $arFields)
	{
		$errors = new Main\ErrorCollection();

		if (!$adminList->IsUpdated($ID))
		{
			continue;
		}
		fillSmtpConfigurationFromPost($ID, $arFields, $errors);

		if (!empty($errors->getValues()))
		{
			$adminList->AddUpdateError('(ID=' . $ID . ') ' . implode('<br>', $errors->getValues()), $ID);
			continue;
		}

		$result = Main\Mail\Internal\SenderTable::update($ID, $arFields);
		if (!$result->isSuccess())
		{
			$adminList->AddUpdateError('(ID=' . $ID . ') ' . implode('<br>', $result->getErrorMessages()), $ID);
		}
	}
}

function fillSmtpConfigurationFromPost(int $id, array &$updateFields, Main\ErrorCollection $errors)
{
	$configuration = Main\Mail\Internal\SenderTable::getById($id)->fetchObject();

	static $formFields = [
		'EMAIL',
		'NAME',
		'IS_PUBLIC',
		'IS_CONFIRMED',
	];

	$fields = $configuration->entity->getFields();
	foreach ($formFields as $fieldName)
	{
		$value = trim($updateFields[$fieldName]);
		if ($fields[$fieldName] instanceof Main\ORM\Fields\BooleanField)
		{
			$value = ($value == 'Y');
		}

		if ($fieldName === 'EMAIL' && !Bitrix\Main\Mail\Address::isValid($value))
		{
			$errors->add([new \Bitrix\Main\Error(Loc::getMessage('smtp_configuration_wrong_field_value', [
				'%FIELD_NAME%' => $fields[$fieldName]->getTitle(),
			]))]);
		}

		$updateFields[$fieldName] = $value;
	}
}

if (($arID = $adminList->GroupAction()) && $isAdmin)
{
	if ($request['action_target'] == 'selected')
	{
		$arID = [];
		$data = Main\Mail\Internal\SenderTable::getList(['filter' => $senderFilter]);
		while ($template = $data->fetch())
		{
			$arID[] = $template['ID'];
		}
	}

	foreach ($arID as $ID)
	{
		if (intval($ID) <= 0)
		{
			continue;
		}

		switch ($request['action_button'])
		{
			case 'delete':
				$result = Main\Mail\Internal\SenderTable::delete($ID);
				if (!$result->isSuccess())
				{
					$adminList->AddGroupError('(ID=' . $ID . ') ' . implode('<br>', $result->getErrorMessages()), $ID);
				}
				break;
		}
	}
}

$APPLICATION->SetTitle(Loc::getMessage('smtp_configuration_admin_title'));

$sortBy = mb_strtoupper($sorting->getField());
if (!Main\Mail\Internal\SenderTable::getEntity()->hasField($sortBy))
{
	$sortBy = 'ID';
}

$sortOrder = mb_strtoupper($sorting->getOrder());
if ($sortOrder != 'ASC')
{
	$sortOrder = 'DESC';
}

$nav = new \Bitrix\Main\UI\AdminPageNavigation('nav-smtp-configuration');

$configurationList = Main\Mail\Internal\SenderTable::getList([
	'filter' => $senderFilter,
	'order' => [$sortBy => $sortOrder],
	'count_total' => true,
	'offset' => $nav->getOffset(),
	'limit' => $nav->getLimit(),
]);

$nav->setRecordCount($configurationList->getCount());

$adminList->setNavigation($nav, Loc::getMessage('smtp_configuration_admin_nav'));

$entity = Main\Mail\Internal\SenderTable::getEntity();
$fields = $entity->getFields();

$adminList->AddHeaders([
	['id' => 'ID', 'content' => 'ID', 'sort' => 'ID', 'default' => true],
	['id' => 'EMAIL', 'content' => $fields['EMAIL']->getTitle(), 'sort' => 'EMAIL', 'default' => true],
	['id' => 'NAME', 'content' => $fields['NAME']->getTitle(), 'sort' => 'NAME', 'default' => true],
	['id' => 'IS_PUBLIC', 'content' => $fields['IS_PUBLIC']->getTitle(), 'sort' => 'IS_PUBLIC', 'default' => true],
	['id' => 'IS_CONFIRMED', 'content' => $fields['IS_CONFIRMED']->getTitle(), 'sort' => 'IS_CONFIRMED', 'default' => true],
]);

while ($configuration = $configurationList->fetchObject())
{
	$id = $configuration->getId();

	$row = $adminList->AddRow($id, $configuration->collectValues(), 'smtp_edit.php?ID=' . $id . '&lang=' . LANGUAGE_ID, Loc::getMessage('smtp_configuration_admin_edit'));

	$row->AddViewField('ID', '<a href="smtp_edit.php?ID=' . $id . '&amp;lang=' . LANGUAGE_ID . '" title="' . Loc::getMessage('smtp_configuration_admin_edit') . '">' . $id . '</a>');
	$row->AddInputField('EMAIL');
	$row->AddInputField('NAME');
	$row->AddCheckField('IS_PUBLIC');
	$row->AddCheckField('IS_CONFIRMED');

	$arActions = [];
	$arActions[] = ['ICON' => 'edit', 'TEXT' => Loc::getMessage('smtp_configuration_admin_edit1'), 'ACTION' => $adminList->ActionRedirect('smtp_edit.php?ID=' . $id)];
	if ($isAdmin)
	{
		$arActions[] = ['ICON' => 'copy', 'TEXT' => Loc::getMessage('smtp_configuration_admin_copy'), 'ACTION' => $adminList->ActionRedirect('smtp_edit.php?COPY_ID=' . $id)];
		$arActions[] = ['SEPARATOR' => true];
		$arActions[] = ['ICON' => 'delete', 'TEXT' => Loc::getMessage('smtp_configuration_admin_del'), 'ACTION' => "if(confirm('" . Loc::getMessage('smtp_configuration_admin_del_conf') . "')) " . $adminList->ActionDoGroup($id, 'delete')];
	}

	$row->AddActions($arActions);
}

$adminList->AddGroupActionTable([
	'delete' => true,
]);

$aContext = [
	[
		'TEXT' => Loc::getMessage('smtp_configuration_admin_add'),
		'LINK' => 'smtp_edit.php?lang=' . LANGUAGE_ID,
		'TITLE' => Loc::getMessage('smtp_configuration_admin_add_title'),
		'ICON' => 'btn_new',
	],
];
$adminList->AddAdminContextMenu($aContext);

$adminList->CheckListMode();

require $_SERVER['DOCUMENT_ROOT'] . BX_ROOT . '/modules/main/include/prolog_admin_after.php';
?>
<form name="find_form" method="GET" action="<?= $APPLICATION->GetCurPage() ?>?">
<?php
$oFilter = new CAdminFilter(
	$tableID . '_filter',
	[
		'id' => $fields['ID']->getTitle(),
		'email' => $fields['EMAIL']->getTitle(),
		'name' => $fields['NAME']->getTitle(),
		'public' => $fields['IS_PUBLIC']->getTitle(),
	]
);

$oFilter->Begin();
?>
<tr>
	<td><b><?= Loc::getMessage('smtp_configuration_admin_find') ?></b></td>
	<td nowrap>
		<input type="text" size="25" name="find" value="<?= htmlspecialcharsbx($filter['find']) ?>" title="<?= Loc::getMessage('F_SEARCH_TITLE') ?>">
		<select name="find_type">
			<option value="email"<?php if ($filter['find_type'] == 'email') echo ' selected'; ?>><?= Loc::getMessage('smtp_configuration_admin_email') ?></option>
			<option value="name"<?php if ($filter['find_type'] == 'name') echo ' selected'; ?>><?= Loc::getMessage('smtp_configuration_admin_username') ?></option>
		</select>
	</td>
</tr>
<tr>
	<td><?= $fields['ID']->getTitle() ?>:</td>
	<td><input type="text" name="find_id" size="47" value="<?= htmlspecialcharsbx($filter['find_id']) ?>"></td>
</tr>
<tr>
	<td><?= $fields['IS_PUBLIC']->getTitle() ?>:</td>
	<td><?php
		$arr = [
			'reference' => [Loc::getMessage('smtp_configuration_admin_yes'), Loc::getMessage('smtp_configuration_admin_no')],
			'reference_id' => ['1', '0'],
		];
		echo SelectBoxFromArray('find_public', $arr, htmlspecialcharsbx($filter['find_public']), Loc::getMessage('smtp_configuration_admin_all'));
	?></td>
</tr>
<tr>
	<td><?= $fields['NAME']->getTitle() ?>:</td>
	<td><input type="text" name="find_name" size="47" value="<?= htmlspecialcharsbx($filter['find_name']) ?>"></td>
</tr>
<tr>
	<td><?= $fields['EMAIL']->getTitle() ?>:</td>
	<td><input type="text" name="find_email" size="47" value="<?= htmlspecialcharsbx($filter['find_email']) ?>"></td>
</tr>
<?php
$oFilter->Buttons(['table_id' => $tableID, 'url' => $APPLICATION->GetCurPage(), 'form' => 'find_form']);
$oFilter->End();
?>
</form>
<?php
$adminList->DisplayList();

require $_SERVER['DOCUMENT_ROOT'] . BX_ROOT . '/modules/main/include/epilog_admin.php';
