package org.springframework.samples.pubus.chat;

import java.time.LocalDateTime;

import org.springframework.samples.pubus.model.BaseEntity;

import jakarta.persistence.Entity;
import lombok.*;


@Getter
@Setter
@Entity
public class Message extends BaseEntity {
    private String senderName;
    private String message;
    private LocalDateTime timestamp;

}