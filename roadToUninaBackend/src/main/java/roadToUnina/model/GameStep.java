package roadToUnina.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "game_steps")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(of = "id")
public class GameStep {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "game_id", nullable = false)
    private Game game;

    @Column(name = "step_number", nullable = false)
    private Integer stepNumber;

    @Column(name = "url_from", nullable = false, length = 500)
    private String urlFrom;

    @Column(name = "url_to", nullable = false, length = 500)
    private String urlTo;

    @Column(name = "clicked_at", nullable = false, updatable = false)
    private LocalDateTime clickedAt;

    @PrePersist
    protected void onCreate() {
        this.clickedAt = LocalDateTime.now();
    }

    public GameStep(Game game, Integer stepNumber, String urlFrom, String urlTo) {
        this.game = game;
        this.stepNumber = stepNumber;
        this.urlFrom = urlFrom;
        this.urlTo = urlTo;
    }
}
