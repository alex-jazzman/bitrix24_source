<?if(!Defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED!==true) die();

	function AddTableData($source = Array(),$data = Array(), $data_name = "", $dataID = false)
	{
		global $APPLICATION;
		if($dataID == false)
			$dataID = "data".rand(1,10000);
		$source["data"][$dataID] = $data;
		$source["names"][$dataID] = $data_name;

		return $source;
	}

	function defineApiVersion()
	{
		global $APPLICATION;

		$apiVersion = $_REQUEST["api_version"] ?? null;
		if ($apiVersion)
		{
			$APPLICATION->set_cookie("MOBILE_APP_VERSION", intval($apiVersion), time() + 60 * 60 * 24 * 30 * 12 * 2);
			$api_version = intval($apiVersion);
		}
		else
		{
			$api_version = $APPLICATION->get_cookie("MOBILE_APP_VERSION");
			if (!$api_version)
			{
				$api_version = 1;
			}
		}

		$APPLICATION->SetPageProperty("api_version", $api_version);
	}
?>