package roadToUnina.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
@AllArgsConstructor
public class StepResponse {
    private int stepNumber;
    private String url;
}
