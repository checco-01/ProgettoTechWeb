package roadToUnina.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class StepRequest {
    @NotBlank
    private String urlFrom;

    @NotBlank
    private String urlTo;
}
