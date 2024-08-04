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

    Swal.fire({
        title: 'Error!',
        text: 'An error occurred. You will be logged out.',
        icon: 'error',
        confirmButtonText: 'OK'
    }).then((result) => {
        if (result.isConfirmed) {
            window.location.href = '/login';
        }
    });
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
    } else if (messageBody.startsWith("[Accepted Friend]")) {
        handleAcceptedFriend(messageBody);
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
    console.log(messageBody);
    const data = messageBody.split(". Friend ID: ");
    const friendId = data[1];
    $(`li[data-friend-id="${friendId}"]`).remove();
}

// Function to handle accepted friend request
function handleAcceptedFriend(messageBody) {
    console.log(messageBody);
    const parts = messageBody.split('. Friend ID: ');
    const friendId = parts[1].split(', Updated: ')[0];
    const date = parts[1].split(', Updated: ')[1];
    const usernamePart = parts[0].split('] ')[1];
    const username = usernamePart.split(' has accepted you as a friend')[0];
    const formattedDate = date;

    const friendListDiv = $('.friend-list ul');
    friendListDiv.append(`
        <li data-friend-id="${friendId}" class="bg-gray-700 text-white p-2 mb-2 rounded-md flex justify-between items-center">
            <div class="flex flex-col">
                <span>${username}</span>
                <span class="text-gray-400 text-xs">Added on ${formattedDate}</span>
            </div>
            <div class="flex items-center space-x-2">
                <button class="flex items-center justify-center w-10 h-10 bg-blue-500 text-white rounded-md hover:bg-blue-600 relative group" onclick="startChat('${friendId}')">
                    <i class="fas fa-comments text-base"></i>
                    <span class="absolute bottom-full left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs p-1 rounded-md whitespace-nowrap hidden group-hover:block">Chat</span>
                </button>
                <button class="flex items-center justify-center w-10 h-10 bg-red-500 text-white rounded-md hover:bg-red-600 relative group" onclick="removeFriend('${friendId}', '${username}')">
                    <i class="fas fa-user-minus text-base"></i>
                    <span class="absolute bottom-full left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs p-1 rounded-md whitespace-nowrap hidden group-hover:block">Remove</span>
                </button>
            </div>
        </li>
    `);
}

// Function to fetch chat history
function getChatHistory(username) {
    $.ajax({
        type: 'GET',
        url: '/chatHistory',
        data: { username },
        success: function (data) {
            const chatList = $('#chatHistory');
            chatList.empty();

            data.forEach(chat => {
                const chatId = `chat_${chat.id}`;
                const updatedDate = new Date(chat.lastMessageTimestamp);
                const formattedDate = updatedDate.toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                });
                const formattedTime = updatedDate.toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit'
                });

                // Check if chat already exists
                if ($(`#${chatId}`).length === 0) {
                    chatList.append(`
                        <div id="${chatId}" class="chat-item bg-gray-800 text-white p-3 mb-2 rounded-md cursor-pointer hover:bg-gray-700 transition-colors relative" onclick="setActiveChat('${chatId}')">
                            <div class="flex flex-col h-full">
                                <div class="flex justify-between items-center">
                                    <span class="text-lg font-bold">${chat.username}</span>
                                    <span class="text-xs text-gray-400">${formattedDate} ${formattedTime || ''}</span>
                                </div>
                                <div class="text-gray-400 text-sm mt-1 flex-grow">
                                    ${0 || 'No messages yet'}
                                </div>
                                <button class="remove-history-btn absolute bottom-2 right-5 bg-transparent border-0 p-0 text-red-400 hover:text-red-600 group" onclick="removeMessageHistory('${chatId}')">
                                    <i class="fas fa-trash-alt text-base"></i>
                                    <span class="absolute bottom-full left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs p-1 rounded-md whitespace-nowrap hidden group-hover:block">Remove</span>
                                </button>
                            </div>
                        </div>
                    `);
                }
            });
        },
        error: function (err) {
            console.error('Error fetching chat history:', err);
        }
    });
}

