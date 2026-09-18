package app.careerflow.rs.health;

import java.sql.Connection;
import java.sql.SQLException;

import javax.sql.DataSource;

import org.springframework.boot.health.contributor.Health;
import org.springframework.boot.health.contributor.HealthIndicator;
import org.springframework.stereotype.Component;

@Component("dbHealthIndicator")
public class DBHealthCheck implements HealthIndicator {

    private static final int VALIDATION_TIMEOUT_SECONDS = 2;

    private final DataSource dataSource;

    public DBHealthCheck(DataSource dataSource) {
        this.dataSource = dataSource;
    }

    @Override
    public Health health() {
        long startTime = System.nanoTime();

        try {
            try (Connection connection = dataSource.getConnection()) {
                boolean valid = connection.isValid(VALIDATION_TIMEOUT_SECONDS);
                long responseTime = (System.nanoTime() - startTime) / 1_000_000;

                if (!valid) {
                    return Health.down()
                            .withDetail("responseTime", responseTime + "ms")
                            .withDetail("validationTimeout", VALIDATION_TIMEOUT_SECONDS + "s")
                            .build();
                }

                return Health.up()
                        .withDetail("responseTime", responseTime + "ms")
                        .withDetail("database", connection.getMetaData().getDatabaseProductName())
                        .build();
            }

        } catch (SQLException e) {
            return Health.down()
                    .withDetail("error", e.getMessage())
                    .build();
        }
    }
}
