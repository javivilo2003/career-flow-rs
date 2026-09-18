package app.careerflow.rs.contact.mapper;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.UUID;

import org.junit.jupiter.api.Test;

import app.careerflow.rs.company.domain.Company;
import app.careerflow.rs.contact.domain.Contact;
import app.careerflow.rs.contact.dto.ContactRequest;

class ContactMapperTest {

    private final ContactMapper mapper = new ContactMapper();

    @Test
    void mapsEntityToDto() {
        UUID id = UUID.randomUUID();
        UUID companyId = UUID.randomUUID();
        Company company = Company.builder().id(companyId).build();
        Contact contact = Contact.builder()
            .id(id).company(company).name("Ada Lovelace").phone("123")
            .email("ada@example.com").jobRole("CTO").build();

        var dto = mapper.apply(contact);

        assertThat(dto.id()).isEqualTo(id);
        assertThat(dto.companyID()).isEqualTo(companyId);
        assertThat(dto.name()).isEqualTo("Ada Lovelace");
        assertThat(dto.phone()).isEqualTo("123");
        assertThat(dto.email()).isEqualTo("ada@example.com");
        assertThat(dto.jobRole()).isEqualTo("CTO");
    }

    @Test
    void mapsRequestToEntity() {
        UUID companyId = UUID.randomUUID();
        Company company = Company.builder().id(companyId).build();
        ContactRequest request = new ContactRequest(
            companyId, "Ada Lovelace", "123", "ada@example.com", "CTO"
        );

        Contact contact = mapper.toEntityContact(request, company);

        assertThat(contact.getId()).isNull();
        assertThat(contact.getCompany()).isSameAs(company);
        assertThat(contact.getName()).isEqualTo(request.name());
        assertThat(contact.getPhone()).isEqualTo(request.phone());
        assertThat(contact.getEmail()).isEqualTo(request.email());
        assertThat(contact.getJobRole()).isEqualTo(request.jobRole());
    }
}
