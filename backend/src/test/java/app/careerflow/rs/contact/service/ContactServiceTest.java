package app.careerflow.rs.contact.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
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
import app.careerflow.rs.company.repository.CompanyRepository;
import app.careerflow.rs.contact.domain.Contact;
import app.careerflow.rs.contact.dto.ContactDTO;
import app.careerflow.rs.contact.dto.ContactRequest;
import app.careerflow.rs.contact.mapper.ContactMapper;
import app.careerflow.rs.contact.repository.ContactRepository;

@ExtendWith(MockitoExtension.class)
class ContactServiceTest {

    @Mock private ContactRepository repository;
    @Mock private CompanyRepository companyRepository;
    @Mock private ContactMapper mapper;
    @InjectMocks private ContactService service;

    @Test
    void unsupportedSortingFieldIsRejected() {
        ContactFilter filter = new ContactFilter(null, null, null, null, null);

        assertThatThrownBy(() -> service.getContacts(
            filter, 0, 10, "unknownField", Sort.Direction.ASC
        ))
            .isInstanceOf(InvalidRequestException.class)
            .hasMessage("Unsupported sorting field: unknownField");
        verifyNoInteractions(repository);
    }

    @Test
    void getContactByIdRejectsUnknownContact() {
        UUID id = UUID.randomUUID();
        when(repository.findById(id)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.getContactById(id))
            .isInstanceOf(ResourceNotFoundException.class)
            .hasMessage(id + " not found.");
    }

    @Test
    void addNewContactResolvesCompanyAndSavesMappedEntity() throws Exception {
        UUID companyId = UUID.randomUUID();
        Company company = Company.builder().id(companyId).build();
        ContactRequest request = new ContactRequest(companyId, "Ada", null, null, "CTO");
        Contact contact = Contact.builder().company(company).name("Ada").jobRole("CTO").build();
        Contact saved = Contact.builder().id(UUID.randomUUID()).company(company).name("Ada").jobRole("CTO").build();
        ContactDTO dto = new ContactDTO(saved.getId(), companyId, "Ada", null, null, "CTO");
        when(companyRepository.findById(companyId)).thenReturn(Optional.of(company));
        when(mapper.toEntityContact(request, company)).thenReturn(contact);
        when(repository.save(contact)).thenReturn(saved);
        when(mapper.apply(saved)).thenReturn(dto);

        assertThat(service.addNewContact(request)).isSameAs(dto);

        verify(repository).save(contact);
        verify(mapper).apply(saved);
    }

    @Test
    void addNewContactRejectsUnknownCompany() {
        UUID companyId = UUID.randomUUID();
        ContactRequest request = new ContactRequest(companyId, "Ada", null, null, "CTO");
        when(companyRepository.findById(companyId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.addNewContact(request))
            .isInstanceOf(ResourceNotFoundException.class)
            .hasMessage(companyId + " not found.");
        verifyNoInteractions(mapper, repository);
    }

    @Test
    void updateContactResolvesCompanyAndSavesChanges() throws Exception {
        UUID id = UUID.randomUUID();
        UUID companyId = UUID.randomUUID();
        Company company = Company.builder().id(companyId).build();
        Contact contact = Contact.builder().id(id).build();
        ContactRequest request = new ContactRequest(companyId, "Ada", "123", "ada@example.com", "CTO");
        ContactDTO dto = new ContactDTO(id, companyId, "Ada", "123", "ada@example.com", "CTO");
        when(companyRepository.findById(companyId)).thenReturn(Optional.of(company));
        when(repository.findById(id)).thenReturn(Optional.of(contact));
        when(mapper.apply(contact)).thenReturn(dto);

        service.updateContact(id, request);

        assertThat(contact.getCompany()).isSameAs(company);
        assertThat(contact.getName()).isEqualTo("Ada");
        assertThat(contact.getPhone()).isEqualTo("123");
        assertThat(contact.getEmail()).isEqualTo("ada@example.com");
        assertThat(contact.getJobRole()).isEqualTo("CTO");
        verify(repository).save(contact);
        verify(mapper).apply(contact);
    }

    @Test
    void multipleContactsMayShareTheSameJobRole() throws Exception {
        UUID companyId = UUID.randomUUID();
        Company company = Company.builder().id(companyId).build();
        ContactRequest firstRequest = new ContactRequest(companyId, "Ada", null, null, "Recruiter");
        ContactRequest secondRequest = new ContactRequest(companyId, "Grace", null, null, "Recruiter");
        Contact first = Contact.builder().company(company).name("Ada").jobRole("Recruiter").build();
        Contact second = Contact.builder().company(company).name("Grace").jobRole("Recruiter").build();
        when(companyRepository.findById(companyId)).thenReturn(Optional.of(company));
        when(mapper.toEntityContact(firstRequest, company)).thenReturn(first);
        when(mapper.toEntityContact(secondRequest, company)).thenReturn(second);
        when(repository.save(first)).thenReturn(first);
        when(repository.save(second)).thenReturn(second);
        when(mapper.apply(any(Contact.class))).thenReturn(
            new ContactDTO(UUID.randomUUID(), companyId, "contact", null, null, "Recruiter")
        );

        service.addNewContact(firstRequest);
        service.addNewContact(secondRequest);

        verify(repository).save(first);
        verify(repository).save(second);
    }

    @Test
    void deleteContactDeletesExistingContact() throws Exception {
        UUID id = UUID.randomUUID();
        Contact contact = Contact.builder().id(id).build();
        when(repository.findById(id)).thenReturn(Optional.of(contact));

        service.deleteById(id);

        verify(repository).delete(contact);
    }
}
