<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

abstract class CBaseModuleMoveWizardStep extends CWizardStep
{
	public function InitStep()
	{
		global $DB;
		$wizard = $this->GetWizard();
		$node_id = intval($wizard->GetVar('node_id'));

		if (!CModule::IncludeModule('cluster'))
		{
			$this->SetError(GetMessage('CLUWIZ_NO_MODULE_ERROR'));
		}
		elseif ($DB->type != 'MYSQL')
		{
			$this->SetError(GetMessage('CLUWIZ_DATABASE_NOT_SUPPORTED'));
		}
		elseif ($node_id <= 0)
		{
			$this->SetError(GetMessage('CLUWIZ_NO_NODE_ERROR'));
		}
	}

	abstract public function ShowStepNoError();

	public function ShowStep()
	{
		if (count($this->GetErrors()) == 0)
		{
			$this->ShowStepNoError();
		}

		$this->content .= '<style>
			li.cluwiz_erli { list-style-image:url(/bitrix/themes/.default/images/lamp/red.gif) }
			li.cluwiz_okli { list-style-image:url(/bitrix/themes/.default/images/lamp/green.gif) }
			p.cluwiz_err { color:red }
			span.cluwiz_ok { color:green }
			</style>
		';
	}
}

class CModuleMoveStep1 extends CBaseModuleMoveWizardStep
{
	public function InitStep()
	{
		parent::InitStep();
		$wizard = $this->GetWizard();

		if ($wizard->GetVar('status') == 'READY')
		{
			$this->SetTitle(GetMessage('CLUWIZ_STEP1_TITLE1'));
		}
		else
		{
			$this->SetTitle(GetMessage('CLUWIZ_STEP1_TITLE2'));
		}

		$this->SetStepID('step1');
		$this->SetCancelStep('cancel');
	}

	public function ShowStepNoError()
	{
		$wizard = $this->GetWizard();
		$strNextStep = '';

		if (count($this->GetErrors()) == 0)
		{
			$arNode = CClusterDBNode::GetByID($wizard->GetVar('node_id'));
			if (is_array($arNode))
			{
				$arModules = [];
				foreach (GetModuleEvents('cluster', 'OnGetTableList', true) as $arEvent)
				{
					$ar = ExecuteModuleEventEx($arEvent);
					if (is_array($ar))
					{
						$cur_node_id = intval(COption::GetOptionString($ar['MODULE']->MODULE_ID, 'dbnode_id'));
						if ($cur_node_id < 1)
						{
							$cur_node_id = 1;
						}
						$cur_node_id = CClusterDBNode::GetByID($cur_node_id);
						$arModules[$ar['MODULE']->MODULE_ID] = $ar['MODULE']->MODULE_NAME . ' (' . $cur_node_id['NAME'] . ')';
					}
				}

				$arNodes = [];
				$curNodeName = '';
				$rsDBNodes = CClusterDBNode::GetList(
					['ID' => 'ASC']
					,[
						'=ACTIVE' => 'Y',
						'=ROLE_ID' => ['MODULE', 'MAIN'],
						'=STATUS' => ['READY', 'ONLINE'],
					]
					,['ID', 'NAME']
				);
				while ($arDBNode = $rsDBNodes->Fetch())
				{
					if ($arDBNode['ID'] != $wizard->GetVar('node_id'))
					{
						$arNodes[$arDBNode['ID']] = $arDBNode['NAME'];
					}
					else
					{
						$curNodeName = $arDBNode['NAME'];
					}
				}

				$arOtherModules = $arModules;

				$arNodeModules = CClusterDBNode::GetModules($wizard->GetVar('node_id'));
				foreach ($arNodeModules as $key => $_)
				{
					$arNodeModules[$key] = $arModules[$key];
					unset($arOtherModules[$key]);
				}

				if ($arNode['STATUS'] == 'READY')
				{
					$this->content .= GetMessage('CLUWIZ_STEP1_CONTENT1', [
						'#database#' => $curNodeName,
						'#module_select_list#' => $this->ShowSelectField('module', $arOtherModules),
					]);
					$this->content .= $this->ShowHiddenField('to_node_id', $wizard->GetVar('node_id'));
					$strNextStep = 'step2';
				}
				elseif ($arNode['STATUS'] == 'ONLINE')
				{
					$this->content .= GetMessage('CLUWIZ_STEP1_CONTENT2', [
						'#database_select_list#' => $this->ShowSelectField('to_node_id', $arNodes),
					]);
					$this->content .= $this->ShowHiddenField('from_node_id', $wizard->GetVar('node_id'));
					$strNextStep = 'step3';
				}
			}
		}

		if ($strNextStep)
		{
			$this->SetNextStep('step2');
		}
	}

