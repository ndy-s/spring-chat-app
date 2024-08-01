const currentUsername = currentUser.username;
const currentUserId = currentUser.userId;

console.log("Current User: " + currentUsername);
console.log("Current User ID: " + currentUserId);

// Configure AJAX settings for CSRF token
$(document).ajaxSend((e, xhr, options) => {
    const token = $("meta[name='_csrf']").attr("content");
    const header = $("meta[name='_csrf_header']").attr("content");
    xhr.setRequestHeader(header, token);
});

// Function to establish WebSocket connection
let stompClient = null;

function connect() {
    const socket = new SockJS('/ws');
    stompClient = Stomp.over(socket);

    stompClient.connect({}, onConnected, onError);
}

// Callback function for successful connection
function onConnected(frame) {
    console.log('Connected: ' + frame);
    stompClient.subscribe('/user/specific', handleMessage);
}

// Callback function for connection error
function onError(error) {
    console.error('Stomp Error: ' + error);
}

// Function to handle incoming messages
function handleMessage(message) {
    const messageBody = message.body;

    if (messageBody.startsWith("Error:")) {
        showError(messageBody);
    } else if (messageBody.startsWith("[Friend Request]")) {
        handleFriendRequest(messageBody);
    } else if (messageBody.startsWith("[Remove Friend]")) {
        handleRemoveFriend(messageBody);
    }
}

// Function to display error messages
function showError(messageBody) {
    Swal.fire({
        icon: 'error',
        title: 'Error',
        text: messageBody,
        confirmButtonText: 'OK'
    });
}

// Function to handle friend requests
function handleFriendRequest(messageBody) {
    const data = messageBody.split(". Request ID: ");
    const usernames = data[0].split("New friend request from ")[1].split(" to ");
    const fromUsername = usernames[0];
    const toUsername = usernames[1];
    const friendRequestId = data[1];

    // Increment the badge count
    updateBadge(1);

    let friendRequestsDiv = $('.friend-requests ul');
    friendRequestsDiv.append(`
        <li data-request-id="${friendRequestId}" class="bg-gray-700 text-white p-2 mb-2 rounded-md flex justify-between items-center">
            <span>${fromUsername}</span>
            <div class="flex space-x-2">
                <button class="flex items-center justify-center w-10 h-10 bg-green-500 text-white rounded-md hover:bg-green-600 relative group" onclick="acceptFriendRequest('${friendRequestId}')">
                    <i class="fas fa-check-circle text-base"></i>
                    <span class="absolute bottom-full left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs p-1 rounded-md whitespace-nowrap hidden group-hover:block">Accept</span>
                </button>
                <button class="flex items-center justify-center w-10 h-10 bg-red-500 text-white rounded-md hover:bg-red-600 relative group" onclick="declineFriendRequest('${friendRequestId}')">
                    <i class="fas fa-times-circle text-base"></i>
                    <span class="absolute bottom-full left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs p-1 rounded-md whitespace-nowrap hidden group-hover:block">Decline</span>
                </button>
            </div>
        </li>
    `);
}

// Function to handle removing friends
function handleRemoveFriend(messageBody) {
    console.log("Friend removed: ", messageBody);
    const data = messageBody.split(". Friend ID: ");
    const friendId = data[1];
    $(`li[data-friend-id="${friendId}"]`).remove();
}

// Function to fetch friend requests
function getFriendRequest(username) {
    $.ajax({
        type: 'GET',
        url: '/friendRequests',
        data: { username: username },
        success: function(data) {
            let friendRequestsDiv = $('.friend-requests ul');
            friendRequestsDiv.empty();

            // Set badge count based on the number of requests
            updateBadge(data.length);

            data.forEach(function(request) {
                friendRequestsDiv.append(`
                    <li data-request-id="${request.id}" class="bg-gray-700 text-white p-2 mb-2 rounded-md flex justify-between items-center">
                        <span>${request.username}</span>
                        <div class="flex space-x-2">
                            <button class="flex items-center justify-center w-10 h-10 bg-green-500 text-white rounded-md hover:bg-green-600 relative group" onclick="acceptFriendRequest('${request.id}')">
                                <i class="fas fa-check-circle text-base"></i>
                                <span class="absolute bottom-full left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs p-1 rounded-md whitespace-nowrap hidden group-hover:block">Accept</span>
                            </button>
                            <button class="flex items-center justify-center w-10 h-10 bg-red-500 text-white rounded-md hover:bg-red-600 relative group" onclick="declineFriendRequest('${request.id}')">
                                <i class="fas fa-times-circle text-base"></i>
                                <span class="absolute bottom-full left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs p-1 rounded-md whitespace-nowrap hidden group-hover:block">Decline</span>
                            </button>
                        </div>
                    </li>
                `);
            });
        },
        error: function(err) {
            console.error('Error fetching friend requests:', err);
        }
    });
}

