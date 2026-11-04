package com.eventlab;



import com.eventlab.service.client.ServiceClient;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;
import org.springframework.web.service.registry.ImportHttpServices;

@SpringBootApplication
@EnableJpaAuditing
@ImportHttpServices(group = "service",types = ServiceClient.class)
public class BookingServiceApplication {

    public static void main(String[] args) {
        SpringApplication.run(BookingServiceApplication.class, args);
    }

}
