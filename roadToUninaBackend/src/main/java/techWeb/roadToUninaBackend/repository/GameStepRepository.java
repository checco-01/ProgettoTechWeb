package techWeb.roadToUninaBackend.repository;

import techWeb.roadToUninaBackend.model.GameStep;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface GameStepRepository extends JpaRepository<GameStep, Long> {
    List<GameStep> findByGameIdOrderByStepNumberAsc(Long gameId);
}
