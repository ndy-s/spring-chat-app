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
    public List<MessageData> getChatData(Long friendId) {
        Friend friend = friendRepository.findById(friendId).orElse(null);

        if (friend == null) {
            throw new RuntimeException("Chat history not found");
        }

        User user = friend.getUser();
        User friendUser = friend.getFriend();

        return messageRepository.findChatMessages(user, friendUser);
    }

    @Transactional
    public MessageHistory chatFriend(Long id, String username) {
        Friend friendEntity = friendRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Friend relationship does not exist"));

        User currentUser = friendEntity.getUser();
        User friendUser = friendEntity.getFriend();

        boolean isCurrentUser = currentUser.getUsername().equals(username);

        User user = isCurrentUser ? currentUser : friendUser;
        User friend = isCurrentUser ? friendUser : currentUser;

        ChatHistory chatHistory = chatHistoryRepository.findByUserAndFriend(user, friend)
                .orElseGet(() -> createChatHistory(user, friend));

        return MessageHistory.builder()
                .id(friendEntity.getId())
                .userId(friend.getId())
                .username(friend.getUsername())
                .lastMessageTimestamp(chatHistory.getLastMessageTimestamp())
                .build();
    }

    @Transactional
    public MessageData sendMessage(Long friendId, String username, String content) {
        if (friendId == null || username == null || content == null || content.trim().isEmpty()) {
            throw new IllegalArgumentException("Invalid input parameters");
        }

        Friend friend = friendRepository.findById(friendId)
                .orElseThrow(() -> new RuntimeException("Friend not found"));

        User sender = friend.getUser().getUsername().equals(username) ? friend.getUser() : friend.getFriend();
        User receiver = friend.getUser().getUsername().equals(username) ? friend.getFriend() : friend.getUser();

        ChatHistory senderToReceiver = chatHistoryRepository.findByUserAndFriend(sender, receiver)
                .orElseThrow(() -> new RuntimeException("Chat history not found for sender"));

        ChatHistory receiverToSender = chatHistoryRepository.findByUserAndFriend(receiver, sender)
                .orElseGet(() -> createChatHistory(receiver, sender));

        Message newMessage = new Message();
        newMessage.setContent(content);
        newMessage.setSender(sender);
        newMessage.setReceiver(receiver);
        newMessage.setTimestamp(new Date());
        messageRepository.save(newMessage);

        senderToReceiver.setLastMessage(newMessage);
        senderToReceiver.setLastMessageTimestamp(new Date());
        chatHistoryRepository.save(senderToReceiver);

        receiverToSender.setLastMessage(newMessage);
        receiverToSender.setLastMessageTimestamp(new Date());
        chatHistoryRepository.save(receiverToSender);

        return MessageData.builder()
                .id(friendId)
                .content(content)
                .userId(receiver.getId())
                .username(receiver.getUsername())
                .timestamp(newMessage.getTimestamp())
                .build();
    }

    @Transactional
    public void removeHistory(Long friendId, String username) {
        Friend friendEntity = friendRepository.findById(friendId)
                .orElseThrow(() -> new RuntimeException("Friend not found"));

        User currentUser = friendEntity.getUser();
        User friendUser = friendEntity.getFriend();

        boolean isCurrentUser = currentUser.getUsername().equals(username);

        User user = isCurrentUser ? currentUser : friendUser;
        User friend = isCurrentUser ? friendUser : currentUser;

        ChatHistory chatHistory = chatHistoryRepository.findByUserAndFriend(user, friend)
                .orElseThrow(() -> new RuntimeException("Chat history not found"));

        chatHistoryRepository.delete(chatHistory);
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

    private ChatHistory createChatHistory(User user, User friend) {
        ChatHistory newChatHistory = ChatHistory.builder()
                .user(user)
                .friend(friend)
                .lastMessage(null)
                .lastMessageTimestamp(new Date())
                .build();
        return chatHistoryRepository.save(newChatHistory);
    }

}