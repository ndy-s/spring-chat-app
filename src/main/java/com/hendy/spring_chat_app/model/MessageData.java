package com.hendy.spring_chat_app.model;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Date;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MessageData {

    private Long id;

    private Long userId;

    private String username;

    @NotBlank
    private String content;

    private Date timestamp;
}
