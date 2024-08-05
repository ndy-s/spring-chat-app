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

// Variable to store the current chat ID
let currentChatId = null;

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
function handleMessage(event) {
    try {
        const data = JSON.parse(event.body);

        // Check if the message is an error
        if (data.message !== undefined) {
            showError(data.message);
            return;
        }

        switch (data.type) {
            case 'Friend Request':
                handleFriendRequest(data);
                break;
            case 'Remove Friend':
                handleRemoveFriend(data);
                break;
            case 'Accepted Friend':
                handleAcceptedFriend(data);
                break;
            case 'Received Message':
                handleReceivedMessage(data);
                break;
            default:
                console.warn('Unknown message type:', data.type);
        }
    } catch (error) {
        console.error('Error parsing message:', error);
        showError('An error occurred while processing the message.');
    }
}

// Function to display error messages
function showError(message) {
    Swal.fire({
        icon: 'error',
        title: 'Error',
        text: message,
        confirmButtonText: 'OK'
    });
}

// Function to handle friend requests
function handleFriendRequest(data) {
    // Increment the badge count
    updateBadge(1);

    let friendRequestsDiv = $('.friend-requests ul');
    friendRequestsDiv.append(`
        <li data-request-id="${data.friendId}" class="bg-gray-700 text-white p-2 mb-2 rounded-md flex justify-between items-center cursor-pointer">
            <span class="w-3/5 truncate" title="${data.from}">${data.from}</span>
            <div class="flex space-x-2">
                <button class="flex items-center justify-center w-10 h-10 bg-green-500 text-white rounded-md hover:bg-green-600 relative group" onclick="acceptFriendRequest('${data.friendId}')">
                    <i class="fas fa-check-circle text-base"></i>
                    <span class="absolute bottom-full left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs p-1 rounded-md whitespace-nowrap hidden group-hover:block">Accept</span>
                </button>
                <button class="flex items-center justify-center w-10 h-10 bg-red-500 text-white rounded-md hover:bg-red-600 relative group" onclick="declineFriendRequest('${data.friendId}')">
                    <i class="fas fa-times-circle text-base"></i>
                    <span class="absolute bottom-full left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs p-1 rounded-md whitespace-nowrap hidden group-hover:block">Decline</span>
                </button>
            </div>
        </li>
    `);
}

// Function to handle removing friends
function handleRemoveFriend(data) {
    $(`li[data-friend-id="${data.friendId}"]`).remove();
}

// Function to handle accepted friend request
function handleAcceptedFriend(data) {
    const friendListDiv = $('.friend-list ul');
    friendListDiv.append(`
        <li data-friend-id="${data.friendId}" class="bg-gray-700 text-white p-2 mb-2 rounded-md flex justify-between items-center cursor-pointer">
            <div class="flex flex-col w-3/5">
                <span class="truncate" title="${data.from}">${data.from}</span>
                <span class="text-gray-400 text-xs">Added on ${data.updatedAt}</span>
            </div>
            <div class="flex items-center space-x-2">
                <button class="flex items-center justify-center w-10 h-10 bg-blue-500 text-white rounded-md hover:bg-blue-600 relative group" onclick="startChat('${data.friendId}')">
                    <i class="fas fa-comments text-base"></i>
                    <span class="absolute bottom-full left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs p-1 rounded-md whitespace-nowrap hidden group-hover:block">Chat</span>
                </button>
                <button class="flex items-center justify-center w-10 h-10 bg-red-500 text-white rounded-md hover:bg-red-600 relative group" onclick="removeFriend('${data.friendId}', '${data.from}')">
                    <i class="fas fa-user-minus text-base"></i>
                    <span class="absolute bottom-full left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs p-1 rounded-md whitespace-nowrap hidden group-hover:block">Remove</span>
                </button>
            </div>
        </li>
    `);
}

