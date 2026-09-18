package app.careerflow.rs.company.mapper;

import java.util.function.Function;

import app.careerflow.rs.company.domain.Company;
import app.careerflow.rs.company.dto.CompanyDTO;
import app.careerflow.rs.company.dto.CompanyRequest;

public class CompanyMapper implements Function<Company, CompanyDTO> {

    @Override
    public CompanyDTO apply(Company t) {
        return new CompanyDTO(
            t.getId(),
            t.getCompanyName(),
            t.getCompanyAddress(),
            t.getBio(),
            t.getWebsiteUrl()
        );
    }

    public Company toEntityCompany(CompanyRequest request){
        return Company.builder()
            .companyName(request.companyName())
            .companyAddress(request.companyAddress())
            .bio(request.bio())
            .websiteUrl(request.websiteUrl())
            .build();
    }
    
}
