import { configureOtpAnalytics, prepareOtpAnalyticsData } from '../../src/analytics';

describe('OtpAuth analytics', () => {
	afterEach(() => {
		configureOtpAnalytics();
	});

	it('should append user id to otp analytics data', () => {
		configureOtpAnalytics({ userId: 42 });

		assert.deepEqual(prepareOtpAnalyticsData({
			event: 'show',
		}), {
			tool: 'security',
			category: 'fa_auth_form',
			event: 'show',
			p5: 'userId_42',
		});
	});

	it('should skip empty user id', () => {
		configureOtpAnalytics({ userId: 0 });

		assert.deepEqual(prepareOtpAnalyticsData({
			event: 'show',
		}), {
			tool: 'security',
			category: 'fa_auth_form',
			event: 'show',
		});
	});
});
