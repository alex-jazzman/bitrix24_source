import { Reflection, Type } from 'main.core';

export function isAutomationAvailable(): boolean
{
	return !Type.isNull(Reflection.getClass('BX.Bizproc.Automation'));
}
