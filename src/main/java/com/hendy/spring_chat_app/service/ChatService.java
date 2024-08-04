package com.hendy.spring_chat_app.service;

import com.hendy.spring_chat_app.entity.ChatHistory;
import com.hendy.spring_chat_app.entity.Friend;
import com.hendy.spring_chat_app.entity.Message;
import com.hendy.spring_chat_app.entity.User;
import com.hendy.spring_chat_app.model.MessageData;
import com.hendy.spring_chat_app.model.MessageHistory;
import com.hendy.spring_chat_app.repository.ChatHistoryRepository;
import com.hendy.spring_chat_app.repository.FriendRepository;
import com.hendy.spring_chat_app.repository.MessageRepository;
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

    @Autowired
    private MessageRepository messageRepository;

    public List<MessageHistory> getChatHistory(String username) {
        return chatHistoryRepository.findMessageHistoriesByUsername(username);
    }

    @Transactional
    public List<MessageData> getChatData(Long chatHistoryId) {
        ChatHistory chatHistory = chatHistoryRepository.findById(chatHistoryId).orElse(null);

        if (chatHistory == null) {
            throw new RuntimeException("Chat history not found");
        }

        User user = chatHistory.getUser();
        User friendUser = chatHistory.getFriend();

        return messageRepository.findChatMessages(user, friendUser);
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

    @Transactional
    public MessageData sendMessage(Long chatHistoryId, String username, String content) {
        if (chatHistoryId == null || username == null || content == null || content.trim().isEmpty()) {
            throw new IllegalArgumentException("Invalid input parameters");
        }

        ChatHistory chatHistory = chatHistoryRepository.findById(chatHistoryId)
                .orElseThrow(() -> new RuntimeException("Chat history not found"));

        User sender = chatHistory.getUser().getUsername().equals(username) ? chatHistory.getUser() : chatHistory.getFriend();
        User receiver = chatHistory.getUser().getUsername().equals(username) ? chatHistory.getFriend() : chatHistory.getUser();

        Message newMessage = new Message();
        newMessage.setContent(content);
        newMessage.setSender(sender);
        newMessage.setReceiver(receiver);
        newMessage.setTimestamp(new Date());
        messageRepository.save(newMessage);

        return MessageData.builder()
                .id(chatHistoryId)
                .content(content)
                .userId(receiver.getId())
                .username(receiver.getUsername())
                .timestamp(newMessage.getTimestamp())
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

    public MessageData errorMessageDataResponse(String message) {
        return MessageData.builder()
                .id(null)
                .userId(null)
                .username(null)
                .content(message)
                .timestamp(null)
                .build();
    }

}