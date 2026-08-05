package roadToUnina.repository;

import roadToUnina.model.Game;
import roadToUnina.model.types.GameStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface GameRepository extends JpaRepository<Game, Long> {
    List<Game> findByUserIdOrderByCreatedAtDesc(Long userId);
    Optional<Game> findByUserIdAndActiveTrue(Long userId);
    List<Game> findByGameStatusOrderByTimeElapsedSecondsAsc(GameStatus status);
    List<Game> findByGameStatusOrderByNumberOfStepsAsc(GameStatus status);
    List<Game> findByGameStatusAndUserIdOrderByCreatedAtDesc(GameStatus status, Long userId);
}
