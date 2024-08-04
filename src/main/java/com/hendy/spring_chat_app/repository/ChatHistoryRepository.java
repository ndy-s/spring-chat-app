package com.hendy.spring_chat_app.repository;

import com.hendy.spring_chat_app.entity.ChatHistory;
import com.hendy.spring_chat_app.entity.User;
import com.hendy.spring_chat_app.model.MessageHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ChatHistoryRepository extends JpaRepository<ChatHistory, Long> {

    Optional<ChatHistory> findByUserAndFriend(User user, User friend);

    @Query("SELECT new com.hendy.spring_chat_app.model.MessageHistory(" +
            "ch.id, " +
            "CASE WHEN ch.user.username = :username THEN ch.friend.id ELSE ch.user.id END, " +
            "CASE WHEN ch.user.username = :username THEN ch.friend.username ELSE ch.user.username END, " +
            "ch.lastMessageTimestamp) " +
            "FROM ChatHistory ch " +
            "WHERE ch.user.username = :username OR ch.friend.username = :username")
    List<MessageHistory> findMessageHistoriesByUsername(@Param("username") String username);
}
