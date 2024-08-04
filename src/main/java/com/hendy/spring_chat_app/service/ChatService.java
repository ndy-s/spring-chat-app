package com.hendy.spring_chat_app.service;

import com.hendy.spring_chat_app.entity.ChatHistory;
import com.hendy.spring_chat_app.entity.Friend;
import com.hendy.spring_chat_app.entity.User;
import com.hendy.spring_chat_app.model.MessageHistory;
import com.hendy.spring_chat_app.repository.ChatHistoryRepository;
import com.hendy.spring_chat_app.repository.FriendRepository;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Date;
import java.util.List;
import java.util.Optional;

@Service
public class ChatService {

    @Autowired
    private FriendRepository friendRepository;

    @Autowired
    private ChatHistoryRepository chatHistoryRepository;

    public List<MessageHistory> getChatHistory(String username) {
        return chatHistoryRepository.findMessageHistoriesByUsername(username);
    }

    @Transactional
    public MessageHistory chatFriend(Long id, String username) {
        Optional<Friend> friendRequest = friendRepository.findById(id);

        if (friendRequest.isEmpty()) {
            throw new RuntimeException("Friend relationship does not exist");
        }

        Friend friend = friendRequest.get();
        User user = friend.getUser();
        User friendUser = friend.getFriend();

        Optional<ChatHistory> chatHistoryOpt = chatHistoryRepository.findByUserAndFriend(user, friendUser);
        ChatHistory chatHistory = chatHistoryOpt.orElseGet(() -> {
            ChatHistory newChatHistory = new ChatHistory();
            newChatHistory.setUser(user);
            newChatHistory.setFriend(friendUser);
            newChatHistory.setLastMessageTimestamp(new Date());
            return chatHistoryRepository.save(newChatHistory);
        });

        boolean isCurrentUser = user.getUsername().equals(username);
        User targetUser = isCurrentUser ? friendUser : user;

        return MessageHistory.builder()
                .id(chatHistory.getId())
                .userId(targetUser.getId())
                .username(targetUser.getUsername())
                .lastMessageTimestamp(chatHistory.getLastMessageTimestamp())
                .build();
    }

    public MessageHistory errorChatHistoryResponse(String message) {
        return MessageHistory.builder()
                .id(null)
                .userId(null)
                .username(message)
                .lastMessageTimestamp(null)
                .build();
    }
}