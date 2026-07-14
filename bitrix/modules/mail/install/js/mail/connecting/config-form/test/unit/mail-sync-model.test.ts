import { describe, it } from 'mocha';
import { assert } from 'chai';

import { App } from '../../src/components/app';

type MailSyncComputed = {
	get: () => { sync: { enabled: boolean; periodValue: string } };
	set: (value: { sync: { enabled: boolean; periodValue: string } }) => void;
};

function getMailSyncComputed(): MailSyncComputed
{
	return (App as unknown as {
		computed: {
			mailSyncModel: MailSyncComputed;
		};
	}).computed.mailSyncModel;
}

describe('MailboxConfigApp mail sync model', () => {
	it('keeps selected period when mail sync is disabled and enabled again', () => {
		const mailSyncModel = getMailSyncComputed();
		const context = {
			state: {
				mailbox: {
					messageMaxAge: 30,
				},
			},
			lastMailSyncPeriodValue: '7',
		};

		mailSyncModel.set.call(context, {
			sync: {
				enabled: false,
				periodValue: '30',
			},
		});

		assert.equal(context.state.mailbox.messageMaxAge, 0);
		assert.equal(mailSyncModel.get.call(context).sync.periodValue, '30');

		mailSyncModel.set.call(context, {
			sync: {
				enabled: true,
				periodValue: '30',
			},
		});

		assert.equal(context.state.mailbox.messageMaxAge, 30);
	});
});