	public function OnPostForm()
	{
		$wizard = $this->GetWizard();
		if ($wizard->IsNextButtonClick())
		{
			if ($wizard->GetVar('module'))
			{
				$module = $wizard->GetVar('module');
			}
			else
			{
				$arNodeModules = CClusterDBNode::GetModules($wizard->GetVar('from_node_id'));
				$module = key($arNodeModules);
			}
			COption::SetOptionString($module, 'dbnode_status', 'ok');
			global $MAIN_MODULE_INCLUDED;
			unset($MAIN_MODULE_INCLUDED[$module]);
		}
	}
}

//Move module to selected node
class CModuleMoveStep2 extends CBaseModuleMoveWizardStep
{
	public $nodeDB;

	public function InitStep()
	{
		parent::InitStep();
		$wizard = $this->GetWizard();

		$this->SetTitle(GetMessage('CLUWIZ_STEP2_TITLE'));
		$this->SetPrevStep('step1');
		$this->SetStepID('step2');
		$this->SetCancelStep('cancel');

		if (count($this->GetErrors()) == 0)
		{
			$to_node_id = $wizard->GetVar('to_node_id');
			if ($to_node_id < 2)
			{
				$this->nodeDB = $GLOBALS['DB'];
			}
			else
			{
				$this->nodeDB = CDatabase::GetDBNodeConnection($to_node_id, true, false);
			}

			if (!is_object($this->nodeDB))
			{
				$this->SetError(GetMessage('CLUWIZ_NO_CONN_ERROR'));
			}
		}
	}

	public function ShowStepNoError()
	{
		global $APPLICATION;
		$wizard = $this->GetWizard();
		$path = $wizard->package->path;

		if (count($this->GetErrors()) == 0)
		{
			if ($wizard->GetVar('module'))
			{
				$module = $wizard->GetVar('module');
			}
			else
			{
				$arNodeModules = CClusterDBNode::GetModules($wizard->GetVar('from_node_id'));
				$module = key($arNodeModules);
			}

			$arTables = false;
			foreach (GetModuleEvents('cluster', 'OnGetTableList', true) as $arEvent)
			{
				if ($module === $arEvent['TO_MODULE_ID'])
				{
					$arTables = ExecuteModuleEventEx($arEvent);
					break;
				}
			}

			if (is_array($arTables))
			{
				$arTablesToDelete = [];
				foreach ($arTables['TABLES'] as $table_name => $_)
				{
					if ($this->nodeDB->TableExists($table_name))
					{
						$arTablesToDelete[] = $table_name;
					}
				}

				if (empty($arTablesToDelete))
				{
					$this->content .= GetMessage('CLUWIZ_STEP2_NO_TABLES');
					$this->SetNextStep('step4');
				}
				else
				{
					if ($wizard->GetVar('to_node_id'))
					{
						$arNode = CClusterDBNode::GetByID($wizard->GetVar('to_node_id'));
					}
					else
					{
						$arNode = CClusterDBNode::GetByID($wizard->GetVar('node_id'));
					}

					$wizard->SetVar('action', '');
					CJSCore::Init(['ajax']);
					\Bitrix\Main\UI\Extension::load('main.core');
					$APPLICATION->AddHeadScript($path . '/js/import.js');

					$this->content .= GetMessage('CLUWIZ_STEP2_TABLES_EXIST');
					$this->content .= '<br /><a style="text-decoration:none;border-bottom:1px dashed #2775C7;" onclick="if(document.getElementById(\'tables\').style.display==\'block\'){document.getElementById(\'tables\').style.display=\'none\';}else{document.getElementById(\'tables\').style.display=\'block\';}">' . GetMessage('CLUWIZ_STEP2_TABLES_LIST') . '</a>';
					$this->content .= '<div id="tables" style="display:none">' . implode('<br />', $arTablesToDelete) . '</div>';
					$this->content .= '<br /><br />' . $this->ShowCheckboxField('action', 'delete', [
						'id' => 'action',
						'onclick' => 'if(this.checked){EnableButton();}else{DisableButton();}',
					]) . '<label for="action">' . GetMessage('CLUWIZ_STEP2_DELETE_TABLES', ['#database#' => $arNode['NAME']]) . '</label>';

					$this->content .= '
						<script type="text/javascript">
							var nextButtonID = "' . $wizard->GetNextButtonID() . '";
							var formID = "' . $wizard->GetFormName() . '";
							BX.ready(DisableButton);
						</script>
					';

					$this->SetNextStep('step3');
				}
			}
		}
	}
}

//Drop tables
class CModuleMoveStep3 extends CBaseModuleMoveWizardStep
{
	public function InitStep()
	{
		parent::InitStep();
		$this->SetTitle(GetMessage('CLUWIZ_STEP3_TITLE'));
		$this->SetPrevStep('step2');
		$this->SetStepID('step3');
		$this->SetNextStep('step4');
		$this->SetCancelStep('cancel');
	}

