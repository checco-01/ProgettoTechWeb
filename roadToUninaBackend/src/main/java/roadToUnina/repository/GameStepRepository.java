package roadToUnina.repository;

import roadToUnina.model.GameStep;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface GameStepRepository extends JpaRepository<GameStep, Long> {
    List<GameStep> findByGameIdOrderByStepNumberAsc(Long gameId);

    Optional<GameStep> findTopByGameIdOrderByStepNumberDesc(Long gameId);
}
