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

import java.util.List;

@Service
public class GameService {

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

        Game game = new Game(user, request.getStartUrl());
        game = gameRepository.save(game);

        GameStep step = new GameStep(game, 0, "", request.getStartUrl());
        gameStepRepository.save(step);

        return new StartGameResponse(game.getId(), game.getStartUrl());
    }

    @Transactional
    public void recordStep(Long gameId, String username, StepRequest request) {
        Game game = gameRepository.findById(gameId)
                .orElseThrow(() -> new IllegalArgumentException("Game not found"));

        validateGameOwnership(game, username);

        if (game.getGameStatus() != GameStatus.InProgress) {
            throw new IllegalStateException("Game is not active");
        }

        int stepNumber = game.getNumberOfSteps() + 1;
        game.setNumberOfSteps(stepNumber);

        GameStep step = new GameStep(game, stepNumber, request.getUrlFrom(), request.getUrlTo());
        gameStepRepository.save(step);

        gameRepository.save(game);
    }

    @Transactional
    public GameSummaryResponse completeGame(Long gameId, String username, CompleteGameRequest request) {
        Game game = gameRepository.findById(gameId)
                .orElseThrow(() -> new IllegalArgumentException("Game not found"));

        validateGameOwnership(game, username);

        game.setNumberOfSteps(request.getTotalSteps());
        game.setGameStatus(GameStatus.Completed);
        game.setTimeElapsedSeconds(request.getTotalTime());
        gameRepository.save(game);

        return toSummary(game);
    }

    @Transactional
    public GameSummaryResponse abandonGame(Long gameId, String username) {
        Game game = gameRepository.findById(gameId)
                .orElseThrow(() -> new IllegalArgumentException("Game not found"));

        validateGameOwnership(game, username);

        game.setGameStatus(GameStatus.Failed);
        gameRepository.save(game);

        return toSummary(game);
    }

    public StepResponse getLastGameStep(Long gameId, String username) {
        Game game = gameRepository.findById(gameId)
                .orElseThrow(() -> new IllegalArgumentException("Game not found"));

        validateGameOwnership(game, username);

        GameStep lastStep = gameStepRepository.findTopByGameIdOrderByStepNumberDesc(gameId)
                .orElseThrow(() -> new IllegalArgumentException("No steps found for this game"));

        return StepResponse.builder()
                .stepNumber(lastStep.getStepNumber())
                .url(lastStep.getUrlTo())
                .build();
    }

    public GameSummaryResponse getActiveGame(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        return gameRepository.findByUserIdAndGameStatus(user.getId(), GameStatus.InProgress)
                .map(this::toSummary)
                .orElse(null);
    }

    public List<GameSummaryResponse> getInProgressGames(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        return gameRepository.findByGameStatusAndUserIdOrderByCreatedAtDesc(GameStatus.InProgress, user.getId())
                .stream()
                .map(this::toSummary)
                .toList();
    }

    public GameSummaryResponse getGame(Long gameId, String username) {
        Game game = gameRepository.findById(gameId)
                .orElseThrow(() -> new IllegalArgumentException("Game not found"));
        validateGameOwnership(game, username);
        return toSummary(game);
    }

    public List<GameSummaryResponse> searchCompletedGames(String query) {
        if (query == null || query.isBlank()) {
            return List.of();
        }
        return gameRepository.searchCompletedGames(GameStatus.Completed, query.trim())
                .stream()
                .map(this::toSummary)
                .toList();
    }

    public List<StepResponse> getGameSteps(Long gameId) {
        Game game = gameRepository.findById(gameId)
                .orElseThrow(() -> new IllegalArgumentException("Game not found"));

        // Il percorso è visibile solo per le partite completate
        if (game.getGameStatus() != GameStatus.Completed) {
            throw new IllegalStateException("Only completed games expose their path");
        }

        return gameStepRepository.findByGameIdOrderByStepNumberAsc(gameId)
                .stream()
                .map(step -> StepResponse.builder()
                        .stepNumber(step.getStepNumber())
                        .url(step.getUrlTo())
                        .build())
                .toList();
    }

    private void validateGameOwnership(Game game, String username) {
        if (!game.getUser().getUsername().equals(username)) {
            throw new IllegalArgumentException("Game does not belong to user");
        }
    }

    private GameSummaryResponse toSummary(Game game) {
        return GameSummaryResponse.builder()
                .id(game.getId())
                .username(game.getUser().getUsername())
                .numberOfSteps(game.getNumberOfSteps())
                .gameStatus(game.getGameStatus())
                .timeElapsedSeconds(game.getTimeElapsedSeconds())
                .createdAt(game.getCreatedAt())
                .startUrl(game.getStartUrl())
                .build();
    }
}
