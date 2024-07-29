package com.hendy.spring_chat_app.model;

import com.hendy.spring_chat_app.entity.FriendshipStatus;
import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SearchUserFriends {

    @NotBlank
    private Long userId;

    @NotBlank
    private Long friendId;

    @NotBlank
    private FriendshipStatus status;
}
