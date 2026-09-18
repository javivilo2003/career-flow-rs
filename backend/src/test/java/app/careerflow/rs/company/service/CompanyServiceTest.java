package app.careerflow.rs.company.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import org.springframework.data.domain.Sort;

import app.careerflow.rs.common.exception.InvalidRequestException;
import app.careerflow.rs.common.exception.ResourceNotFoundException;
import app.careerflow.rs.company.domain.Company;
import app.careerflow.rs.company.dto.CompanyRequest;
import app.careerflow.rs.company.mapper.CompanyMapper;
import app.careerflow.rs.company.repository.CompanyRepository;

@ExtendWith(MockitoExtension.class)
public class CompanyServiceTest {

    @Mock 
    private CompanyRepository repository;

    @Mock 
    private CompanyMapper mapper;

    @InjectMocks 
    private CompanyService service;

    @Test 
    void unsupportedSortingFieldIsRejected(){
        CompanyFilter emptyFilter = new CompanyFilter(
            null,
            null,
            null,
            null,
            null,
            null
        );

        assertThatThrownBy(() -> 
            service.getCompanies(emptyFilter,
                0,
                10,
                "unknownField",
                Sort.Direction.ASC
            )
        )
            .isInstanceOf(InvalidRequestException.class)
            .hasMessage(
                "Unsupported sorting field: unknownField"
            );
        verifyNoInteractions(repository);
    }

    @Test
    void getCompanyByIdReturnsMappedCompany() throws Exception {
        UUID id = UUID.randomUUID();
        Company company = Company.builder().id(id).companyName("Testing L.S.").build();
        when(repository.findById(id)).thenReturn(Optional.of(company));

        var result = service.getCompanyById(id);

        assertThat(result.id()).isEqualTo(id);
        assertThat(result.companyName()).isEqualTo("Testing L.S.");
    }

    @Test
    void getCompanyByIdRejectsUnknownCompany() {
        UUID id = UUID.randomUUID();
        when(repository.findById(id)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.getCompanyById(id))
            .isInstanceOf(ResourceNotFoundException.class)
            .hasMessage(id + " not found.");
    }

    @Test
    void addNewCompanyMapsAndSavesRequest() {
        CompanyRequest request = new CompanyRequest(
            "Testing L.S.",
            "625 Parkway Blvd",
            "Testing company",
            "https://testing.com/"
        );

        service.addNewCompany(request);

        verify(repository).save(argThat(company ->
            company.getId() == null
                && "Testing L.S.".equals(company.getCompanyName())
                && "625 Parkway Blvd".equals(company.getCompanyAddress())
                && "Testing company".equals(company.getBio())
                && "https://testing.com/".equals(company.getWebsiteUrl())
        ));
    }
}
