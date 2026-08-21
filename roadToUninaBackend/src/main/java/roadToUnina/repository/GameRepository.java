package roadToUnina.repository;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import roadToUnina.model.Game;
import roadToUnina.model.types.GameStatus;

@Repository
public interface GameRepository extends JpaRepository<Game, Long> {
    Optional<Game> findByUserIdAndGameStatus(Long userId, GameStatus gameStatus);

    List<Game> findByGameStatusAndUserIdOrderByCreatedAtDesc(GameStatus status, Long userId);

    @Query("""
        SELECT g FROM Game g
        WHERE g.gameStatus = :status
          AND (
                LOWER(g.user.username) LIKE LOWER(CONCAT('%', :query, '%'))
                OR CAST(g.id AS string) LIKE CONCAT('%', :query, '%')
              )
        ORDER BY g.createdAt DESC
        """)
    List<Game> searchCompletedGames(@Param("status") GameStatus status, @Param("query") String query);

    @Query("""
        SELECT g.user.username AS username,
               COUNT(g)          AS completedGames,
               AVG(g.numberOfSteps) AS averageSteps
        FROM Game g
        WHERE g.gameStatus = :status
        GROUP BY g.user.username
        ORDER BY COUNT(g) DESC, AVG(g.numberOfSteps) ASC, g.user.username ASC
        """)
    List<LeaderboardRow> findLeaderboard(@Param("status") GameStatus status);

    interface LeaderboardRow {
        String getUsername();

        Long getCompletedGames();

        Double getAverageSteps();
    }
}
