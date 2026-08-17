package roadToUnina.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import roadToUnina.model.types.GameStatus;

import java.time.LocalDateTime;

@Data
@Builder
@AllArgsConstructor
public class GameSummaryResponse {
    private Long id;
    private String startUrl;
    private int numberOfSteps;
    private GameStatus gameStatus;
    private LocalDateTime createdAt;
}