// Function to handle received message
function handleReceivedMessage(data) {
    if (currentChatId === data.historyId) {
        const chatMessagesContainer = $('.chat-messages');
        const formattedDateTime = formatDateTime(data.timestamp);

        const messageElement = $('<div></div>')
            .addClass('flex justify-start mb-2')
            .append(`
                    <div class="p-4 rounded-lg shadow-sm bg-gray-200 max-w-lg break-words whitespace-normal overflow-hidden">
                        <p class="font-semibold text-gray-800">${data.from}</p>
                        <p>${data.content}</p>
                        <p class="text-gray-600 text-right" style="font-size: 0.7rem;">${formattedDateTime}</p>
                    </div>
                `);

        chatMessagesContainer.append(messageElement);
        chatMessagesContainer.scrollTop(chatMessagesContainer[0].scrollHeight);
    }
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
                const formattedDate = formatDateTime(chat.lastMessageTimestamp);

                // Check if chat already exists
                if ($(`#${chatId}`).length === 0) {
                    chatList.append(`
                        <div id="${chatId}" class="chat-item bg-gray-800 text-white p-3 mb-2 rounded-md cursor-pointer hover:bg-gray-700 transition-colors relative" onclick="setActiveChat('${chat.id}')">
                            <div class="flex flex-col h-full">
                                <div class="flex justify-between items-center">
                                    <span class="text-lg font-bold w-2/5 truncate">${chat.username}</span>
                                    <span class="text-xs text-gray-400">${formattedDate}</span>
                                </div>
                                <div class="text-gray-400 text-sm mt-1 flex-grow w-4/5 truncate" title="${chat.lastMessage || 'No messages yet'}">
                                    ${chat.lastMessage || 'No messages yet'}
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
            showError('Could not fetching chat history.');
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
                    <li data-request-id="${request.id}" class="bg-gray-700 text-white p-2 mb-2 rounded-md flex justify-between items-center cursor-pointer">
                        <span class="w-3/5 truncate" title="${request.username}">${request.username}</span>
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
            showError('Could not fetching friend requests.');
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
                    <li data-friend-id="${friend.id}" class="bg-gray-700 text-white p-2 mb-2 rounded-md flex justify-between items-center cursor-pointer">
                        <div class="flex flex-col w-3/5">
                            <span class="truncate" title="${friend.username}">${friend.username}</span>
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
            showError('Could not fetching friend list.')
        }
    });
}

// Function to send a friend request via WebSocket
function sendFriendRequest(username) {
    const request = {
        type: 'Friend Request',
        from: currentUsername,
        to: username
    };

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
                    type: 'Accepted Friend',
                    from: currentUsername,
                    to: response.username,
                    friendId: friendId,
                    updatedAt: formattedDate
                };
                stompClient.send("/app/acceptedFriendRequest", {}, JSON.stringify(request));

                friendListDiv.append(`
                    <li data-friend-id="${response.id}" class="bg-gray-700 text-white p-2 mb-2 rounded-md flex justify-between items-center cursor-pointer">
                        <div class="flex flex-col w-3/5">
                            <span class="truncate" title="${response.username}">${response.username}</span>
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
        error: function (err) {
            console.error('Error accepting friend request:', err);
            showError('Could not accept friend request. Please try again.');
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
        error: function (err) {
            console.error('Error declining friend request:', err);
            showError('Could not decline friend request. Please try again.');
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
                const request = {
                    type: 'Remove Friend',
                    friendId: friendId,
                    from: currentUsername,
                    to: friendUsername
                };
                stompClient.send("/app/removeFriend", {}, JSON.stringify(request));
                $(`li[data-friend-id="${friendId}"]`).remove();
            });
        },
        error: function (err) {
            console.error('Error removing friend:', err);
            showError('Could not remove friend. Please try again.');
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
                    <li class="bg-gray-700 text-white p-2 mb-2 rounded-md flex justify-between items-center cursor-pointer">
                        <span class="w-4/5 truncate" title="${user.username}">${user.username}</span>
                        ${buttonHTML}
                    </li>
                `);
            });
        },
        error: function (err) {
            console.error('Error fetching user data: ', err);
            showError('Could not search users. Please try again.');
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
            const formattedDate = formatDateTime(data.lastMessageTimestamp);

            // Check if chat already exists
            if ($(`#${chatId}`).length === 0) {
                chatList.prepend(`
                    <div id="${chatId}" class="chat-item bg-gray-800 text-white p-3 mb-2 rounded-md cursor-pointer hover:bg-gray-700 transition-colors relative" onclick="setActiveChat('${data.id}')">
                        <div class="flex flex-col h-full">
                            <div class="flex justify-between items-center">
                                <span class="text-lg font-bold w-2/5 truncate">${data.username}</span>
                                <span class="text-xs text-gray-400">${formattedDate}</span>
                            </div>
                            <div class="text-gray-400 text-sm mt-1 flex-grow w-4/5 truncate" title="${data.lastMessage || 'No messages yet'}">
                                ${data.lastMessage || 'No messages yet'}
                            </div>
                            <button class="remove-history-btn absolute bottom-2 right-5 bg-transparent border-0 p-0 text-red-400 hover:text-red-600 group" onclick="removeMessageHistory('${chatId}')">
                                <i class="fas fa-trash-alt text-base"></i>
                                <span class="absolute bottom-full left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs p-1 rounded-md whitespace-nowrap hidden group-hover:block">Remove</span>
                            </button>
                        </div>
                    </div>
                `);
            }

            // Set the chat as active
            setActiveChat(data.id);
        },
        error: function () {
            console.error('Error fetching chat history:', err);
            showError('Could not fetching chat history. Please try again.');
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
            console.error('Error removing message history:', err);
            showError('Could not removing chat history. Please try again.');
        }
    });
}

