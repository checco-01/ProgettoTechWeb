package roadToUnina.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
@AllArgsConstructor
public class LeaderboardEntryResponse {
    private int position;
    private String username;
    private long completedGames;
    private Double averageSteps;
}
