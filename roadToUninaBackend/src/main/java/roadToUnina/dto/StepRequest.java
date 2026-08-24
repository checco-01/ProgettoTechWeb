package roadToUnina.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class StepRequest {
    // urlFrom non è accettato dal client: la pagina corrente è sempre
    // quella salvata dal server (vedi GameService.recordStep)
    @NotBlank @Size(max = 500) private String urlTo;
}