	public function ShowStepNoError()
	{
		global $APPLICATION;
		$wizard = $this->GetWizard();
		$path = $wizard->package->path;
		$to_node_id = $wizard->GetVar('to_node_id');

		if ($wizard->GetVar('module'))
		{
			$module = $wizard->GetVar('module');
		}
		else
		{
			$arNodeModules = CClusterDBNode::GetModules($wizard->GetVar('from_node_id'));
			$module = key($arNodeModules);
		}

		CJSCore::Init(['ajax']);
		\Bitrix\Main\UI\Extension::load('main.core');
		$APPLICATION->AddHeadScript($path . '/js/import.js');

		$this->content = '';
		$this->content .= '<div style="padding: 20px;">';
		$this->content .= '<div id="output"><br /></div>';
		$this->content .= '</div>';
		$this->content .= '
			<script type="text/javascript">
				var nextButtonID = "' . $wizard->GetNextButtonID() . '";
				var formID = "' . $wizard->GetFormName() . '";
				var LANG = \'' . LANG . '\';
				var toNodeId = "' . CUtil::JSEscape($to_node_id) . '";
				var module = "' . CUtil::JSEscape($module) . '";
				var path = "' . CUtil::JSEscape($path) . '";
				var sessid = "' . bitrix_sessid() . '";
				BX.ready(DisableButton);
				BX.ready(DropTables);
			</script>
		';
	}
}

//Datamove
class CModuleMoveStep4 extends CBaseModuleMoveWizardStep
{
	protected $location = '';

	public function InitStep()
	{
		parent::InitStep();
		$this->SetTitle(GetMessage('CLUWIZ_STEP4_TITLE'));
		$this->SetStepID('step4');
		$this->SetNextStep('step4');
		$this->SetNextCaption(GetMessage('CLUWIZ_FINALSTEP_BUTTONTITLE'));
	}

	public function ShowStepNoError()
	{
		global $APPLICATION;
		$wizard = $this->GetWizard();
		$path = $wizard->package->path;
		$to_node_id = $wizard->GetVar('to_node_id');

		if ($wizard->GetVar('module'))
		{
			$module = $wizard->GetVar('module');
			$from_node_id = intval(COption::GetOptionString($module, 'dbnode_id'));
			if ($from_node_id <= 0)
			{
				$from_node_id = 1;
			}
		}
		else
		{
			$from_node_id = $wizard->GetVar('from_node_id');
			$arNodeModules = CClusterDBNode::GetModules($wizard->GetVar('from_node_id'));
			$module = key($arNodeModules);
		}

		if ($this->location)
		{
			$this->content = '<script>top.window.location = \'' . CUtil::JSEscape($this->location) . '\';</script>';
		}
		else
		{
			CJSCore::Init(['ajax']);
			\Bitrix\Main\UI\Extension::load('main.core');
			$APPLICATION->AddHeadScript($path . '/js/import.js');

			$this->content = '';
			$this->content .= '<div style="padding: 20px;">';
			$this->content .= '<div id="output"><br /></div>';
			$this->content .= '</div>';
			if ($wizard->GetPrevStepID() == 'step1' || $wizard->GetPrevStepID() == 'step2')
			{
				$this->content .= '
					<script type="text/javascript">
						var nextButtonID = "' . $wizard->GetNextButtonID() . '";
						var formID = "' . $wizard->GetFormName() . '";
						var LANG = \'' . LANG . '\';
						var fromNodeId = "' . CUtil::JSEscape($from_node_id) . '";
						var toNodeId = "' . CUtil::JSEscape($to_node_id) . '";
						var module = "' . CUtil::JSEscape($module) . '";
						var nodeStatus = "' . CUtil::JSEscape($wizard->GetVar('status')) . '";
						var path = "' . CUtil::JSEscape($path) . '";
						var sessid = "' . bitrix_sessid() . '";
						BX.ready(DisableButton);
						BX.ready(MoveTables);
					</script>
				';
			}
		}
	}

	public function OnPostForm()
	{
		$wizard = $this->GetWizard();
		if ($wizard->IsNextButtonClick())
		{
			$this->location = '/bitrix/admin/cluster_dbnode_list.php?lang=' . LANGUAGE_ID;
		}
	}
}

class CModuleMoveCancelStep extends CBaseModuleMoveWizardStep
{
	public function InitStep()
	{
		parent::InitStep();
		$this->SetTitle(GetMessage('CLUWIZ_CANCELSTEP_TITLE'));
		$this->SetStepID('cancel');
		$this->SetCancelStep('cancel');
		$this->SetCancelCaption(GetMessage('CLUWIZ_CANCELSTEP_BUTTONTITLE'));
	}

	public function ShowStepNoError()
	{
		$this->content = GetMessage('CLUWIZ_CANCELSTEP_CONTENT');
	}
}
