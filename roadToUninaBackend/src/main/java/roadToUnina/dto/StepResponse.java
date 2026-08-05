package roadToUnina.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class StepResponse {
    private int stepNumber;

    @JsonProperty("isTarget")
    private boolean isTarget;
}