// Function to fetch friend list
function getFriendList(username) {
    $.ajax({
        type: 'GET',
        url: '/friendList',
        data: { username },
        success: function(data) {
            const friendListDiv = $('.friend-list ul');
            friendListDiv.empty();

            data.forEach(friend => {
                const updatedDate = new Date(friend.updatedAt);
                const formattedDate = updatedDate.toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                });

                friendListDiv.append(`
                    <li data-friend-id="${friend.id}" class="bg-gray-700 text-white p-2 mb-2 rounded-md flex justify-between items-center">
                        <div class="flex flex-col">
                            <span>${friend.username}</span>
                            <span class="text-gray-400 text-xs">Added on ${formattedDate}</span>
                        </div>
                        <button class="flex items-center justify-center w-10 h-10 bg-red-500 text-white rounded-md hover:bg-red-600 relative group" onclick="removeFriend('${friend.id}', '${friend.username}')">
                            <i class="fas fa-user-minus text-base"></i>
                            <span class="absolute bottom-full left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs p-1 rounded-md whitespace-nowrap hidden group-hover:block">Remove</span>
                        </button>
                    </li>
                `);
            });
        },
        error: function(err) {
            console.error('Error fetching friend list:', err);
        }
    });
}

// Function to send a friend request via WebSocket
function sendFriendRequest(username) {
    const request = { from: currentUsername, to: username };

    stompClient.send("/app/friendRequest", {}, JSON.stringify(request));

    const addFriendButton = $(`button[data-username='${username}']`);
    if (addFriendButton.length) {
        addFriendButton.replaceWith(`
            <button class="flex items-center justify-center w-10 h-10 bg-gray-500 text-white rounded-md cursor-not-allowed relative group">
                <i class="fas fa-clock text-base"></i>
                <span class="absolute bottom-full left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs p-1 rounded-md whitespace-nowrap hidden group-hover:block">Pending</span>
            </button>
        `);
    }
}

// Function to accept a friend request
function acceptFriendRequest(requestId) {
    $.ajax({
        type: 'POST',
        url: '/friendRequests/accept',
        data: { requestId },
        success: function(response) {
            // Check if the response contains an error message
            if (response.username.startsWith("Error:")) {
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: response.username,
                    confirmButtonText: 'OK'
                });
                return;
            }

            Swal.fire({
                icon: 'success',
                title: 'Friend Request Accepted',
                text: 'Friend request accepted successfully.',
                confirmButtonText: 'OK'
            }).then(() => {
                $(`li[data-request-id="${requestId}"]`).remove();
                updateBadge(-1);

                // TODO: add send stompclient for target udpate their friend list

                // Update the friend list with new friend information
                const friendListDiv = $('.friend-list ul');
                const updatedDate = new Date(response.updatedAt);
                const formattedDate = updatedDate.toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                });

                friendListDiv.append(`
                    <li data-friend-id="${response.id}" class="bg-gray-700 text-white p-2 mb-2 rounded-md flex justify-between items-center">
                        <div class="flex flex-col">
                            <span>${response.username}</span>
                            <span class="text-gray-400 text-xs">Added on ${formattedDate}</span>
                        </div>
                        <button class="flex items-center justify-center w-10 h-10 bg-red-500 text-white rounded-md hover:bg-red-600 relative group" onclick="removeFriend('${response.id}', '${response.username}')">
                            <i class="fas fa-user-minus text-base"></i>
                            <span class="absolute bottom-full left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs p-1 rounded-md whitespace-nowrap hidden group-hover:block">Remove</span>
                        </button>
                    </li>
                `);
            });
        },
        error: function() {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Could not accept friend request. Please try again.',
                confirmButtonText: 'OK'
            });
        }
    });
}

// Function to decline a friend request
function declineFriendRequest(requestId) {
    $.ajax({
        type: 'POST',
        url: '/friendRequests/decline',
        data: { requestId },
        success: function(response) {
            Swal.fire({
                icon: 'success',
                title: 'Friend Request Declined',
                text: response,
                confirmButtonText: 'OK'
            }).then(() => {
                $(`li[data-request-id="${requestId}"]`).remove();
                updateBadge(-1);
            });
        },
        error: function() {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Could not decline friend request. Please try again.',
                confirmButtonText: 'OK'
            });
        }
    });
}

