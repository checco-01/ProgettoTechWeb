package techWeb.roadToUninaBackend.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "games")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Game {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "start_url", nullable = false, length = 500)
    private String startUrl;

    @Column(name = "end_url", nullable = false, length = 500)
    private String endUrl = "https://www.unina.it/";

    @Column(name = "number_of_steps")
    private Integer numberOfSteps = 0;

    @Column(name = "time_elapsed_seconds")
    private Integer timeElapsedSeconds = 0;

    @Column(nullable = false)
    private Boolean completed = false;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }

    public Game(User user, String startUrl) {
        this.user = user;
        this.startUrl = startUrl;
    }
}
