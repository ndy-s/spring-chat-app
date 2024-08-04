package com.hendy.spring_chat_app.controller;

import com.hendy.spring_chat_app.entity.Friend;
import com.hendy.spring_chat_app.model.FriendRequest;
import com.hendy.spring_chat_app.model.FriendByStatus;
import com.hendy.spring_chat_app.service.FriendService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;

import java.util.List;

@Controller
public class FriendController {

    private static final Logger log = LoggerFactory.getLogger(FriendController.class);

    @Autowired
    private SimpMessagingTemplate simpMessagingTemplate;

    @Autowired
    private FriendService friendService;

    @GetMapping("/friendRequests")
    @ResponseBody
    public List<FriendByStatus> getPendingFriendRequests(@RequestParam("username") String username) {
        return friendService.getPendingRequests(username);
    }

    @GetMapping("/friendList")
    @ResponseBody
    public List<FriendByStatus> getFriendList(@RequestParam("username") String username) {
        return friendService.getFriendList(username);
    }

    @MessageMapping("/friendRequest")
    public void sendToSpecificUser(@Payload FriendRequest request) {
        try {
            Friend friend = friendService.sendFriendRequest(request);
            String message = String.format("[Friend Request] New friend request from %s to %s. Request ID: %d", request.getFrom(), request.getTo(), friend.getId());
            simpMessagingTemplate.convertAndSendToUser(request.getTo(), "/specific", message);
        } catch (IllegalArgumentException | IllegalStateException e) {
            log.error("Error processing friend request", e);
            simpMessagingTemplate.convertAndSendToUser(request.getFrom(), "/specific", "Error: " + e.getMessage());
        } catch (Exception e) {
            log.error("Unexpected error processing friend request", e);
            simpMessagingTemplate.convertAndSendToUser(request.getFrom(), "/specific", "Error: Unexpected error occurred.");
        }
    }

    @MessageMapping("/removeFriend")
    public void receiveRemovedFriend(@Payload FriendRequest request) {
        try {
            String message = String.format("[Remove Friend] %s has removed you as a friend. Friend ID: %d", request.getFrom(), request.getFriendId());
            simpMessagingTemplate.convertAndSendToUser(request.getTo(), "/specific", message);
        } catch (IllegalArgumentException | IllegalStateException e) {
            log.error("Error processing remove friend", e);
            simpMessagingTemplate.convertAndSendToUser(request.getTo(), "/specific", "Error: " + e.getMessage());
        } catch (Exception e) {
            log.error("Unexpected error processing remove friend", e);
            simpMessagingTemplate.convertAndSendToUser(request.getTo(), "/specific", "Error: Unexpected error occurred.");
        }
    }

    @PostMapping("/friendRequests/accept")
    @ResponseBody
    public FriendByStatus acceptFriendRequest(@RequestParam("friendId") String friendId) {
        try {
            Long id = Long.parseLong(friendId);
            return friendService.acceptFriendRequest(id);
        } catch (NumberFormatException e) {
            log.error("Invalid friend ID format.", e);
            return friendService.errorFriendRequestResponse("Error: Invalid friend ID format. " + e.getMessage());
        } catch (IllegalArgumentException e) {
            log.error("Error: ", e);
            return friendService.errorFriendRequestResponse("Error: " + e.getMessage());
        } catch (Exception e) {
            log.error("An unexpected error occurred while accepting the friend request.", e);
            return friendService.errorFriendRequestResponse("Error: An unexpected error occurred while accepting the friend request. " + e.getMessage());
        }
    }

    @MessageMapping("/acceptedFriendRequest")
    public void acceptedFriendRequest(@Payload FriendRequest request) {
        try {
            String message = String.format("[Accepted Friend] %s has accepted you as a friend. Friend ID: %d, Updated: %s", request.getFrom(), request.getFriendId(), request.getUpdatedAt());
            simpMessagingTemplate.convertAndSendToUser(request.getTo(), "/specific", message);
        } catch (IllegalArgumentException | IllegalStateException e) {
            log.error("Error processing accepted friend request", e);
            simpMessagingTemplate.convertAndSendToUser(request.getTo(), "/specific", "Error: " + e.getMessage());
        } catch (Exception e) {
            log.error("Unexpected error processing accepted friend request", e);
            simpMessagingTemplate.convertAndSendToUser(request.getTo(), "/specific", "Error: Unexpected error occurred.");
        }
    }

    @PostMapping("/friendRequests/decline")
    @ResponseBody
    public String declineFriendRequest(@RequestParam("friendId") String friendId) {
        try {
            Long id = Long.parseLong(friendId);
            friendService.removeFriend(id);
            return "Friend request declined successfully.";
        } catch (NumberFormatException e) {
            return "Error: Invalid friend ID format.";
        } catch (IllegalArgumentException e) {
            return "Error: " + e.getMessage();
        } catch (Exception e) {
            return "Error: An unexpected error occurred while declining the friend request.";
        }
    }

    @PostMapping("/friend/remove")
    @ResponseBody
    public String removeFriend(@RequestParam("friendId") String friendId) {
        try {
            Long id = Long.parseLong(friendId);
            friendService.removeFriend(id);
            return "Friend removed successfully.";
        } catch (NumberFormatException e) {
            return "Error: Invalid friend ID format.";
        } catch (IllegalArgumentException e) {
            return "Error: " + e.getMessage();
        } catch (Exception e) {
            return "Error: An unexpected error occurred while removing friend.";
        }
    }
}