// Function to remove a friend
function removeFriend(friendId, friendUsername) {
    $.ajax({
        type: 'POST',
        url: '/friend/remove',
        data: { friendId },
        success: function(response) {
            Swal.fire({
                icon: 'success',
                title: 'Friend Removed',
                text: response,
                confirmButtonText: 'OK'
            }).then(() => {
                const request = { friendId, from: currentUsername, to: friendUsername };
                stompClient.send("/app/removeFriend", {}, JSON.stringify(request));
                $(`li[data-friend-id="${friendId}"]`).remove();
            });
        },
        error: function() {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Could not remove friend. Please try again.',
                confirmButtonText: 'OK'
            });
        }
    });
}

// Function to search for users
function searchUsers(query) {
    $.ajax({
        type: 'GET',
        url: '/searchUsers',
        data: { query },
        success: function(data) {
            const resultsDiv = $('.add-friend .search-results');
            resultsDiv.empty();

            data.forEach(user => {
                let buttonHTML = '';
                let status = 'NONE';

                user.friends.forEach(friend => {
                    if (friend.friendId === currentUserId) {
                        status = friend.status;
                    }
                });

                user.friendsOf.forEach(friend => {
                    if (friend.userId === currentUserId) {
                        status = friend.status;
                    }
                });

                switch (status) {
                    case 'PENDING':
                        buttonHTML = `
                            <button class="flex items-center justify-center w-10 h-10 bg-gray-500 text-white rounded-md cursor-not-allowed relative group">
                                <i class="fas fa-clock text-base"></i>
                                <span class="absolute bottom-full left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs p-1 rounded-md whitespace-nowrap hidden group-hover:block">Pending</span>
                            </button>
                        `;
                        break;
                    case 'ACCEPTED':
                        buttonHTML = `
                            <button class="flex items-center justify-center w-10 h-10 bg-green-400 text-white rounded-md cursor-not-allowed relative group">
                                <i class="fas fa-user text-base"></i>
                                <span class="absolute bottom-full left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs p-1 rounded-md whitespace-nowrap hidden group-hover:block">Friends</span>
                            </button>
                        `;
                        break;
                    default:
                        buttonHTML = `
                            <button class="flex items-center justify-center w-10 h-10 bg-blue-600 text-white rounded-md hover:bg-blue-800 relative group" data-username="${user.username}" onclick="sendFriendRequest('${user.username}')">
                                <i class="fas fa-user-plus text-base"></i>
                                <span class="absolute bottom-full left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs p-1 rounded-md whitespace-nowrap hidden group-hover:block">Add Friend</span>
                            </button>
                        `;
                        break;
                }

                resultsDiv.append(`
                    <li class="bg-gray-700 text-white p-2 mb-2 rounded-md flex justify-between items-center">
                        <span>${user.username}</span>
                        ${buttonHTML}
                    </li>
                `);
            });
        },
        error: function(err) {
            console.error('Error fetching user data:', err);
        }
    });
}

// Helper function to update the badge count
function updateBadge(countChange) {
    let badge = $('#notification-badge');
    let currentCount = parseInt(badge.text()) || 0;
    let newCount = currentCount + countChange;

    if (newCount > 0) {
        badge.text(newCount).removeClass('hidden');
    } else {
        badge.text('0').addClass('hidden');
    }
}

// Document ready function
$(document).ready(function () {
    connect();
    getFriendRequest(currentUsername);
    getFriendList(currentUsername);

    // Search form submission handler
    $('#searchForm').submit(function (event) {
        event.preventDefault();
        let query = $('#friendUsername').val();
        searchUsers(query);
    });

    // Menu item click handlers
    $('#showFriendList').click(function () {
        setActiveMenuItem($(this));
        hideAllSections();
        $('.friend-list').addClass('active');
    });

    $('#showFriendRequests').click(function () {
        setActiveMenuItem($(this));
        hideAllSections();
        $('.friend-requests').addClass('active');
    });

    $('#showAddFriend').click(function () {
        setActiveMenuItem($(this));
        hideAllSections();
        $('.add-friend').addClass('active');
        $('.add-friend #friendUsername').val('');
        $('.add-friend .search-results').empty();
    });

    $('#showChats').click(function () {
        setActiveMenuItem($(this));
        hideAllSections();
        $('.chat-history').addClass('active');
    });

    // Utility functions
    function setActiveMenuItem(element) {
        $('.menu-item a').removeClass('active');
        element.addClass('active');
    }

    function hideAllSections() {
        $('.sidebar-content').removeClass('active');
    }

    // Set Chat as default active and show chat history
    setActiveMenuItem($('#showChats'));
    $('.chat-history').addClass('active');
});
