package app.careerflow.rs.analytics.controller;

import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.LocalDate;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import app.careerflow.rs.analytics.service.AnalyticsService;
import app.careerflow.rs.common.exception.InvalidRequestException;

@WebMvcTest(AnalyticsController.class)
class AnalyticsControllerTest {

    @Autowired private MockMvc mockMvc;
    @MockitoBean private AnalyticsService service;

    @Test
    void forwardsOptionalInclusiveCalendarBounds() throws Exception {
        LocalDate from = LocalDate.of(2026, 8, 1);
        LocalDate to = LocalDate.of(2026, 8, 31);

        mockMvc.perform(get("/api/analytics/progress").param("from", "2026-08-01")
                .param("to", "2026-08-31"))
            .andExpect(status().isOk());

        verify(service).getProgress(from, to);
    }

    @Test
    void malformedDateUsesSharedInvalidRequestEnvelope() throws Exception {
        mockMvc.perform(get("/api/analytics/progress").param("from", "08/01/2026"))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.error.code").value("INVALID_REQUEST"));
    }

    @Test
    void reversedRangeUsesDocumentedMessageAndEnvelope() throws Exception {
        LocalDate from = LocalDate.of(2026, 8, 31);
        LocalDate to = LocalDate.of(2026, 8, 1);
        when(service.getProgress(from, to))
            .thenThrow(new InvalidRequestException("from must be on or before to."));

        mockMvc.perform(get("/api/analytics/progress").param("from", "2026-08-31")
                .param("to", "2026-08-01"))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.error.code").value("INVALID_REQUEST"))
            .andExpect(jsonPath("$.error.message").value("from must be on or before to."));
    }
}
