package app.careerflow.rs.contact.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import app.careerflow.rs.common.exception.ResourceNotFoundException;
import app.careerflow.rs.company.domain.Company;
import app.careerflow.rs.company.repository.CompanyRepository;
import app.careerflow.rs.contact.domain.Contact;
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
    void getAllContactsMapsEveryEntity() {
        Contact contact = Contact.builder().build();
        when(repository.findAll()).thenReturn(List.of(contact));
        when(mapper.apply(contact)).thenReturn(new app.careerflow.rs.contact.dto.ContactDTO(
            UUID.randomUUID(), UUID.randomUUID(), "Ada", null, null, "CTO"
        ));

        assertThat(service.getAllContacts()).hasSize(1);
        verify(mapper).apply(contact);
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
        when(companyRepository.findById(companyId)).thenReturn(Optional.of(company));
        when(mapper.toEntityContact(request, company)).thenReturn(contact);

        service.addNewContact(request);

        verify(repository).save(contact);
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
}