// Function to set an active chat
function setActiveChat(historyId) {
    currentChatId = historyId;
    const chatId = `chat_${historyId}`;
    $('.chat-item').removeClass('bg-gray-700').addClass('bg-gray-800');
    $(`#${chatId}`).removeClass('bg-gray-800').addClass('bg-gray-700');

    $.ajax({
        type: 'GET',
        url: '/getChatData',
        data: { historyId },
        success: function(data) {
            const chatMessagesContainer = $('.chat-messages');
            chatMessagesContainer.empty();

            data.forEach(message => {
                const isCurrentUser = message.username === currentUsername;

                const formattedDateTime = formatDateTime(message.timestamp);

                const messageElement = $('<div></div>')
                    .addClass(`flex ${isCurrentUser ? 'justify-end' : 'justify-start'} mb-2`)
                    .append(`
                        <div class="p-4 rounded-lg shadow-sm ${isCurrentUser ? 'bg-blue-200' : 'bg-gray-200'} max-w-lg break-words whitespace-normal overflow-hidden">
                            <p class="font-semibold text-gray-800">${message.username}</p>
                            <p>${message.content}</p>
                            <p class="text-gray-600 text-right" style="font-size: 0.7rem;">${formattedDateTime}</p>
                        </div>
                    `);

                chatMessagesContainer.append(messageElement);
            });

            chatMessagesContainer.scrollTop(chatMessagesContainer[0].scrollHeight);
        },
        error: function(err) {
            console.error('Error fetching chat data:', err);
            showError('Could not fetching chat data. Please try again.');
        }
    });
}

// Function to send a message
function sendMessage(historyId) {
    const messageContent = $('.chat-input input').val();
    if (messageContent.trim() === '') return;

    $.ajax({
        type: 'POST',
        url: '/sendMessage',
        data: {
            historyId,
            username: currentUsername,
            content: messageContent
        },
        success: function(response) {
            $('.chat-input input').val('');
            const chatMessagesContainer = $('.chat-messages');
            const formattedDateTime = formatDateTime(response.timestamp);

            const request = {
                type: "Received Message",
                from: currentUsername,
                to: response.username,
                historyId: historyId,
                content: response.content,
                timestamp: formattedDateTime
            };
            stompClient.send("/app/sendMessage", {}, JSON.stringify(request));

            const messageElement = $('<div></div>')
                .addClass('flex justify-end mb-2')
                .append(`
                    <div class="p-4 rounded-lg shadow-sm bg-blue-200 max-w-lg break-words whitespace-normal overflow-hidden">
                        <p class="font-semibold text-gray-800">${currentUsername}</p>
                        <p>${response.content}</p>
                        <p class="text-gray-600 text-right" style="font-size: 0.7rem;">${formattedDateTime}</p>
                    </div>
                `);

            chatMessagesContainer.append(messageElement);
            chatMessagesContainer.scrollTop(chatMessagesContainer[0].scrollHeight);
        },
        error: function(err) {
            console.error('Error sending a message:', err);
            showError('Could not send the message. Please try again.');
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

// Function to format the date and time
function formatDateTime(dateTime) {
    const optionsDate = { year: 'numeric', month: 'short', day: 'numeric' };
    const optionsTime = { hour: '2-digit', minute: '2-digit', hour12: true };
    const date = new Date(dateTime);

    const formattedDate = date.toLocaleDateString('en-US', optionsDate);
    const formattedTime = date.toLocaleTimeString('en-US', optionsTime);

    return `${formattedDate}, ${formattedTime}`;
}

// Document ready function
$(document).ready(function () {
    connect();
    getChatHistory(currentUsername);
    getFriendRequest(currentUsername);
    getFriendList(currentUsername);

    const $chatMessages = $('.chat-messages');

    let isDragging = false;
    let startY;
    let scrollTop;
    let lastY;
    let velocity = 0;
    let momentumInterval;

    $chatMessages.on('mousedown', function(e) {
        isDragging = true;
        startY = e.pageY - $chatMessages.offset().top;
        scrollTop = $chatMessages.scrollTop();
        lastY = startY;
        $chatMessages.addClass('cursor-grabbing');
        clearInterval(momentumInterval); // Stop momentum on drag start
    });

    $(document).on('mouseup', function() {
        if (isDragging) {
            isDragging = false;
            $chatMessages.removeClass('cursor-grabbing').addClass('cursor-grab');
            // Start momentum effect
            startMomentum();
        }
    });

    $chatMessages.on('mouseleave mouseup', function() {
        if (isDragging) {
            isDragging = false;
            $chatMessages.removeClass('cursor-grabbing').addClass('cursor-grab');
            // Start momentum effect
            startMomentum();
        }
    });

    $chatMessages.on('mousemove', function(e) {
        if (!isDragging) return;
        e.preventDefault();
        const y = e.pageY - $chatMessages.offset().top;
        const walk = (y - startY) * 2; // Scroll-fast ratio
        $chatMessages.scrollTop(scrollTop - walk);

        // Calculate velocity
        velocity = y - lastY;
        lastY = y;
    });

    function startMomentum() {
        momentumInterval = setInterval(() => {
            if (Math.abs(velocity) < 1) {
                clearInterval(momentumInterval);
                return;
            }

            $chatMessages.scrollTop($chatMessages.scrollTop() - velocity);
            velocity *= 0.95; // Friction
        }, 16); // Roughly 60 FPS
    }

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

    $('.chat-input input[type="text"]').on('keydown', function(event) {
        if (event.key === 'Enter') {
            event.preventDefault();
            $('#sendButton').click();
        }
    });

    $('#sendButton').click(function() {
        if (currentChatId !== null) {
            sendMessage(currentChatId);
        } else {
            console.error('No active chat selected.');
        }
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
