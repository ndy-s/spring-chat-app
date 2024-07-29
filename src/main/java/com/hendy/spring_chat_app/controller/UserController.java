package com.hendy.spring_chat_app.controller;

import com.hendy.spring_chat_app.entity.User;
import com.hendy.spring_chat_app.model.SearchUserFriends;
import com.hendy.spring_chat_app.model.SearchUsers;
import com.hendy.spring_chat_app.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;

import java.util.List;
import java.util.stream.Collectors;

@Controller
public class UserController {

    @Autowired
    private UserService userService;

    @GetMapping("/searchUsers")
    @ResponseBody
    public List<SearchUsers> searchUsers(@RequestParam("query") String query) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String currentUsername = null;
        if (authentication != null && authentication.isAuthenticated()) {
            Object principal = authentication.getPrincipal();
            if (principal instanceof UserDetails) {
                currentUsername = ((UserDetails) principal).getUsername();
            }
        }

        List<User> users = userService.searchUsers(query, currentUsername);
        return users.stream().map(user -> {
            SearchUsers searchUsers = new SearchUsers();
            searchUsers.setUsername(user.getUsername());

            // Map friendsOf to SearchUserFriends DTO
            List<SearchUserFriends> friendsOf = user.getFriendsOf().stream().map(friend -> {
                SearchUserFriends searchUserFriends = new SearchUserFriends();
                searchUserFriends.setUserId(friend.getUser().getId());
                searchUserFriends.setFriendId(friend.getFriend().getId());
                searchUserFriends.setStatus(friend.getStatus());
                return searchUserFriends;
            }).collect(Collectors.toList());

            searchUsers.setFriendsOf(friendsOf);

            return searchUsers;
        }).collect(Collectors.toList());
    }
}
