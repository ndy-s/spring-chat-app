package com.hendy.spring_chat_app.model;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReceivedMessage {

    @NotBlank
    private String type;

    @NotBlank
    @Size(max = 100)
    private String from;

    @NotBlank
    @Size(max = 100)
    private String to;

    @NotNull
    private String historyId;

    @NotBlank
    private String content;

    @NotBlank
    private String timestamp;
}
