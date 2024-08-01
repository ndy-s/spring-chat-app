package com.hendy.spring_chat_app.repository;

import com.hendy.spring_chat_app.entity.Friend;
import com.hendy.spring_chat_app.entity.FriendshipStatus;
import com.hendy.spring_chat_app.entity.User;
import com.hendy.spring_chat_app.model.FriendByStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FriendRepository extends JpaRepository<Friend, Long> {

    Optional<Friend> findByUserAndFriend(User user, User friend);

    @Query("SELECT new com.hendy.spring_chat_app.model.FriendByStatus(f.id, f.friend.id, f.friend.username, f.updatedAt) FROM Friend f WHERE f.user.username = :username AND f.status = :status")
    List<FriendByStatus> findStatusByUserUsername(@Param("username") String username, @Param("status") FriendshipStatus status);

    @Query("SELECT new com.hendy.spring_chat_app.model.FriendByStatus(f.id, f.user.id, f.user.username, f.updatedAt) FROM Friend f WHERE f.friend.username = :username AND f.status = :status")
    List<FriendByStatus> findStatusByFriendUsername(@Param("username") String username, @Param("status") FriendshipStatus status);
}