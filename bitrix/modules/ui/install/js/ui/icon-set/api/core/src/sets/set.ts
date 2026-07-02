import { Actions } from './actions';
import { Social } from './social';
import { Main } from './main';
import { ContactCenter } from './contact-center';
import { CRM } from './crm';
import { Editor } from './editor';
import { Special } from './special';
import { Animated } from './animated';

export const Set = Object.freeze({
	...Actions,
	...Social,
	...Main,
	...ContactCenter,
	...CRM,
	...Editor,
	...Special,
	...Animated,
});
