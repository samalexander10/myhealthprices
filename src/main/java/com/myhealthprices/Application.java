package com.myhealthprices;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.mongodb.config.EnableReactiveMongoAuditing;

@SpringBootApplication
@EnableReactiveMongoAuditing
public class Application {

	public static void main(String[] args) {
		SpringApplication.run(Application.class, args);
	}
}
