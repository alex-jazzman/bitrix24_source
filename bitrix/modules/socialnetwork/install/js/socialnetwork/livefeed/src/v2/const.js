export const EntityType = Object.freeze({
	CalendarEvent: 'CALENDAR_EVENT',
	BlogPost: 'BLOG_POST',
	BlogComment: 'BLOG_COMMENT',
});

const Context = Object.freeze({
	Feed: 'feed',
});

const Element = Object.freeze({
	PostContextMenu: 'post_context_menu',
	CommentContextMenu: 'comment_context_menu',
});

export const Analytics = Object.freeze({
	Context,
	Element,
});
