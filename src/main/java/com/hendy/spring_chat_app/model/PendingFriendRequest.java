package com.hendy.spring_chat_app.model;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class PendingFriendRequest {

    @NotBlank
    private Long id;

    @NotBlank
    private Long userId;

    @NotBlank
    private String username;
}