// Function to fetch friend requests
function getFriendRequest(username) {
    $.ajax({
        type: 'GET',
        url: '/friendRequests',
        data: { username },
        success: function (data) {
            let friendRequestsDiv = $('.friend-requests ul');
            friendRequestsDiv.empty();

            // Set badge count based on the number of requests
            updateBadge(data.length);

            data.forEach(function (request) {
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
        error: function (err) {
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
        success: function (data) {
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
                        <div class="flex items-center space-x-2">
                            <button class="flex items-center justify-center w-10 h-10 bg-blue-500 text-white rounded-md hover:bg-blue-600 relative group" onclick="startChat('${friend.id}')">
                                <i class="fas fa-comments text-base"></i>
                                <span class="absolute bottom-full left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs p-1 rounded-md whitespace-nowrap hidden group-hover:block">Chat</span>
                            </button>
                            <button class="flex items-center justify-center w-10 h-10 bg-red-500 text-white rounded-md hover:bg-red-600 relative group" onclick="removeFriend('${friend.id}', '${friend.username}')">
                                <i class="fas fa-user-minus text-base"></i>
                                <span class="absolute bottom-full left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs p-1 rounded-md whitespace-nowrap hidden group-hover:block">Remove</span>
                            </button>
                        </div>
                    </li>
                `);
            });
        },
        error: function (err) {
            console.error('Error fetching friend list:', err);
        }
    });
}

// Function to send a friend request via WebSocket
function sendFriendRequest(username) {
    const request = {from: currentUsername, to: username};

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
function acceptFriendRequest(friendId) {
    $.ajax({
        type: 'POST',
        url: '/friendRequests/accept',
        data: { friendId },
        success: function (response) {
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
                $(`li[data-request-id="${friendId}"]`).remove();
                updateBadge(-1);

                // Update the friend list with new friend information
                const friendListDiv = $('.friend-list ul');
                const updatedDate = new Date(response.updatedAt);
                const formattedDate = updatedDate.toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                });

                const request = {
                    from: currentUsername,
                    to: response.username,
                    friendId: friendId,
                    updatedAt: formattedDate
                };
                stompClient.send("/app/acceptedFriendRequest", {}, JSON.stringify(request));

                friendListDiv.append(`
                    <li data-friend-id="${response.id}" class="bg-gray-700 text-white p-2 mb-2 rounded-md flex justify-between items-center">
                        <div class="flex flex-col">
                            <span>${response.username}</span>
                            <span class="text-gray-400 text-xs">Added on ${formattedDate}</span>
                        </div>
                        <div class="flex items-center space-x-2">
                            <button class="flex items-center justify-center w-10 h-10 bg-blue-500 text-white rounded-md hover:bg-blue-600 relative group" onclick="startChat('${response.id}')">
                                <i class="fas fa-comments text-base"></i>
                                <span class="absolute bottom-full left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs p-1 rounded-md whitespace-nowrap hidden group-hover:block">Chat</span>
                            </button>
                            <button class="flex items-center justify-center w-10 h-10 bg-red-500 text-white rounded-md hover:bg-red-600 relative group" onclick="removeFriend('${response.id}', '${response.username}')">
                                <i class="fas fa-user-minus text-base"></i>
                                <span class="absolute bottom-full left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs p-1 rounded-md whitespace-nowrap hidden group-hover:block">Remove</span>
                            </button>
                        </div>
                    </li>
                `);
            });
        },
        error: function () {
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
function declineFriendRequest(friendId) {
    $.ajax({
        type: 'POST',
        url: '/friendRequests/decline',
        data: { friendId },
        success: function (response) {
            Swal.fire({
                icon: 'success',
                title: 'Friend Request Declined',
                text: response,
                confirmButtonText: 'OK'
            }).then(() => {
                $(`li[data-request-id="${friendId}"]`).remove();
                updateBadge(-1);
            });
        },
        error: function () {
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
        success: function (response) {
            Swal.fire({
                icon: 'success',
                title: 'Friend Removed',
                text: response,
                confirmButtonText: 'OK'
            }).then(() => {
                const request = {friendId, from: currentUsername, to: friendUsername};
                stompClient.send("/app/removeFriend", {}, JSON.stringify(request));
                $(`li[data-friend-id="${friendId}"]`).remove();
            });
        },
        error: function () {
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
        success: function (data) {
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
        error: function (err) {
            console.error('Error fetching user data: ', err);
        }
    });
}

// Function to start chat with friend
function startChat(friendId) {
    $('#showChats').click();

    $.ajax({
        type: 'POST',
        url: '/startChat',
        data: {
            friendId: friendId,
            username: currentUsername
        },
        success: function (data) {
            // Check if there's an error message in the response
            if (data.error) {
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: `${data.errorMessage} (Error Code: ${data.errorCode})`,
                    confirmButtonText: 'OK'
                });
                return;
            }

            // If no error, proceed to handle chat data
            const chatId = `chat_${data.id}`;
            const chatList = $('#chatHistory');
            const updatedDate = new Date(data.lastMessageTimestamp);
            const formattedDate = updatedDate.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
            const formattedTime = updatedDate.toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit'
            });

            // Check if chat already exists
            if ($(`#${chatId}`).length === 0) {
                chatList.prepend(`
                    <div id="${chatId}" class="chat-item bg-gray-800 text-white p-3 mb-2 rounded-md cursor-pointer hover:bg-gray-700 transition-colors" onclick="setActiveChat('${chatId}')">
                        <div class="flex justify-between items-center">
                            <span class="text-lg font-bold">${data.username}</span>
                            <span class="text-xs text-gray-400">${formattedDate} ${formattedTime || ''}</span>
                        </div>
                        <div class="text-gray-400 text-sm">${0 || 'No messages yet'}</div>
                    </div>
                `);
            }

            // Set the chat as active
            setActiveChat(chatId);
        },
        error: function () {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Could not fetching chat history. Please try again.',
                confirmButtonText: 'OK'
            });
        }
    });
}

// Function to remove message history
function removeMessageHistory(chatId) {
    $.ajax({
        type: 'POST',
        url: '/removeHistory',
        data: { chatId },
        success: function(data) {

        },
        error: function(err) {

        }
    });
}

// Function to set an active chat (placeholder)
function setActiveChat(chatId) {
    $('.chat-item').removeClass('bg-gray-700').addClass('bg-gray-800');
    $(`#${chatId}`).removeClass('bg-gray-800').addClass('bg-gray-700');
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
    getChatHistory(currentUsername);
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
