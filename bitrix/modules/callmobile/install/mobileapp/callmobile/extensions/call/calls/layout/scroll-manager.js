/*
* @module call/calls/layout/floor-requests-list
*/
jn.define('call/calls/layout/scroll-manager', (require, exports, module) => {
	const Utils = require('src/util');
	const { GridUserCount } = require('call/const');

	const PREV_PAGE_TEASER = 20;
	const PREV_PAGE_TEASER_ANDROID = -25;

	class ScrollManager
	{
		constructor({
			getConnectedUserCount,
			getConnectedUsers,
			subscribeOnNewPage,
		})
		{
			this.scrollView = null;

			this.getConnectedUserCount = getConnectedUserCount;
			this.getConnectedUsers = getConnectedUsers;
			this.subscribeOnNewPage = subscribeOnNewPage;

			this.state = {
				currentGridPage: 1,
				currentScrollPosition: 0,
				startingDragScrollPosition: 0,
			};

		}

		getConnectedUsers()
		{
			return this.getConnectedUsers;
		}

		setScrollViewRef(ref)
		{
			this.scrollView = ref;
		}

		handleScrollEnd()
		{
			const currentPage = this.state.currentGridPage;
			const newPage = this.getCurrentPage(this.state.startingDragScrollPosition, this.state.currentScrollPosition);

			if (currentPage !== newPage)
			{
				this.state.currentGridPage = newPage;
				this.subscribeOnNewPage();
			}

			this.scrollToCurrentPage();
		}

		scrollToCurrentPage()
		{
			const offset = Utils.getIsIos() ? PREV_PAGE_TEASER : PREV_PAGE_TEASER_ANDROID;
			this.scrollView?.scrollTo({
				x: 0,
				y: this.state.currentGridPage !== 1 ? ((this.state.currentGridPage - 1) * (this.getScrollViewHeight() - offset)) : 0,
				animated: true,
			})
		}

		getScrollViewHeight()
		{
			return device.screen.height;
		}

		getMaxAmountOfPagesInScrollView()
		{
			const userCount = this.getConnectedUsers().length;
			if (userCount > GridUserCount.fullFirstPageCount)
			{
				return Math.ceil(userCount / GridUserCount.fullFirstPageCount);
			}

			return 1;
		}

		getCurrentPage(scrollStartingPosition, scrollCurrentPosition)
		{
			const currentPage = this.state.currentGridPage;
			let newPage;
			if (scrollStartingPosition !== undefined && scrollCurrentPosition !== undefined)
			{
				const diff = scrollCurrentPosition - scrollStartingPosition;
				if (diff > 0)
				{
					newPage = this.state.currentGridPage + 1;
				}
				else
				{
					newPage = this.state.currentGridPage - 1;
				}
			}
			else
			{
				newPage = Math.ceil(this.getConnectedUserCount() / GridUserCount.fullFirstPageCount);
				if (this.getConnectedUserCount() === GridUserCount.fullFirstPageCount)
				{
					this.scrollView?.scrollTo({ x: 0, y: 0, animated: false });
				}
			}

			if (currentPage !== newPage)
			{
				if (newPage < 1)
				{
					newPage = 1;
				}

				if (newPage > this.getMaxAmountOfPagesInScrollView())
				{
					newPage = this.getMaxAmountOfPagesInScrollView();
				}
			}

			return newPage;
		}


		getCurrentGridPage()
		{
			return this.state.currentGridPage;
		}

		setCurrentGridPage(page)
		{
			this.state.currentGridPage = page;
		}

		setCurrentScrollPosition(pos)
		{
			this.state.currentScrollPosition = pos;
		}

		getCurrentScrollPosition()
		{
			return this.state.currentScrollPosition;
		}

		beginDrag()
		{
			this.state.startingDragScrollPosition = this.state.currentScrollPosition;
		}

	}

	module.exports = {
		ScrollManager,
	};
});
