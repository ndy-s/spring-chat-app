package com.hendy.spring_chat_app.model;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SearchUsers {

    @NotBlank
    private String username;

    @NotBlank
    private List<SearchUserFriends> friendsOf;
}
