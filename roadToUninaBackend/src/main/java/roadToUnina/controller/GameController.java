package roadToUnina.controller;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import roadToUnina.dto.*;
import roadToUnina.service.GameService;

import java.util.Map;

@RestController
@RequestMapping("/api/game")
public class GameController {

    private final GameService gameService;

    public GameController(GameService gameService) {
        this.gameService = gameService;
    }

    @PostMapping("/start")
    public ResponseEntity<?> startGame(@Valid @RequestBody StartGameRequest request,
                                       Authentication auth) {
        try {
            StartGameResponse response = gameService.startGame(auth.getName(), request);
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/{gameId}/step")
    public ResponseEntity<?> recordStep(@PathVariable Long gameId,
                                        @Valid @RequestBody StepRequest request,
                                        Authentication auth) {
        try {
            StepResponse response = gameService.recordStep(gameId, auth.getName(), request);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", e.getMessage()));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/{gameId}/complete")
    public ResponseEntity<?> completeGame(@PathVariable Long gameId,
                                          @Valid @RequestBody CompleteGameRequest request,
                                          Authentication auth) {
        try {
            GameSummaryResponse response = gameService.completeGame(gameId, auth.getName(), request);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/active")
    public ResponseEntity<?> getActiveGame(Authentication auth) {
        GameSummaryResponse game = gameService.getActiveGame(auth.getName());
        if (game == null) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.ok(game);
    }

    @GetMapping("/{gameId}")
    public ResponseEntity<?> getGame(@PathVariable Long gameId, Authentication auth) {
        try {
            GameSummaryResponse game = gameService.getGame(gameId, auth.getName());
            return ResponseEntity.ok(game);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }
}
