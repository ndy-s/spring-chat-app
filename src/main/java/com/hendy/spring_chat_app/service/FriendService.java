package com.hendy.spring_chat_app.service;

import com.hendy.spring_chat_app.entity.Friend;
import com.hendy.spring_chat_app.entity.FriendshipStatus;
import com.hendy.spring_chat_app.entity.User;
import com.hendy.spring_chat_app.model.FriendRequest;
import com.hendy.spring_chat_app.model.PendingFriendRequest;
import com.hendy.spring_chat_app.repository.FriendRepository;
import com.hendy.spring_chat_app.repository.UserRepository;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class FriendService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private FriendRepository friendRepository;

    public List<PendingFriendRequest> getPendingRequests(String username) {
        return friendRepository.findStatusByUsername(username, FriendshipStatus.PENDING);
    }

    @Transactional
    public Friend sendFriendRequest(FriendRequest request) {
        User fromUser = userRepository.findByUsername(request.getFrom())
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + request.getFrom()));
        User toUser = userRepository.findByUsername(request.getTo())
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + request.getTo()));

        if (friendRepository.findByUserAndFriend(fromUser, toUser).isPresent()) {
            throw new IllegalStateException("Friend request already sent.");
        }

        Friend friend = Friend.builder()
                .user(fromUser)
                .friend(toUser)
                .status(FriendshipStatus.PENDING)
                .build();

        return friendRepository.save(friend);
    }

}
