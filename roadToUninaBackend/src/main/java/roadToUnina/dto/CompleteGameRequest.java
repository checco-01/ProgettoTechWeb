package roadToUnina.dto;

import jakarta.validation.constraints.Min;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor

public class CompleteGameRequest {
    @Min(0)
    private int totalSteps;
    private int totalTime;
}
