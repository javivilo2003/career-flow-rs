package app.careerflow.rs.company.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;

import app.careerflow.rs.common.exception.ConflictException;
import app.careerflow.rs.company.domain.Company;
import app.careerflow.rs.company.dto.CompanyRequest;
import app.careerflow.rs.company.repository.CompanyRepository;
import app.careerflow.rs.contact.repository.ContactRepository;
import app.careerflow.rs.job_application.repository.JobApplicationRepository;
import jakarta.persistence.criteria.CriteriaBuilder;
import jakarta.persistence.criteria.CriteriaQuery;
import jakarta.persistence.criteria.Expression;
import jakarta.persistence.criteria.Path;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;

@ExtendWith(MockitoExtension.class)
class CompanyPhaseOneServiceContractTest {

    @Mock
    private CompanyRepository repository;

    @Mock
    private JobApplicationRepository applicationRepository;

    @Mock
    private ContactRepository contactRepository;

    @InjectMocks
    private CompanyService service;

    @Test
    void createReturnsTheGeneratedPersistedId() {
        UUID persistedId = UUID.randomUUID();
        CompanyRequest request = new CompanyRequest("Acme", null, null, null);
        when(repository.save(any(Company.class))).thenAnswer(invocation -> {
            Company company = invocation.getArgument(0);
            company.setId(persistedId);
            return company;
        });

        var result = service.addNewCompany(request);

        assertThat(result.id()).isEqualTo(persistedId);
        assertThat(result.companyName()).isEqualTo("Acme");
    }

    @Test
    void createRejectsAnExistingCompanyNameIgnoringCase() {
        CompanyRequest request = new CompanyRequest("ACME", null, null, null);
        when(repository.existsByCompanyNameIgnoreCase("ACME")).thenReturn(true);

        assertThatThrownBy(() -> service.addNewCompany(request))
            .isInstanceOf(ConflictException.class)
            .hasMessage("A company with this name already exists.");

        verify(repository, never()).save(any(Company.class));
    }

    @SuppressWarnings({ "unchecked", "rawtypes" })
    @Test
    void companyNameFilterUsesCaseInsensitiveContainsMatching() {
        when(repository.findAll(any(Specification.class), any(Pageable.class)))
            .thenReturn(Page.empty());
        service.getCompanies(
            new CompanyFilter(null, "  Ac_Me%  ", null, null, null, null),
            0,
            10,
            "companyName",
            Sort.Direction.ASC
        );

        ArgumentCaptor<Specification<Company>> specification = ArgumentCaptor.forClass(Specification.class);
        verify(repository).findAll(specification.capture(), any(Pageable.class));

        Root<Company> root = org.mockito.Mockito.mock(Root.class);
        CriteriaQuery<?> query = org.mockito.Mockito.mock(CriteriaQuery.class);
        CriteriaBuilder builder = org.mockito.Mockito.mock(CriteriaBuilder.class);
        Path<String> namePath = org.mockito.Mockito.mock(Path.class);
        Expression<String> lowerName = org.mockito.Mockito.mock(Expression.class);
        Predicate namePredicate = org.mockito.Mockito.mock(Predicate.class);
        Predicate combined = org.mockito.Mockito.mock(Predicate.class);
        when(root.<String>get("companyName")).thenReturn(namePath);
        when(builder.lower(namePath)).thenReturn(lowerName);
        when(builder.like(lowerName, "%ac\\_me\\%%", '\\')).thenReturn(namePredicate);
        when(builder.and(any(Predicate[].class))).thenReturn(combined);

        assertThat(specification.getValue().toPredicate(root, query, builder)).isSameAs(combined);
        verify(builder).like(eq(lowerName), eq("%ac\\_me\\%%"), eq('\\'));
    }
}
