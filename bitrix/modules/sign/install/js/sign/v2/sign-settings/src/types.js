import type { BlankSelectorConfig } from 'sign.v2.blank-selector';
import type { DocumentSendConfig } from 'sign.v2.b2b.document-send';
import type { UserPartyConfig } from 'sign.v2.b2e.user-party';

export type SignOptions = {
	uid: ?string;
	type: ?string;
	config: {
		blankSelectorConfig: BlankSelectorConfig;
		documentSendConfig: DocumentSendConfig;
		userPartyConfig: UserPartyConfig;
	}
};
