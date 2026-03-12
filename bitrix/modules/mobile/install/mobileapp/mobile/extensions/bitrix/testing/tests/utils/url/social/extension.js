(() => {
	const require = (ext) => jn.require(ext);
	const { describe, it, expect } = require('testing');

	describe('utils/url/social normalizeSocialLink', () => {
		const { normalizeSocialLink, SocialPlatform } = require('utils/url/social');

		describe('General validation', () => {
			it('should return null for empty inputs', () => {
				expect(normalizeSocialLink(SocialPlatform.X, '')).toBe(null);
				expect(normalizeSocialLink(SocialPlatform.X, null)).toBe(null);
				expect(normalizeSocialLink(null, 'username')).toBe(null);
			});

			it('should return null for unsupported platforms', () => {
				expect(normalizeSocialLink('UNKNOWN_PLATFORM', 'username')).toBe(null);
			});

			it('should trim whitespace from input', () => {
				expect(normalizeSocialLink(SocialPlatform.X, '  username  ')).toBe('https://x.com/username');
				expect(normalizeSocialLink(SocialPlatform.X, '  @username  ')).toBe('https://x.com/username');
			});

			it('should handle trailing slashes', () => {
				expect(normalizeSocialLink(SocialPlatform.X, 'username/')).toBe('https://x.com/username');
				expect(normalizeSocialLink(SocialPlatform.X, '/username/')).toBe('https://x.com/username');
			});

			it('should handle edge cases for usernames', () => {
				expect(normalizeSocialLink(SocialPlatform.X, '.username')).toBe(null);
				expect(normalizeSocialLink(SocialPlatform.X, 'username.')).toBe(null);
				expect(normalizeSocialLink(SocialPlatform.X, 'user..name')).toBe(null);
				expect(normalizeSocialLink(SocialPlatform.X, 'username-')).toBe(null);
				expect(normalizeSocialLink(SocialPlatform.X, '-username')).toBe(null);
				expect(normalizeSocialLink(SocialPlatform.X, 'user--name')).toBe(null);
				expect(normalizeSocialLink(SocialPlatform.X, 'user.-name')).toBe(null);
				expect(normalizeSocialLink(SocialPlatform.X, 'user-.name')).toBe(null);
			});
		});

		describe('X (Twitter)', () => {
			it('should normalize full X.com URLs', () => {
				expect(normalizeSocialLink(SocialPlatform.X, 'https://x.com/username')).toBe('https://x.com/username');
				expect(normalizeSocialLink(SocialPlatform.X, 'https://www.x.com/username')).toBe('https://x.com/username');
				expect(normalizeSocialLink(SocialPlatform.X, 'https://x.com/username/')).toBe('https://x.com/username');
			});

			it('should normalize full Twitter.com URLs', () => {
				expect(normalizeSocialLink(SocialPlatform.X, 'https://twitter.com/username')).toBe('https://twitter.com/username');
				expect(normalizeSocialLink(SocialPlatform.X, 'https://www.twitter.com/username')).toBe('https://twitter.com/username');
			});

			it('should normalize usernames with @ symbol', () => {
				expect(normalizeSocialLink(SocialPlatform.X, '@username')).toBe('https://x.com/username');
				expect(normalizeSocialLink(SocialPlatform.X, '@@username')).toBe('https://x.com/username');
			});

			it('should normalize usernames with / symbol', () => {
				expect(normalizeSocialLink(SocialPlatform.X, '/username')).toBe('https://x.com/username');
				expect(normalizeSocialLink(SocialPlatform.X, '//username')).toBe('https://x.com/username');
			});

			it('should normalize plain usernames', () => {
				expect(normalizeSocialLink(SocialPlatform.X, 'username')).toBe('https://x.com/username');
				expect(normalizeSocialLink(SocialPlatform.X, 'user.name')).toBe('https://x.com/user.name');
				expect(normalizeSocialLink(SocialPlatform.X, 'user_name')).toBe('https://x.com/user_name');
			});

			it('should normalize partial URLs', () => {
				expect(normalizeSocialLink(SocialPlatform.X, 'x.com/username')).toBe('https://x.com/username');
				expect(normalizeSocialLink(SocialPlatform.X, 'twitter.com/username')).toBe('https://twitter.com/username');
			});

			it('should handle multi-level paths in partial URLs', () => {
				expect(normalizeSocialLink(SocialPlatform.X, 'x.com/user/status/123')).toBe('https://x.com/user/status/123');
				expect(normalizeSocialLink(SocialPlatform.X, 'twitter.com/i/topics/123456')).toBe('https://twitter.com/i/topics/123456');
			});

			it('should remove query parameters and hash', () => {
				expect(normalizeSocialLink(SocialPlatform.X, 'https://x.com/username?ref=src')).toBe('https://x.com/username');
				expect(normalizeSocialLink(SocialPlatform.X, 'https://x.com/username#section')).toBe('https://x.com/username');
				expect(normalizeSocialLink(SocialPlatform.X, 'https://x.com/username?ref=src#section')).toBe('https://x.com/username');
			});

			it('should return null for invalid URLs', () => {
				expect(normalizeSocialLink(SocialPlatform.X, 'https://facebook.com/username')).toBe(null);
				expect(normalizeSocialLink(SocialPlatform.X, 'invalid username!')).toBe(null);
			});
		});

		describe('Facebook', () => {
			it('should normalize full Facebook URLs', () => {
				expect(normalizeSocialLink(SocialPlatform.FACEBOOK, 'https://facebook.com/username')).toBe('https://facebook.com/username');
				expect(normalizeSocialLink(SocialPlatform.FACEBOOK, 'https://www.facebook.com/username')).toBe('https://facebook.com/username');
				expect(normalizeSocialLink(SocialPlatform.FACEBOOK, 'https://facebook.com/username/')).toBe('https://facebook.com/username');
			});

			it('should normalize usernames with @ symbol', () => {
				expect(normalizeSocialLink(SocialPlatform.FACEBOOK, '@username')).toBe('https://facebook.com/username');
			});

			it('should normalize plain usernames', () => {
				expect(normalizeSocialLink(SocialPlatform.FACEBOOK, 'username')).toBe('https://facebook.com/username');
			});

			it('should normalize partial URLs', () => {
				expect(normalizeSocialLink(SocialPlatform.FACEBOOK, 'facebook.com/username')).toBe('https://facebook.com/username');
			});

			it('should return null for invalid URLs', () => {
				expect(normalizeSocialLink(SocialPlatform.FACEBOOK, 'https://x.com/username')).toBe(null);
			});
		});

		describe('LinkedIn', () => {
			it('should normalize full LinkedIn URLs', () => {
				expect(normalizeSocialLink(SocialPlatform.LINKEDIN, 'https://linkedin.com/in/username')).toBe('https://linkedin.com/in/username');
				expect(normalizeSocialLink(SocialPlatform.LINKEDIN, 'https://www.linkedin.com/in/username')).toBe('https://linkedin.com/in/username');
			});

			it('should normalize usernames with @ symbol', () => {
				expect(normalizeSocialLink(SocialPlatform.LINKEDIN, '@username')).toBe('https://linkedin.com/in/username');
			});

			it('should normalize plain usernames', () => {
				expect(normalizeSocialLink(SocialPlatform.LINKEDIN, 'username')).toBe('https://linkedin.com/in/username');
			});

			it('should normalize partial URLs', () => {
				expect(normalizeSocialLink(SocialPlatform.LINKEDIN, 'linkedin.com/in/username')).toBe('https://linkedin.com/in/username');
			});

			it('should handle multi-level paths in partial URLs', () => {
				expect(normalizeSocialLink(SocialPlatform.LINKEDIN, 'linkedin.com/company/bitrix')).toBe('https://linkedin.com/company/bitrix');
				expect(normalizeSocialLink(SocialPlatform.LINKEDIN, 'linkedin.com/school/university-name')).toBe('https://linkedin.com/school/university-name');
			});

			it('should return null for invalid URLs', () => {
				expect(normalizeSocialLink(SocialPlatform.LINKEDIN, 'https://facebook.com/username')).toBe(null);
			});
		});

		describe('Zoom', () => {
			it('should normalize full Zoom URLs', () => {
				expect(normalizeSocialLink(SocialPlatform.ZOOM, 'https://zoom.us/my/username')).toBe('https://zoom.us/my/username');
				expect(normalizeSocialLink(SocialPlatform.ZOOM, 'https://www.zoom.us/my/username')).toBe('https://zoom.us/my/username');
			});

			it('should normalize plain usernames', () => {
				expect(normalizeSocialLink(SocialPlatform.ZOOM, 'username')).toBe('https://zoom.us/my/username');
			});

			it('should normalize partial URLs', () => {
				expect(normalizeSocialLink(SocialPlatform.ZOOM, 'zoom.us/my/username')).toBe('https://zoom.us/my/username');
			});

			it('should return null for invalid URLs', () => {
				expect(normalizeSocialLink(SocialPlatform.ZOOM, 'https://x.com/username')).toBe(null);
			});
		});

		describe('Microsoft Teams', () => {
			it('should normalize full Teams URLs', () => {
				expect(normalizeSocialLink(SocialPlatform.MICROSOFT_TEAMS, 'https://teams.microsoft.com/l/chat/0/0?users=user@example.com')).toBe('https://teams.microsoft.com/l/chat/0/0?users=user@example.com');
			});

			it('should normalize email addresses', () => {
				expect(normalizeSocialLink(SocialPlatform.MICROSOFT_TEAMS, 'user@example.com')).toBe('https://teams.microsoft.com/l/chat/0/0?users=user%40example.com');
			});

			it('should return null for non-email inputs', () => {
				expect(normalizeSocialLink(SocialPlatform.MICROSOFT_TEAMS, 'username')).toBe(null);
			});

			it('should return null for invalid URLs', () => {
				expect(normalizeSocialLink(SocialPlatform.MICROSOFT_TEAMS, 'https://zoom.us/my/username')).toBe(null);
			});
		});

		describe('Xing', () => {
			it('should normalize full Xing URLs', () => {
				expect(normalizeSocialLink(SocialPlatform.XING, 'https://xing.com/profile/username')).toBe('https://xing.com/profile/username');
				expect(normalizeSocialLink(SocialPlatform.XING, 'https://www.xing.com/profile/username')).toBe('https://xing.com/profile/username');
			});

			it('should normalize plain usernames', () => {
				expect(normalizeSocialLink(SocialPlatform.XING, 'username')).toBe('https://xing.com/profile/username');
			});

			it('should normalize partial URLs', () => {
				expect(normalizeSocialLink(SocialPlatform.XING, 'xing.com/profile/username')).toBe('https://xing.com/profile/username');
			});

			it('should return null for invalid URLs', () => {
				expect(normalizeSocialLink(SocialPlatform.XING, 'https://facebook.com/username')).toBe(null);
			});
		});
	});
})();
