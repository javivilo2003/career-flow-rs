package app.careerflow.rs.contact.mapper;

import java.util.function.Function;

import org.springframework.stereotype.Service;

import app.careerflow.rs.company.domain.Company;
import app.careerflow.rs.contact.domain.Contact;
import app.careerflow.rs.contact.dto.ContactDTO;
import app.careerflow.rs.contact.dto.ContactRequest;

@Service
public class ContactMapper implements Function<Contact, ContactDTO>{

    @Override
    public ContactDTO apply(Contact t) {
        return new ContactDTO(
            t.getId(),
            t.getCompany().getId(),
            t.getName(),
            t.getPhone(),
            t.getEmail(),
            t.getJobRole()
        );
    }
    
    public Contact toEntityContact(ContactRequest request, Company company){
        return Contact.builder()
            .company(company)
            .name(request.name())
            .phone(request.phone())
            .email(request.email())
            .jobRole(request.jobRole())
            .build();
    }
}
