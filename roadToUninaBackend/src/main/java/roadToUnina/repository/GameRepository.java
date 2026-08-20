package roadToUnina.repository;

import roadToUnina.model.Game;
import roadToUnina.model.types.GameStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

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
    List<Game> searchCompletedGames(@Param("status") GameStatus status,
                                    @Param("query") String query);
}
