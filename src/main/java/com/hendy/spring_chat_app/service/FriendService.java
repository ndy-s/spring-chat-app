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

import java.util.List;
import java.util.Optional;

@Service
public class FriendService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private FriendRepository friendRepository;

    public List<FriendByStatus> getPendingRequests(String username) {
        return friendRepository.findStatusByUsername(username, FriendshipStatus.PENDING);
    }

    public List<FriendByStatus> getFriendList(String username) {
        return friendRepository.findStatusByUsername(username, FriendshipStatus.ACCEPTED);
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

            // Check the current status and update accordingly
            if (friend.getStatus() == FriendshipStatus.PENDING) {
                throw new IllegalStateException("Friend request already sent.");
            } else {
                if (friend.getStatus() == FriendshipStatus.DECLINED) {
                    friend.setStatus(FriendshipStatus.PENDING);
                    return friendRepository.save(friend);
                } else {
                    throw new IllegalStateException("Friend request already accepted.");
                }
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
    public void declineFriendRequest(Long id) {
        Optional<Friend> friendRequest = friendRepository.findById(id);

        if (friendRequest.isPresent()) {
            Friend friend = friendRequest.get();
            friend.setStatus(FriendshipStatus.DECLINED);
            friendRepository.save(friend);
        } else {
            throw new IllegalArgumentException("Friend request not found for ID: " + id);
        }
    }

}
