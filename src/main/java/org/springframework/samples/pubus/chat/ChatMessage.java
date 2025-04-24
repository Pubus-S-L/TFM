package org.springframework.samples.pubus.chat;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.util.Date;

import org.springframework.samples.pubus.model.BaseEntity;

@Entity
@Getter
@Setter
public class ChatMessage extends BaseEntity {

    private String content;
    private String sender;
    private String receiver;
    private Integer chatId;
    private Date timestamp;
}