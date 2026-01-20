import { TranscriptStatus } from '../../../../../../model/files/src/transcript/types';

export type Speech2Text = {
	text: string,
	textColor: string,
	status: TranscriptStatus,
}
