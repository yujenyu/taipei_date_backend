const community = {
    getEvents: '/events',
    getEventPage: '/get-event-page/:eventId',
    getPosts: '/posts',
    getPostPage: '/get-post-page/:postId',
    getUserPosts: '/posts/:userId',
    uploadPhoto: '/upload-photo',
    getSuggestUsers: '/getSuggestUsers',
    createPost: '/create-post',
    uploadEventPhoto: '/upload-event-photo',
    createEvent: '/create-event',
    savePost: '/save-post',
    unsavePost: '/unsave-post',
    likePost: '/like-post',
    unlikePost: '/unlike-post',
    attendEvent: '/attend-event',
    notAttendEvent: '/notattend-event',
    isAttendedEvent: '/isAttended-event',
    getComments: '/get-comments',
    addComment: '/add-comment',
    getFollows: '/get-follows/:userId',
    getCountPosts: '/get-count-posts/:userId',
    getUserInfo: '/get-userInfo/:userId',
    checkPostStatus: '/check-post-status',
    getRandomPosts: '/get-random-posts',
    checkEventStatus: '/check-event-status',
    deletePost: '/delete-post',
    deleteEvent: '/delete-event',
    deleteComment: '/delete-comment',
    follow: '/follow',
    unfollow: '/unfollow',
    checkFollowStatus: '/check-follow-status',
    getPostsByKeyword: '/get-posts-by-keyword',
    searchUsers: '/search-users',
    editPost: '/edit-post',
    editPostPhoto: '/edit-post-photo',
    editEvent: '/edit-event',
    editEventPhoto: '/edit-event-photo',
};

export { community };
