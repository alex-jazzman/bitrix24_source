import { Loc, Text } from 'main.core';
import { Center as NotificationCenter } from 'ui.notification';

// Copied from call.core icons (CALL_PHONE_SVG). Inlined here on purpose so the thin facade
// does not depend on call.core, which must not load when the new core engine is active.
const CALL_PHONE_SVG = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 14 14' fill='none'%3E%3Cpath fill-rule='evenodd' clip-rule='evenodd' d='M11.4898 9.16245L13.5108 10.6311C14.1215 11.081 14.1688 11.9701 13.6054 12.4772C11.4924 14.4356 7.97177 15.1958 3.33697 10.4435C-1.2979 5.69121 -0.376129 2.28926 1.73683 0.330898C2.29964 -0.176043 3.19623 -0.0921704 3.62458 0.52528L5.03805 2.53011C5.5331 3.26605 5.22041 4.26872 4.46091 4.76034L3.61245 5.30957C3.41748 5.43002 3.36316 5.6824 3.46778 5.87581C4.56505 7.74363 6.15032 9.3805 8.00435 10.5535C8.18926 10.657 8.45482 10.6035 8.58372 10.4328L9.18285 9.60919C9.70675 8.89133 10.7721 8.63946 11.4898 9.16245Z' fill='%2311A9D9'/%3E%3C/svg%3E";

// Toast shown on the active tab when the call is already running in another tab.
export function notifyCallInAnotherTab(): void
{
	const icon = `<img src="${CALL_PHONE_SVG}" width="14" height="14" style="vertical-align: middle; margin-right: 6px;" alt="">`;
	NotificationCenter.notify({
		content: `${icon} ${Text.encode(Loc.getMessage('CALL_MULTI_TAB_BALLOON_TEXT') ?? '')}`,
		position: 'top-right',
		autoHideDelay: 10000,
		closeButton: true,
	});
}
