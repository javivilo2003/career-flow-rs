package app.careerflow.rs.company.mapper;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.UUID;

import org.junit.jupiter.api.Test;

import app.careerflow.rs.company.domain.Company;
import app.careerflow.rs.company.dto.CompanyDTO;
import app.careerflow.rs.company.dto.CompanyRequest;


public class CompanyDTOMapperTest {
    
    private CompanyMapper mapper = new CompanyMapper();

    @Test 
    void mapsEntityToDto(){
        UUID id = UUID.randomUUID();
        
        Company company = Company.builder()
            .id(id)
            .companyName("Testing L.S.")
            .build();
        
        CompanyDTO dto = mapper.apply(company);

        assertThat(dto.id()).isEqualTo(company.getId());
        assertThat(dto.companyName()).isEqualTo(company.getCompanyName());
        assertThat(dto.companyAddress()).isEqualTo(company.getCompanyAddress());
        assertThat(dto.bio()).isEqualTo(company.getBio());
        assertThat(dto.websiteUrl()).isEqualTo(company.getWebsiteUrl());
    }

    @Test
    void mapsRequestToEntity(){
        CompanyRequest request = new CompanyRequest(
            "Testing L.S.",
            null,
            null,
            null
        );

        Company entity = mapper.toEntityCompany(request);

        assertThat(entity.getId()).isNull();
        assertThat(request.companyName()).isEqualTo(entity.getCompanyName());
        assertThat(request.companyAddress()).isEqualTo(entity.getCompanyAddress());
        assertThat(request.bio()).isEqualTo(entity.getBio());
        assertThat(request.websiteUrl()).isEqualTo(entity.getWebsiteUrl());
    }
}
