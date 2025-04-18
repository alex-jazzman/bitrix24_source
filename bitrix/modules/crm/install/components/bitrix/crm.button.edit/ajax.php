<?php
use Bitrix\Main\Loader;
use Bitrix\Crm\SiteButton\Manager;
use Bitrix\Crm\SiteButton\Internals\AvatarTable;
use Bitrix\Main\Localization\Loc;

define('STOP_STATISTICS', true);
define('BX_SECURITY_SHOW_MESSAGE', true);

require_once($_SERVER['DOCUMENT_ROOT'].'/bitrix/modules/main/include/prolog_before.php');

if (!Loader::includeModule('crm'))
{
	return;
}

Loc::loadMessages(__FILE__);

class CrmSiteButtonEditAjaxController extends \Bitrix\Crm\SiteButton\ComponentController
{
	protected function getActions()
	{
		return array(
			'addAvatarFile',
			'removeAvatarFile',
		);
	}

	protected function removeAvatarFile()
	{
		$fileId = $this->request->get('fileId');
		$this->responseData['fileId'] = $fileId;
		if (!$this->checkPermissionsWrite() || !$fileId)
		{
			$this->errors[] = Loc::getMessage('CRM_PERMISSION_DENIED');
			return;
		}

		$listDb = AvatarTable::getList(array(
			'select' => array('ID', 'FILE_ID'),
			'filter' => array('=FILE_ID' => $fileId)
		));
		while ($item = $listDb->fetch())
		{
			$deleteResult = AvatarTable::delete($item['ID']);
			if ($deleteResult->isSuccess())
			{
				CFile::Delete($item['FILE_ID']);
			}
		}
	}

	protected function addAvatarFile()
	{
		if (!$this->checkPermissionsWrite())
		{
			$this->errors[] = Loc::getMessage('CRM_PERMISSION_DENIED');
			return;
		}

		if (!isset($_FILES["avatar_file"]))
		{
			return;
		}

		$file = $_FILES["avatar_file"];
		if(!is_uploaded_file($file["tmp_name"]))
		{
			return;
		}

		if($file["name"] == '' || intval($file["size"]) == 0)
		{
			return;
		}

		$names = explode('/', $file["type"]);
		if ($names[1])
		{
			$file["name"] .= '.' . $names[1];
		}


		$checkResponse = CFile::CheckImageFile($file);
		if ($checkResponse !== null)
		{
			$this->errors[] = $checkResponse;
			return;
		}

		$file["MODULE_ID"] = "crm";
		$fileId = intval(CFile::SaveFile($file, "crm", true, false, 'button'));
		if($fileId > 0)
		{
			$addResult = AvatarTable::add(array('FILE_ID' => $fileId));
			$addResult->isSuccess();
		}

		$list = Manager::getAvatars();
		foreach ($list as $item)
		{
			if ($item['ID'] == $fileId)
			{
				$this->responseData['fileId'] = $item['ID'];
				$this->responseData['filePath'] = $item['PATH'];
				return;
			}
		}
	}

	protected function checkPermissionsWrite()
	{
		return \Bitrix\Crm\Service\Container::getInstance()->getUserPermissions()->siteButton()->canEdit();
	}

	protected function checkPermissions()
	{
		return \Bitrix\Crm\Service\Container::getInstance()->getUserPermissions()->siteButton()->canRead();
	}

	protected function prepareRequestData()
	{
		$this->requestData = array(
			'BUTTON_ID' => intval($this->request->get('button_id'))
		);
	}
}

$controller = new CrmSiteButtonEditAjaxController();
$controller->exec();