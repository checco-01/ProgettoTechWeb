package roadToUnina.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class StartGameResponse {
    private Long gameId;
    private String startUrl;
}
