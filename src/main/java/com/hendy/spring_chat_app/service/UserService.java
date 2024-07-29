package com.hendy.spring_chat_app.service;

import com.hendy.spring_chat_app.entity.User;
import com.hendy.spring_chat_app.exception.InvalidRegistrationException;
import com.hendy.spring_chat_app.model.RegisterUserRequest;
import com.hendy.spring_chat_app.repository.UserRepository;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ValidationService validationService;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Transactional
    public void register(RegisterUserRequest request) {
        validationService.validate(request);

        if (userRepository.existsByUsername(request.getUsername())) {
            throw new InvalidRegistrationException("Username already registered");
        }

        User user = new User();
        user.setUsername(request.getUsername());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        userRepository.save(user);
    }

    public Optional<User> findByUsername(String username) {
        return userRepository.findByUsername(username);
    }

    public List<User> searchUsers(String query, String currentUsername) {
        return userRepository.findByUsernameContainingAndUsernameNot(query, currentUsername);
    }
}
