package com.hendy.spring_chat_app.repository;

import com.hendy.spring_chat_app.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByUsername(String username);

    Optional<User> findByUsernameIgnoreCase(String username);

    boolean existsByUsername(String username);

    List<User> findByUsernameContainingAndUsernameNot(String username, String excludedUsername);
}
