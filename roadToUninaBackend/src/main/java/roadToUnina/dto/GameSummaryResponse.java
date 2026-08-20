package roadToUnina.dto;

import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import roadToUnina.model.types.GameStatus;

@Data
@Builder
@AllArgsConstructor
public class GameSummaryResponse {
    private Long id;
    private String username;
    private String startUrl;
    private int numberOfSteps;
    private Integer timeElapsedSeconds;
    private GameStatus gameStatus;
    private LocalDateTime createdAt;
}
