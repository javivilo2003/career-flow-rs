package app.careerflow.rs;

import org.springframework.boot.SpringApplication;


public class TestDemoApplication {

	public static void main(String[] args) {
		SpringApplication.from(CareerFlowApi::main).with(TestcontainersConfiguration.class).run(args);
	}

}
