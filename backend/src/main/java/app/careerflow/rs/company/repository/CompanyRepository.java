package app.careerflow.rs.company.repository;

import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import app.careerflow.rs.company.domain.Company;

public interface CompanyRepository extends JpaRepository<Company, UUID>,
                 JpaSpecificationExecutor<Company>{
    boolean existsByCompanyNameIgnoreCase(String companyName);

    boolean existsByCompanyNameIgnoreCaseAndIdNot(String companyName, UUID id);

    boolean existsByWebsiteUrl(String websiteUrl);

    boolean existsByWebsiteUrlAndIdNot(String websiteUrl, UUID id);
}
