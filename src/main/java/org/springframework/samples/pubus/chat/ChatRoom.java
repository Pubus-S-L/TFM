package org.springframework.samples.pubus.chat;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;
import java.util.Set;

import org.springframework.samples.pubus.model.BaseEntity;
import org.springframework.samples.pubus.user.User;

@Entity
@Getter
@Setter
public class ChatRoom extends BaseEntity {

    @ManyToMany(fetch = FetchType.EAGER)
    private List<User> users = new ArrayList<>();

    // @ElementCollection
    // private Set<Integer> participant;

}