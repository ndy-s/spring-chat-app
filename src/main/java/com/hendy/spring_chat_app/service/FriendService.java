package com.hendy.spring_chat_app.service;

import com.hendy.spring_chat_app.entity.Friend;
import com.hendy.spring_chat_app.entity.FriendshipStatus;
import com.hendy.spring_chat_app.entity.User;
import com.hendy.spring_chat_app.model.FriendRequest;
import com.hendy.spring_chat_app.model.FriendByStatus;
import com.hendy.spring_chat_app.repository.FriendRepository;
import com.hendy.spring_chat_app.repository.UserRepository;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
public class FriendService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private FriendRepository friendRepository;

    public List<FriendByStatus> getPendingRequests(String username) {
        return friendRepository.findStatusByFriendUsername(username, FriendshipStatus.PENDING);
    }

    public List<FriendByStatus> getFriendList(String username) {
        List<FriendByStatus> friendUsername = friendRepository.findStatusByFriendUsername(username, FriendshipStatus.ACCEPTED);
        List<FriendByStatus> userUsername = friendRepository.findStatusByUserUsername(username, FriendshipStatus.ACCEPTED);

        List<FriendByStatus> combinedFriends = new ArrayList<>(friendUsername);
        combinedFriends.addAll(userUsername);

        return combinedFriends;
    }

    @Transactional
    public Friend sendFriendRequest(FriendRequest request) {
        // Retrieve the user entities from the database
        User fromUser = userRepository.findByUsername(request.getFrom())
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + request.getFrom()));
        User toUser = userRepository.findByUsername(request.getTo())
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + request.getTo()));

        // Search for an existing friend request or friendship
        Optional<Friend> existingRequest = friendRepository.findByUserAndFriend(fromUser, toUser);
        if (existingRequest.isPresent()) {
            Friend friend = existingRequest.get();

            // Check the current status and handle accordingly
            if (friend.getStatus() == FriendshipStatus.PENDING) {
                throw new IllegalStateException("Friend request already sent.");
            } else {
                throw new IllegalStateException("Friendship already exists.");
            }
        }

        // Check if a reverse request exists (i.e., toUser sent a request to fromUser)
        Optional<Friend> reverseRequest = friendRepository.findByUserAndFriend(toUser, fromUser);
        if (reverseRequest.isPresent()) {
            Friend reverseFriend = reverseRequest.get();

            if (reverseFriend.getStatus() == FriendshipStatus.PENDING) {
                throw new IllegalStateException("A pending friend request already exists from " + request.getTo() + " to " + request.getFrom());
            } else {
                throw new IllegalStateException("Friendship already exists.");
            }
        }

        // Create a new friend request if it does not exist
        Friend newFriend = Friend.builder()
                .user(fromUser)
                .friend(toUser)
                .status(FriendshipStatus.PENDING)
                .build();

        return friendRepository.save(newFriend);
    }

    @Transactional
    public void acceptFriendRequest(Long id) {
        Optional<Friend> friendRequest = friendRepository.findById(id);

        if (friendRequest.isPresent()) {
            Friend friend = friendRequest.get();
            friend.setStatus(FriendshipStatus.ACCEPTED);
            friendRepository.save(friend);
        } else {
            throw new IllegalArgumentException("Friend request not found for ID: " + id);
        }
    }

    @Transactional
    public void removeFriend(Long id) {
        Optional<Friend> friendRequest = friendRepository.findById(id);

        if (friendRequest.isPresent()) {
            friendRepository.deleteById(id);
        } else {
            throw new IllegalArgumentException("Friend not found for ID: " + id);
        }
    }

}
