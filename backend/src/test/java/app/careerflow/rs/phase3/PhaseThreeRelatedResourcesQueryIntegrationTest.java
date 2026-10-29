package app.careerflow.rs.phase3;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.LocalDate;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.boot.jdbc.test.autoconfigure.AutoConfigureTestDatabase;
import org.springframework.context.annotation.Import;
import org.springframework.data.domain.Sort;
import org.springframework.test.context.ActiveProfiles;

import app.careerflow.rs.TestcontainersConfiguration;
import app.careerflow.rs.company.domain.Company;
import app.careerflow.rs.company.repository.CompanyRepository;
import app.careerflow.rs.contact.domain.Contact;
import app.careerflow.rs.contact.mapper.ContactMapper;
import app.careerflow.rs.contact.repository.ContactRepository;
import app.careerflow.rs.contact.service.ContactFilter;
import app.careerflow.rs.contact.service.ContactService;
import app.careerflow.rs.interview.domain.Interview;
import app.careerflow.rs.interview.domain.InterviewStatus;
import app.careerflow.rs.interview.mapper.InterviewMapper;
import app.careerflow.rs.interview.repository.InterviewRepository;
import app.careerflow.rs.interview.service.InterviewFilter;
import app.careerflow.rs.interview.service.InterviewService;
import app.careerflow.rs.job_application.domain.ApplicationStatus;
import app.careerflow.rs.job_application.domain.JobApplication;
import app.careerflow.rs.job_application.repository.JobApplicationRepository;
import app.careerflow.rs.note.domain.Note;
import app.careerflow.rs.note.mapper.NoteMapper;
import app.careerflow.rs.note.repository.NoteRepository;
import app.careerflow.rs.note.service.NoteFilter;
import app.careerflow.rs.note.service.NoteService;
import app.careerflow.rs.user.domain.User;
import app.careerflow.rs.user.repository.UserRepository;

@DataJpaTest
@ActiveProfiles("test")
@Import({
    TestcontainersConfiguration.class,
    ContactService.class,
    ContactMapper.class,
    NoteService.class,
    NoteMapper.class,
    InterviewService.class,
    InterviewMapper.class
})
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
class PhaseThreeRelatedResourcesQueryIntegrationTest {

    @Autowired private CompanyRepository companyRepository;
    @Autowired private UserRepository userRepository;
    @Autowired private JobApplicationRepository applicationRepository;
    @Autowired private ContactRepository contactRepository;
    @Autowired private NoteRepository noteRepository;
    @Autowired private InterviewRepository interviewRepository;
    @Autowired private ContactService contactService;
    @Autowired private NoteService noteService;
    @Autowired private InterviewService interviewService;

    private Company firstCompany;
    private Company secondCompany;
    private JobApplication firstApplication;
    private JobApplication secondApplication;

    @BeforeEach
    void setUp() {
        firstCompany = companyRepository.save(Company.builder()
            .companyName("Phase Three Alpha " + UUID.randomUUID())
            .build());
        secondCompany = companyRepository.save(Company.builder()
            .companyName("Phase Three Beta " + UUID.randomUUID())
            .build());
        User owner = userRepository.save(User.builder()
            .username("p3-owner-" + UUID.randomUUID().toString().substring(0, 8))
            .build());
        firstApplication = saveApplication(owner, firstCompany, "Platform Engineer");
        secondApplication = saveApplication(owner, secondCompany, "Product Engineer");
    }

    @Test
    void contactsCombineCompanyAndCaseInsensitivePartialNameFilters() {
        saveContact(firstCompany, "Ada Lovelace", "Engineering Manager");
        saveContact(firstCompany, "Grace Hopper", "Engineering Manager");
        saveContact(secondCompany, "Ada Byron", "Engineering Manager");

        var result = contactService.getContacts(
            new ContactFilter(null, firstCompany.getId(), "  ADA LOVE  ", null, null),
            0,
            10,
            "name",
            Sort.Direction.ASC
        );

        assertThat(result.getContent())
            .extracting(dto -> dto.name())
            .containsExactly("Ada Lovelace");
        assertThat(result.getContent().getFirst().companyID()).isEqualTo(firstCompany.getId());
    }

    @Test
    void persistenceAllowsMultipleContactsWithTheSameJobRole() {
        Contact first = saveContact(firstCompany, "First Recruiter", "Recruiter");
        Contact second = saveContact(firstCompany, "Second Recruiter", "Recruiter");

        contactRepository.flush();

        assertThat(first.getId()).isNotNull();
        assertThat(second.getId()).isNotNull().isNotEqualTo(first.getId());
    }

    @Test
    void notesAreFilteredByTheirApplicationAssociation() {
        noteRepository.save(Note.builder()
            .application(firstApplication)
            .content("First application note")
            .build());
        noteRepository.save(Note.builder()
            .application(secondApplication)
            .content("Second application note")
            .build());

        var result = noteService.getNotes(
            new NoteFilter(null, firstApplication.getId(), null, null),
            0,
            10,
            "createdAt",
            Sort.Direction.DESC
        );

        assertThat(result.getContent())
            .singleElement()
            .satisfies(dto -> {
                assertThat(dto.jobApplicationId()).isEqualTo(firstApplication.getId());
                assertThat(dto.content()).isEqualTo("First application note");
            });
    }

    @Test
    void interviewsCombineApplicationStatusAndInclusiveDateOnlyRange() {
        saveInterview(firstApplication, InterviewStatus.SCHEDULED, LocalDate.of(2026, 10, 1));
        saveInterview(firstApplication, InterviewStatus.SCHEDULED, LocalDate.of(2026, 10, 31));
        saveInterview(firstApplication, InterviewStatus.COMPLETED, LocalDate.of(2026, 10, 15));
        saveInterview(secondApplication, InterviewStatus.SCHEDULED, LocalDate.of(2026, 10, 15));
        saveInterview(firstApplication, InterviewStatus.SCHEDULED, LocalDate.of(2026, 11, 1));

        var result = interviewService.getInterviews(
            new InterviewFilter(
                null,
                firstApplication.getId(),
                null,
                InterviewStatus.SCHEDULED,
                LocalDate.of(2026, 10, 1),
                LocalDate.of(2026, 10, 31)
            ),
            0,
            10,
            "interviewDate",
            Sort.Direction.ASC
        );

        assertThat(result.getContent())
            .extracting(dto -> dto.interviewDate())
            .containsExactly(LocalDate.of(2026, 10, 1), LocalDate.of(2026, 10, 31));
        assertThat(result.getContent())
            .allSatisfy(dto -> {
                assertThat(dto.jobApplicationId()).isEqualTo(firstApplication.getId());
                assertThat(dto.status()).isEqualTo(InterviewStatus.SCHEDULED);
            });
    }

    private JobApplication saveApplication(User owner, Company company, String position) {
        return applicationRepository.save(JobApplication.builder()
            .user(owner)
            .company(company)
            .position(position)
            .status(ApplicationStatus.APPLIED)
            .source("QA")
            .build());
    }

    private Contact saveContact(Company company, String name, String jobRole) {
        return contactRepository.save(Contact.builder()
            .company(company)
            .name(name)
            .jobRole(jobRole)
            .build());
    }

    private void saveInterview(
            JobApplication application, InterviewStatus status, LocalDate interviewDate) {
        interviewRepository.save(Interview.builder()
            .jobApplication(application)
            .stage("Technical")
            .status(status)
            .interviewDate(interviewDate)
            .build());
    }
}
