package roadToUnina.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import roadToUnina.dto.*;
import roadToUnina.model.Game;
import roadToUnina.model.GameStep;
import roadToUnina.model.User;
import roadToUnina.model.types.GameStatus;
import roadToUnina.repository.GameRepository;
import roadToUnina.repository.GameStepRepository;
import roadToUnina.repository.UserRepository;

@Service
public class GameService {

    private static final String TARGET_URL = "Università_degli_Studi_di_Napoli_Federico_II";

    private final GameRepository gameRepository;
    private final GameStepRepository gameStepRepository;
    private final UserRepository userRepository;

    public GameService(GameRepository gameRepository,
                       GameStepRepository gameStepRepository,
                       UserRepository userRepository) {
        this.gameRepository = gameRepository;
        this.gameStepRepository = gameStepRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public StartGameResponse startGame(String username, StartGameRequest request) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        // Disattiva eventuali partite attive precedenti
        gameRepository.findByUserIdAndActiveTrue(user.getId())
                .ifPresent(game -> {
                    game.setActive(false);
                    gameRepository.save(game);
                });

        Game game = new Game(user, request.getStartUrl());
        game = gameRepository.save(game);

        return new StartGameResponse(game.getId(), game.getStartUrl());
    }

    @Transactional
    public StepResponse recordStep(Long gameId, String username, StepRequest request) {
        Game game = gameRepository.findById(gameId)
                .orElseThrow(() -> new IllegalArgumentException("Game not found"));

        validateGameOwnership(game, username);

        if (!game.getActive()) {
            throw new IllegalStateException("Game is not active");
        }

        int stepNumber = game.getNumberOfSteps() + 1;

        GameStep step = new GameStep(game, stepNumber, request.getUrlFrom(), request.getUrlTo());
        gameStepRepository.save(step);

        game.setNumberOfSteps(stepNumber);
        gameRepository.save(game);

        boolean isTarget = request.getUrlTo().replace(' ', '_')
                .equalsIgnoreCase(TARGET_URL);

        return new StepResponse(stepNumber, isTarget);
    }

    @Transactional
    public GameSummaryResponse completeGame(Long gameId, String username, CompleteGameRequest request) {
        Game game = gameRepository.findById(gameId)
                .orElseThrow(() -> new IllegalArgumentException("Game not found"));

        validateGameOwnership(game, username);

        game.setNumberOfSteps(request.getTotalSteps());
        game.setTimeElapsedSeconds(request.getTimeElapsedSeconds());
        game.setGameStatus(GameStatus.Completed);
        game.setActive(false);
        gameRepository.save(game);

        return toSummary(game);
    }

    public GameSummaryResponse getActiveGame(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        return gameRepository.findByUserIdAndActiveTrue(user.getId())
                .map(this::toSummary)
                .orElse(null);
    }

    public GameSummaryResponse getGame(Long gameId, String username) {
        Game game = gameRepository.findById(gameId)
                .orElseThrow(() -> new IllegalArgumentException("Game not found"));
        validateGameOwnership(game, username);
        return toSummary(game);
    }

    private void validateGameOwnership(Game game, String username) {
        if (!game.getUser().getUsername().equals(username)) {
            throw new IllegalArgumentException("Game does not belong to user");
        }
    }

    private GameSummaryResponse toSummary(Game game) {
        return GameSummaryResponse.builder()
                .id(game.getId())
                .startUrl(game.getStartUrl())
                .numberOfSteps(game.getNumberOfSteps())
                .timeElapsedSeconds(game.getTimeElapsedSeconds())
                .gameStatus(game.getGameStatus())
                .createdAt(game.getCreatedAt())
                .build();
    }
}
