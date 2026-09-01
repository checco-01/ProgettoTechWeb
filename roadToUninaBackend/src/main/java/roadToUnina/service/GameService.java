package roadToUnina.service;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.IntStream;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import roadToUnina.client.WikipediaClient;
import roadToUnina.dto.*;
import roadToUnina.exception.RateLimitExceededException;
import roadToUnina.model.Game;
import roadToUnina.model.GameStep;
import roadToUnina.model.User;
import roadToUnina.model.types.GameStatus;
import roadToUnina.repository.GameRepository;
import roadToUnina.repository.GameStepRepository;
import roadToUnina.repository.UserRepository;

@Service
public class GameService {

    private final GameRepository gameRepository;
    private final GameStepRepository gameStepRepository;
    private final UserRepository userRepository;
    private final WikipediaClient wikipediaClient;

    private static final int MAX_IN_PROGRESS_GAMES = 3;
    private static final int MAX_STARTS_PER_HOUR = 30;
    private static final int MAX_STEPS_PER_MINUTE = 30;
    private static final long HOUR_MILLIS = 3_600_000L;
    private static final long MINUTE_MILLIS = 60_000L;

    /** Pagina obiettivo del gioco (titolo Wikipedia), hardcoded: è fissa per il gioco. */
    private static final String TARGET_PAGE = "Università_degli_Studi_di_Napoli_Federico_II";

    private final Map<String, Window> startWindows = new ConcurrentHashMap<>();
    private final Map<String, Window> stepWindows = new ConcurrentHashMap<>();

    private record Window(int count, long startMillis) {
        boolean expired(long windowMillis) {
            return System.currentTimeMillis() - startMillis >= windowMillis;
        }

        Window increment() {
            return new Window(count + 1, startMillis);
        }
    }

    public GameService(
            GameRepository gameRepository,
            GameStepRepository gameStepRepository,
            UserRepository userRepository,
            WikipediaClient wikipediaClient) {
        this.gameRepository = gameRepository;
        this.gameStepRepository = gameStepRepository;
        this.userRepository = userRepository;
        this.wikipediaClient = wikipediaClient;
    }

    @Transactional
    public StartGameResponse startGame(String username) {
        User user = userRepository
                .findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        long inProgress = gameRepository.countByGameStatusAndUserId(GameStatus.InProgress, user.getId());
        if (inProgress >= MAX_IN_PROGRESS_GAMES) {
            throw new RateLimitExceededException(
                    "Hai già " + MAX_IN_PROGRESS_GAMES + " partite in corso: concludile o abbandonale");
        }

        checkStartAllowed(username);

        String startingAdress = wikipediaClient
                .getRandomPage(TARGET_PAGE)
                .orElseThrow(() -> new IllegalStateException(
                        "Impossibile ottenere una pagina casuale da Wikipedia. Riprova tra poco."));
        String resolvedStart = wikipediaClient.resolveTitle(startingAdress).orElse(startingAdress);
        if (WikipediaClient.normalize(resolvedStart).equalsIgnoreCase(WikipediaClient.normalize(TARGET_PAGE))) {
            throw new IllegalStateException("La pagina di partenza non può essere l'obiettivo");
        }

        Game game = new Game(user, startingAdress);
        game = gameRepository.save(game);

        GameStep step = new GameStep(game, 0, "", startingAdress);
        gameStepRepository.save(step);

        return new StartGameResponse(game.getId(), game.getStartUrl());
    }

    @Transactional
    public void recordStep(Long gameId, String username, String stepRequest) {
        Game game = gameRepository.findById(gameId).orElseThrow(() -> new IllegalArgumentException("Game not found"));

        validateGameOwnership(game, username);

        if (game.getGameStatus() != GameStatus.InProgress) {
            throw new IllegalStateException("Game is not active");
        }

        // Anti-bot: limite di passaggi al minuto per utente
        checkStepAllowed(username);

        // La pagina corrente è sempre quella salvata dal server (ultimo urlTo o
        // startUrl): il client non può saltare a pagine arbitrarie.
        String currentPage = gameStepRepository
                .findTopByGameIdOrderByStepNumberDesc(gameId)
                .map(GameStep::getUrlTo)
                .orElse(game.getStartUrl());

        // Anti-cheat: verifica che il link esista realmente nella pagina corrente
        if (!wikipediaClient.hasLink(currentPage, stepRequest)) {
            throw new IllegalArgumentException("Il link non esiste nella pagina corrente");
        }

        int stepNumber = game.getNumberOfSteps() + 1;
        game.setNumberOfSteps(stepNumber);

        GameStep step = new GameStep(game, stepNumber, currentPage, stepRequest);
        gameStepRepository.save(step);

        gameRepository.save(game);
    }

