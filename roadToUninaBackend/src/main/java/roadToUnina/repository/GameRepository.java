package roadToUnina.repository;

import roadToUnina.model.Game;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface GameRepository extends JpaRepository<Game, Long> {
    List<Game> findByUserIdOrderByCreatedAtDesc(Long userId);
    List<Game> findByCompletedTrueOrderByTimeElapsedSecondsAsc();
    List<Game> findByCompletedTrueOrderByNumberOfStepsAsc();
    List<Game> findByCompletedTrueAndUserIdOrderByCreatedAtDesc(Long userId);
}
