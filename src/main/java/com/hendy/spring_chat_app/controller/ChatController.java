package com.hendy.spring_chat_app.controller;

import com.hendy.spring_chat_app.entity.ChatHistory;
import com.hendy.spring_chat_app.model.FriendByStatus;
import com.hendy.spring_chat_app.model.MessageHistory;
import com.hendy.spring_chat_app.service.ChatService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Controller
public class ChatController {

    private static final Logger log = LoggerFactory.getLogger(ChatController.class);
    @Autowired
    private ChatService chatService;

    @GetMapping("/chatHistory")
    @ResponseBody
    public List<MessageHistory> getPendingFriendRequests(@RequestParam("username") String username) {
        return chatService.getChatHistory(username);
    }

    @PostMapping("/startChat")
    @ResponseBody
    public MessageHistory startChat(@RequestParam("friendId") String friendId, @RequestParam("username") String username) {
        try {
            Long id = Long.parseLong(friendId);
            return chatService.chatFriend(id, username);
        } catch (NumberFormatException e) {
            log.error("Invalid request ID format.", e);
            return chatService.errorChatHistoryResponse("Error: Invalid friend ID format. " + e.getMessage());
        } catch (IllegalArgumentException e) {
            log.error("Error: ", e);
            return chatService.errorChatHistoryResponse("Error: " + e.getMessage());
        } catch (Exception e) {
            log.error("An unexpected error occurred while fetching the chat history.", e);
            return chatService.errorChatHistoryResponse("Error: An unexpected error occurred while fetching the chat history. " + e.getMessage());
        }
    }
}
