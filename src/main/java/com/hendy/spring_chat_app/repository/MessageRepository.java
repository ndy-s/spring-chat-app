package com.hendy.spring_chat_app.repository;

import com.hendy.spring_chat_app.entity.Message;
import com.hendy.spring_chat_app.entity.User;
import com.hendy.spring_chat_app.model.MessageData;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MessageRepository extends JpaRepository<Message, Long> {

    @Query("SELECT new com.hendy.spring_chat_app.model.MessageData(" +
            "m.id, " +
            "m.sender.id, " +
            "m.sender.username, " +
            "m.content, " +
            "m.timestamp) " +
            "FROM Message m " +
            "WHERE (m.sender = :user AND m.receiver = :friend) " +
            "OR (m.sender = :friend AND m.receiver = :user) " +
            "ORDER BY m.timestamp ASC")
    List<MessageData> findChatMessages(@Param("user") User user, @Param("friend") User friend);
}