    @Transactional
    public GameSummaryResponse completeGame(Long gameId, String username) {
        Game game = gameRepository.findById(gameId).orElseThrow(() -> new IllegalArgumentException("Game not found"));

        validateGameOwnership(game, username);

        if (game.getGameStatus() != GameStatus.InProgress) {
            throw new IllegalStateException("Game is not active");
        }

        // Anti-cheat: la partita si completa solo se l'ultima pagina è l'obiettivo.
        // Il titolo viene risolto lato server (i redirect contano, come nel frontend).
        String lastPage = gameStepRepository
                .findTopByGameIdOrderByStepNumberDesc(gameId)
                .map(GameStep::getUrlTo)
                .orElse(game.getStartUrl());
        boolean reachedTarget = wikipediaClient
                .resolveTitle(lastPage)
                .map(resolved ->
                        WikipediaClient.normalize(resolved).equalsIgnoreCase(WikipediaClient.normalize(TARGET_PAGE)))
                .orElse(false);
        if (!reachedTarget) {
            throw new IllegalArgumentException("Obiettivo non raggiunto: non puoi completare la partita");
        }

        // Anti-cheat: mosse e tempo sono calcolati dal server, nessun valore
        // accettato dal client. Il tempo è la differenza tra ora e la creazione
        // della partita (stessa semantica del timer lato frontend).
        long elapsedSeconds = Math.max(
                0, Duration.between(game.getCreatedAt(), LocalDateTime.now()).getSeconds());
        game.setGameStatus(GameStatus.Completed);
        game.setTimeElapsedSeconds((int) elapsedSeconds);
        gameRepository.save(game);

        return toSummary(game);
    }

    @Transactional
    public GameSummaryResponse abandonGame(Long gameId, String username) {
        Game game = gameRepository.findById(gameId).orElseThrow(() -> new IllegalArgumentException("Game not found"));

        validateGameOwnership(game, username);

        if (game.getGameStatus() != GameStatus.InProgress) {
            throw new IllegalStateException("Game is not active");
        }

        game.setGameStatus(GameStatus.Failed);
        gameRepository.save(game);

        return toSummary(game);
    }

    public StepResponse getLastGameStep(Long gameId, String username) {
        Game game = gameRepository.findById(gameId).orElseThrow(() -> new IllegalArgumentException("Game not found"));

        validateGameOwnership(game, username);

        GameStep lastStep = gameStepRepository
                .findTopByGameIdOrderByStepNumberDesc(gameId)
                .orElseThrow(() -> new IllegalArgumentException("No steps found for this game"));

        return StepResponse.builder()
                .stepNumber(lastStep.getStepNumber())
                .url(lastStep.getUrlTo())
                .build();
    }

    public List<GameSummaryResponse> getInProgressGames(String username) {
        User user = userRepository
                .findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        return gameRepository
                .findByGameStatusAndUserIdOrderByCreatedAtDesc(GameStatus.InProgress, user.getId())
                .stream()
                .map(this::toSummary)
                .toList();
    }

    public List<GameSummaryResponse> getMyGames(String username) {
        User user = userRepository
                .findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        return gameRepository.findByUserIdOrderByCreatedAtDesc(user.getId()).stream()
                .map(this::toSummary)
                .toList();
    }

    public GameSummaryResponse getGame(Long gameId, String username) {
        Game game = gameRepository.findById(gameId).orElseThrow(() -> new IllegalArgumentException("Game not found"));
        validateGameOwnership(game, username);
        return toSummary(game);
    }

    public List<GameSummaryResponse> searchCompletedGames(String query) {
        if (query == null || query.isBlank()) {
            return List.of();
        }
        return gameRepository.searchCompletedGames(GameStatus.Completed, query.trim()).stream()
                .map(this::toSummary)
                .toList();
    }

    public List<LeaderboardEntryResponse> getLeaderboard() {
        List<GameRepository.LeaderboardRow> rows = gameRepository.findLeaderboard(GameStatus.Completed);

        return IntStream.range(0, Math.min(rows.size(), 10))
                .mapToObj(i -> LeaderboardEntryResponse.builder()
                        .position(i + 1)
                        .username(rows.get(i).getUsername())
                        .completedGames(rows.get(i).getCompletedGames())
                        .averageSteps(rows.get(i).getAverageSteps())
                        .build())
                .toList();
    }

    public List<StepResponse> getGameSteps(Long gameId) {
        Game game = gameRepository.findById(gameId).orElseThrow(() -> new IllegalArgumentException("Game not found"));

        // Il percorso è visibile solo per le partite concluse (completate o abbandonate)
        if (game.getGameStatus() == GameStatus.InProgress) {
            throw new IllegalStateException("Only finished games expose their path");
        }

        return gameStepRepository.findByGameIdOrderByStepNumberAsc(gameId).stream()
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

    public void checkStartAllowed(String username) {
        if (exceeded(startWindows, username, MAX_STARTS_PER_HOUR, HOUR_MILLIS)) {
            throw new RateLimitExceededException("Troppe partite avviate. Riprova più tardi.");
        }
    }

    public void checkStepAllowed(String username) {
        if (exceeded(stepWindows, username, MAX_STEPS_PER_MINUTE, MINUTE_MILLIS)) {
            throw new RateLimitExceededException("Troppi passaggi in poco tempo. Riprova più lentamente.");
        }
    }

    private boolean exceeded(Map<String, Window> windows, String key, int limit, long windowMillis) {
        Window current = windows.compute(key, (_, w) -> {
            if (w == null || w.expired(windowMillis)) {
                return new Window(1, System.currentTimeMillis());
            }
            return w.increment();
        });
        return current.count() > limit;
    }
}
