package com.hendy.spring_chat_app.controller;

import com.hendy.spring_chat_app.entity.Message;
import com.hendy.spring_chat_app.model.ErrorMessage;
import com.hendy.spring_chat_app.model.MessageData;
import com.hendy.spring_chat_app.model.MessageHistory;
import com.hendy.spring_chat_app.model.ReceivedMessage;
import com.hendy.spring_chat_app.service.ChatService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
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
    private SimpMessagingTemplate simpMessagingTemplate;

    @Autowired
    private ChatService chatService;

    @GetMapping("/chatHistory")
    @ResponseBody
    public List<MessageHistory> getPendingFriendRequests(@RequestParam("username") String username) {
        return chatService.getChatHistory(username);
    }

    @GetMapping("/getChatData")
    @ResponseBody
    public List<MessageData> getChatData(@RequestParam("historyId") String historyId) {
        try {
            Long id = Long.parseLong(historyId);
            return chatService.getChatData(id);
        } catch (NumberFormatException e) {
            log.error("Invalid chat ID format: {}", historyId, e);
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Error: Invalid history ID format.");
        } catch (Exception e) {
            log.error("An unexpected error occurred while fetching chat data for historyId: {}", historyId, e);
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Error fetching chat data");
        }
    }

    @PostMapping("/startChat")
    @ResponseBody
    public MessageHistory startChat(@RequestParam("friendId") String friendId, @RequestParam("username") String username) {
        try {
            Long id = Long.parseLong(friendId);
            return chatService.chatFriend(id, username);
        } catch (NumberFormatException e) {
            log.error("Invalid friend ID format.", e);
            return chatService.errorChatHistoryResponse("Error: Invalid friend ID format. " + e.getMessage());
        } catch (IllegalArgumentException e) {
            log.error("Error: ", e);
            return chatService.errorChatHistoryResponse("Error: " + e.getMessage());
        } catch (Exception e) {
            log.error("An unexpected error occurred while fetching the chat history.", e);
            return chatService.errorChatHistoryResponse("Error: An unexpected error occurred while fetching the chat history. " + e.getMessage());
        }
    }

    @PostMapping("/sendMessage")
    @ResponseBody
    public MessageData sendMessage(
            @RequestParam("historyId") String historyId,
            @RequestParam("username") String username,
            @RequestParam("content") String content
    ) {
        try {
            Long id = Long.parseLong(historyId);
            return chatService.sendMessage(id, username, content);
        } catch (NumberFormatException e) {
            log.error("Invalid history ID format.", e);
            return chatService.errorMessageDataResponse("Error: Invalid history ID format. " + e.getMessage());
        } catch (IllegalArgumentException e) {
            log.error("Error: ", e);
            return chatService.errorMessageDataResponse("Error: " + e.getMessage());
        } catch (Exception e) {
            log.error("An unexpected error occurred while fetching the chat history.", e);
            return chatService.errorMessageDataResponse("Error: An unexpected error occurred while fetching the chat history. " + e.getMessage());
        }
    }

    @MessageMapping("/sendMessage")
    public void receivedMessage(@Payload ReceivedMessage request) {
        try {
            simpMessagingTemplate.convertAndSendToUser(request.getTo(), "/specific", request);
        } catch (IllegalArgumentException | IllegalStateException e) {
            log.error("Error processing sent message", e);
            simpMessagingTemplate.convertAndSendToUser(request.getFrom(), "/specific", new ErrorMessage(e.getMessage()));
        } catch (Exception e) {
            log.error("Unexpected error processing sent message", e);
            simpMessagingTemplate.convertAndSendToUser(request.getFrom(), "/specific", new ErrorMessage("Unexpected error occurred."));
        }
    }

    @PostMapping("/removeHistory")
    @ResponseBody
    public void removeHistory() {

    }
}
