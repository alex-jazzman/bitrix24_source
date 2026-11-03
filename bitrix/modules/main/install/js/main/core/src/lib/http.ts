import Cookie from './http/cookie';
import Data from './http/data';

/**
 * @memberOf BX
 */
export default class Http
{
	static Cookie: typeof Cookie = Cookie;
	static Data: typeof Data = Data;
}
