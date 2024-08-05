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
            "f.id, " +
            "ch.friend.id, " +
            "ch.friend.username, " +
            "ch.lastMessage.content, " +
            "ch.lastMessageTimestamp)" +
            "FROM ChatHistory ch " +
            "LEFT JOIN ch.lastMessage lm " +
            "LEFT JOIN Friend f ON (f.user = ch.user AND f.friend = ch.friend) OR (f.user = ch.friend AND f.friend = ch.user) " +
            "WHERE ch.user.username = :username")
    List<MessageHistory> findMessageHistoriesByUsername(@Param("username") String username);
}
