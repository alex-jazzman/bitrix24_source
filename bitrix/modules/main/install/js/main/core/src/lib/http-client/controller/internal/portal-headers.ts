export const csrfHeaderName = 'X-Bitrix-Csrf-Token';
export const bxAjaxHeaderName = 'Bx-ajax';
export const siteIdHeaderName = 'X-Bitrix-Site-Id';

/**
 * The portal-specific headers set by the action path on same-origin requests.
 * The transport removes every one of them from the final header set of any
 * cross-origin request (see `HttpClient`), so they never leave the portal origin
 * no matter which layer put them into the request.
 */
export const portalHeaderNames: readonly string[] = [csrfHeaderName, bxAjaxHeaderName, siteIdHeaderName];
