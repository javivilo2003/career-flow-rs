package app.careerflow.rs.health;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

import java.sql.Connection;
import java.sql.DatabaseMetaData;
import java.sql.SQLException;

import javax.sql.DataSource;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.boot.health.contributor.Status;

@ExtendWith(MockitoExtension.class)
class DBHealthCheckTest {

    @Mock private DataSource dataSource;
    @Mock private Connection connection;
    @Mock private DatabaseMetaData metadata;

    @Test
    void reportsUpForValidConnection() throws Exception {
        when(dataSource.getConnection()).thenReturn(connection);
        when(connection.isValid(2)).thenReturn(true);
        when(connection.getMetaData()).thenReturn(metadata);
        when(metadata.getDatabaseProductName()).thenReturn("PostgreSQL");

        var health = new DBHealthCheck(dataSource).health();

        assertThat(health.getStatus()).isEqualTo(Status.UP);
        assertThat(health.getDetails()).containsEntry("database", "PostgreSQL");
        assertThat(health.getDetails()).containsKey("responseTime");
    }

    @Test
    void reportsDownForInvalidConnection() throws Exception {
        when(dataSource.getConnection()).thenReturn(connection);
        when(connection.isValid(2)).thenReturn(false);

        var health = new DBHealthCheck(dataSource).health();

        assertThat(health.getStatus()).isEqualTo(Status.DOWN);
        assertThat(health.getDetails()).containsEntry("validationTimeout", "2s");
    }

    @Test
    void reportsDownWhenConnectionFails() throws Exception {
        when(dataSource.getConnection()).thenThrow(new SQLException("Database unavailable"));

        var health = new DBHealthCheck(dataSource).health();

        assertThat(health.getStatus()).isEqualTo(Status.DOWN);
        assertThat(health.getDetails()).containsEntry("error", "Database unavailable");
    }
}
