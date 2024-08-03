package com.hendy.spring_chat_app.model;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Date;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class FriendRequest {

    @NotBlank
    @Size(max = 100)
    private String from;

    @NotBlank
    @Size(max = 100)
    private String to;

    private Long friendId;

    private String updatedAt;
}
