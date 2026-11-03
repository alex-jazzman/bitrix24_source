import { ViewUiState } from 'call.mapping';

// Every known ui state but Preparing. The list is spelled out on purpose: uiState comes from the
// outside unchecked, and a value outside the enum must hide the menu rather than show it.
export function isBottomCenterMenuVisible(uiState)
{
	return uiState === ViewUiState.Initializing
		|| uiState === ViewUiState.Calling
		|| uiState === ViewUiState.Connected
		|| uiState === ViewUiState.Error;
}
