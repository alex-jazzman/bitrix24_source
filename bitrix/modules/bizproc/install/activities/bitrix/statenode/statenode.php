<?php

if (!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED !== true)
{
	die();
}

use Bitrix\Bizproc\Internal\Entity\Workflow\ExecutionPayload;
use Bitrix\Bizproc\Public\Activity\Structure\FlowListenerTrait;

/** @property-read array Permission */
/** @property-read int PermissionMode */
/** @property-read int PermissionScope */
class CBPStateNode extends CBPActivity implements IBPActivityEventListener
{
	use FlowListenerTrait;

	private const IN_PORT_INIT = 0;
	private const IN_PORT_FIN = 1;
	private const IN_PORT_WAIT = 2;

	private const OUT_PORT_INIT = 0;
	private const OUT_PORT_FIN = 1;
	private const OUT_PORT_WAIT = 2;

	public function __construct($name)
	{
		parent::__construct($name);
		$this->arProperties = [
			"Title" => "",
			"Permission" => [],
			"PermissionMode" => null,
			"PermissionScope" => null,
		];
	}

	public function executeWithPayload(ExecutionPayload $payload)
	{
		$stateService = $this->workflow->getStateService();
		$stateService->setState(
			$this->getWorkflowInstanceId(),
			[
				"STATE" => $this->getName(),
				"TITLE" => $this->getTitle(),
				"PARAMETERS" => [],
			],
			$this->getPermissions()
		);

		$port = $payload->getInputPort();

		if ($port === self::IN_PORT_INIT)
		{
			$this->outputPortId = self::OUT_PORT_INIT;

			return CBPActivityExecutionStatus::Closed;
		}

		if ($port === self::IN_PORT_FIN)
		{
			$this->outputPortId = self::OUT_PORT_FIN;

			return CBPActivityExecutionStatus::Closed;
		}

		$this->outputPortId = self::OUT_PORT_WAIT;

		return $this->executeState();
	}

	private function getPermissions(): array
	{
		$permissions = $this->Permission;
		$permissionMode = $this->PermissionMode;
		$permissionScope = $this->PermissionScope;

		if (is_array($permissions))
		{
			foreach ($permissions as $k1 => $v1)
			{
				$v2 = [];
				foreach ($v1 as $v3)
				{
					$v2[] = (mb_strpos($v3, "{=") === 0 ? $v3 : "{=user:" . $v3 . "}");
				}
				if (count($v2) > 0)
				{
					$permissionText[] = $k1 . ": " . implode(", ", $v2);
				}
			}
		}

		if (!empty($permissionMode))
		{
			$permissions['__mode'] = $permissionMode;
		}
		if (!empty($permissionScope))
		{
			$permissions['__scope'] = $permissionScope;
		}

		if ($permissionText)
		{
			$this->WriteToTrackingService(
				GetMessage("BPSA_TRACK_1", ['#VAL#' => implode(";", $permissionText)])
			);
		}

		return $permissions;
	}

	private function executeState()
	{
		$this->subscribeOutputFlow(self::OUT_PORT_WAIT);

		return CBPActivityExecutionStatus::Closed;
	}

	public function onEvent(CBPActivity $sender, $arEventParameters = [])
	{
		$this->onFlowEvent($sender, self::OUT_PORT_WAIT);
	}

	public static function getPropertiesDialog()
	{
		CBPRuntime::getRuntime()->includeActivityFile('StateActivity');

		return CBPStateActivity::getPropertiesDialog(...func_get_args());
	}

	public static function getPropertiesDialogValues()
	{
		CBPRuntime::getRuntime()->includeActivityFile('StateActivity');

		return CBPStateActivity::getPropertiesDialogValues(...func_get_args());
	}
}
