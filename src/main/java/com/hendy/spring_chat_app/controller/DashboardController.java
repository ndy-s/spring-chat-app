package com.hendy.spring_chat_app.controller;

import com.hendy.spring_chat_app.entity.User;
import com.hendy.spring_chat_app.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;

import java.util.Optional;

@Controller
public class DashboardController {

    @Autowired
    private UserService userService;

    @GetMapping("/")
    public String dashboard(Model model) {
        // Get the authentication object
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        // Check if the user is authenticated and get the username
        String username = null;
        Long userId = null;
        if (authentication != null && authentication.isAuthenticated()) {
            Object principal = authentication.getPrincipal();
            if (principal instanceof UserDetails) {
                username = ((UserDetails) principal).getUsername();
            } else {
                username = principal.toString();
            }

            // Fetch the user details from the service
            if (username != null) {
                Optional<User> userOptional = userService.findByUsername(username);
                if (userOptional.isPresent()) {
                    User user = userOptional.get();
                    userId = user.getId();
                }
            }
        }

        // Add the username and user ID to the model
        model.addAttribute("username", username);
        model.addAttribute("userId", userId);

        return "dashboard";
    }
}
